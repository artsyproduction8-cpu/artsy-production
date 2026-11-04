import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-cookie';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { id: rawId } = await params;
    const cleanId = decodeURIComponent(rawId).trim();
    const db = supabaseAdmin;

    if (!isSupabaseConfigured || !db) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // IP rate limiting
    const ip = getClientIp(request);
    const limit = await checkRateLimit(`ext_rev_${authUser.id}_${ip}`, 'api', 20, 600);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many payment requests. Please wait ${Math.ceil(limit.resetSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    // Resolve project and associated order
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    let projectQuery = db.from('projects').select(`
      id, project_number, title, status, client_id, order_id, assigned_creator_id,
      current_revision_round, max_free_revisions, created_at,
      orders:order_id ( id, order_number, gross_amount, status, service_key, client_name, client_phone, client_email )
    `);

    if (isUuid) {
      projectQuery = projectQuery.eq('id', cleanId);
    } else {
      projectQuery = projectQuery.eq('project_number', cleanId);
    }

    const { data: project, error: projErr } = await projectQuery.maybeSingle();

    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Access control: client must own project unless admin
    if (authUser.role === 'client' && project.client_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden: Access restricted to project owner' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action } = body;
    const ord = (project as any).orders || {};

    // 50% extra revision fee formula strictly based on total amount paid
    const totalAmountPaidPaise = Number(ord.gross_amount) || 100000;
    const extraRevisionFeePaise = Math.round(totalAmountPaidPaise * 0.5);
    const currentRound = Math.max(Number(project.current_revision_round) || 1, 1);
    const currentMax = Math.max(Number(project.max_free_revisions) || 0, 2);

    const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const isLive = Boolean(rzpKeyId && rzpKeySecret && !rzpKeyId.includes('your-') && !rzpKeyId.includes('mock'));

    // ─── 1. ACTION: CREATE ORDER ──────────────────────────────────────────────
    if (action === 'create_order') {
      let razorpayOrderId: string;

      if (isLive && rzpKeySecret) {
        const authHeader = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: extraRevisionFeePaise, // 50% in paise
            currency: 'INR',
            receipt: `rev_${Date.now().toString(36)}`,
            notes: {
              projectId: project.id,
              orderId: project.order_id,
              clientId: authUser.id,
              type: 'extra_revision',
              roundNumber: currentRound,
            },
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (!rzpRes.ok) {
          const errData = await rzpRes.json().catch(() => ({}));
          console.error('[Razorpay Extra Revision Order Error]:', rzpRes.status, errData);
          return NextResponse.json({ error: 'Failed to create payment order with Razorpay' }, { status: 502 });
        }

        const rzpData = await rzpRes.json();
        razorpayOrderId = String(rzpData.id);
      } else {
        // Mock order for sandbox / offline dev
        razorpayOrderId = `order_mock_rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }

      return NextResponse.json({
        success: true,
        razorpayOrderId,
        amount: extraRevisionFeePaise,
        currency: 'INR',
        razorpayKeyId: isLive ? rzpKeyId : (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock'),
        currentRound,
        totalAmountPaidPaise,
      });
    }

    // ─── 2. ACTION: VERIFY PAYMENT ────────────────────────────────────────────
    if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!razorpay_order_id || !razorpay_payment_id) {
        return NextResponse.json({ error: 'Missing payment verification credentials' }, { status: 400 });
      }

      if (isLive && rzpKeySecret) {
        // 1. Verify HMAC SHA256 signature
        const expectedSig = crypto
          .createHmac('sha256', rzpKeySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (expectedSig !== razorpay_signature) {
          console.error('[Extra Revision Signature Mismatch]:', { expected: expectedSig, got: razorpay_signature });
          return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
        }

        // 2. Double check payment status with Razorpay REST API
        const authHeader = Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
          headers: { Authorization: `Basic ${authHeader}` },
          signal: AbortSignal.timeout(6000),
        });

        if (!payRes.ok) {
          return NextResponse.json({ error: 'Unable to verify payment with payment gateway' }, { status: 400 });
        }

        const payData = await payRes.json();
        if (payData.status !== 'captured') {
          return NextResponse.json({ error: 'Payment not captured' }, { status: 400 });
        }

        if (payData.amount !== extraRevisionFeePaise) {
          return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
        }
      }

      const nowIso = new Date().toISOString();
      const newIncludedRounds = Math.max(currentMax + 1, currentRound);

      // 1. Update project: increment max_free_revisions to unlock comment section
      await db
        .from('projects')
        .update({
          max_free_revisions: newIncludedRounds,
          updated_at: nowIso,
        })
        .eq('id', project.id);

      // 2. Append to public.change_orders table
      try {
        const gstAmount = Math.round(extraRevisionFeePaise - (extraRevisionFeePaise / 1.18));
        await db.from('change_orders').insert([{
          project_id: project.id,
          order_id: project.order_id,
          change_type: 'extra_revision',
          description: `Additional Creative Revision Pass (Round ${currentRound}) — 50% Service Sizing`,
          additional_price: extraRevisionFeePaise,
          gst_amount: gstAmount,
          total_price: extraRevisionFeePaise,
          status: 'paid',
          paid_at: nowIso,
          created_by: authUser.id,
          created_at: nowIso,
        }]);
      } catch (coErr) {
        console.warn('[Change Order Insert Warning]:', coErr);
      }

      // 3. Append to WORM public.payments table
      try {
        await db.from('payments').insert([{
          order_id: project.order_id,
          amount: extraRevisionFeePaise,
          currency: 'INR',
          gateway: 'razorpay',
          gateway_payment_id: razorpay_payment_id,
          gateway_order_id: razorpay_order_id,
          gateway_signature: razorpay_signature || null,
          payment_method: 'upi_card',
          status: 'captured',
          captured_at: nowIso,
          created_at: nowIso,
        }]);
      } catch (payErr) {
        console.warn('[Payments WORM Insert Warning]:', payErr);
      }

      // 4. Record in audit_logs
      try {
        await db.from('audit_logs').insert([{
          action: 'extra_revision_unlocked',
          user_id: authUser.id,
          entity_type: 'project',
          entity_id: project.id,
          new_values: {
            round: currentRound,
            unlockedIncludedRounds: newIncludedRounds,
            amountPaidPaise: extraRevisionFeePaise,
            razorpayPaymentId: razorpay_payment_id,
            timestamp: nowIso,
          },
        }]);
      } catch {}

      // 5. In-app notification to assigned creator
      if (project.assigned_creator_id) {
        try {
          await db.from('notifications').insert([{
            user_id: project.assigned_creator_id,
            event_number: 19,
            title: `🎬 Revision Round ${currentRound} Unlocked`,
            message: `${authUser.full_name || 'Client'} has unlocked Revision Round ${currentRound} for ${project.title}. Detailed feedback notes will be submitted shortly.`,
            action_url: `/freelancer/work/${project.id}`,
            read: false,
            created_at: nowIso,
          }]);
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: `Revision Round ${currentRound} unlocked successfully! Comment section enabled.`,
        includedRounds: newIncludedRounds,
        currentRound,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Extra Revision Exception]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
