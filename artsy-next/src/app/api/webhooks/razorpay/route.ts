import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/razorpay',
    message: 'Razorpay webhook endpoint is healthy and listening for HMAC-SHA256 signed POST events.',
    configuredSecret: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
  });
}

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

    const eventTimestamp = event.created_at || event.payload?.payment?.entity?.created_at || event.payload?.refund?.entity?.created_at;
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
    if (supabaseAdmin && typeof supabaseAdmin.from === 'function') {
      try {
        const { data: existingEvent } = await supabaseAdmin
          .from('webhook_events')
          .select('id, status')
          .match({ gateway: 'razorpay', event_id: eventId })
          .maybeSingle();

        if (existingEvent) {
          // Already received and processed: return 200 OK immediately
          return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        // Record incoming webhook event
        await supabaseAdmin.from('webhook_events').insert([
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

    // 4. Process Gateway Events
    switch (eventType) {
      case 'payment.captured':
      case 'order.paid': {
        const paymentEntity = event.payload?.payment?.entity;
        const razorpayOrderId = paymentEntity?.order_id;
        const razorpayPaymentId = paymentEntity?.id;
        const amountPaise = paymentEntity?.amount;

        if (supabaseAdmin && typeof supabaseAdmin.from === 'function' && razorpayOrderId) {
          try {
            const { data: order } = await supabaseAdmin
              .from('orders')
              .select('*')
              .eq('razorpay_order_id', razorpayOrderId)
              .maybeSingle();

            if (order) {
              await supabaseAdmin
                .from('orders')
                .update({
                  status: 'paid',
                  razorpay_payment_id: razorpayPaymentId,
                  paid_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

              await supabaseAdmin.from('payments').insert([
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
              await supabaseAdmin.from('financial_events').insert([
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

              // Dispatch Tax Invoice via Resend Email and archive to WORM vault
              if (order.client_email) {
                try {
                  const { generateInvoiceData } = await import('@/lib/invoices/generator');
                  const { archiveInvoiceToVault } = await import('@/lib/invoices/vault');
                  const { sendInvoiceEmail } = await import('@/lib/email/dispatcher');
                  const invoice = generateInvoiceData({
                    orderId: order.order_number || order.id,
                    clientName: order.client_name || 'Valued Client',
                    clientPhone: order.client_phone || '',
                    clientEmail: order.client_email,
                    totalPaise: amountPaise || order.gross_amount,
                  });
                  await archiveInvoiceToVault(invoice);
                  await sendInvoiceEmail(order.client_email, invoice);
                } catch (invErr) {
                  console.warn('Auto invoice email dispatch warning:', invErr);
                }
              }
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
        if (supabaseAdmin && typeof supabaseAdmin.from === 'function' && razorpayOrderId) {
          try {
            await supabaseAdmin
              .from('orders')
              .update({ status: 'payment_failed', updated_at: new Date().toISOString() })
              .eq('razorpay_order_id', razorpayOrderId);
          } catch (e) {
            console.warn('Failed payment update warning:', e);
          }
        }
        break;
      }

      case 'refund.created':
      case 'refund.processed': {
        const refund = event.payload?.refund?.entity;
        if (refund && supabaseAdmin && typeof supabaseAdmin.from === 'function') {
          try {
            // Find matched order by razorpay_payment_id
            const { data: matchedOrder } = await supabaseAdmin
              .from('orders')
              .select('id, gross_amount, refund_amount')
              .eq('razorpay_payment_id', refund.payment_id)
              .maybeSingle();

            await supabaseAdmin
              .from('orders')
              .update({
                refund_status: refund.status || 'processed',
                refund_amount: refund.amount,
                updated_at: new Date().toISOString(),
              })
              .eq('razorpay_payment_id', refund.payment_id);

            await supabaseAdmin
              .from('refund_entries')
              .insert([
                {
                  order_id: matchedOrder?.id || null,
                  amount: refund.amount,
                  reason: refund.notes?.reason || 'webhook refund',
                  razorpay_refund_id: refund.id,
                  reference: refund.id,
                  status: refund.status || 'processed',
                  created_at: new Date().toISOString(),
                },
              ]);
          } catch (refErr) {
            console.warn('Refund webhook DB processing warning:', refErr);
          }
        }
        break;
      }

      default:
        break;
    }

    // Mark webhook event as processed
    if (supabaseAdmin && typeof supabaseAdmin.from === 'function') {
      try {
        await supabaseAdmin
          .from('webhook_events')
          .update({ status: 'processed', processed_at: new Date().toISOString() })
          .match({ gateway: 'razorpay', event_id: eventId });
      } catch {
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
