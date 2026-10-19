import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }
  if (!['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return createErrorResponse('Database client unavailable', 'Database service is currently unavailable', 503);
  }

  try {
    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status');

    let query = dbClient
      .from('orders')
      .select('id, order_number, client_id, client_name, client_phone, client_email, service_key, gross_amount, net_amount, gst_amount, status, requirements_snapshot, created_at, paid_at')
      .order('created_at', { ascending: false });

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data: dbOrders, error } = await query;

    if (error) {
      console.warn('[Admin Orders Fetch Warning]', error);
      return NextResponse.json({ success: true, orders: [] });
    }

    const formattedOrders = (dbOrders || []).map((o: any) => {
      const snap = o.requirements_snapshot || {};
      let mappedStatus: 'unassigned' | 'in_progress' | 'review_ready' | 'completed' | 'pending' | 'paid' = 'unassigned';
      if (['in_production', 'creator_assigned'].includes(o.status)) {
        mappedStatus = 'in_progress';
      } else if (o.status === 'review_ready') {
        mappedStatus = 'review_ready';
      } else if (['completed', 'delivered', 'approved'].includes(o.status)) {
        mappedStatus = 'completed';
      } else if (['payment_pending', 'draft', 'pending'].includes(o.status)) {
        mappedStatus = 'pending';
      } else if (o.status === 'paid') {
        mappedStatus = 'paid';
      }

      return {
        id: o.id,
        orderNum: o.order_number || `ORD-${String(o.id).slice(0, 6).toUpperCase()}`,
        title: snap.title || snap.projectTitle || snap.projectName || o.service_key || 'Cinematic Production',
        client: o.client_name || o.client_phone || 'Client',
        clientPhone: o.client_phone || '',
        clientEmail: o.client_email || '',
        type: o.service_key || 'Custom Edit',
        cameraProfile: snap.cameraProfile || snap.camera || '4K Digital Profile',
        grossAmount: o.gross_amount || 0,
        amount: typeof o.gross_amount === 'number'
          ? (o.gross_amount > 10000 ? Math.round(o.gross_amount / 100) : o.gross_amount)
          : 0,
        status: mappedStatus,
        rawStatus: o.status,
        createdAt: o.created_at,
        paidAt: o.paid_at,
        assignedEditor: null,
        hoursRemaining: 24,
      };
    });

    return NextResponse.json({ success: true, orders: formattedOrders });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to fetch studio production orders', 500);
  }
}

export async function PATCH(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
  }
  if (!['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updates.paid_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    }

    const { error } = await dbClient
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('[Admin Orders PATCH Error]', error);
      return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Order #${orderId.slice(0, 8)} status marked as ${status}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
