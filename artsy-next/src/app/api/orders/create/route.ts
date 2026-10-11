import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';
import { calculateLivePrice, ConfiguratorSelections } from '@/lib/pricing/engine';

function resolveServiceKey(serviceId?: string): string {
  if (!serviceId) return 'wedding';
  const lower = serviceId.toLowerCase();
  if (lower.includes('wedding')) return 'wedding';
  if (lower.includes('brand') || lower.includes('ugc')) return 'brand_ugc';
  if (lower.includes('store') || lower.includes('product')) return 'store_product';
  if (lower.includes('corporate') || lower.includes('event')) return 'corporate_event';
  return 'wedding';
}

/**
 * POST /api/orders/create
 * 
 * Creates a Razorpay order server-side and stores the order record in database.
 * Security Fix #3: Amount is strictly computed server-side via the Pricing Engine.
 * Client-supplied amounts are ignored and logged as potential tampering attempts.
 * 
 * Body: { serviceId, currency?, requirements?, quoteId?, clientPhone?, clientName?, clientEmail? }
 * Returns: { orderId, razorpayOrderId, amount, currency, razorpayKeyId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      serviceId,
      currency = 'INR',
      requirements = {},
      quoteId,
      clientPhone,
      clientName,
      clientEmail,
    } = body;

    // Security Fix #3: Log client-supplied amount tampering if provided, but never use it
    if (body.amount !== undefined) {
      console.warn(
        `[SECURITY AUDIT] Client attempted to supply direct amount: ${body.amount}. Ignored. Calculating canonical price server-side.`
      );
    }

    // 1. Server-side price calculation via canonical pricing engine
    const serviceKey = resolveServiceKey(serviceId);
    const priceBreakdown = calculateLivePrice(serviceKey, (requirements as ConfiguratorSelections) || {});
    const canonicalAmount = priceBreakdown.grandTotalPaise;

    // 2. Validate amount bounds (guardrails)
    if (!canonicalAmount || canonicalAmount < 100) {
      return NextResponse.json(
        { error: 'Calculated order amount is invalid.' },
        { status: 400 }
      );
    }

    if (canonicalAmount > 50000000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum order value of ₹5,00,000' },
        { status: 400 }
      );
    }

    // 3. Check Razorpay credentials
    const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const isRzpConfigured = rzpKeyId && rzpKeySecret && !rzpKeyId.includes('your-');

    let razorpayOrderId: string;
    let razorpayOrderData: Record<string, unknown> = {};

    if (isRzpConfigured) {
      // 4a. LIVE MODE: Call Razorpay Orders API with server-computed amount
      const authHeader = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');

      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: canonicalAmount, // in paise, computed server-side
          currency,
          receipt: `artsy_${Date.now()}`,
          notes: {
            serviceId: serviceId || 'custom',
            serviceKey,
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
          },
          { status: 502 }
        );
      }

      razorpayOrderData = await rzpRes.json();
      razorpayOrderId = String(razorpayOrderData.id);
    } else {
      // 4b. MOCK MODE: Generate simulated order ID with server-computed amount
      razorpayOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      razorpayOrderData = {
        id: razorpayOrderId,
        amount: canonicalAmount,
        currency,
        status: 'created',
        receipt: `artsy_mock_${Date.now()}`,
      };
    }

    // 5. Calculate financial waterfall on canonical amount
    const waterfall = calculateFinancialWaterfall(canonicalAmount);

    // 6. Store order in database
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
            service_key: serviceKey,
            service_id: isUUID(serviceId) ? serviceId : null,
            quote_id: isUUID(quoteId) ? quoteId : null,
            currency,
            gross_amount: canonicalAmount,
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

    // 7. Return order details
    return NextResponse.json({
      success: true,
      orderId: razorpayOrderId,
      amount: canonicalAmount,
      currency,
      razorpayKeyId: rzpKeyId || 'rzp_mock_key',
      razorpayOrderId,
      internalOrderId: internalOrderNumber,
      serviceKey,
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
      { error: 'Internal server error creating order' },
      { status: 500 }
    );
  }
}
