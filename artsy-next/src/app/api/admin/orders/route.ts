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
    const excludeCancelled = searchParams.get('excludeCancelled') === 'true';

    let query = dbClient
      .from('orders')
      .select('id, order_number, client_id, client_name, client_phone, client_email, service_key, gross_amount, net_amount, gst_amount, status, requirements_snapshot, created_at, paid_at, preferred_creator_id, preferred_creator_assigned, preferred_creator_rejection_reason, cancellation_reason, cancelled_at')
      .order('created_at', { ascending: false });

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    } else if (excludeCancelled) {
      query = query.neq('status', 'cancelled');
    }

    const { data: dbOrders, error } = await query;

    if (error) {
      console.warn('[Admin Orders Fetch Warning]', error);
      return NextResponse.json({ success: true, orders: [] });
    }

    // Resolve creator names for orders with preferred creators
    const creatorIds = new Set<string>();
    (dbOrders || []).forEach((o: any) => {
      if (o.preferred_creator_id) creatorIds.add(o.preferred_creator_id);
    });

    const creatorMap: Record<string, string> = {};
    if (creatorIds.size > 0) {
      const { data: creators } = await dbClient
        .from('creator_profiles')
        .select('id, public_display_name')
        .in('id', Array.from(creatorIds));

      (creators || []).forEach((c: any) => {
        creatorMap[c.id] = c.public_display_name;
      });
    }

    const formattedOrders = (dbOrders || []).map((o: any) => {
      const snap = o.requirements_snapshot || {};
      let mappedStatus: 'unassigned' | 'in_progress' | 'review_ready' | 'completed' | 'pending' | 'paid' | 'cancelled' = 'unassigned';
      if (o.status === 'cancelled') {
        mappedStatus = 'cancelled';
      } else if (['in_production', 'creator_assigned'].includes(o.status)) {
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

      // Dynamic SLA turnaround labels
      const turnaround = snap.turnaround || 'standard';
      const turnaroundLabel =
        turnaround === 'rush' || turnaround === 'express'
          ? '48 Hours Express'
          : turnaround === 'priority'
          ? '4–5 Working Days'
          : '7–10 Working Days Standard';

      const hoursRemaining =
        turnaround === 'rush' || turnaround === 'express'
          ? 48
          : turnaround === 'priority'
          ? 96
          : 168;

      // Dynamic editor assignment label
      let assignedEditor: string = 'Unassigned';
      const creatorName = o.preferred_creator_id ? (creatorMap[o.preferred_creator_id] || 'Requested Creator') : null;
      if (o.status === 'cancelled') {
        assignedEditor = 'Cancelled';
      } else if (o.preferred_creator_assigned && creatorName) {
        assignedEditor = `Assigned: ${creatorName}`;
      } else if (o.preferred_creator_rejection_reason) {
        assignedEditor = `Declined (${o.preferred_creator_rejection_reason})`;
      } else if (creatorName) {
        assignedEditor = `Requested: ${creatorName} (Offer Sent)`;
      } else {
        assignedEditor = 'Unassigned';
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
        assignedEditor,
        turnaroundLabel,
        hoursRemaining,
        cancellationReason: o.cancellation_reason || null,
        preferredCreatorId: o.preferred_creator_id || null,
        preferredCreatorName: creatorName,
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
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 });
    }

    const { data: updated, error } = await dbClient
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 'Failed to update order status', 500);
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to update order status', 500);
  }
}
