// =============================================================================
// ARTSY PRODUCTION — OPENWA GATEWAY DISPATCHER WITH BAILEYS ANTI-BAN
// =============================================================================
// Provides self-hosted WhatsApp OTP delivery protected by baileys-antiban
// to prevent account bans, with adaptive rate limiting (max 8 msgs/min),
// typing indicators (HumanEntropyService), and legitimacy signal injection.

import { EventEmitter } from 'events';
import {
  AntiBan,
  LegitimacySignalInjector,
  HumanEntropyService,
} from 'baileys-antiban';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';

// -----------------------------------------------------------------------------
// SINGLETON ANTI-BAN & ENTROPY INSTANCES (8 msgs/min strict limit)
// -----------------------------------------------------------------------------
const mockWaspEmitter = new EventEmitter();
(mockWaspEmitter as any).getProvider = () => ({
  socket: {
    sendPresenceUpdate: async () => {},
  },
});

// Flat config per baileys-antiban v4+
const antiban = new AntiBan({
  maxPerMinute: 8,
  maxPerHour: 150,
  maxPerDay: 800,
  minDelayMs: 1500,
  maxDelayMs: 3500,
  burstAllowance: 2,
  logging: true,
} as any);

const legitimacyInjector = new LegitimacySignalInjector({
  enableTypos: false, // Strict: Never inject typos into security OTP codes
  enableTypingPauses: true,
  typingPauseLengthThreshold: 35,
  typingPauseProbability: 0.35,
});

const entropyService = new HumanEntropyService(
  mockWaspEmitter,
  process.env.WHATSAPP_SESSION_ID || 'artsy-otp',
  { enabled: true }
);

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
export interface WhatsAppOTPResult {
  success: boolean;
  messageId?: string;
  error?: string;
  rateLimited?: boolean;
}

export interface AntiBanHealthStatus {
  maxPerMinute: number;
  lastMinute: number;
  allowed: boolean;
  messagesAllowed: number;
  messagesBlocked: number;
  currentFactor: number;
  entropyCycles: number;
  typosInjected: number;
}

// -----------------------------------------------------------------------------
// CORE DISPATCHER: sendWhatsAppOTP
// -----------------------------------------------------------------------------
export async function sendWhatsAppOTP(
  phone: string,
  otp: string
): Promise<WhatsAppOTPResult> {
  const gatewayUrl = (process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:2785').replace(/\/$/, '');
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY || '';
  const sessionId = process.env.WHATSAPP_SESSION_ID || '';

  // Clean and format phone number for WhatsApp (@c.us format)
  const digitsOnly = phone.replace(/\D/g, '');
  const normalizedPhone = digitsOnly.startsWith('91') && digitsOnly.length === 12
    ? digitsOnly
    : (digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly);

  const chatId = `${normalizedPhone}@c.us`;
  const text = `Your Artsy verification code is: ${otp}. Valid for 5 minutes.`;

  // 1. Anti-Ban Rate Limit Pre-Check
  try {
    const decision = await antiban.beforeSend(chatId, text);
    if (!decision.allowed) {
      console.warn(`[AntiBan] WhatsApp OTP rate limit exceeded for ${chatId}: ${decision.reason}`);
      await logDeliveryAttempt(phone, 'rate_limited', `Rate limit exceeded: ${decision.reason}`);
      return {
        success: false,
        rateLimited: true,
        error: `WhatsApp rate limit exceeded: ${decision.reason || 'Max 8 msgs/min'}`,
      };
    }

    // Apply human jitter delay calculated by AntiBan
    if (decision.delayMs > 0) {
      const safeDelay = Math.min(decision.delayMs, 2500);
      await new Promise((resolve) => setTimeout(resolve, safeDelay));
    }

    // Legitimacy Signal: calculate human typing pauses
    const pauses = legitimacyInjector.getTypingPauses(text.length);
    if (pauses.length > 0 && pauses[0].pauseDurationMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(pauses[0].pauseDurationMs, 500)));
    }
  } catch (antiBanErr) {
    console.warn('[AntiBan] Pre-send check warning:', antiBanErr);
  }

  // 2. Validate Gateway Credentials
  if (!apiKey || apiKey.includes('YOUR_OPERATOR_KEY') || !sessionId || sessionId.includes('YOUR_SESSION')) {
    const errorMsg = 'OpenWA Gateway credentials not configured (.env.local missing real API key or Session ID).';
    console.warn(`[OpenWA Dispatcher] ${errorMsg}`);
    await logDeliveryAttempt(phone, 'unconfigured', errorMsg);
    return { success: false, error: errorMsg };
  }

  // 3. Dispatch HTTP Request to OpenWA Gateway
  const sendEndpoint = `${gatewayUrl}/api/sessions/${sessionId}/messages/send-text`;
  const payload = {
    chatId,
    text,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s strict timeout

  try {
    const response = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown gateway error');
      console.error(`[OpenWA Dispatcher] Gateway returned status ${response.status}: ${errText}`);
      antiban.afterSendFailed(errText);
      await logDeliveryAttempt(phone, 'failed', `HTTP ${response.status}: ${errText}`);
      return { success: false, error: `Gateway error ${response.status}: ${errText}` };
    }

    const data = await response.json().catch(() => ({}));
    const messageId = data?.id || data?.messageId || data?.data?.id || `owa_${Date.now()}`;

    // Post-send Anti-Ban record
    antiban.afterSend(chatId, text, messageId);

    // Delivery log persistence
    await logDeliveryAttempt(phone, 'delivered', undefined, messageId);
    console.log(`[OpenWA Dispatcher] OTP delivered via WhatsApp to ${normalizedPhone} (msgId: ${messageId})`);

    return {
      success: true,
      messageId,
    };
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId);
    const errMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
    console.error(`[OpenWA Dispatcher] Dispatch failed to ${chatId}:`, errMessage);
    antiban.afterSendFailed(errMessage);
    await logDeliveryAttempt(phone, 'failed', errMessage);
    return { success: false, error: errMessage };
  }
}

