import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Strict Signature Verification (HMAC SHA256)
    if (!webhookSecret) {
      console.error('[Razorpay Webhook Error] RAZORPAY_WEBHOOK_SECRET is not configured on server.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Razorpay Webhook Error] Invalid webhook signature provided.');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // 2. Parse Event & Enforce 5-Minute Replay Protection Window
    let event: any = {};
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventTimestamp = event.created_at || event.payload?.payment?.entity?.created_at;
    if (eventTimestamp) {
      const nowSec = Math.floor(Date.now() / 1000);
      const diffSec = Math.abs(nowSec - Number(eventTimestamp));
      if (diffSec > 300) {
        console.warn(`[Razorpay Replay Alert] Dropping event: ${diffSec}s difference exceeds 5-minute replay window.`);
        return NextResponse.json(
          { error: 'Webhook timestamp outside 5-minute window' },
          { status: 400 }
        );
      }
    }

    const eventId = event.event_id || event.id || `evt_${Date.now()}`;
    const eventType = event.event;

    // 3. Idempotency Check via webhook_events
    if (supabase && typeof supabase.from === 'function') {
      try {
        const { data: existingEvent } = await supabase
          .from('webhook_events')
          .select('id, status')
          .match({ gateway: 'razorpay', event_id: eventId })
          .maybeSingle();

        if (existingEvent) {
          // Already received and processed: return 200 OK immediately
          return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        // Record incoming webhook event
        await supabase.from('webhook_events').insert([
          {
            gateway: 'razorpay',
            event_id: eventId,
            event_type: eventType,
            payload: event,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (dbErr) {
        console.warn('Webhook idempotency DB insert warning (offline mode):', dbErr);
      }
    }

    // 4. Process Payment Events
    switch (eventType) {
      case 'payment.captured':
      case 'order.paid': {
        const paymentEntity = event.payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        const razorpayPaymentId = paymentEntity?.id;
        const amountPaise = paymentEntity?.amount;

        if (supabase && typeof supabase.from === 'function' && razorpayOrderId) {
          try {
            const { data: order } = await supabase
              .from('orders')
              .select('*')
              .eq('razorpay_order_id', razorpayOrderId)
              .maybeSingle();

            if (order) {
              await supabase
                .from('orders')
                .update({
                  status: 'paid',
                  razorpay_payment_id: razorpayPaymentId,
                  paid_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

              await supabase.from('payments').insert([
                {
                  order_id: order.id,
                  amount: amountPaise || order.gross_amount,
                  currency: 'INR',
                  gateway: 'razorpay',
                  gateway_payment_id: razorpayPaymentId,
                  gateway_order_id: razorpayOrderId,
                  gateway_signature: signature || null,
                  payment_method: paymentEntity?.method || 'unknown',
                  status: 'captured',
                  gateway_response: paymentEntity,
                  captured_at: new Date().toISOString(),
                },
              ]);

              const waterfall = calculateFinancialWaterfall(amountPaise || order.gross_amount);
              await supabase.from('financial_events').insert([
                {
                  order_id: order.id,
                  event_type: 'client_payment',
                  amount: waterfall.clientPayment,
                  currency: 'INR',
                  reference_id: order.id,
                  reference_table: 'orders',
                },
                {
                  order_id: order.id,
                  event_type: 'gateway_fee',
                  amount: -waterfall.totalGatewayDeduction,
                  currency: 'INR',
                  reference_id: order.id,
                  reference_table: 'orders',
                },
                {
                  order_id: order.id,
                  event_type: 'gst_liability',
                  amount: -waterfall.gstAmount,
                  currency: 'INR',
                  reference_id: order.id,
                  reference_table: 'orders',
                },
                {
                  order_id: order.id,
                  event_type: 'creator_payable',
                  amount: -waterfall.creatorAmount,
                  currency: 'INR',
                  reference_id: order.id,
                  reference_table: 'orders',
                },
              ]);
            }
          } catch (processErr) {
            console.warn('Payment capture DB write warning:', processErr);
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = event.payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        if (supabase && typeof supabase.from === 'function' && razorpayOrderId) {
          try {
            await supabase
              .from('orders')
              .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
              .eq('razorpay_order_id', razorpayOrderId);
          } catch (e) {
            console.warn('Failed payment update warning:', e);
          }
        }
        break;
      }

      default:
        break;
    }

    // Mark webhook event as processed
    if (supabase && typeof supabase.from === 'function') {
      try {
        await supabase
          .from('webhook_events')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .match({ gateway: 'razorpay', event_id: eventId });
      } catch (e) {
        // non-blocking
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Webhook processing exception:', errorMsg);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
