import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';

    const dbClient = supabaseAdmin || supabase;
    let payouts: any[] = [];

    if (dbClient && typeof dbClient.from === 'function') {
      try {
        let query = dbClient
          .from('creator_payouts')
          .select(`
            id,
            project_id,
            creator_id,
            gross_amount,
            tds_rate,
            tds_amount,
            net_payout,
            status,
            neft_utr_reference,
            created_at,
            updated_at,
            creator_profiles:creator_id (
              bank_account_name,
              bank_account_number,
              bank_ifsc_code,
              bank_name,
              pan_number
            ),
            users:creator_id (
              full_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (!error && data) {
          payouts = data.map((p: any) => ({
            id: p.id,
            projectId: p.project_id || 'PROJ-DEFAULT',
            creatorId: p.creator_id,
            creatorName: p.users?.full_name || p.creator_profiles?.bank_account_name || 'Creator',
            creatorEmail: p.users?.email || '',
            creatorPhone: p.users?.phone || '',
            bankAccountName: p.creator_profiles?.bank_account_name || p.users?.full_name || 'Creator',
            bankAccountNumber: p.creator_profiles?.bank_account_number || '',
            bankIfsc: p.creator_profiles?.bank_ifsc_code || '',
            bankName: p.creator_profiles?.bank_name || 'HDFC Bank',
            panNumber: p.creator_profiles?.pan_number || '',
            grossAmount: (p.gross_amount || 0) > 1000 ? p.gross_amount / 100 : p.gross_amount || 0,
            tdsRate: Number(p.tds_rate) || 0.1,
            tdsAmount: (p.tds_amount || 0) > 100 ? p.tds_amount / 100 : p.tds_amount || 0,
            netPayout: (p.net_payout || 0) > 1000 ? p.net_payout / 100 : p.net_payout || 0,
            status: p.status || 'pending',
            utrReference: p.neft_utr_reference || null,
            createdAt: p.created_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('[Admin Payouts API] Fetch warning:', err);
      }
    }

    // Compute summary metrics
    const summary = {
      pendingAmount: payouts.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.netPayout, 0),
      pendingCount: payouts.filter((p) => p.status === 'pending').length,
      dispatchedAmount: payouts.filter((p) => p.status === 'dispatched').reduce((sum, p) => sum + p.netPayout, 0),
      dispatchedCount: payouts.filter((p) => p.status === 'dispatched').length,
      reconciledAmount: payouts.filter((p) => p.status === 'reconciled').reduce((sum, p) => sum + p.netPayout, 0),
      reconciledCount: payouts.filter((p) => p.status === 'reconciled').length,
      totalTdsWithheld: payouts.reduce((sum, p) => sum + p.tdsAmount, 0),
      totalPayouts: payouts.length,
    };

    return NextResponse.json({
      success: true,
      payouts,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, status, utrReference } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing payout id or status' }, { status: 400 });
    }

    const dbClient = supabaseAdmin || supabase;
    if (dbClient && typeof dbClient.from === 'function') {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (utrReference !== undefined) {
        updateData.neft_utr_reference = utrReference;
      }

      const { error } = await dbClient
        .from('creator_payouts')
        .update(updateData)
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, id, status, utrReference });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
