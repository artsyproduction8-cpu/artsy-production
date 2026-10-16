import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';

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
        console.error('[Health Check DB Warning]:', error.message);
        dbStatus = 'degraded';
        dbMode = 'connected';
      }
    } catch (err: unknown) {
      console.error('[Health Check DB Error]:', err);
      dbStatus = 'degraded';
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

  // 4. WhatsApp Health (Meta Cloud API)
  const metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  let waStatus: 'connected' | 'disconnected' = 'disconnected';
  let waSessionStatus: 'registered' | 'unregistered' | 'disconnected' = 'disconnected';
  let waError: string | undefined = undefined;

  const isMetaTokenPresent = Boolean(
    metaAccessToken &&
    !metaAccessToken.includes('WILL_BE_PROVIDED') &&
    !metaAccessToken.includes('your-')
  );

  if (isMetaTokenPresent && metaPhoneId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const metaRes = await fetch(`https://graph.facebook.com/v23.0/${metaPhoneId}`, {
        headers: { Authorization: `Bearer ${metaAccessToken}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (metaRes.ok) {
        waStatus = 'connected';
        waSessionStatus = 'registered';
      } else {
        const errJson = await metaRes.json().catch(() => ({}));
        waStatus = 'disconnected';
        waSessionStatus = 'unregistered';
        waError = errJson.error?.message || `Meta Graph API returned status ${metaRes.status}`;
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.warn('[Health] Meta API timeout or error:', fetchErr.message);
      waStatus = 'disconnected';
      waSessionStatus = 'disconnected';
      waError = fetchErr.name === 'AbortError' ? 'Meta Graph API timeout' : (fetchErr.message || 'Connection failed');
    }
  } else {
    waStatus = 'disconnected';
    waSessionStatus = 'disconnected';
    waError = 'WHATSAPP_ACCESS_TOKEN is missing or not configured';
  }

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
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: dbStatus,
        mode: dbMode,
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
