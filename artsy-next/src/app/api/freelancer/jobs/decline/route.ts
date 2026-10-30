import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { sendNotificationEmail } from '@/lib/email/dispatcher';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !['freelancer', 'admin', 'super_admin'].includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized: Creator access required' }, { status: 401 });
    }

    const creatorId = authUser.id;
    const body = await request.json().catch(() => ({}));
    const { projectId, reason } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const db = supabaseAdmin || supabase;
    if (!db) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Resolve project and associated order
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    let targetProject: any = null;

    if (isUUID) {
      const { data: proj } = await db
        .from('projects')
        .select('id, project_number, title, order_id, client_id, assigned_creator_id')
        .eq('id', projectId)
        .maybeSingle();
      targetProject = proj;
    } else {
      const { data: proj } = await db
        .from('projects')
        .select('id, project_number, title, order_id, client_id, assigned_creator_id')
        .eq('project_number', projectId)
        .maybeSingle();
      targetProject = proj;
    }

    if (!targetProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Fetch order details
    const { data: order } = await db
      .from('orders')
      .select('id, order_number, client_id, client_name, client_phone, client_email, preferred_creator_id')
      .eq('id', targetProject.order_id)
      .maybeSingle();

    const declineReasonText = reason?.trim() || 'Schedule conflict / fully booked for requested turnaround';
    const nowIso = new Date().toISOString();

    // 3. Update assignment to declined
    await db
      .from('assignments')
      .update({
        status: 'declined',
        responded_at: nowIso,
        decline_reason: declineReasonText,
      })
      .eq('project_id', targetProject.id)
      .eq('creator_id', creatorId);

    // 4. Update project: unassign creator and flag for reassignment
    await db
      .from('projects')
      .update({
        status: 'pending_assignment',
        assigned_creator_id: null,
        updated_at: nowIso,
      })
      .eq('id', targetProject.id);

    // 5. Update order: preferred creator unassigned and capture reason
    if (order) {
      await db
        .from('orders')
        .update({
          preferred_creator_assigned: false,
          preferred_creator_rejection_reason: declineReasonText,
          updated_at: nowIso,
        })
        .eq('id', order.id);
    }

    // 6. MULTI-CHANNEL DISPATCH TO CLIENT (In-App, WhatsApp, Email)
    const clientUserId = targetProject.client_id || order?.client_id;
    const clientPhone = order?.client_phone;
    const clientEmail = order?.client_email;
    const clientName = order?.client_name || 'Client';
    const projectTitle = targetProject.title || 'Production Project';
    const orderNumber = order?.order_number || targetProject.project_number;
    const clientActionUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/client/projects`;

    // 6A. Channel 1: In-App Notification to Client
    if (clientUserId) {
      try {
        await db.from('notifications').insert([
          {
            user_id: clientUserId,
            event_number: 14,
            title: `Editor Update for Order #${orderNumber}`,
            message: `Your requested editor was unavailable for this timeline (${declineReasonText}). You can choose another editor or let Artsy Studio match our best available talent.`,
            action_url: '/client/projects',
            read: false,
            created_at: nowIso,
          },
        ]);
      } catch (notifErr) {
        console.warn('[Decline Job] Client in-app notification warning:', notifErr);
      }
    }

    // 6B. Channel 2: WhatsApp to Client
    if (clientPhone) {
      try {
        await dispatchNotification({
          eventNumber: 14,
          userId: clientUserId || '',
          recipientPhone: clientPhone,
          recipientEmail: clientEmail || undefined,
          variables: {
            userName: clientName,
            projectId: orderNumber,
            reason: declineReasonText,
          },
          actionUrl: clientActionUrl,
        });
      } catch (waErr) {
        console.warn('[Decline Job] WhatsApp notification warning:', waErr);
      }
    }

    // 6C. Channel 3: Transactional Email to Client
    if (clientEmail) {
      try {
        await sendNotificationEmail({
          eventNumber: 14,
          title: `Update on Order #${orderNumber}: Editor Unavailable`,
          message: `Hello ${clientName},\n\nYour requested editor is currently unavailable for your selected production schedule: "${declineReasonText}".\n\nYour order and payment are fully secured. You have two options to proceed immediately:\n\n1. Choose another verified editor from our roster\n2. Let Artsy Studio assign our top senior specialist in this category\n\nPlease visit your client portal to make your selection so we can initiate your edit.`,
          recipientEmail: clientEmail,
          actionUrl: clientActionUrl,
        });
      } catch (emErr) {
        console.warn('[Decline Job] Email notification warning:', emErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Job declined. Client has been notified across in-app, WhatsApp, and email.',
    });
  } catch (err: any) {
    console.error('[Decline Job Exception]:', err);
    return NextResponse.json({ error: 'Failed to decline job' }, { status: 500 });
  }
}
