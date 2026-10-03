// =============================================================================
// ARTSY PRODUCTION — RESEND EMAIL DISPATCHER
// =============================================================================
// Integrates with Resend API for transactional emails:
// - Email OTP Authentication (Primary delivery channel)
// - 44 Platform Notification Events
// - GST Statutory Invoices (SAC 999613)
// =============================================================================

import { supabase } from '@/../lib/supabase';
import { InvoiceData } from '@/lib/invoices/generator';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  forwardedTo?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const SANDBOX_OWNER_EMAIL = 'artsyproduction8@gmail.com';

/**
 * Sends an email using the Resend REST API.
 * Automatically handles Resend sandbox testing restrictions for unregistered emails.
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.includes('your-resend') || apiKey === '[PASTE YOUR RESEND API KEY HERE]') {
    console.warn('[Resend Email Mock] RESEND_API_KEY not configured. Simulated send to:', options.to);
    return {
      success: true,
      id: `mock_email_${Date.now()}`,
    };
  }

  const fromAddress = options.from || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'Artsy Production <onboarding@resend.dev>';
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  const payload: Record<string, unknown> = {
    from: fromAddress,
    to: recipients,
    subject: options.subject,
  };

  if (options.html) {
    payload.html = options.html;
  }
  if (options.text) {
    payload.text = options.text;
  }
  if (options.replyTo) {
    payload.reply_to = options.replyTo;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      return { success: true, id: data.id };
    }

    // Handle Resend free tier sandbox restriction (only sends to account owner's email, rejects example.com / unverified domains)
    const errorMsgStr = typeof data.message === 'string' ? data.message : '';
    const isSandboxRestriction =
      !response.ok &&
      (response.status === 403 || response.status === 400 || response.status === 422) &&
      (errorMsgStr.includes('own email address') ||
        errorMsgStr.includes('example.com') ||
        errorMsgStr.includes('testing email') ||
        errorMsgStr.includes('verify a domain'));

    if (isSandboxRestriction) {
      console.warn(`[Resend Sandbox Notice] Recipient ${recipients.join(', ')} cannot be directly delivered in sandbox mode. Forwarding to verified account owner: ${SANDBOX_OWNER_EMAIL}`);

      const sandboxPayload = {
        ...payload,
        to: [SANDBOX_OWNER_EMAIL],
        subject: `[Dev Sandbox for ${recipients[0]}] ${options.subject}`,
        html: options.html
          ? `<div style="background:#fff3cd;padding:12px;margin-bottom:16px;border-radius:6px;font-family:sans-serif;font-size:12px;color:#856404;border:1px solid #ffeeba;">
               <strong>Resend Sandbox Notice:</strong> Intended recipient was <code>${recipients.join(', ')}</code>. In sandbox mode, Resend routes test emails to your verified account inbox.
             </div>${options.html}`
          : undefined,
        text: options.text
          ? `[Resend Sandbox Notice: Intended recipient was ${recipients.join(', ')}. Delivered to verified account owner.]\n\n${options.text}`
          : undefined,
      };

      const fallbackRes = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(sandboxPayload),
      });

      const fallbackData = await fallbackRes.json();
      if (fallbackRes.ok && fallbackData.id) {
        return {
          success: true,
          id: fallbackData.id,
          forwardedTo: SANDBOX_OWNER_EMAIL,
        };
      }
    }

    console.error('[Resend Email Error]', response.status, data);
    return {
      success: false,
      error: data.message || `HTTP ${response.status}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Resend Email Network Exception]', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends a 6-digit verification code (OTP) via Resend email.
 */
