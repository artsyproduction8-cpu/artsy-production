import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authUser.id);
  if (!isUuid) {
    return NextResponse.json({ success: true, invoices: [] });
  }

  const db = supabaseAdmin || supabase;
  if (!db || typeof db.from !== 'function') {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    // 1. Fetch paid orders for this client
    const { data: orders, error: ordersError } = await db
      .from('orders')
      .select('id, order_number, gross_amount, gst_amount, net_amount, status, service_key, created_at, paid_at')
      .eq('client_id', authUser.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[Client Invoices API] Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch invoices', invoices: [] }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, invoices: [] });
    }

    // 2. Fetch corresponding projects to retrieve project titles
    const orderIds = orders.map((o: any) => o.id);
    const { data: projects } = await db
      .from('projects')
      .select('id, order_id, title')
      .in('order_id', orderIds);

    const titleMap: Record<string, string> = {};
    (projects || []).forEach((p: any) => {
      if (p.order_id) titleMap[p.order_id] = p.title;
    });

    // 3. Map orders into structured TaxInvoice items
    const invoices = orders.map((ord: any) => {
      const grossPaise = Number(ord.gross_amount) || 0;
      const totalPaid = Math.round(grossPaise / 100);
      const gstPaise = Number(ord.gst_amount) || 0;
      const gstAmount = gstPaise > 0 ? Math.round(gstPaise / 100) : Math.round(totalPaid - totalPaid / 1.18);
      const netBase = totalPaid - gstAmount;

      const orderRef = ord.order_number || `ORD-${ord.id.slice(0, 8)}`;
      const cleanRef = orderRef.replace(/[^a-zA-Z0-9]/g, '');
      const invoiceNumber = `INV-ARTSY-${cleanRef.slice(-6) || ord.id.slice(0, 6)}`;
      const dateStr = ord.paid_at || ord.created_at
        ? new Date(ord.paid_at || ord.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Recent';

      const projectTitle = titleMap[ord.id] || (ord.service_key ? `${ord.service_key} Video Edit` : 'Post-Production Order');

      return {
        id: ord.id,
        invoiceNumber,
        orderRef,
        date: dateStr,
        projectTitle,
        netBase,
        gstAmount,
        totalPaid,
        gstin: '27AABCU9603R1ZM',
        status: 'released',
        downloadUrl: `/api/invoices/${ord.id}`,
      };
    });

    return NextResponse.json({ success: true, invoices });
  } catch (err: any) {
    console.error('[Client Invoices API] Exception:', err);
    return NextResponse.json({ error: 'Internal server error', invoices: [] }, { status: 500 });
  }
}

