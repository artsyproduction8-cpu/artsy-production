import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    // 1. Fetch from disputes table
    const { data: disputesList, error: dispErr } = await dbClient
      .from('disputes')
      .select('*')
      .order('opened_at', { ascending: false });

    // 2. Fetch orders where status = 'disputed'
    const { data: disputedOrders } = await dbClient
      .from('orders')
      .select('id, order_number, client_id, client_name, client_email, gross_amount, cancellation_reason, created_at')
      .eq('status', 'disputed');

    // 3. Fetch all orders and projects to enrich dispute records
    const orderIds = (disputesList || []).map((d: any) => d.order_id).filter(Boolean);
    let orders: any[] = [];
    if (orderIds.length > 0) {
      const { data: oData } = await dbClient
        .from('orders')
        .select('id, order_number, client_id, client_name, client_email, gross_amount')
        .in('id', orderIds);
      orders = oData || [];
    }
    const orderMap: Record<string, any> = {};
    orders.forEach((o: any) => {
      orderMap[o.id] = o;
    });

    const projectIds = (disputesList || []).map((d: any) => d.project_id).filter(Boolean);
    let projects: any[] = [];
    if (projectIds.length > 0) {
      const { data: prData } = await dbClient
        .from('projects')
        .select('id, project_number, title')
        .in('id', projectIds);
      projects = prData || [];
    }
    const projectMap: Record<string, any> = {};
    projects.forEach((p: any) => {
      projectMap[p.id] = p;
    });

    const enrichedDisputes = (disputesList || []).map((d: any) => {
      const ord = orderMap[d.order_id] || {};
      const prj = projectMap[d.project_id] || {};
      return {
        id: d.id,
        orderId: d.order_id,
        orderNumber: ord.order_number || 'N/A',
        clientName: ord.client_name || 'Client',
        clientEmail: ord.client_email || '',
        projectName: prj.title || `Project #${prj.project_number || '1'}`,
        reason: d.reason || 'Client raised quality or timeline dispute',
        amount: d.amount || ord.gross_amount || 0,
        status: d.status || 'open',
        openedAt: d.opened_at,
        resolvedAt: d.resolved_at || null,
        resolutionNotes: d.resolution_notes || null,
      };
    });

    // Also include any disputed orders not yet in disputes table
    (disputedOrders || []).forEach((o: any) => {
      const existing = enrichedDisputes.find((ed: any) => ed.orderId === o.id);
      if (!existing) {
        enrichedDisputes.push({
          id: `ord-disp-${o.id}`,
          orderId: o.id,
          orderNumber: o.order_number,
          clientName: o.client_name || 'Client',
          clientEmail: o.client_email || '',
          projectName: `Order ${o.order_number}`,
          reason: o.cancellation_reason || 'Client disputed order',
          amount: o.gross_amount || 0,
          status: 'open',
          openedAt: o.created_at,
          resolvedAt: null,
          resolutionNotes: null,
        });
      }
    });

    return NextResponse.json({
      success: true,
      disputes: enrichedDisputes,
    });
  } catch (err: any) {
    console.error('Error fetching disputes:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, action, notes } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Dispute ID and action required' }, { status: 400 });
    }

    if (!['resolve', 'escalate', 'refund'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be resolve, escalate, or refund.' }, { status: 400 });
    }

    const newStatus = action === 'resolve' ? 'resolved' : action === 'escalate' ? 'escalated' : 'refunded';

    // If ID is a real UUID in disputes table
    if (!id.startsWith('ord-disp-')) {
      await dbClient
        .from('disputes')
        .update({
          status: newStatus,
          resolved_at: action !== 'escalate' ? new Date().toISOString() : null,
          resolution_notes: notes || `Action ${action} executed by ${authUser.email || authUser.id}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    // Record audit log
    await dbClient.from('audit_logs').insert([
      {
        admin_id: authUser.id,
        admin_email: authUser.email || 'admin@artsyproduction.com',
        action: `DISPUTE_${action.toUpperCase()}`,
        target_table: 'disputes',
        target_id: id.startsWith('ord-disp-') ? id.replace('ord-disp-', '') : id,
        new_values: { action, status: newStatus, notes: notes || null },
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, disputeId: id, action, status: newStatus });
  } catch (err: any) {
    console.error('Error updating dispute:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