export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<EmailResult> {
  const subject = `Your Artsy Verification Code: ${otpCode}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artsy Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #12141c; border: 1px solid #1f2430; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px; text-align: center; border-bottom: 1px solid #1f2430;">
              <span style="font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">ARTSY</span>
              <span style="font-size: 11px; display: block; margin-top: 4px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;">Cinematic Post-Production</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px;">
              <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">One-Time Passcode</h1>
              <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Use the following 6-digit code to securely sign in to your Artsy account.
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #0a0b10; border: 1px solid #2d3748; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                <span style="font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #3b82f6; display: inline-block;">${otpCode}</span>
                <span style="display: block; font-size: 11px; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Valid for 5 minutes</span>
              </div>

              <div style="background-color: #181c27; border-left: 3px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #cbd5e1;">
                  <strong>Security Advisory:</strong> Artsy personnel will never ask for this code. Never share your passcode or forward this email.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                If you did not request this login code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0d0f15; border-top: 1px solid #1f2430; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; ${new Date().getFullYear()} Artsy Production. All rights reserved.<br>
                Mumbai &bull; Bengaluru &bull; Delhi NCR
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Your Artsy Production verification code is: ${otpCode}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}

/**
 * Sends a statutory GST Tax Invoice email via Resend.
 */
export async function sendInvoiceEmail(toEmail: string, invoice: InvoiceData): Promise<EmailResult> {
  const subject = `Tax Invoice #${invoice.invoiceNumber} — Artsy Production`;
  const viewInvoiceUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/invoices/${invoice.orderDetails.orderId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${invoice.invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1d1d1f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:600px;background:#ffffff;border:1px solid #e5e5e7;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:32px;border-bottom:2px solid #1d1d1f;">
              <span style="font-size:20px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">ARTSY PRODUCTION</span>
              <span style="display:block;font-size:11px;color:#86868b;margin-top:2px;">STATUTORY TAX INVOICE (RULE 46 OF CGST RULES)</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;">Payment Confirmed &amp; Invoice Issued</h2>
              <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#555;">
                Thank you for your business. Your payment of <strong>₹${(invoice.orderDetails.totalPaidPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> for Order #<strong>${invoice.orderDetails.orderId}</strong> has been successfully captured into Production Vault custody.
              </p>

              <table width="100%" style="border-collapse:collapse;margin-bottom:24px;font-size:12px;">
                <tr style="background:#f5f5f7;">
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e5e7;">Invoice No</th>
                  <td style="text-align:right;padding:10px;border-bottom:1px solid #e5e5e7;font-family:monospace;font-weight:700;">${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e5e7;">Date</th>
                  <td style="text-align:right;padding:10px;border-bottom:1px solid #e5e5e7;">${invoice.invoiceDate}</td>
                </tr>
                <tr style="background:#f5f5f7;">
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e5e7;">Service</th>
                  <td style="text-align:right;padding:10px;border-bottom:1px solid #e5e5e7;">${invoice.orderDetails.serviceName}</td>
                </tr>
                <tr>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e5e7;">SAC Code</th>
                  <td style="text-align:right;padding:10px;border-bottom:1px solid #e5e5e7;">${invoice.orderDetails.sacCode}</td>
                </tr>
                <tr style="background:#f5f5f7;">
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e5e7;">Taxable Value</th>
                  <td style="text-align:right;padding:10px;border-bottom:1px solid #e5e5e7;font-family:monospace;">₹${(invoice.orderDetails.taxableAmountPaise / 100).toFixed(2)}</td>
                </tr>
                <tr>
                  <th style="text-align:left;padding:10px;border-bottom:1px solid #e5e5e7;">GST (18%)</th>
                  <td style="text-align:right;padding:10px;border-bottom:1px solid #e5e5e7;font-family:monospace;">₹${(invoice.orderDetails.gstAmountPaise / 100).toFixed(2)}</td>
                </tr>
                <tr style="background:#f5f5f7;font-size:14px;font-weight:700;">
                  <th style="text-align:left;padding:12px;border-top:2px solid #1d1d1f;">Total Paid</th>
                  <td style="text-align:right;padding:12px;border-top:2px solid #1d1d1f;font-family:monospace;color:#2563eb;">₹${(invoice.orderDetails.totalPaidPaise / 100).toFixed(2)}</td>
                </tr>
              </table>

              <div style="text-align:center;margin:32px 0;">
                <a href="${viewInvoiceUrl}" style="background-color:#1d1d1f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;display:inline-block;">
                  View &amp; Download GST Invoice PDF &rarr;
                </a>
              </div>

              <p style="margin:0;font-size:11px;color:#86868b;text-align:center;line-height:1.5;">
                This electronic invoice is archived in the immutable statutory WORM vault per Section 36 of CGST Act.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Tax Invoice #${invoice.invoiceNumber}\nOrder ID: ${invoice.orderDetails.orderId}\nTotal Paid: ₹${(invoice.orderDetails.totalPaidPaise / 100).toFixed(2)}\nView online: ${viewInvoiceUrl}`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}

/**
 * Sends a notification email for one of the 44 platform events.
 */
export async function sendNotificationEmail(params: {
  eventNumber: number;
  title: string;
  message: string;
  recipientEmail: string;
  actionUrl?: string;
}): Promise<EmailResult> {
  const subject = `[Artsy Production] ${params.title}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${params.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background-color:#12141c;border:1px solid #1f2430;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #1f2430;text-align:center;">
              <span style="font-size:18px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#fff;">ARTSY</span>
              <span style="display:block;font-size:10px;color:#94a3b8;letter-spacing:1px;margin-top:2px;">PRODUCTION NOTIFICATION</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <span style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;">
                Event #${params.eventNumber} &bull; ${params.title}
              </span>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#e2e8f0;">
                ${params.message}
              </p>
              ${
                params.actionUrl
                  ? `<div style="text-align:center;margin:24px 0;">
                      <a href="${params.actionUrl}" style="background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;display:inline-block;">
                        Open in Dashboard &rarr;
                      </a>
                     </div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px;background-color:#0d0f15;border-top:1px solid #1f2430;text-align:center;">
              <p style="margin:0;font-size:11px;color:#64748b;">
                &copy; ${new Date().getFullYear()} Artsy Production. You are receiving this notification for project updates.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const res = await sendEmail({
    to: params.recipientEmail,
    subject,
    html,
    text: params.message,
  });

  // Record in Supabase notification_delivery_log if available
  if (supabase && typeof supabase.from === 'function') {
    try {
      await supabase.from('notification_delivery_log').insert([
        {
          channel: 'email',
          recipient: params.recipientEmail,
          event_number: params.eventNumber,
          provider_message_id: res.id || null,
          status: res.success ? 'sent' : 'failed',
          error_message: res.error || null,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      // non-blocking
    }
  }

  return res;
}
