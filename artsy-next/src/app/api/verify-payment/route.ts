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
          .select('id, gross_amount, status')
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

    // Mark as paid in database if matching order exists
    if (isSupabaseConfigured && supabaseAdmin && typeof supabaseAdmin.from === 'function') {
      try {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            razorpay_payment_id: payment_id,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', order_id);
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
