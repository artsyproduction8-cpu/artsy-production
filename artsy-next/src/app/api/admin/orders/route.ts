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
    const { data: dbOrders, error } = await dbClient
      .from('orders')
      .select('id, order_number, client_name, client_phone, client_email, service_key, gross_amount, status, requirements_snapshot, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Admin Orders Fetch Warning]', error);
      return NextResponse.json({ success: true, orders: [] });
    }

    const formattedOrders = (dbOrders || []).map((o: any) => {
      const snap = o.requirements_snapshot || {};
      let mappedStatus: 'unassigned' | 'in_progress' | 'review_ready' | 'completed' = 'unassigned';
      if (['in_production', 'creator_assigned'].includes(o.status)) {
        mappedStatus = 'in_progress';
      } else if (o.status === 'review_ready') {
        mappedStatus = 'review_ready';
      } else if (['completed', 'delivered', 'approved'].includes(o.status)) {
        mappedStatus = 'completed';
      }

      return {
        id: o.id,
        orderNum: o.order_number || `ORD-${String(o.id).slice(0, 6).toUpperCase()}`,
        title: snap.title || snap.projectTitle || snap.projectName || o.service_key || 'Cinematic Production',
        client: o.client_name || o.client_phone || 'Client',
        type: o.service_key || 'Custom Edit',
        cameraProfile: snap.cameraProfile || snap.camera || '4K Digital Profile',
        amount: typeof o.gross_amount === 'number'
          ? (o.gross_amount > 10000 ? Math.round(o.gross_amount / 100) : o.gross_amount)
          : 0,
        status: mappedStatus,
        assignedEditor: null,
        hoursRemaining: 24,
      };
    });

    return NextResponse.json({ success: true, orders: formattedOrders });
  } catch (err: any) {
    console.error('Failed to fetch admin orders:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
