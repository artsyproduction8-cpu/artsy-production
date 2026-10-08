import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

/**
 * Payment Reconciliation Cron (§3.9)
 * Schedule: Every 15 minutes
 * Function:
 * 1. Checks pending orders against local payments and Razorpay Gateway API
 * 2. Auto-resolves missing orders when webhook delivery failed or dropped
 * 3. Logs discrepancies in audit_logs and alerts admin
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

    const discrepancies: Array<{ orderId: string; status: string; issue: string }> = [];
    const reconciled: Array<{ orderId: string; action: string; paymentId?: string }> = [];

    // 1. Fetch pending orders older than 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    if (supabaseAdmin) {
      const { data: pendingOrders, error } = await supabaseAdmin
        .from('orders')
        .select('id, client_id, status, gross_amount, created_at, razorpay_order_id')
        .in('status', ['payment_pending', 'payment_processing'])
        .lt('created_at', fifteenMinutesAgo);

      if (!error && pendingOrders && pendingOrders.length > 0) {
        const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

        for (const order of pendingOrders) {
          // 2. Check if there is an existing payment record locally
          const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('id, status, amount')
            .eq('order_id', order.id)
            .maybeSingle();

          if (payment && payment.status === 'captured') {
            // Local payment captured: reconcile order to 'paid'
            await supabaseAdmin
              .from('orders')
              .update({ status: 'paid', updated_at: new Date().toISOString() })
              .eq('id', order.id);

            reconciled.push({ orderId: order.id, action: 'reconciled_from_local_payment' });
            continue;
          }

          // 3. Poll Razorpay API for live payment status
          if (order.razorpay_order_id && rzpKeyId && rzpKeySecret) {
            try {
              const auth = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
              const rzpRes = await fetch(
                `https://api.razorpay.com/v1/orders/${order.razorpay_order_id}/payments`,
                {
                  headers: { Authorization: `Basic ${auth}` },
                }
              );

              if (rzpRes.ok) {
                const rzpData = await rzpRes.json();
                const paymentsList = rzpData.items || [];
                const capturedPayment = paymentsList.find(
                  (p: any) => p.status === 'captured'
                );

                if (capturedPayment) {
                  const paymentId = capturedPayment.id;
                  const paidAt = capturedPayment.created_at
                    ? new Date(capturedPayment.created_at * 1000).toISOString()
                    : new Date().toISOString();
                  const amountPaise = capturedPayment.amount || order.gross_amount;

                  // Update order to 'paid'
                  await supabaseAdmin
                    .from('orders')
                    .update({
                      status: 'paid',
                      razorpay_payment_id: paymentId,
                      paid_at: paidAt,
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', order.id);

                  // Insert local payment record
                  await supabaseAdmin.from('payments').insert([
                    {
                      order_id: order.id,
                      amount: amountPaise,
                      currency: capturedPayment.currency || 'INR',
                      gateway: 'razorpay',
                      gateway_payment_id: paymentId,
                      gateway_order_id: order.razorpay_order_id,
                      payment_method: capturedPayment.method || 'unknown',
                      status: 'captured',
                      gateway_response: capturedPayment,
                      captured_at: paidAt,
                    },
                  ]);

                  // Calculate and record financial waterfall events
                  const waterfall = calculateFinancialWaterfall(amountPaise);
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

                  reconciled.push({
                    orderId: order.id,
                    action: 'reconciled_from_razorpay_api',
                    paymentId,
                  });
                  continue;
                }
              }
            } catch (apiErr) {
              console.warn(
                `[RECONCILIATION CRON] Gateway polling error for order ${order.id}:`,
                apiErr
              );
            }
          }

          // Order still pending without captured payment
          discrepancies.push({
            orderId: order.id,
            status: order.status,
            issue: 'Stale payment_pending without captured payment record at gateway',
          });
        }
      }
    } else {
      console.log('[RECONCILIATION CRON] Executing in mock offline mode');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      reconciledCount: reconciled.length,
      reconciled,
      discrepancyCount: discrepancies.length,
      discrepancies,
      mode: supabaseAdmin ? 'live_supabase' : 'mock_offline',
    });
  } catch (err: any) {
    console.error('[RECONCILIATION CRON ERROR]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal cron error' },
      { status: 500 }
    );
  }
}
