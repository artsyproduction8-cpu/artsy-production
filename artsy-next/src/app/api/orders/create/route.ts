import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

/**
 * POST /api/orders/create
 * 
 * Creates a Razorpay order server-side and stores the order record in database.
 * 
 * Body: { serviceId, amount, currency?, requirements?, quoteId?, clientPhone?, clientName?, clientEmail? }
 * Returns: { orderId, razorpayOrderId, amount, currency, razorpayKeyId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serviceId,
      amount,
      currency = 'INR',
      requirements = {},
      quoteId,
      clientPhone,
      clientName,
      clientEmail,
    } = body;

    // 1. Validate required fields
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Amount is required and must be at least 100 paise (₹1)' },
        { status: 400 }
      );
    }

    if (amount > 50000000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum order value of ₹5,00,000' },
        { status: 400 }
      );
    }

    // 2. Check Razorpay credentials
    const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const isRzpConfigured = rzpKeyId && rzpKeySecret && !rzpKeyId.includes('your-');

    let razorpayOrderId: string;
    let razorpayOrderData: Record<string, unknown> = {};

    if (isRzpConfigured) {
      // 3a. LIVE MODE: Call Razorpay Orders API
      const authHeader = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');

      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amount, // in paise
          currency,
          receipt: `artsy_${Date.now()}`,
          notes: {
            serviceId: serviceId || 'custom',
            platform: 'artsy_production',
            quoteId: quoteId || null,
          },
        }),
      });

      if (!rzpRes.ok) {
        const errorData = await rzpRes.json().catch(() => ({}));
        console.error('[Razorpay Order Creation Error]', rzpRes.status, errorData);
        return NextResponse.json(
          {
            error: 'Failed to create payment order with Razorpay',
            details: errorData?.error?.description || `HTTP ${rzpRes.status}`,
          },
          { status: 502 }
        );
      }

      razorpayOrderData = await rzpRes.json();
      razorpayOrderId = String(razorpayOrderData.id);
    } else {
      // 3b. MOCK MODE: Generate simulated order ID
      razorpayOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      razorpayOrderData = {
        id: razorpayOrderId,
        amount,
        currency,
        status: 'created',
        receipt: `artsy_mock_${Date.now()}`,
      };
    }

    // 4. Calculate financial waterfall for this order
    const waterfall = calculateFinancialWaterfall(amount);

    // 5. Store order in database
    const internalOrderNumber = `ARTSY-${Math.floor(100000 + Math.random() * 900000)}`;

    const isUUID = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str));

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: dbError } = await supabase.from('orders').insert([
          {
            order_number: internalOrderNumber,
            client_phone: clientPhone || null,
            client_name: clientName || null,
            client_email: clientEmail || null,
            service_key: serviceId || null,
            service_id: isUUID(serviceId) ? serviceId : null,
            quote_id: isUUID(quoteId) ? quoteId : null,
            currency,
            gross_amount: amount,
            gst_amount: waterfall.gstAmount,
            gateway_fee: waterfall.totalGatewayDeduction,
            net_amount: waterfall.availableForSplit,
            status: 'payment_pending',
            razorpay_order_id: razorpayOrderId,
            requirements_snapshot: requirements || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        if (dbError) {
          console.warn('[Order DB Insert Warning]', dbError);
        }
      } catch (dbErr) {
        console.warn('[Order DB Insert Exception]', dbErr);
      }
    }

    // 6. Return order details
    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amount,
      currency,
      razorpayKeyId: rzpKeyId || 'rzp_mock_key',
      razorpayOrderId,
      internalOrderId: internalOrderNumber,
      mode: isRzpConfigured ? 'live' : 'mock',
      waterfall: {
        gst: waterfall.gstAmount,
        gatewayFee: waterfall.totalGatewayDeduction,
        creatorPayout: waterfall.creatorAmount,
        artsyRevenue: waterfall.artsyAmount,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Order Creation Error]', errorMsg);
    return NextResponse.json(
      { error: 'Internal server error creating order', details: errorMsg },
      { status: 500 }
    );
  }
}
