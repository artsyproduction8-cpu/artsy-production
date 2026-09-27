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

    // 2. Email Dispatch via Resend (Primary delivery channel while WhatsApp is skipped)
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
      } catch (emailErr) {
        console.error('Email dispatch error for notification event #' + payload.eventNumber, emailErr);
      }
    } else if (hasResend && !emailToUse) {
      console.log(`[Resend Email Notice] Event #${payload.eventNumber} "${template.title}" has no recipient email provided. Message: "${formattedMessage}"`);
    }

    // 3. WhatsApp Cloud API Dispatch (MOCKED - Skipped per configuration)
    const isMockWA = process.env.MOCK_WHATSAPP === 'true' || true;
    if (payload.recipientPhone) {
      const cleanPhone = payload.recipientPhone.replace(/\D/g, '');
      const templateDef = WHATSAPP_TEMPLATES[payload.eventNumber];
      const templateName = templateDef?.templateName || 'artsy_general_notification';
      console.log(`[WhatsApp MOCK (Skipped)] Event #${payload.eventNumber} ("${templateName}") -> ${cleanPhone}: "${formattedMessage}"`);

      if (supabase && typeof supabase.from === 'function') {
        try {
          await supabase.from('notification_delivery_log').insert([
            {
              notification_id: inAppNotificationId,
              channel: 'whatsapp',
              recipient: payload.recipientPhone,
              event_number: payload.eventNumber,
              provider_message_id: `mock_wa_${Date.now()}`,
              status: 'mock_sent',
              created_at: new Date().toISOString(),
            },
          ]);
        } catch {
          // non-blocking
        }
      }
    }

    // 4. SMS Fallback (MOCKED - Skipped per configuration)
    if (template.isCritical && payload.recipientPhone) {
      console.log(`[SMS MOCK (Skipped)] Event #${payload.eventNumber} to ${payload.recipientPhone}: "${formattedMessage}"`);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Notification dispatch exception:', err);
    return { success: false, error: 'Internal dispatch error' };
  }
}
