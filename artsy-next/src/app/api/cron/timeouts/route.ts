import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';

/**
 * Project Approval & Creator Offer Timeout Cron (§6.7, §6.8)
 * Schedule: Hourly
 * 
 * Rules:
 * 1. Client Approval (§6.7):
 *    - In 'client_review' state
 *    - Day 3, 5, 6: Send review reminder (Event 23)
 *    - Day 7 (>= 168 hours): Auto-approve project (Event 24, status -> 'auto_approved')
 * 
 * 2. Freelancer Acceptance Timeout (§6.8):
 *    - In 'creator_proposed' state
 *    - 12 hours: Send reminder to creator
 *    - 24 hours: Auto-decline offer, reassign_needed, alert admin (Event 15)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[CRON SECURITY ALERT] CRON_SECRET is not configured on server — rejecting request');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const autoApprovedProjects: string[] = [];
    const reviewRemindersSent: string[] = [];
    const creatorOfferTimeouts: string[] = [];

    const now = Date.now();

    if (supabase) {
      // 1. Check projects in 'client_review'
      const { data: reviewProjects } = await supabase
        .from('projects')
        .select('id, user_id, updated_at, status, is_auto_approve_blocked')
        .eq('status', 'client_review');

      if (reviewProjects) {
        for (const proj of reviewProjects) {
          // Master Plan v2.1 Audit Issue #17: Support block check
          if (proj.is_auto_approve_blocked) {
            console.log(`[TIMEOUT CRON] Project ${proj.id} auto-approval bypassed due to active support block flag`);
            continue;
          }

          const targetClientId = (proj as any).client_id || proj.user_id;
          let clientPhone: string | undefined;
          let clientEmail: string | undefined;

          if (targetClientId) {
            const { data: clientUser } = await supabase
              .from('users')
              .select('phone, email')
              .eq('id', targetClientId)
              .maybeSingle();

            clientPhone = clientUser?.phone || undefined;
            clientEmail = clientUser?.email || undefined;
          }

          const sendClientNotification = async (eventNumber: number, variables?: Record<string, any>) => {
            if (!clientPhone && !clientEmail) {
              console.log(`[TIMEOUT CRON] Skipped event ${eventNumber} for project ${proj.id}: client contact missing`);
              return;
            }
            await dispatchNotification({
              eventNumber,
              userId: targetClientId || 'system',
              recipientPhone: clientPhone,
              recipientEmail: clientEmail,
              variables: { projectId: proj.id, ...variables }
            });
          };

          const updatedAt = new Date(proj.updated_at).getTime();
          const elapsedHours = (now - updatedAt) / (1000 * 60 * 60);

          if (elapsedHours >= 168) {
            // >= 7 days: Auto-approve
            await supabase
              .from('projects')
              .update({ status: 'auto_approved', updated_at: new Date().toISOString() })
              .eq('id', proj.id);

            // Master Plan v2.1: Retention triggers on project approval
            const rawRetentionExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
            const masterRetentionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await supabase
              .from('file_records')
              .update({ retention_delete_at: rawRetentionExpiry, updated_at: new Date().toISOString() })
              .eq('project_id', proj.id)
              .eq('file_type', 'raw_footage')
              .is('retention_delete_at', null);

            await supabase
              .from('file_records')
              .update({ retention_delete_at: masterRetentionExpiry, updated_at: new Date().toISOString() })
              .eq('project_id', proj.id)
              .eq('file_type', 'master_delivery')
              .is('retention_delete_at', null);

            // Event 24: Auto-Approved Notification to Client
            await sendClientNotification(24);

            // Event 29: Payout Scheduled for Creator
            const creatorId = (proj as any).assigned_creator_id || (proj as any).assigned_editor_id;
            let creatorPhone: string | undefined;
            let creatorEmail: string | undefined;

            if (creatorId) {
              const { data: creatorUser } = await supabase
                .from('users')
                .select('phone, email')
                .eq('id', creatorId)
                .maybeSingle();

              creatorPhone = creatorUser?.phone || undefined;
              creatorEmail = creatorUser?.email || undefined;
            }

            if (creatorPhone || creatorEmail) {
              await dispatchNotification({
                eventNumber: 29,
                userId: creatorId || 'system',
                recipientPhone: creatorPhone,
                recipientEmail: creatorEmail,
                variables: { projectId: proj.id, amount: '4,533' }
              });
            } else {
              console.log(`[TIMEOUT CRON] Skipped event 29 for project ${proj.id}: creator contact missing`);
            }

            autoApprovedProjects.push(proj.id);
          } else if (elapsedHours >= 144 && elapsedHours < 145) {
            // Day 6 reminder
            await sendClientNotification(23);
            reviewRemindersSent.push(`${proj.id}_day6`);
          } else if (elapsedHours >= 120 && elapsedHours < 121) {
            // Day 5 reminder
            await sendClientNotification(23);
            reviewRemindersSent.push(`${proj.id}_day5`);
          } else if (elapsedHours >= 72 && elapsedHours < 73) {
            // Day 3 reminder
            await sendClientNotification(23);
            reviewRemindersSent.push(`${proj.id}_day3`);
          }
        }
      }

      // 2. Check assignments in 'offered' state (§6.8: dynamic 24h standard, 4h rush 4-5d, 2h rush 48h)
      const { data: pendingOffers } = await supabase
        .from('assignments')
        .select('id, project_id, creator_id, status, offered_at')
        .eq('status', 'offered');

      if (pendingOffers) {
        for (const offer of pendingOffers) {
          const offeredAt = new Date(offer.offered_at).getTime();
          const elapsedHours = (now - offeredAt) / (1000 * 60 * 60);

          // Check project priority / rush status
          const { data: projData } = await supabase
            .from('projects')
            .select('priority')
            .eq('id', offer.project_id)
            .maybeSingle();

          const priority = projData?.priority || 1;
          const timeoutHours = priority >= 5 ? 2 : priority >= 3 ? 4 : 24;

          if (elapsedHours >= timeoutHours) {
            // Timeout reached: auto-decline and notify admin
            await supabase
              .from('assignments')
              .update({ 
                status: 'declined', 
                response_notes: `Auto-declined: ${timeoutHours}-hour acceptance timeout expired` 
              })
              .eq('id', offer.id);

            await supabase
              .from('projects')
              .update({ status: 'reassignment_needed', updated_at: new Date().toISOString() })
              .eq('id', offer.project_id);

            // Fetch admin user contact
            const { data: adminUser } = await supabase
              .from('users')
              .select('id, phone, email')
              .eq('role', 'admin')
              .limit(1)
              .maybeSingle();

            const adminPhone = adminUser?.phone || process.env.ADMIN_PHONE;
            const adminEmail = adminUser?.email || process.env.ADMIN_EMAIL;

            if (adminPhone || adminEmail) {
              await dispatchNotification({
                eventNumber: 15,
                userId: adminUser?.id || 'admin',
                recipientPhone: adminPhone,
                recipientEmail: adminEmail,
                variables: { projectId: offer.project_id }
              });
            } else {
              console.log(`[TIMEOUT CRON] Skipped event 15 for offer ${offer.id}: admin contact missing`);
            }
            creatorOfferTimeouts.push(offer.id);
          }
        }
      }
    } else {
      console.log('[TIMEOUTS CRON] Simulated execution in mock offline mode');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      autoApprovedCount: autoApprovedProjects.length,
      autoApprovedProjects,
      reviewRemindersCount: reviewRemindersSent.length,
      creatorOfferTimeoutsCount: creatorOfferTimeouts.length,
      creatorOfferTimeouts,
      mode: supabase ? 'live_supabase' : 'mock_offline'
    });
  } catch (err: any) {
    console.error('[TIMEOUTS CRON ERROR]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal timeouts cron error' },
      { status: 500 }
    );
  }
}
