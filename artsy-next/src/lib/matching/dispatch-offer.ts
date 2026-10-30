// =============================================================================
// ARTSY PRODUCTION — CREATOR JOB OFFER DISPATCHER (MULTI-CHANNEL)
// =============================================================================
// Handles automated project offer push to preferred / matched creators:
// 1. In-App Notification (Database `notifications` table)
// 2. WhatsApp Notification (Meta Cloud API / WhatsApp Dispatcher)
// 3. Transactional Email (Resend Email Dispatcher)
// =============================================================================

import { supabaseAdmin, supabase } from '@/lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { sendNotificationEmail } from '@/lib/email/dispatcher';

export interface DispatchOfferParams {
  projectId: string;
  orderId: string;
  creatorId: string;
  grossAmountPaise: number;
  serviceTitle?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  turnaroundLabel?: string;
}

export interface DispatchOfferResult {
  success: boolean;
  assignmentId?: string;
  creatorName?: string;
  payoutPaise?: number;
  payoutInr?: number;
  error?: string;
}

export async function dispatchCreatorJobOffer(params: DispatchOfferParams): Promise<DispatchOfferResult> {
  const db = supabaseAdmin || supabase;
  if (!db || typeof db.from !== 'function') {
    return { success: false, error: 'Database service unavailable' };
  }

  const {
    projectId,
    orderId,
    creatorId,
    grossAmountPaise,
    serviceTitle = 'Cinematic Production',
    turnaroundLabel = '7–10 Working Days Standard',
  } = params;

  try {
    // 1. Calculate creator share from authoritative financial waterfall (70% of available split)
    const waterfall = calculateFinancialWaterfall(grossAmountPaise);
    const creatorPayoutPaise = waterfall.creatorAmount;
    const creatorPayoutInr = Math.round(creatorPayoutPaise / 100);

    // 2. Resolve creator user and profile
    const { data: creatorUser } = await db
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', creatorId)
      .maybeSingle();

    const { data: creatorProf } = await db
      .from('creator_profiles')
      .select('public_display_name, public_specialty')
      .eq('id', creatorId)
      .maybeSingle();

    const creatorDisplayName =
      creatorProf?.public_display_name ||
      creatorUser?.full_name ||
      'Creator Partner';

    // 3. Idempotently insert or update assignment in public.assignments
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour acceptance SLA

    let assignmentId: string | undefined;

    const { data: existingAssignment } = await db
      .from('assignments')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (existingAssignment) {
      assignmentId = existingAssignment.id;
      // If previously declined or cancelled and reoffered, reset to offered
      if (['declined', 'cancelled', 'timeout'].includes(existingAssignment.status)) {
        await db
          .from('assignments')
          .update({
            status: 'offered',
            offered_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            responded_at: null,
            decline_reason: null,
          })
          .eq('id', existingAssignment.id);
      }
    } else {
      const { data: newAssignment, error: assignErr } = await db
        .from('assignments')
        .insert({
          project_id: projectId,
          creator_id: creatorId,
          status: 'offered',
          offered_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString(),
        })
        .select('id')
        .single();

      if (assignErr) {
        console.warn('[Dispatch Offer] Assignment insert warning:', assignErr);
      }
      assignmentId = newAssignment?.id;
    }

    // 4. Update project assigned_creator_id and status if needed
    await db
      .from('projects')
      .update({
        assigned_creator_id: creatorId,
        updated_at: now.toISOString(),
      })
      .eq('id', projectId);

    // Update order preferred_creator_assigned marker
    await db
      .from('orders')
      .update({
        preferred_creator_id: creatorId,
        preferred_creator_assigned: false, // will flip to true when accepted
        preferred_creator_rejection_reason: null,
        updated_at: now.toISOString(),
      })
      .eq('id', orderId);

    // 5. Channel 1: In-App Notification for Creator
    try {
      await db.from('notifications').insert([
        {
          user_id: creatorId,
          event_number: 12,
          title: `New Project Offer: ${serviceTitle}`,
          message: `You have been selected for ${serviceTitle}. Net Payout: ₹${creatorPayoutInr.toLocaleString('en-IN')}. Delivery: ${turnaroundLabel}. Respond within 24 hours.`,
          action_url: '/freelancer',
          read: false,
          created_at: now.toISOString(),
        },
      ]);
    } catch (notifErr) {
      console.warn('[Dispatch Offer] In-App notification non-fatal error:', notifErr);
    }

    // 6. Channel 2: WhatsApp Notification to Creator Phone
    if (creatorUser?.phone) {
      try {
        await dispatchNotification({
          eventNumber: 12,
          userId: creatorId,
          recipientPhone: creatorUser.phone,
          recipientEmail: creatorUser.email || undefined,
          variables: {
            userName: creatorDisplayName,
            serviceName: serviceTitle,
            payout: creatorPayoutInr,
            projectId: projectId,
            orderId: orderId,
          },
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/freelancer`,
        });
      } catch (waErr) {
        console.warn('[Dispatch Offer] WhatsApp notification non-fatal error:', waErr);
      }
    }

    // 7. Channel 3: Direct Email via Resend to Creator Email
    if (creatorUser?.email) {
      try {
        await sendNotificationEmail({
          eventNumber: 12,
          title: `New Project Offer: ${serviceTitle}`,
          message: `Congratulations ${creatorDisplayName}!\n\nA client has chosen you for their production project.\n\n• Project: ${serviceTitle}\n• Net Payout: ₹${creatorPayoutInr.toLocaleString('en-IN')} INR\n• Delivery SLA: ${turnaroundLabel}\n• Response Window: 24 Hours\n\nPlease log in to your Artsy Creator Workstation to accept or decline this offer.`,
          recipientEmail: creatorUser.email,
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/freelancer`,
        });
      } catch (emailErr) {
        console.warn('[Dispatch Offer] Resend Email dispatch non-fatal error:', emailErr);
      }
    }

    return {
      success: true,
      assignmentId,
      creatorName: creatorDisplayName,
      payoutPaise: creatorPayoutPaise,
      payoutInr: creatorPayoutInr,
    };
  } catch (err: any) {
    console.error('[Dispatch Offer] Exception during job offer dispatch:', err);
    return { success: false, error: err?.message || 'Failed to dispatch offer' };
  }
}

