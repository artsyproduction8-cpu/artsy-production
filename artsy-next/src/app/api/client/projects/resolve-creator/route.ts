import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { dispatchCreatorJobOffer } from '@/lib/matching/dispatch-offer';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { sendNotificationEmail } from '@/lib/email/dispatcher';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['client', 'admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Client session required' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { projectId, choice, newCreatorId } = body;

    if (!projectId || !choice) {
      return NextResponse.json({ error: 'Missing projectId or choice' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;
    if (!db) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Resolve project
    const { data: project, error: pErr } = await db
      .from('projects')
      .select('id, project_number, title, order_id, client_id, assigned_creator_id')
      .eq('id', projectId)
      .maybeSingle();

    if (pErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Anti-IDOR: Non-admin must own the project
    if (project.client_id !== authUser.id && !['admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Forbidden: You do not own this project' }, { status: 403 });
    }

    // 2. Resolve order
    const { data: order, error: oErr } = await db
      .from('orders')
      .select('*')
      .eq('id', project.order_id)
      .maybeSingle();

    if (oErr || !order) {
      return NextResponse.json({ error: 'Associated order not found' }, { status: 404 });
    }

    // Resolve client contact details from users table
    const { data: clientUser } = await db
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', project.client_id || order.client_id)
      .maybeSingle();

    const clientPhone = clientUser?.phone || authUser.phone;
    const clientEmail = clientUser?.email || authUser.email;
    const clientName = clientUser?.full_name || authUser.full_name || 'Client';

    const snap = order.requirements_snapshot || {};
    const turnaroundLabel =
      snap.turnaround === 'rush' || snap.turnaround === 'express'
        ? '48 Hours Express'
        : snap.turnaround === 'priority'
        ? '4–5 Working Days'
        : '7–10 Working Days Standard';

    const nowIso = new Date().toISOString();

    if (choice === 'reassign') {
      if (!newCreatorId) {
        return NextResponse.json({ error: 'newCreatorId is required for reassign choice' }, { status: 400 });
      }

      // Verify creator is approved
      const { data: newCreatorProf } = await db
        .from('creator_profiles')
        .select('id, public_display_name, approval_status')
        .eq('id', newCreatorId)
        .maybeSingle();

      if (!newCreatorProf || newCreatorProf.approval_status !== 'approved') {
        return NextResponse.json({ error: 'Selected creator is not approved or unavailable' }, { status: 400 });
      }

      // Update order and project
      await db
        .from('orders')
        .update({
          preferred_creator_id: newCreatorId,
          preferred_creator_assigned: false,
          preferred_creator_rejection_reason: null,
          updated_at: nowIso,
        })
        .eq('id', order.id);

      await db
        .from('projects')
        .update({
          assigned_creator_id: newCreatorId,
          status: 'awaiting_upload',
          updated_at: nowIso,
        })
        .eq('id', project.id);

      // Dispatch 3-channel push to newly selected creator
      await dispatchCreatorJobOffer({
        projectId: project.id,
        orderId: order.id,
        creatorId: newCreatorId,
        grossAmountPaise: order.gross_amount,
        serviceTitle: project.title,
        clientName,
        clientPhone,
        clientEmail,
        turnaroundLabel,
      });

      return NextResponse.json({
        success: true,
        message: `Project offer dispatched to ${newCreatorProf.public_display_name}.`,
        assignedCreatorName: newCreatorProf.public_display_name,
      });
    }

    if (choice === 'artsy_assign') {
      // Find top approved creator in database who is not the previously declined one
      const previouslyDeclinedId = order.preferred_creator_id;

      let creatorQuery = db
        .from('creator_profiles')
        .select('id, public_display_name, public_specialty')
        .eq('approval_status', 'approved');

      if (previouslyDeclinedId) {
        creatorQuery = creatorQuery.neq('id', previouslyDeclinedId);
      }

      const { data: topCreators } = await creatorQuery.limit(5);

      const matchedCreator = topCreators && topCreators.length > 0 ? topCreators[0] : null;

      if (matchedCreator) {
        // Auto-assign top creator
        await db
          .from('orders')
          .update({
            preferred_creator_id: matchedCreator.id,
            preferred_creator_assigned: true,
            preferred_creator_rejection_reason: 'Assigned by Artsy Studio Lead',
            updated_at: nowIso,
          })
          .eq('id', order.id);

        await db
          .from('projects')
          .update({
            assigned_creator_id: matchedCreator.id,
            status: 'creator_assigned',
            updated_at: nowIso,
          })
          .eq('id', project.id);

        // Dispatch offer to matched creator
        await dispatchCreatorJobOffer({
          projectId: project.id,
          orderId: order.id,
          creatorId: matchedCreator.id,
          grossAmountPaise: order.gross_amount,
          serviceTitle: project.title,
          clientName,
          clientPhone,
          clientEmail,
          turnaroundLabel,
        });

        // Notify client across in-app, WhatsApp, and Email
        if (authUser.id) {
          try {
            await db.from('notifications').insert([
              {
                user_id: authUser.id,
                event_number: 11,
                title: 'Editor Assigned by Artsy Studio',
                message: `Artsy Studio Lead has matched your project with senior editor ${matchedCreator.public_display_name}.`,
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
              eventNumber: 11,
              userId: authUser.id,
              recipientPhone: order.client_phone,
              recipientEmail: order.client_email || undefined,
              variables: {
                userName: order.client_name || 'Client',
                projectId: order.order_number || project.project_number,
              },
              actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/client/projects`,
            });
          } catch {}
        }

        return NextResponse.json({
          success: true,
          message: `Artsy Studio assigned senior editor ${matchedCreator.public_display_name}.`,
          assignedCreatorName: matchedCreator.public_display_name,
        });
      } else {
        // Flag for urgent admin dispatch slate
        await db
          .from('orders')
          .update({
            preferred_creator_rejection_reason: 'Client requested Artsy Studio assignment',
            updated_at: nowIso,
          })
          .eq('id', order.id);

        await db
          .from('projects')
          .update({
            status: 'pending_assignment',
            updated_at: nowIso,
          })
          .eq('id', project.id);

        return NextResponse.json({
          success: true,
          message: 'Artsy Studio Lead has prioritized your order for immediate senior assignment.',
        });
      }
    }

    return NextResponse.json({ error: 'Invalid choice' }, { status: 400 });
  } catch (err: any) {
    console.error('[Resolve Creator Exception]:', err);
    return NextResponse.json({ error: 'Failed to resolve creator assignment' }, { status: 500 });
  }
}

