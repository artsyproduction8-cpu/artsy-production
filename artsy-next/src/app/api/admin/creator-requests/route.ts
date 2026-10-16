import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import { sendMetaTemplate } from '@/lib/whatsapp/meta-cloud-dispatcher';
import { createErrorResponse } from '@/lib/api-response';

export async function GET(request: Request) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return createErrorResponse('Database client unavailable', 'Database service is currently unavailable', 503);
  }

  try {
    // 1. Fetch orders with preferred creator requests pending assignment
    const { data: orders, error: ordersError } = await dbClient
      .from('orders')
      .select('id, order_number, client_name, client_phone, client_email, service_key, gross_amount, status, preferred_creator_id, preferred_creator_assigned, preferred_creator_rejection_reason, created_at')
      .not('preferred_creator_id', 'is', null)
      .eq('preferred_creator_assigned', false)
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

    const enrichedOrders = (orders || []).map((ord: any) => ({
      ...ord,
      preferredCreator: creatorMap.get(ord.preferred_creator_id) || {
        id: ord.preferred_creator_id,
        public_display_name: 'Unknown Creator',
        public_specialty: 'Video Editor',
        creator_tier: 'standard',
        avg_rating: 5.0,
      },
    }));

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

    if (action === 'assign_requested') {
      // 1. Mark order as assigned to preferred creator
      await dbClient
        .from('orders')
        .update({
          preferred_creator_assigned: true,
          preferred_creator_rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // 2. Find corresponding project (if exists) or update assigned creator
      const { data: project } = await dbClient
        .from('projects')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (project) {
        await dbClient
          .from('projects')
          .update({
            assigned_creator_id: order.preferred_creator_id,
            assigned_editor_id: order.preferred_creator_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        // Create assignment row
        await dbClient.from('assignments').insert([
          {
            project_id: project.id,
            creator_id: order.preferred_creator_id,
            status: 'offered',
            offered_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // Notify client via WhatsApp/in-app if phone available
      if (order.client_phone) {
        try {
          await sendMetaTemplate(order.client_phone, 'artsy_project_status', [
            order.order_number,
            'Your requested creator has been confirmed and assigned to your project.',
          ]).catch(() => null);
        } catch { /* non-fatal */ }
      }

      return NextResponse.json({
        success: true,
        message: 'Requested creator assigned successfully',
      });
    } else if (action === 'assign_alternate') {
      if (!alternateCreatorId) {
        return NextResponse.json({ error: 'Alternate creator ID is required' }, { status: 400 });
      }

      // Fetch alternate creator name
      const { data: altCreator } = await dbClient
        .from('creator_profiles')
        .select('public_display_name, public_specialty')
        .eq('id', alternateCreatorId)
        .single();

      const altName = altCreator?.public_display_name || 'Senior Editor';

      // Mark order
      await dbClient
        .from('orders')
        .update({
          preferred_creator_assigned: true,
          preferred_creator_rejection_reason: 'Original creator unavailable',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Find project and assign alternate
      const { data: project } = await dbClient
        .from('projects')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (project) {
        await dbClient
          .from('projects')
          .update({
            assigned_creator_id: alternateCreatorId,
            assigned_editor_id: alternateCreatorId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        await dbClient.from('assignments').insert([
          {
            project_id: project.id,
            creator_id: alternateCreatorId,
            status: 'offered',
            offered_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // Notify client:
      // "Your requested creator was not available for this project. We have assigned [Alternate Name] who specializes in the same category."
      const clientNotice = `Your requested creator was not available for this project. We have assigned ${altName} who specializes in the same category.`;

      if (order.client_phone) {
        try {
          await sendMetaTemplate(order.client_phone, 'artsy_project_status', [
            order.order_number,
            clientNotice,
          ]).catch(() => null);
        } catch { /* non-fatal */ }
      }

      return NextResponse.json({
        success: true,
        message: `Assigned alternate creator: ${altName}`,
        clientNotice,
      });
    } else if (action === 'reject') {
      const rejectionReason = reason || 'Creator unavailable for requested project dates';

      await dbClient
        .from('orders')
        .update({
          preferred_creator_assigned: false,
          preferred_creator_rejection_reason: rejectionReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return NextResponse.json({
        success: true,
        message: 'Preferred creator request rejected',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return createErrorResponse(err, 'Failed to process creator assignment action', 500);
  }
}
