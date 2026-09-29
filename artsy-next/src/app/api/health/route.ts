import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';
import { checkOpenWAGatewayHealth, getAntiBanStatus } from '@/lib/whatsapp/openwa-dispatcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'mock';
  let dbLatencyMs = 0;
  let dbMode: 'connected' | 'mock' = 'mock';

  // 1. Database Health (Supabase)
  if (isSupabaseConfigured) {
    try {
      const dbStart = Date.now();
      const { error } = await supabase.from('platform_config').select('key').limit(1);
      dbLatencyMs = Date.now() - dbStart;

      if (!error) {
        dbStatus = 'connected';
        dbMode = 'connected';
      } else {
        dbStatus = `degraded: ${error.message}`;
        dbMode = 'connected';
      }
    } catch (err: unknown) {
      dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    dbStatus = 'mock';
    dbMode = 'mock';
  }

  // 2. Storage Health (Backblaze B2 - Skipped / Mock)
  const b2KeyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const b2AppKey = process.env.B2_APPLICATION_KEY;
  const b2Status = (b2KeyId && b2AppKey && !b2KeyId.includes('your-')) ? 'configured' : 'mock';

  // 3. Payments Health (Razorpay - Connected)
  const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  const rzpStatus = (rzpKeyId && rzpSecret && !rzpKeyId.includes('your-')) ? 'connected' : 'mock';

  // 4. WhatsApp Health (OpenWA Self-Hosted Gateway + Baileys Anti-Ban)
  const openwaHealth = await checkOpenWAGatewayHealth();
  const antiBanStatus = getAntiBanStatus();
  const waStatus = openwaHealth.reachable ? 'connected' : (openwaHealth.configured ? 'disconnected' : 'mock');

  // 5. Email Health (Resend - Connected)
  const resendApiKey = process.env.RESEND_API_KEY;
  const isResendConfigured = Boolean(
    resendApiKey &&
    !resendApiKey.includes('your-resend') &&
    resendApiKey !== '[PASTE YOUR RESEND API KEY HERE]'
  );
  const emailStatus = isResendConfigured ? 'connected' : 'mock';

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbMode === 'connected' || dbMode === 'mock';

  const healthPayload = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? Math.floor(process.uptime()) : null,
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: dbStatus,
        mode: dbMode,
        latencyMs: dbLatencyMs,
      },
      storage: {
        provider: 'backblaze_b2',
        status: b2Status,
      },
      payments: {
        provider: 'razorpay',
        status: rzpStatus,
      },
      email: {
        provider: 'resend',
        status: emailStatus,
      },
      whatsapp: {
        provider: 'openwa_gateway',
        status: waStatus,
        gatewayUrl: openwaHealth.gatewayUrl,
        sessionId: openwaHealth.sessionId || null,
        sessionStatus: openwaHealth.sessionStatus || 'disconnected',
        antiban: {
          rateLimitStatus: antiBanStatus.allowed ? 'active' : 'throttled',
          maxPerMinute: antiBanStatus.maxPerMinute,
          lastMinute: antiBanStatus.lastMinute,
          messagesAllowed: antiBanStatus.messagesAllowed,
          messagesBlocked: antiBanStatus.messagesBlocked,
          currentFactor: antiBanStatus.currentFactor,
          entropyCycles: antiBanStatus.entropyCycles,
        },
        ...(openwaHealth.error && { error: openwaHealth.error }),
      },
      notifications: {
        provider: 'resend_email',
        status: emailStatus,
        whatsapp_provider: 'openwa_gateway',
        whatsapp_status: waStatus,
      },
    },
    responseTimeMs,
    version: '2.2.0',
  };

  return NextResponse.json(healthPayload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
