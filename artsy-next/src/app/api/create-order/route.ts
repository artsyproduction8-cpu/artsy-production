import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { amount, currency = 'INR', receipt, notes } = body;

    // 1. Validate amount >= 100 paise (₹1)
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Amount is required and must be at least 100 paise (₹1)' },
        { status: 400 }
      );
    }

    // 2. Check Razorpay credentials
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret || key_id.includes('your-') || key_secret.includes('your-')) {
      return NextResponse.json(
        { error: 'Razorpay authentication credentials missing or not configured' },
        { status: 401 }
      );
    }

    // 3. Initialize Razorpay SDK instance
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // 4. Create Order with Razorpay
    const orderOptions = {
      amount: Math.round(amount),
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || { platform: 'artsy_production' },
    };

    const order = await razorpay.orders.create(orderOptions);

    // 5. Return standard order payload
    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Razorpay create-order error]:', err);

    // Handle authentication failures
    if (
      err?.statusCode === 401 ||
      (err?.error?.code === 'BAD_REQUEST_ERROR' &&
        err?.error?.description?.toLowerCase().includes('auth'))
    ) {
      return NextResponse.json(
        { error: 'Razorpay authentication failed. Check API credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: err?.error?.description || err?.message || 'Failed to create Razorpay order',
        details: err?.error || err,
      },
      { status: 500 }
    );
  }
}
