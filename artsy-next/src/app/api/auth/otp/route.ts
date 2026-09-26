import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { supabase } from '@/../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await request.json();
    const { phone, role = 'client', consentGiven = true } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian phone number.' }, { status: 400 });
    }

    // 1. Rate Limiting Check (Max 5 requests per 10 minutes per phone/IP)
    const rateLimit = await checkRateLimit(`${cleanPhone}_${ip}`, 'auth', 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests. Please wait ${Math.ceil(rateLimit.resetSeconds / 60)} minutes before retrying.`,
        },
        { status: 429 }
      );
    }

    // 2. Generate 6-digit OTP
    const isDev = process.env.NODE_ENV !== 'production';
    const otpCode = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Record DPDP Consent in database if consent record table exists
    if (consentGiven && supabase && typeof supabase.from === 'function') {
      try {
        await supabase.from('consent_records').insert([
          {
            phone: cleanPhone,
            purpose: 'authentication_and_order_updates',
            terms_version: 'v2.1',
            ip_address: ip,
            user_agent: request.headers.get('user-agent') || null,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        // Non-blocking for auth flow
        console.warn('DPDP consent insert warning:', err);
      }
    }

    // 4. Dispatch OTP via WhatsApp -> SMS Fallback (MSG91)
    const formattedPhone = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
    await dispatchNotification({
      eventNumber: 1, // OTP_SENT
      userId: `anon_${cleanPhone}`,
      recipientPhone: formattedPhone,
      variables: {
        otp: otpCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched to ${formattedPhone}.`,
      remainingAttempts: rateLimit.remaining,
      ...(isDev && { devOtp: otpCode }), // Only shown in local dev mode
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Auth OTP dispatch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to dispatch verification code. Please try again.',
        details: errorMsg,
      },
      { status: 500 }
    );
  }
}
