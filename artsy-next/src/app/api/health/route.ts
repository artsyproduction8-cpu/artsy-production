import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Enforces a strict 500ms deadline on external health checks
const withTimeout = <T>(promise: Promise<T>, fallback: T, ms: number = 500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

export async function GET() {
  const startTime = Date.now();

  // 1. Database Check (Supabase) capped at 500ms
  const checkDatabase = async () => {
    let dbStatus = 'mock';
    let dbMode: 'connected' | 'mock' = 'mock';
    let dbLatencyMs = 0;

    if (isSupabaseConfigured && supabase) {
      try {
        const dbStart = Date.now();
        const { error } = await supabase.from('platform_config').select('key').limit(1);
        dbLatencyMs = Date.now() - dbStart;

        if (!error) {
          dbStatus = 'connected';
          dbMode = 'connected';
        } else {
          console.error('[Health Check DB Warning]:', error.message);
          dbStatus = 'degraded';
          dbMode = 'connected';
        }
      } catch (err: unknown) {
        console.error('[Health Check DB Error]:', err);
        dbStatus = 'degraded';
      }
    }
    return { dbStatus, dbMode, dbLatencyMs };
  };

  // 2. WhatsApp Meta Cloud API Check capped at 500ms
  const checkWhatsApp = async () => {
    const metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    let waStatus: 'connected' | 'disconnected' | 'degraded' = 'disconnected';
    let waSessionStatus: 'registered' | 'unregistered' | 'disconnected' = 'disconnected';
    let waError: string | undefined = undefined;

    const isMetaTokenPresent = Boolean(
      metaAccessToken &&
      !metaAccessToken.includes('WILL_BE_PROVIDED') &&
      !metaAccessToken.includes('your-')
    );

    if (isMetaTokenPresent && metaPhoneId) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v23.0/${metaPhoneId}`, {
          headers: { Authorization: `Bearer ${metaAccessToken}` },
          signal: AbortSignal.timeout(500),
        });

        if (metaRes.ok) {
          waStatus = 'connected';
          waSessionStatus = 'registered';
        } else {
          const errJson = await metaRes.json().catch(() => ({}));
          waStatus = 'degraded';
          waSessionStatus = 'unregistered';
          waError = errJson.error?.message || `Meta Graph API returned status ${metaRes.status}`;
        }
      } catch (fetchErr: any) {
        waStatus = 'degraded';
        waSessionStatus = 'disconnected';
        waError = fetchErr.name === 'TimeoutError' ? 'Meta Graph API 500ms timeout' : (fetchErr.message || 'Connection failed');
      }
    } else {
      waStatus = 'disconnected';
      waSessionStatus = 'disconnected';
      waError = 'WHATSAPP_ACCESS_TOKEN is missing or not configured';
    }

    return { waStatus, waSessionStatus, waError };
  };

  // 3. Upstash Redis Check capped at 500ms
  const checkRedis = async () => {
    let redisStatus: 'connected' | 'degraded' | 'mock' = 'mock';
    let redisLatencyMs = 0;
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/['"]+/g, '').trim();
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.replace(/['"]+/g, '').trim();

    if (upstashUrl && upstashToken && !upstashUrl.includes('your-upstash') && upstashUrl.startsWith('http')) {
      try {
        const start = Date.now();
        const res = await fetch(`${upstashUrl}/ping`, {
          headers: { Authorization: `Bearer ${upstashToken}` },
          signal: AbortSignal.timeout(500),
        });
        redisLatencyMs = Date.now() - start;
        if (res.ok) {
          redisStatus = 'connected';
        } else {
          redisStatus = 'degraded';
        }
      } catch {
        redisStatus = 'degraded';
      }
    }
    return { redisStatus, redisLatencyMs };
  };

  // Parallel execution with strict 500ms deadlines
  const [dbResult, waResult, redisResult] = await Promise.all([
    withTimeout(
      checkDatabase().catch(() => ({ dbStatus: 'degraded', dbMode: 'connected' as const, dbLatencyMs: 0 })),
      { dbStatus: 'degraded', dbMode: 'connected' as const, dbLatencyMs: 500 },
      500
    ),
    withTimeout(
      checkWhatsApp().catch((e: any) => ({ waStatus: 'degraded' as const, waSessionStatus: 'disconnected' as const, waError: e?.message })),
      { waStatus: 'degraded' as const, waSessionStatus: 'disconnected' as const, waError: 'Check exceeded 500ms deadline' },
      500
    ),
    withTimeout(
      checkRedis().catch(() => ({ redisStatus: 'degraded' as const, redisLatencyMs: 0 })),
      { redisStatus: 'degraded' as const, redisLatencyMs: 500 },
      500
    ),
  ]);

  const { dbStatus, dbMode } = dbResult;
  const { waStatus, waSessionStatus } = waResult;
  const { redisStatus } = redisResult;

  // 4. Storage Health (Backblaze B2 - Config check)
  const b2KeyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const b2AppKey = process.env.B2_APPLICATION_KEY;
  const b2Status = (b2KeyId && b2AppKey && !b2KeyId.includes('your-')) ? 'configured' : 'mock';

  // 5. Payments Health (Razorpay - Config check)
  const rzpKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const rzpSecret = process.env.RAZORPAY_KEY_SECRET;
  const rzpStatus = (rzpKeyId && rzpSecret && !rzpKeyId.includes('your-')) ? 'connected' : 'mock';

  // 6. Email Health (Resend - Config check)
  const resendApiKey = process.env.RESEND_API_KEY;
  const isResendConfigured = Boolean(
    resendApiKey &&
    !resendApiKey.includes('your-resend') &&
    resendApiKey !== '[PASTE YOUR RESEND API KEY HERE]'
  );
  const emailStatus = isResendConfigured ? 'connected' : 'mock';

  const isHealthy = dbMode === 'connected' || dbMode === 'mock';
  const totalResponseTimeMs = Date.now() - startTime;

  const healthPayload = {
    status: isHealthy && waStatus !== 'degraded' && redisStatus !== 'degraded' ? 'ok' : 'degraded',
    responseTimeMs: totalResponseTimeMs,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: dbStatus,
        mode: dbMode,
      },
      redis: {
        provider: 'upstash',
        status: redisStatus,
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
        provider: 'meta_cloud_api',
        status: waStatus,
        sessionStatus: waSessionStatus,
      },
      notifications: {
        provider: 'resend_email',
        status: emailStatus,
        whatsapp_provider: 'meta_cloud_api',
        whatsapp_status: waStatus,
      },
    },
    version: '2.3.0',
  };

  return NextResponse.json(healthPayload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
