import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const authUser = getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type'); // 'client_payment' | 'creator_payout' | 'refund' | 'all'
  const statusFilter = searchParams.get('status');
  const format = searchParams.get('format'); // 'json' | 'csv'

  try {
    // 1. Fetch Client Payments
    const { data: payments } = await dbClient
      .from('payments')
      .select('id, order_id, amount, currency, gateway, payment_method, status, created_at')
      .order('created_at', { ascending: false });

    // 2. Fetch Orders to get client information
    const { data: orders } = await dbClient
      .from('orders')
      .select('id, order_number, client_id, client_name, client_email');

    const orderMap: Record<string, any> = {};
    (orders || []).forEach((o: any) => {
      orderMap[o.id] = o;
    });

    // 3. Fetch Creator Payouts
    const { data: payouts } = await dbClient
      .from('creator_payouts')
      .select('id, project_id, creator_id, gross_amount, tds_rate, tds_amount, net_payout, status, neft_utr_reference, created_at')
      .order('created_at', { ascending: false });

    // 4. Fetch Users for creator name
    const { data: users } = await dbClient
      .from('users')
      .select('id, full_name, email');

    const userMap: Record<string, any> = {};
    (users || []).forEach((u: any) => {
      userMap[u.id] = u;
    });

    // 5. Fetch Refunds
    const { data: refunds } = await dbClient
      .from('refund_entries')
      .select('id, order_id, amount, reason, razorpay_refund_id, status, credit_note_number, created_at')
      .order('created_at', { ascending: false });

    // Combine into unified ledger items
    interface LedgerItem {
      id: string;
      date: string;
      type: 'client_payment' | 'creator_payout' | 'refund';
      reference: string;
      partyName: string;
      partyEmail: string;
      grossAmount: number;
      feeOrTds: number;
      netAmount: number;
      direction: 'IN' | 'OUT';
      status: string;
      method: string;
    }

    const ledger: LedgerItem[] = [];

    // Process client payments (IN)
    (payments || []).forEach((p: any) => {
      const order = orderMap[p.order_id] || {};
      ledger.push({
        id: p.id,
        date: p.created_at,
        type: 'client_payment',
        reference: order.order_number || p.id.slice(0, 8),
        partyName: order.client_name || 'Client',
        partyEmail: order.client_email || '',
        grossAmount: p.amount || 0,
        feeOrTds: 0,
        netAmount: p.amount || 0,
        direction: 'IN',
        status: p.status || 'captured',
        method: p.payment_method || p.gateway || 'Razorpay',
      });
    });

    // Process creator payouts (OUT)
    (payouts || []).forEach((po: any) => {
      const creator = userMap[po.creator_id] || {};
      ledger.push({
        id: po.id,
        date: po.created_at,
        type: 'creator_payout',
        reference: po.neft_utr_reference || `PO-${po.id.slice(0, 8)}`,
        partyName: creator.full_name || 'Creator',
        partyEmail: creator.email || '',
        grossAmount: po.gross_amount || 0,
        feeOrTds: po.tds_amount || 0,
        netAmount: po.net_payout || 0,
        direction: 'OUT',
        status: po.status || 'pending',
        method: 'NEFT Direct',
      });
    });

    // Process refunds (OUT)
    (refunds || []).forEach((rf: any) => {
      const order = orderMap[rf.order_id] || {};
      ledger.push({
        id: rf.id,
        date: rf.created_at,
        type: 'refund',
        reference: rf.credit_note_number || rf.razorpay_refund_id || `RF-${rf.id.slice(0, 8)}`,
        partyName: order.client_name || 'Client',
        partyEmail: order.client_email || '',
        grossAmount: rf.amount || 0,
        feeOrTds: 0,
        netAmount: rf.amount || 0,
        direction: 'OUT',
        status: rf.status || 'processed',
        method: 'Razorpay Refund',
      });
    });

    // Sort chronologically ascending to calculate running balance, then reverse for display
    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    let totalIn = 0;
    let totalOut = 0;

    const ledgerWithBalance = ledger.map((item) => {
      if (item.status === 'captured' || item.status === 'paid' || item.status === 'processed') {
        if (item.direction === 'IN') {
          totalIn += item.netAmount;
          runningBalance += item.netAmount;
        } else {
          totalOut += item.netAmount;
          runningBalance -= item.netAmount;
        }
      }
      return {
        ...item,
        runningBalance,
      };
    });

    // Filter items according to search params
    let filtered = ledgerWithBalance.slice().reverse();

    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((i) => i.type === typeFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    // CSV format export
    if (format === 'csv') {
      const headers = ['Date', 'Type', 'Reference', 'Party Name', 'Party Email', 'Direction', 'Gross Amount (Paisa)', 'TDS / Fee', 'Net Amount', 'Status', 'Method', 'Running Balance'];
      const rows = filtered.map((i) => [
        `"${i.date}"`,
        `"${i.type}"`,
        `"${i.reference}"`,
        `"${i.partyName.replace(/"/g, '""')}"`,
        `"${i.partyEmail}"`,
        `"${i.direction}"`,
        i.grossAmount,
        i.feeOrTds,
        i.netAmount,
        `"${i.status}"`,
        `"${i.method}"`,
        i.runningBalance,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="artsy_payments_ledger_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalIn,
        totalOut,
        currentBalance: runningBalance,
        totalTransactions: ledger.length,
      },
      ledger: filtered,
    });
  } catch (err: any) {
    console.error('Error fetching payments ledger:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
