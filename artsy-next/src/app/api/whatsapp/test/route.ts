import { NextResponse } from 'next/server';
import { sendMetaTemplate } from '@/lib/whatsapp/meta-cloud-dispatcher';
import { supabase } from '@/../lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  // Security Fix #9: Restrict test endpoint to authenticated admin
  const authUser = await getAuthenticatedUser(request);
  if (!authUser || !['admin', 'super_admin'].includes(authUser.role)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  const body = await request.json();
  const { phone, templateName, params } = body;

  if (!phone || !templateName) {
    return NextResponse.json({ error: 'phone and templateName required' }, { status: 400 });
  }

  const result = await sendMetaTemplate(phone, templateName, params || []);

  // Log to notification_delivery_log per Task 8 requirements
  if (supabase && typeof supabase.from === 'function') {
    try {
      const eventMap: Record<string, number> = {
        artsy_account_confirmed: 3,
        artsy_payment_confirmation: 6,
        artsy_footage_received: 9,
        artsy_editor_assigned: 11,
        artsy_draft_ready: 20,
        artsy_revision_requested: 21,
        artsy_approval_needed: 23,
        artsy_final_delivery: 25,
        artsy_invoice_ready: 5,
        artsy_retention_warning: 35,
        artsy_creator_welcome: 2,
        artsy_job_offer: 12,
        artsy_payout_sent: 30,
        artsy_creator_suspended: 42,
        artsy_dispute_opened: 34,
        artsy_change_order: 26,
        artsy_refund_processed: 33,
        artsy_sla_breach: 44,
        artsy_upload_reminder: 8,
        artsy_review_reminder: 23,
        artsy_daily_checkin: 16,
        artsy_admin_alert: 17,
        artsy_project_status: 5,
      };
      const eventNumber = eventMap[templateName] || 5;
      const deliveryRecord = {
        channel: 'whatsapp_meta',
        recipient: phone,
        event_number: eventNumber,
        provider_message_id: result.messageId || null,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        created_at: new Date().toISOString(),
      };

      const { error: logErr } = await supabase.from('notification_delivery_log').insert([deliveryRecord]);
      if (logErr && logErr.code === '23514') {
        await supabase.from('notification_delivery_log').insert([{ ...deliveryRecord, channel: 'whatsapp' }]);
      }
    } catch (dbErr) {
      console.warn('[TEST_ENDPOINT] Logging error:', dbErr);
    }
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
