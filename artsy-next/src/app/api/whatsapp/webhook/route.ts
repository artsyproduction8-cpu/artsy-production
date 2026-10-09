import { NextRequest, NextResponse } from 'next/server';

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
    const rawBody = await request.text();
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

    // Log event type, messages, statuses, errors
    if (value) {
      if (value.messages) {
        console.log('[WhatsApp Webhook] Incoming message event:', {
          from: value.messages[0]?.from,
          id: value.messages[0]?.id,
          type: value.messages[0]?.type,
          timestamp: value.messages[0]?.timestamp,
        });
      }
      if (value.statuses) {
        console.log('[WhatsApp Webhook] Message status update:', {
          id: value.statuses[0]?.id,
          status: value.statuses[0]?.status,
          recipient_id: value.statuses[0]?.recipient_id,
          errors: value.statuses[0]?.errors,
        });
      }
      if (value.errors) {
        console.warn('[WhatsApp Webhook] Webhook value error:', value.errors);
      }
    } else {
      console.log('[WhatsApp Webhook] Received payload:', typeof payload === 'object' ? JSON.stringify(payload) : payload);
    }

    // Acknowledge receipt immediately with 200 OK
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.error('[WhatsApp Webhook POST Error]:', err);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: 'received_with_error' }, { status: 200 });
  }
}
