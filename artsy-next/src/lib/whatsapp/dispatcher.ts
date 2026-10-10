// =============================================================================
// ARTSY PRODUCTION — NOTIFICATION DISPATCHER (44 EVENTS)
// =============================================================================
// Source: Artsy Production — Master Plan (Reviewed & Finalized).md, Section 7

import { supabase } from '@/../lib/supabase';
import { WHATSAPP_TEMPLATES } from './templates';

export interface NotificationPayload {
  eventNumber: number; // 1 to 44
  userId: string;
  recipientPhone?: string;
  recipientEmail?: string;
  variables?: Record<string, string | number>;
  actionUrl?: string;
}

export interface NotificationTemplate {
  eventNumber: number;
  name: string;
  title: string;
  defaultMessage: string;
  targetChannels: Array<'whatsapp' | 'in_app' | 'email' | 'sms'>;
  isCritical: boolean;
}

export const NOTIFICATION_TEMPLATES: Record<number, NotificationTemplate> = {
  1: { eventNumber: 1, name: 'OTP_SENT', title: 'Security Passcode', defaultMessage: 'Your Artsy verification code is {{otp}}. Valid for 5 minutes. Do not share this code.', targetChannels: ['whatsapp'], isCritical: true },
  2: { eventNumber: 2, name: 'PROFILE_SUBMITTED', title: 'Profile Under Review', defaultMessage: 'Your creator application has been submitted to Studio Curation. We will review your portfolio within 24-48 hours.', targetChannels: ['whatsapp', 'in_app'], isCritical: false },
  3: { eventNumber: 3, name: 'PROFILE_APPROVED', title: 'Application Approved', defaultMessage: 'Welcome to Artsy Production. Your editor profile is approved. You are now eligible to receive project offers.', targetChannels: ['whatsapp'], isCritical: true },
  4: { eventNumber: 4, name: 'PROFILE_REJECTED', title: 'Application Status', defaultMessage: 'Thank you for your interest in Artsy. At this time, our roster does not match your current reel. You may reapply in 60 days.', targetChannels: ['whatsapp'], isCritical: false },
  5: { eventNumber: 5, name: 'QUOTE_READY', title: 'Quote Ready', defaultMessage: 'Your custom production quote is ready for review. View breakdown and lock checkout within 7 days.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  6: { eventNumber: 6, name: 'PAYMENT_SUCCESSFUL', title: 'Payment Confirmed', defaultMessage: 'Payment of ₹{{amount}} confirmed for Order #{{orderId}}. Upload your raw footage to initiate timeline assembly.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  7: { eventNumber: 7, name: 'PAYMENT_FAILED', title: 'Payment Incomplete', defaultMessage: 'Payment transaction failed for Order #{{orderId}}. Tap to retry checkout.', targetChannels: ['whatsapp'], isCritical: true },
  8: { eventNumber: 8, name: 'UPLOAD_REMINDER', title: 'Footage Upload Pending', defaultMessage: 'Friendly reminder: Please upload your project footage for Order #{{orderId}} so our editing team can begin.', targetChannels: ['whatsapp'], isCritical: false },
  9: { eventNumber: 9, name: 'UPLOAD_COMPLETE', title: 'Footage Ingest Verified', defaultMessage: 'Your raw footage has been safely ingested and verified. Project moved to assignment queue.', targetChannels: ['in_app'], isCritical: false },
  10: { eventNumber: 10, name: 'UPLOAD_FAILED', title: 'Upload Incomplete', defaultMessage: 'One or more files failed integrity check. Please re-upload your missing clips.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  11: { eventNumber: 11, name: 'CREATOR_ASSIGNED', title: 'Editor Assigned', defaultMessage: 'Lead editor assigned to Project #{{projectId}}.', targetChannels: ['in_app'], isCritical: false },
  12: { eventNumber: 12, name: 'JOB_OFFERED', title: 'New Project Offer', defaultMessage: 'New project offered: {{serviceName}} (Net Payout: ₹{{payout}}). Respond within 24 hours to secure assignment.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  13: { eventNumber: 13, name: 'CREATOR_ACCEPTED', title: 'Job Accepted', defaultMessage: 'Creator has accepted Project #{{projectId}}. Ingest credentials issued.', targetChannels: ['in_app'], isCritical: false },
  14: { eventNumber: 14, name: 'CREATOR_DECLINED', title: 'Job Declined', defaultMessage: 'Creator declined Project #{{projectId}}. Reassigning to reserve editor.', targetChannels: ['in_app', 'whatsapp'], isCritical: true },
  15: { eventNumber: 15, name: 'ACCEPTANCE_TIMEOUT', title: 'Offer Expired', defaultMessage: '24-hour acceptance window expired for Project #{{projectId}}. Job returned to curation queue.', targetChannels: ['in_app', 'whatsapp'], isCritical: true },
  16: { eventNumber: 16, name: 'DAILY_CHECKIN', title: 'Daily Progress Check', defaultMessage: 'Please submit your daily editing milestone for Project #{{projectId}}.', targetChannels: ['whatsapp'], isCritical: false },
  17: { eventNumber: 17, name: 'CHECKIN_MISSED', title: 'Milestone Alert', defaultMessage: 'Check-in missed for Project #{{projectId}}. Admin attention required.', targetChannels: ['in_app', 'whatsapp'], isCritical: true },
  18: { eventNumber: 18, name: 'DEADLINE_RISK', title: 'Deadline Risk Alert', defaultMessage: 'Project #{{projectId}} internal deadline approaching in less than 24 hours.', targetChannels: ['in_app', 'whatsapp'], isCritical: true },
  19: { eventNumber: 19, name: 'DELIVERABLE_SUBMITTED', title: 'Rough Cut Submitted', defaultMessage: 'New timeline export submitted for Project #{{projectId}}. Ready for Studio QA review.', targetChannels: ['in_app'], isCritical: false },
  20: { eventNumber: 20, name: 'QA_PASSED', title: 'Preview Ready', defaultMessage: 'Studio QA complete! Your private preview link is ready. Review and leave frame-by-frame comments.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  21: { eventNumber: 21, name: 'QA_FAILED', title: 'QA Revision Notes', defaultMessage: 'QA review requires adjustments on audio normalization / color consistency before client preview.', targetChannels: ['whatsapp', 'in_app'], isCritical: false },
  22: { eventNumber: 22, name: 'REVISION_REQUESTED', title: 'Client Feedback Received', defaultMessage: 'Client has submitted revision comments on Project #{{projectId}}. Please review notes.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  23: { eventNumber: 23, name: 'REVIEW_REMINDER', title: 'Preview Awaiting Feedback', defaultMessage: 'Your preview cut for Project #{{projectId}} is ready. Auto-approval activates in 48 hours.', targetChannels: ['whatsapp'], isCritical: false },
  24: { eventNumber: 24, name: 'AUTO_APPROVED', title: 'Project Auto-Approved', defaultMessage: '7-day client review period elapsed. Project #{{projectId}} has been auto-approved for master export.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  25: { eventNumber: 25, name: 'PROJECT_COMPLETED', title: 'Master Delivery Complete', defaultMessage: 'Your master 4K / HD delivery package for Project #{{projectId}} is ready for download.', targetChannels: ['whatsapp'], isCritical: true },
  26: { eventNumber: 26, name: 'CHANGE_ORDER_CREATED', title: 'Change Order Issued', defaultMessage: 'Scope update required for Project #{{projectId}}: ₹{{amount}} for additional deliverables.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  27: { eventNumber: 27, name: 'CHANGE_ORDER_ACCEPTED', title: 'Change Order Approved', defaultMessage: 'Change order approved and funded. Extra scope unlocked.', targetChannels: ['in_app'], isCritical: false },
  28: { eventNumber: 28, name: 'CHANGE_ORDER_DECLINED', title: 'Change Order Declined', defaultMessage: 'Client declined scope change. Proceeding with original delivery specification.', targetChannels: ['in_app'], isCritical: false },
  29: { eventNumber: 29, name: 'PAYOUT_ELIGIBLE', title: 'Payout Scheduled', defaultMessage: 'Project approved! Net payout of ₹{{amount}} scheduled for NEFT release within 7 days.', targetChannels: ['in_app'], isCritical: false },
  30: { eventNumber: 30, name: 'PAYOUT_PROCESSED', title: 'NEFT Payout Transferred', defaultMessage: 'NEFT Payout of ₹{{amount}} successfully processed (UTR: {{utr}}). TDS withheld: ₹{{tds}}.', targetChannels: ['whatsapp'], isCritical: true },
  31: { eventNumber: 31, name: 'PAYOUT_FAILED', title: 'Payout Transfer Issue', defaultMessage: 'NEFT transfer failed due to invalid IFSC / account number. Please verify bank credentials.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  32: { eventNumber: 32, name: 'REFUND_INITIATED', title: 'Refund Initiated', defaultMessage: 'Refund of ₹{{amount}} initiated. Amount will reflect in original payment method in 5-7 business days.', targetChannels: ['whatsapp'], isCritical: true },
  33: { eventNumber: 33, name: 'REFUND_PROCESSED', title: 'Refund Completed', defaultMessage: 'Refund of ₹{{amount}} settled. Credit note generated.', targetChannels: ['whatsapp'], isCritical: true },
  34: { eventNumber: 34, name: 'DISPUTE_OPENED', title: 'Mediation Notice', defaultMessage: 'Dispute opened for Project #{{projectId}}. Studio Admin has initiated manual review.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  35: { eventNumber: 35, name: 'RAW_DELETION_7D', title: 'Storage Notice (7 Days)', defaultMessage: 'Raw footage for Project #{{projectId}} will be deleted in 7 days. Extend retention in dashboard.', targetChannels: ['whatsapp'], isCritical: false },
  36: { eventNumber: 36, name: 'RAW_DELETION_3D', title: 'Storage Notice (3 Days)', defaultMessage: 'URGENT: Raw footage will be permanently archived in 3 days.', targetChannels: ['whatsapp'], isCritical: true },
  37: { eventNumber: 37, name: 'RAW_DELETION_1D', title: 'Storage Notice (24 Hours)', defaultMessage: 'FINAL NOTICE: Raw footage for Project #{{projectId}} will be purged tomorrow.', targetChannels: ['whatsapp'], isCritical: true },
  38: { eventNumber: 38, name: 'RAW_DELETED', title: 'Footage Archived', defaultMessage: 'Raw footage for Project #{{projectId}} soft deleted according to 15-day retention policy.', targetChannels: ['whatsapp'], isCritical: false },
  39: { eventNumber: 39, name: 'FINAL_DELETION_7D', title: 'Master File Expiry (7 Days)', defaultMessage: 'Master export link expires in 7 days. Download your final films.', targetChannels: ['whatsapp'], isCritical: false },
  40: { eventNumber: 40, name: 'FINAL_DELETION_3D', title: 'Master File Expiry (3 Days)', defaultMessage: 'Master video files will be archived in 3 days.', targetChannels: ['whatsapp'], isCritical: true },
  41: { eventNumber: 41, name: 'FINAL_DELETED', title: 'Master File Archived', defaultMessage: 'Final video files archived from hot CDN storage.', targetChannels: ['whatsapp'], isCritical: false },
  42: { eventNumber: 42, name: 'CREATOR_SUSPENDED', title: 'Account Status Notice', defaultMessage: 'Your editor account has been temporarily paused by Studio Administration.', targetChannels: ['whatsapp'], isCritical: true },
  43: { eventNumber: 43, name: 'PROJECT_CANCELLED', title: 'Project Cancelled', defaultMessage: 'Project #{{projectId}} cancelled. Cancellation terms applied per platform policy.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
  44: { eventNumber: 44, name: 'SLA_BREACH', title: 'SLA Grace Compensation', defaultMessage: 'Turnaround deadline exceeded on Project #{{projectId}}. 10% credit applied to account.', targetChannels: ['whatsapp', 'in_app'], isCritical: true },
};

export async function dispatchNotification(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const template = NOTIFICATION_TEMPLATES[payload.eventNumber];
    if (!template) {
      return { success: false, error: `Invalid event number: ${payload.eventNumber}` };
    }

    // Format message with variable substitutions
    let formattedMessage = template.defaultMessage;
    if (payload.variables) {
      Object.entries(payload.variables).forEach(([key, val]) => {
        formattedMessage = formattedMessage.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      });
    }

    // 1. In-App Notification (Only stored if in_app is a target channel and valid user exists)
    let inAppNotificationId = null;
    const isInAppTarget = template.targetChannels.includes('in_app');
    if (isInAppTarget && payload.userId && !payload.userId.startsWith('anon_') && supabase && typeof supabase.from === 'function') {
      try {
        const { data: notifData } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: payload.userId,
              event_number: payload.eventNumber,
              title: template.title,
              message: formattedMessage,
              actionUrl: payload.actionUrl || null,
              read: false,
              created_at: new Date().toISOString(),
            },
          ])
          .select('id')
          .single();
        inAppNotificationId = notifData?.id || null;
      } catch (inAppErr) {
        console.warn('In-app notification insert non-fatal error:', inAppErr);
      }
    }

    // 2. Resolve User Email for Resend Delivery / Fallbacks
    let emailToUse = payload.recipientEmail;
    if (!emailToUse && payload.userId && !payload.userId.startsWith('anon_') && supabase && typeof supabase.from === 'function') {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', payload.userId)
          .maybeSingle();
        if (userData?.email) {
          emailToUse = userData.email;
        }
      } catch (userErr) {
        console.warn('Failed to resolve user email for notification:', userErr);
      }
    }

    const hasResend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your-resend');
    const sendEmailFallback = async (reason: string) => {
      if (hasResend && emailToUse) {
        try {
          const { sendNotificationEmail } = await import('@/lib/email/dispatcher');
          await sendNotificationEmail({
            eventNumber: payload.eventNumber,
            title: template.title,
            message: formattedMessage,
            recipientEmail: emailToUse,
            actionUrl: payload.actionUrl,
          });
          console.log(`[Email Fallback] Sent notification email for Event #${payload.eventNumber} to ${emailToUse} (Reason: ${reason})`);
        } catch (emailErr) {
          console.error(`Email dispatch error for notification event #${payload.eventNumber}:`, emailErr);
        }
      } else {
        console.warn(`[Email Fallback Skipped] No recipient email or Resend not configured for Event #${payload.eventNumber}`);
      }
    };

    // 3. WhatsApp Cloud API Dispatch via Meta Cloud API
    const metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const isMetaConfigured = Boolean(
      metaAccessToken &&
      metaPhoneId &&
      !metaAccessToken.includes('WILL_BE_PROVIDED') &&
      !metaAccessToken.includes('your-')
    );

    let metaSendSuccess = false;

    if (payload.recipientPhone) {
      const cleanPhone = payload.recipientPhone.replace(/\D/g, '');

      if (isMetaConfigured) {
        // Map 44 events to the 3 Meta utility templates
        const metaTemplate = getMetaTemplateForEvent(payload, template);
        try {
          const { sendMetaTemplate } = await import('./meta-cloud-dispatcher');
          const metaResult = await sendMetaTemplate(cleanPhone, metaTemplate.templateName, metaTemplate.params);

          metaSendSuccess = metaResult.success;

          // Log every attempt to notification_delivery_log table with channel='whatsapp_meta'
          if (supabase && typeof supabase.from === 'function') {
            try {
              const deliveryRow = {
                notification_id: inAppNotificationId,
                channel: 'whatsapp_meta',
                recipient: payload.recipientPhone,
                event_number: payload.eventNumber,
                provider_message_id: metaResult.messageId || null,
                status: metaResult.success ? 'sent' : 'failed',
                error_message: metaResult.error || null,
                created_at: new Date().toISOString(),
              };

              const { error: logError } = await supabase
                .from('notification_delivery_log')
                .insert([deliveryRow]);

              if (logError && logError.code === '23514') {
                // If database check constraint requires legacy 'whatsapp' enum
                await supabase
                  .from('notification_delivery_log')
                  .insert([{ ...deliveryRow, channel: 'whatsapp' }]);
              }
            } catch (logErr) {
              console.warn('[META_CAPI] Delivery log non-fatal error:', logErr);
            }
          }

          if (!metaResult.success) {
            console.warn(`[META_CAPI] Failed for Event #${payload.eventNumber}: ${metaResult.error}. Falling back to email.`);
            await sendEmailFallback(`Meta Cloud API failed: ${metaResult.error}`);
          }
        } catch (metaErr: any) {
          console.error(`[META_CAPI] Exception for Event #${payload.eventNumber}:`, metaErr);
          await sendEmailFallback(`Meta Cloud API exception: ${metaErr.message}`);
        }
      } else {
        // Fallback: OpenWA gateway or email
        console.log(`[WhatsApp Meta Cloud API Unconfigured] Event #${payload.eventNumber} recipient: ${cleanPhone}. Triggering fallback.`);
        await sendEmailFallback('Meta Cloud API unconfigured');
      }
    } else {
      // Direct Email dispatch if no phone is specified but email channel is available
      if (hasResend && emailToUse && template.targetChannels.includes('email')) {
        await sendEmailFallback('Direct email notification');
      }
    }

    // 4. SMS Fallback (Critical alerts)
    if (template.isCritical && payload.recipientPhone && !metaSendSuccess) {
      console.log(`[SMS MOCK (Skipped)] Event #${payload.eventNumber} to ${payload.recipientPhone}: "${formattedMessage}"`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Notification dispatch exception:', err);
    return { success: false, error: 'Internal dispatch error' };
  }
}

/**
 * Maps all 44 Artsy notification events to one of the 3 Meta Cloud API utility templates.
 * 
 * Rules:
 * 1. Welcome / new user creation (Events 2, 3) -> artsy_account_confirmed
 *    Parameters: [user_name, account_id, dashboard_url]
 * 2. Payment success (Event 6) -> artsy_payment_confirmation
 *    Parameters: [user_name, amount_inr, project_id, invoice_number]
 * 3. All other status updates (Events 1, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16-44) -> artsy_project_status
 *    Parameters: [project_id, project_name, status_text, project_url]
 */
export function getMetaTemplateForEvent(
  payload: NotificationPayload,
  template: NotificationTemplate
): { templateName: string; params: string[] } {
  const vars = payload.variables || {};
  const userName = String(vars.userName || vars.user_name || vars.name || vars.alias || 'Client');
  const accountId = String(vars.accountId || vars.account_id || vars.userId || payload.userId || 'ARTSY-USER-8841');
  const dashboardUrl = payload.actionUrl || String(vars.dashboardUrl || vars.dashboard_url || 'https://artsyproduction.com/client-dashboard');
  const projectUrl = payload.actionUrl || String(vars.projectUrl || vars.project_url || 'https://artsyproduction.com/client/projects');
  const projectId = String(vars.projectId || vars.project_id || vars.orderId || vars.order_id || 'AP-8841');
  const projectName = String(vars.projectName || vars.project_name || vars.serviceName || vars.service_name || 'Production Film');

  // Welcome / new user creation (Events 2, 3) -> artsy_account_confirmed
  if (payload.eventNumber === 2 || payload.eventNumber === 3) {
    return {
      templateName: process.env.WHATSAPP_WELCOME_TEMPLATE_NAME || 'artsy_account_confirmed',
      params: [userName, accountId, dashboardUrl],
    };
  }

  // Payment success (Event 6) -> artsy_payment_confirmation
  if (payload.eventNumber === 6) {
    const rawAmount = String(vars.amountInr || vars.amount_inr || vars.amount || '8000');
    const amountInr = rawAmount.startsWith('Rs.') || rawAmount.startsWith('₹') ? rawAmount : `Rs.${rawAmount}`;
    const invoiceNumber = String(vars.invoiceNumber || vars.invoice_number || vars.orderId || 'AP/26-27/00001');
    return {
      templateName: process.env.WHATSAPP_PAYMENT_TEMPLATE_NAME || 'artsy_payment_confirmation',
      params: [userName, amountInr, projectId, invoiceNumber],
    };
  }

  // OTP Verification (Event 1) -> artsy_otp_verification if OTP template exists, else artsy_project_status
  if (payload.eventNumber === 1 && vars.otp) {
    const otpTemplate = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    if (otpTemplate) {
      return {
        templateName: otpTemplate,
        params: [String(vars.otp)],
      };
    }
  }

  // All other status updates -> artsy_project_status
  // Events: 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  // 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44
  const statusText = String(vars.statusText || vars.status_text || vars.status || template.title || 'Ready for review');
  return {
    templateName: process.env.WHATSAPP_PROJECT_TEMPLATE_NAME || 'artsy_project_status',
    params: [projectId, projectName, statusText, projectUrl],
  };
}


