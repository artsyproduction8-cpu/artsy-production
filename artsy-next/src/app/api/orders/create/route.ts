import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '@/../lib/supabase';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';
import { calculateLivePrice, ConfiguratorSelections } from '@/lib/pricing/engine';
import { sendMetaTemplate } from '@/lib/whatsapp/meta-cloud-dispatcher';
import { checkRateLimit } from '@/lib/rateLimit';
import { getAuthenticatedUser } from '@/lib/auth-cookie';

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
    // Fix M8: Rate limiting per user or IP (10 orders per 10 minutes)
    const authUser = await getAuthenticatedUser(request);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anon';
    const rateKey = authUser ? `order_${authUser.id}` : `order_ip_${ip}`;
    const limit = await checkRateLimit(rateKey, 'api', 10, 600);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many order creation attempts. Please wait ${Math.ceil(limit.resetSeconds / 60)} minutes before trying again.` },
        { status: 429 }
      );
    }
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
        signal: AbortSignal.timeout(8000),
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

    const preferredCreatorId = body.preferred_creator_id || body.preferredCreatorId;

    // 5. Calculate financial waterfall on canonical amount
    const waterfall = calculateFinancialWaterfall(canonicalAmount);

    // 6. Store order in database
    const internalOrderNumber = `ARTSY-${Math.floor(100000 + Math.random() * 900000)}`;

    const isUUID = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str));

    const dbClient = supabaseAdmin || supabase;

    let preferredCreatorName = 'Requested Creator';
    if (preferredCreatorId && isUUID(preferredCreatorId) && dbClient) {
      try {
        const { data: creatorData } = await dbClient
          .from('creator_profiles')
          .select('public_display_name')
          .eq('id', preferredCreatorId)
          .single();
        if (creatorData?.public_display_name) {
          preferredCreatorName = creatorData.public_display_name;
        }
      } catch (err) {
        console.warn('[Preferred Creator Lookup Non-fatal]', err);
      }
    }

    if (isSupabaseConfigured && dbClient) {
      try {
        const { error: dbError } = await dbClient.from('orders').insert([
          {
            order_number: internalOrderNumber,
            client_id: authUser?.id && isUUID(authUser.id) ? authUser.id : null,
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
            preferred_creator_id: isUUID(preferredCreatorId) ? preferredCreatorId : null,
            preferred_creator_assigned: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
        if (dbError) {
          console.warn('[Order DB Insert Warning]', dbError);
        } else if (preferredCreatorId && isUUID(preferredCreatorId)) {
          // Notify admin: Channel: WhatsApp + in-app
          // Message: "New booking with preferred creator. Order #X, Creator: [Name]"
          const adminNoticeMsg = `New booking with preferred creator. Order #${internalOrderNumber}, Creator: ${preferredCreatorName}`;
          console.log(`[ADMIN NOTIFICATION] New booking with preferred creator. Order #${internalOrderNumber}, Creator: [REDACTED]`);

          // Insert in-app notifications for admins
          try {
            const { data: adminUsers } = await dbClient
              .from('users')
              .select('id, phone')
              .in('role', ['admin', 'super_admin']);

            const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE;
            if (!SUPER_ADMIN_PHONE) {
              throw new Error('SUPER_ADMIN_PHONE env var is required');
            }

            const adminList = (adminUsers && adminUsers.length > 0)
              ? adminUsers
              : [{ id: '50d2d4d3-b55f-4c9c-8281-a3fa324c52ad', phone: SUPER_ADMIN_PHONE }];

            const notificationsToInsert = adminList.map((adm: { id: string }) => ({
              user_id: adm.id,
              title: 'Preferred Creator Request',
              message: adminNoticeMsg,
              action_url: '/admin/creator-requests',
              read: false,
              created_at: new Date().toISOString(),
            }));
            await dbClient.from('notifications').insert(notificationsToInsert);

            // Send WhatsApp notification to admin(s) if phone configured
            for (const adm of adminList) {
              const targetPhone = adm.phone || SUPER_ADMIN_PHONE;
              try {
                // Attempt meta template notice with all 4 required parameters [orderId, title, statusText, url]
                await sendMetaTemplate(targetPhone, 'artsy_project_status', [
                  internalOrderNumber,
                  'Preferred Creator Request',
                  `Requested: ${preferredCreatorName}`,
                  'https://artsyproduction.com/admin/creator-requests',
                ]).catch(() => null);
              } catch {
                // Non-fatal if meta template rejected
              }
            }
          } catch (notifErr) {
            console.warn('[Admin In-app Notif Insert Non-fatal]', notifErr);
          }
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
