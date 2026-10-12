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

  try {
    const { data: refunds, error: refErr } = await dbClient
      .from('refund_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (refErr) {
      return NextResponse.json({ error: refErr.message }, { status: 500 });
    }

    const orderIds = (refunds || []).map((r: any) => r.order_id).filter(Boolean);
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

    const enrichedRefunds = (refunds || []).map((r: any) => ({
      ...r,
      order: orderMap[r.order_id] || null,
    }));

    return NextResponse.json({
      success: true,
      refunds: enrichedRefunds,
    });
  } catch (err: any) {
    console.error('Error fetching refunds:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authUser = getAuthenticatedUser(request);
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
      return NextResponse.json({ error: 'Refund ID and action required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be approve or reject.' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'processed' : 'failed';
    const { data: updated, error } = await dbClient
      .from('refund_entries')
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
        reference: notes || (action === 'approve' ? 'Approved by Admin' : 'Rejected by Admin'),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record audit log
    await dbClient.from('audit_logs').insert([
      {
        admin_id: authUser.id,
        admin_email: authUser.email || 'admin@artsyproduction.com',
        action: `REFUND_${action.toUpperCase()}`,
        target_table: 'refund_entries',
        target_id: id,
        new_values: { action, status: newStatus, notes: notes || null },
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, refund: updated });
  } catch (err: any) {
    console.error('Error updating refund:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
