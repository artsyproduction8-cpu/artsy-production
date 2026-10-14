import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * WhatsApp Cloud API Webhook Endpoint
 * 
 * GET: Meta Webhook Verification Challenge
 * Meta sends hub.mode, hub.verify_token, and hub.challenge
 * Must return hub.challenge if hub.verify_token matches process.env.WHATSAPP_VERIFY_TOKEN
 * 
 * POST: Incoming webhook notification (messages, statuses, errors)
 * Must return 200 OK immediately to acknowledge receipt
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token && expectedToken && token === expectedToken) {
      console.log('[WhatsApp Webhook] Verification successful for Meta challenge');
      // Return challenge as plain text with 200 OK
      return new NextResponse(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    console.warn('[WhatsApp Webhook] Verification failed — token mismatch or invalid mode');
    return new NextResponse('Forbidden', { status: 403 });
  } catch (err) {
    console.error('[WhatsApp Webhook Verification Error]:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const rawBody = await request.text();

    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error('[WhatsApp Webhook] META_APP_SECRET is not configured on server.');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const expectedSig = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const providedSig = signature || '';
    const expectedBuf = Buffer.from(expectedSig);
    const providedBuf = Buffer.from(providedSig);

    if (
      expectedBuf.length !== providedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
      console.warn('[WhatsApp Webhook] Invalid or missing signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: any = null;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = rawBody;
    }

    // Inspect and log incoming Meta payload structure
    const entry = payload?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Redact helper for PII protection (Fix L2)
    const redactPhone = (p?: string) => (p ? p.slice(0, 3) + '****' + p.slice(-4) : 'none');

    // Log event type, messages, statuses, errors
    if (value) {
      if (value.messages) {
        console.log('[WhatsApp Webhook] Incoming message event:', {
          from: redactPhone(value.messages[0]?.from),
          id: value.messages[0]?.id,
          type: value.messages[0]?.type,
          timestamp: value.messages[0]?.timestamp,
        });
      }
      if (value.statuses) {
        console.log('[WhatsApp Webhook] Message status update:', {
          id: value.statuses[0]?.id,
          status: value.statuses[0]?.status,
          recipient_id: redactPhone(value.statuses[0]?.recipient_id),
          errors: value.statuses[0]?.errors,
        });
      }
      if (value.errors) {
        console.warn('[WhatsApp Webhook] Webhook value error:', value.errors);
      }
    } else {
      console.log('[WhatsApp Webhook] Received payload: [REDACTED]');
    }

    // Acknowledge receipt immediately with 200 OK
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.error('[WhatsApp Webhook POST Error]:', err);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'received_with_error' }, { status: 200 });
  }
}
