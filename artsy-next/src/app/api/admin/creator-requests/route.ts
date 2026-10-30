import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { dispatchCreatorJobOffer } from '@/lib/matching/dispatch-offer';
import { sendNotificationEmail } from '@/lib/email/dispatcher';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { createErrorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const limitGet = await checkRateLimit(`admin_cr_req_get_${authUser.id}`, 'admin', 30, 60);
  if (!limitGet.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return createErrorResponse('Database client unavailable', 'Database service is currently unavailable', 503);
  }

  try {
    // 1. Fetch active orders with preferred creator requests pending assignment (exclude cancelled)
    const { data: orders, error: ordersError } = await dbClient
      .from('orders')
      .select('id, order_number, client_id, client_name, client_phone, client_email, service_key, gross_amount, status, preferred_creator_id, preferred_creator_assigned, preferred_creator_rejection_reason, created_at')
      .not('preferred_creator_id', 'is', null)
      .eq('preferred_creator_assigned', false)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (ordersError) {
      return createErrorResponse(ordersError, 'Failed to fetch preferred creator requests', 500);
    }

    // 2. Fetch all approved creators for display & alternate assignment dropdown
    const { data: approvedCreators } = await dbClient
      .from('creator_profiles')
      .select('id, public_display_name, public_specialty, creator_tier, avg_rating, is_accepting_work')
      .eq('approval_status', 'approved');

    // Attach preferred creator details to each order
    const creatorMap = new Map((approvedCreators || []).map((c: any) => [c.id, c]));

    const enrichedOrders = (orders || []).map((ord: any) => {
      let statusLabel = 'Offer Sent to Creator';
      if (ord.preferred_creator_rejection_reason) {
        statusLabel = `Declined (${ord.preferred_creator_rejection_reason})`;
      }

      return {
        ...ord,
        statusLabel,
        preferredCreator: creatorMap.get(ord.preferred_creator_id) || {
          id: ord.preferred_creator_id,
          public_display_name: 'Unknown Creator',
          public_specialty: 'Video Editor',
          creator_tier: 'standard',
          avg_rating: 5.0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      requests: enrichedOrders,
      availableCreators: approvedCreators || [],
    });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to retrieve preferred creator requests', 500);
  }
}

export async function POST(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const limitPost = await checkRateLimit(`admin_cr_req_post_${authUser.id}`, 'admin', 20, 60);
  if (!limitPost.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return NextResponse.json({ error: 'Database client unavailable' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, action, alternateCreatorId, reason } = body;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Order ID and action are required' }, { status: 400 });
    }

    // Fetch order
    const { data: order, error: orderErr } = await dbClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: project } = await dbClient
      .from('projects')
      .select('id, project_number, title')
      .eq('order_id', order.id)
      .maybeSingle();

    const nowIso = new Date().toISOString();

    if (action === 'assign_requested') {
      const creatorId = order.preferred_creator_id;
      if (!creatorId) {
        return NextResponse.json({ error: 'No preferred creator specified on this order' }, { status: 400 });
      }

      await dbClient
        .from('orders')
        .update({
          preferred_creator_assigned: true,
          preferred_creator_rejection_reason: null,
          updated_at: nowIso,
        })
        .eq('id', order.id);

      if (project) {
        await dbClient
          .from('projects')
          .update({
            assigned_creator_id: creatorId,
            status: 'creator_assigned',
            updated_at: nowIso,
          })
          .eq('id', project.id);

        // Dispatch offer to preferred creator
        await dispatchCreatorJobOffer({
          projectId: project.id,
          orderId: order.id,
          creatorId,
          grossAmountPaise: order.gross_amount,
          serviceTitle: project.title,
          clientName: order.client_name,
          clientPhone: order.client_phone,
          clientEmail: order.client_email,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Creator offer confirmed and dispatched.',
      });
    }

    if (action === 'assign_alternate') {
      if (!alternateCreatorId) {
        return NextResponse.json({ error: 'alternateCreatorId is required' }, { status: 400 });
      }

      await dbClient
        .from('orders')
        .update({
          preferred_creator_id: alternateCreatorId,
          preferred_creator_assigned: true,
          preferred_creator_rejection_reason: 'Assigned by Studio Director',
          updated_at: nowIso,
        })
        .eq('id', order.id);

      if (project) {
        await dbClient
          .from('projects')
          .update({
            assigned_creator_id: alternateCreatorId,
            status: 'creator_assigned',
            updated_at: nowIso,
          })
          .eq('id', project.id);

        await dispatchCreatorJobOffer({
          projectId: project.id,
          orderId: order.id,
          creatorId: alternateCreatorId,
          grossAmountPaise: order.gross_amount,
          serviceTitle: project.title,
          clientName: order.client_name,
          clientPhone: order.client_phone,
          clientEmail: order.client_email,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Alternate creator assigned and offer dispatched.',
      });
    }

    if (action === 'reject_request') {
      const rejectionReason = reason?.trim() || 'Creator unavailable for requested turnaround';

      await dbClient
        .from('orders')
        .update({
          preferred_creator_assigned: false,
          preferred_creator_rejection_reason: rejectionReason,
          updated_at: nowIso,
        })
        .eq('id', order.id);

      if (project) {
        await dbClient
          .from('projects')
          .update({
            status: 'pending_assignment',
            assigned_creator_id: null,
            updated_at: nowIso,
          })
          .eq('id', project.id);
      }

      // Notify Client across in-app, WhatsApp, and Email
      if (order.client_id) {
        try {
          await dbClient.from('notifications').insert([
            {
              user_id: order.client_id,
              event_number: 14,
              title: `Update on Order #${order.order_number}`,
              message: `Your requested editor was unavailable (${rejectionReason}). Choose another editor or let Artsy Studio assign our top senior talent.`,
              action_url: '/client/projects',
              read: false,
              created_at: nowIso,
            },
          ]);
        } catch {}
      }

      if (order.client_phone) {
        try {
          await dispatchNotification({
            eventNumber: 14,
            userId: order.client_id || '',
            recipientPhone: order.client_phone,
            recipientEmail: order.client_email || undefined,
            variables: {
              userName: order.client_name || 'Client',
              projectId: order.order_number,
              reason: rejectionReason,
            },
            actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/client/projects`,
          });
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: 'Request declined. Client notified for reassignment.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to process creator request', 500);
  }
}