// -----------------------------------------------------------------------------
// HELPER: Log Delivery to Supabase notification_delivery_log
// -----------------------------------------------------------------------------
async function logDeliveryAttempt(
  phone: string,
  status: string,
  errorDetail?: string,
  providerMessageId?: string
) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('notification_delivery_log').insert([
      {
        channel: 'whatsapp',
        recipient: phone,
        event_number: 1, // OTP_SENT
        provider_message_id: providerMessageId || null,
        status,
        error_message: errorDetail || null,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (dbErr) {
    // Non-blocking log failure
    console.warn('[OpenWA Dispatcher] Failed to write delivery log:', dbErr);
  }
}

// -----------------------------------------------------------------------------
// HEALTH MONITORING HELPERS
// -----------------------------------------------------------------------------
export function getAntiBanStatus(): AntiBanHealthStatus {
  try {
    const stats = antiban.getStats();
    const entropyStats = entropyService.getStats();
    const lsiStats = legitimacyInjector.getStats();

    return {
      maxPerMinute: 8,
      lastMinute: stats.rateLimiter?.lastMinute ?? 0,
      allowed: (stats.rateLimiter?.lastMinute ?? 0) < 8,
      messagesAllowed: stats.messagesAllowed ?? 0,
      messagesBlocked: stats.messagesBlocked ?? 0,
      currentFactor: stats.rateLimiter?.currentFactor ?? 1,
      entropyCycles: entropyStats.cyclesExecuted ?? 0,
      typosInjected: lsiStats.typosInjected ?? 0,
    };
  } catch {
    return {
      maxPerMinute: 8,
      lastMinute: 0,
      allowed: true,
      messagesAllowed: 0,
      messagesBlocked: 0,
      currentFactor: 1,
      entropyCycles: 0,
      typosInjected: 0,
    };
  }
}

// -----------------------------------------------------------------------------
// GENERAL MILESTONE NOTIFICATION DISPATCHER: sendWhatsAppNotification
// -----------------------------------------------------------------------------
export async function sendWhatsAppNotification(
  phone: string,
  messageText: string
): Promise<WhatsAppOTPResult> {
  const gatewayUrl = (process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:2785').replace(/\/$/, '');
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY || '';
  const sessionId = process.env.WHATSAPP_SESSION_ID || '';

  const digitsOnly = phone.replace(/\D/g, '');
  const normalizedPhone =
    digitsOnly.startsWith('91') && digitsOnly.length === 12
      ? digitsOnly
      : digitsOnly.length === 10
      ? `91${digitsOnly}`
      : digitsOnly;

  const chatId = `${normalizedPhone}@c.us`;

  if (!apiKey || apiKey.includes('YOUR_OPERATOR_KEY') || !sessionId || sessionId.includes('YOUR_SESSION')) {
    const errorMsg = 'OpenWA Gateway credentials not configured or in dev fallback mode.';
    return { success: false, error: errorMsg };
  }

  const sendEndpoint = `${gatewayUrl}/api/sessions/${sessionId}/messages/send-text`;
  const payload = { chatId, text: messageText };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Gateway error');
      await logDeliveryAttempt(phone, 'failed', `HTTP ${response.status}: ${errText}`);
      return { success: false, error: errText };
    }

    const data = await response.json().catch(() => ({}));
    const messageId = data?.id || data?.messageId || `owa_${Date.now()}`;
    await logDeliveryAttempt(phone, 'delivered', undefined, messageId);

    return { success: true, messageId };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errMessage = err instanceof Error ? err.message : String(err);
    await logDeliveryAttempt(phone, 'failed', errMessage);
    return { success: false, error: errMessage };
  }
}

export async function checkOpenWAGatewayHealth(): Promise<{
  configured: boolean;
  reachable: boolean;
  gatewayUrl: string;
  sessionId?: string;
  sessionStatus?: string;
  error?: string;
}> {
  const gatewayUrl = (process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:2785').replace(/\/$/, '');
  const apiKey = process.env.WHATSAPP_GATEWAY_API_KEY || '';
  const sessionId = process.env.WHATSAPP_SESSION_ID || '';

  const isConfigured = Boolean(
    apiKey &&
    !apiKey.includes('YOUR_OPERATOR_KEY') &&
    sessionId &&
    !sessionId.includes('YOUR_SESSION')
  );

  if (!isConfigured) {
    return {
      configured: false,
      reachable: false,
      gatewayUrl,
      sessionId,
      sessionStatus: 'unconfigured',
      error: 'Gateway credentials unconfigured or set to placeholder values',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${gatewayUrl}/api/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        configured: true,
        reachable: true,
        gatewayUrl,
        sessionId,
        sessionStatus: data?.status || 'connected',
      };
    }

    return {
      configured: true,
      reachable: false,
      gatewayUrl,
      sessionId,
      sessionStatus: 'disconnected',
      error: `Gateway returned status ${response.status}`,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errMessage = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      reachable: false,
      gatewayUrl,
      sessionId,
      sessionStatus: 'disconnected',
      error: errMessage,
    };
  }
}
