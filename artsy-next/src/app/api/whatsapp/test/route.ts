import { NextResponse } from 'next/server';
import { sendMetaTemplate } from '@/lib/whatsapp/meta-cloud-dispatcher';
import { supabase } from '@/../lib/supabase';

export async function POST(request: Request) {
  const body = await request.json();
  const { phone, templateName, params } = body;

  if (!phone || !templateName) {
    return NextResponse.json({ error: 'phone and templateName required' }, { status: 400 });
  }

  const result = await sendMetaTemplate(phone, templateName, params || []);

  // Log to notification_delivery_log per Task 8 requirements
  if (supabase && typeof supabase.from === 'function') {
    try {
      const eventNumber = templateName === 'artsy_account_confirmed' ? 3 : (templateName === 'artsy_payment_confirmation' ? 6 : 5);
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
        // Fallback to legacy 'whatsapp' enum if database check constraint enforces it
        await supabase.from('notification_delivery_log').insert([{ ...deliveryRecord, channel: 'whatsapp' }]);
      }
    } catch (dbErr) {
      console.warn('[TEST_ENDPOINT] Logging error:', dbErr);
    }
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
