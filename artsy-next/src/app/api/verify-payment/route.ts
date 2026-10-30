import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Accept both snake_case and camelCase field variations
    const order_id =
      body.razorpay_order_id || body.order_id || body.razorpayOrderId;
    const payment_id =
      body.razorpay_payment_id || body.payment_id || body.razorpayPaymentId;
    const signature =
      body.razorpay_signature || body.signature || body.razorpaySignature;

    // Validate presence of all three fields
    if (!order_id || !payment_id || !signature) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required payment verification fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
        },
        { status: 400 }
      );
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      console.error('[Razorpay verify-payment error]: RAZORPAY_KEY_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Server payment configuration missing' },
        { status: 500 }
      );
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    let isMatch = false;
    try {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      console.warn(
        `[Razorpay Signature Mismatch] Order: ${order_id}, Payment: ${payment_id}`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment signature. Verification failed.',
        },
        { status: 400 }
      );
    }

    // Verify captured status server-side with Razorpay API
    const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const isRzpLive = rzpKeyId && key_secret && !rzpKeyId.includes('your-');

    let orderRecord: any = null;
    if (isSupabaseConfigured && supabaseAdmin && typeof supabaseAdmin.from === 'function') {
      try {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, gross_amount, status, order_number, client_id, client_phone, client_email, service_key, preferred_creator_id, requirements_snapshot')
          .eq('razorpay_order_id', order_id)
          .maybeSingle();
        orderRecord = ord;
      } catch (e) {
        console.warn('[Verify Payment Order Lookup Warning]:', e);
      }
    }

    if (isRzpLive) {
      const rzpAuth = Buffer.from(`${rzpKeyId}:${key_secret}`).toString('base64');
      const paymentRes = await fetch(
        `https://api.razorpay.com/v1/payments/${payment_id}`,
        {
          headers: { Authorization: `Basic ${rzpAuth}` },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (!paymentRes.ok) {
        return NextResponse.json(
          { success: false, error: 'Could not verify payment with Razorpay' },
          { status: 400 }
        );
      }

      const rzpPayment = await paymentRes.json();

      if (rzpPayment.status !== 'captured') {
        return NextResponse.json(
          { success: false, error: 'Payment not captured' },
          { status: 400 }
        );
      }

      if (orderRecord && orderRecord.gross_amount && rzpPayment.amount !== orderRecord.gross_amount) {
        return NextResponse.json(
          { success: false, error: 'Payment amount mismatch' },
          { status: 400 }
        );
      }
    }

    // Mark as paid in database if matching order exists and spawn active project
    if (isSupabaseConfigured && supabaseAdmin && typeof supabaseAdmin.from === 'function') {
      try {
        const { error: ordUpdateErr } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            razorpay_payment_id: payment_id,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', order_id);

        if (ordUpdateErr) {
          console.error('[Verify Payment DB Error updating order]:', ordUpdateErr);
        }

        let finalClientId: string = orderRecord?.client_id || '';
        if (orderRecord && orderRecord.id) {
          // Resolve client_id if missing from order
          if (!finalClientId && orderRecord.client_phone) {
            const rawDigits = orderRecord.client_phone.replace(/\D/g, '').slice(-10);
            const { data: matchedUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .ilike('phone', `%${rawDigits}%`)
              .maybeSingle();
            if (matchedUser?.id) finalClientId = matchedUser.id;
          }
          if (!finalClientId && orderRecord.client_email) {
            const { data: matchedUser } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('email', orderRecord.client_email.toLowerCase().trim())
              .maybeSingle();
            if (matchedUser?.id) finalClientId = matchedUser.id;
          }

          if (finalClientId) {
            // Update client_id on order if it was previously unset
            if (!orderRecord.client_id) {
              await supabaseAdmin.from('orders').update({ client_id: finalClientId }).eq('id', orderRecord.id);
            }

            // Check if project already created
            const { data: existingProject } = await supabaseAdmin
              .from('projects')
              .select('id')
              .eq('order_id', orderRecord.id)
              .maybeSingle();

            if (!existingProject) {
              const snap = orderRecord.requirements_snapshot || {};
              const rawSub = snap.subCategory || snap.serviceId;
              const subLabel = rawSub
                ? String(rawSub).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : 'Master Edit';
              const serviceLabel = orderRecord.service_key
                ? orderRecord.service_key.charAt(0).toUpperCase() + orderRecord.service_key.slice(1).replace(/_/g, ' ')
                : 'Personal';
              const projectTitle = `${serviceLabel} • ${subLabel}`;

              const projectNumber = `PRJ-${orderRecord.order_number || Date.now().toString(36).toUpperCase()}`;

              const { error: prjErr } = await supabaseAdmin.from('projects').insert([
                {
                  project_number: projectNumber,
                  order_id: orderRecord.id,
                  client_id: finalClientId,
                  assigned_creator_id: orderRecord.preferred_creator_id || null,
                  title: projectTitle,
                  status: 'awaiting_upload',
                  priority: 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ]);
              if (prjErr) console.error('[Verify Payment DB Error creating project]:', prjErr);
            }
          }
        }

        // Idempotently ensure immutable WORM payments record & financial waterfall exist
        if (orderRecord && orderRecord.id) {
          const { data: existingPayment } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('gateway_payment_id', payment_id)
            .maybeSingle();

          if (!existingPayment) {
            const { error: payErr } = await supabaseAdmin.from('payments').insert([
              {
                order_id: orderRecord.id,
                amount: orderRecord.gross_amount,
                currency: 'INR',
                gateway: 'razorpay',
                gateway_payment_id: payment_id,
                gateway_order_id: order_id,
                gateway_signature: signature || null,
                payment_method: 'razorpay',
                status: 'captured',
                captured_at: new Date().toISOString(),
              },
            ]);
            if (payErr) console.error('[Verify Payment DB Error inserting payment]:', payErr);

            const { calculateFinancialWaterfall } = await import('@/lib/financial/engine');
            const waterfall = calculateFinancialWaterfall(orderRecord.gross_amount);
            await supabaseAdmin.from('financial_events').insert([
              {
                order_id: orderRecord.id,
                event_type: 'client_payment',
                amount: waterfall.clientPayment,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
              {
                order_id: orderRecord.id,
                event_type: 'gateway_fee',
                amount: -waterfall.totalGatewayDeduction,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
              {
                order_id: orderRecord.id,
                event_type: 'gst_liability',
                amount: -waterfall.gstAmount,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
              {
                order_id: orderRecord.id,
                event_type: 'creator_payable',
                amount: -waterfall.creatorAmount,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
            ]);

            if (orderRecord.client_email) {
              try {
                const { generateInvoiceData } = await import('@/lib/invoices/generator');
                const { archiveInvoiceToVault } = await import('@/lib/invoices/vault');
                const { sendInvoiceEmail } = await import('@/lib/email/dispatcher');
                const invoice = generateInvoiceData({
                  orderId: orderRecord.order_number || orderRecord.id,
                  clientName: orderRecord.client_name || '',
                  clientPhone: orderRecord.client_phone || '',
                  clientEmail: orderRecord.client_email,
                  totalPaise: orderRecord.gross_amount,
                });
                await archiveInvoiceToVault(invoice);
                await sendInvoiceEmail(orderRecord.client_email, invoice);
              } catch (invErr) {
                console.warn('[Verify Payment] Invoice archive warning:', invErr);
              }
            }
          }
        }

        // Idempotently ensure immutable WORM payments record & financial waterfall exist
        if (orderRecord && orderRecord.id) {
          const { data: existingPayment } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('gateway_payment_id', payment_id)
            .maybeSingle();

          if (!existingPayment) {
            await supabaseAdmin.from('payments').insert([
              {
                order_id: orderRecord.id,
                amount: orderRecord.gross_amount,
                currency: 'INR',
                gateway: 'razorpay',
                gateway_payment_id: payment_id,
                gateway_order_id: order_id,
                gateway_signature: signature || null,
                payment_method: 'razorpay',
                status: 'captured',
                captured_at: new Date().toISOString(),
              },
            ]);

            const { calculateFinancialWaterfall } = await import('@/lib/financial/engine');
            const waterfall = calculateFinancialWaterfall(orderRecord.gross_amount);
            await supabaseAdmin.from('financial_events').insert([
              {
                order_id: orderRecord.id,
                event_type: 'client_payment',
                amount: waterfall.clientPayment,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
              {
                order_id: orderRecord.id,
                event_type: 'gateway_fee',
                amount: -waterfall.totalGatewayDeduction,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
              {
                order_id: orderRecord.id,
                event_type: 'gst_liability',
                amount: -waterfall.gstAmount,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
              {
                order_id: orderRecord.id,
                event_type: 'creator_payable',
                amount: -waterfall.creatorAmount,
                currency: 'INR',
                reference_id: orderRecord.id,
                reference_table: 'orders',
              },
            ]);

            if (orderRecord.client_email) {
              try {
                const { generateInvoiceData } = await import('@/lib/invoices/generator');
                const { archiveInvoiceToVault } = await import('@/lib/invoices/vault');
                const { sendInvoiceEmail } = await import('@/lib/email/dispatcher');
                const invoice = generateInvoiceData({
                  orderId: orderRecord.order_number || orderRecord.id,
                  clientName: orderRecord.client_name || '',
                  clientPhone: orderRecord.client_phone || '',
                  clientEmail: orderRecord.client_email,
                  totalPaise: orderRecord.gross_amount,
                });
                await archiveInvoiceToVault(invoice);
                await sendInvoiceEmail(orderRecord.client_email, invoice);
              } catch (invErr) {
                console.warn('[Verify Payment] Invoice archive warning:', invErr);
              }
            }
          }
        }

        // Non-blocking Event #6: PAYMENT_SUCCESSFUL dispatch via WhatsApp and Email
        try {
          const { dispatchNotification } = await import('@/lib/whatsapp/dispatcher');
          const grossInr = Math.round((orderRecord?.gross_amount || 800000) / 100);
          await dispatchNotification({
            eventNumber: 6,
            userId: finalClientId || orderRecord?.client_id || '',
            recipientPhone: orderRecord?.client_phone || '',
            recipientEmail: orderRecord?.client_email || '',
            variables: {
              amount: grossInr,
              orderId: orderRecord?.order_number || order_id,
            },
            actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/client/projects`,
          });
        } catch (notifErr) {
          console.warn('[Verify Payment] Notification dispatch non-fatal error:', notifErr);
        }
      } catch (dbErr) {
        console.warn('[Verify Payment DB update warning]:', dbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified successfully',
        order_id,
        payment_id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[INTERNAL] Razorpay verify-payment exception:', err);
    return NextResponse.json(
      { success: false, error: 'Unable to process request' },
      { status: 500 }
    );
  }
}
