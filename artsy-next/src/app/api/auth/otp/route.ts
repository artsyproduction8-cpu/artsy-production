import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rateLimit';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { sendOtpEmail } from '@/lib/email/dispatcher';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';

function hashOtp(otp: string, identifier: string): string {
  return crypto.createHash('sha256').update(`${otp}:${identifier}:${process.env.PII_ENCRYPTION_KEY || 'dev_salt'}`).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const { email, phone, action = 'send', code, role = 'client', consentGiven = true } = body;

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ error: 'Email or phone number is required.' }, { status: 400 });
    }

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
    }

    if (cleanPhone && !cleanEmail && cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian phone number.' }, { status: 400 });
    }

    const formattedPhone = cleanPhone
      ? (cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`)
      : null;

    const identifier = cleanEmail || cleanPhone!;

    // ────────────────────────────────────────────────────────
    // ACTION: VERIFY — Check submitted OTP against stored hash
    // ────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
      }

      const isDev = process.env.NODE_ENV !== 'production';

      // Dev mode shortcut: accept 123456
      if (isDev && code === '123456') {
        return NextResponse.json({
          success: true,
          message: 'OTP verified (dev mode).',
          user: {
            id: cleanEmail ? `user_${cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 15)}` : `user_${cleanPhone!.slice(-6)}`,
            email: cleanEmail || undefined,
            phone: formattedPhone || undefined,
            role,
            status: 'active',
          },
        });
      }

      // Production / Database mode: verify against stored hash
      if (isSupabaseConfigured && supabase) {
        const otpHash = hashOtp(String(code), identifier);
        
        let query = supabase
          .from('otp_sessions')
          .select('id, email, phone, otp_hash, expires_at, verified')
          .eq('otp_hash', otpHash)
          .eq('verified', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (cleanEmail) {
          query = query.eq('email', cleanEmail);
        } else {
          query = query.eq('phone', cleanPhone);
        }

        const { data: session } = await query.maybeSingle();

        if (!session) {
          return NextResponse.json({ error: 'Invalid or expired OTP. Please request a new one.' }, { status: 401 });
        }

        // Mark as verified
        await supabase.from('otp_sessions').update({ verified: true }).eq('id', session.id);

        // Find or create user
        let userQuery = supabase.from('users').select('*');
        if (cleanEmail) {
          userQuery = userQuery.eq('email', cleanEmail);
        } else {
          userQuery = userQuery.eq('phone', formattedPhone);
        }
        const { data: existingUser } = await userQuery.maybeSingle();

        if (existingUser) {
          await supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', existingUser.id);
          return NextResponse.json({ success: true, message: 'OTP verified.', user: existingUser });
        }

        return NextResponse.json({
          success: true,
          message: 'OTP verified. New user — proceed to profile creation.',
          user: { email: cleanEmail || undefined, phone: formattedPhone || undefined, role, status: 'new', isNewUser: true },
        });
      }

      // Fallback for mock mode without database
      if (code === '123456') {
        return NextResponse.json({
          success: true,
          message: 'OTP verified (mock).',
          user: { email: cleanEmail || undefined, phone: formattedPhone || undefined, role, status: 'active' },
        });
      }
      return NextResponse.json({ error: 'Invalid OTP.' }, { status: 401 });
    }

    // ────────────────────────────────────────────────────────
    // ACTION: SEND — Generate and dispatch OTP
    // ────────────────────────────────────────────────────────

    // 1. Rate Limiting Check (Max 5 requests per 10 minutes per identifier/IP)
    const rateLimit = await checkRateLimit(`${identifier}_${ip}`, 'auth', 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many OTP requests. Please wait ${Math.ceil(rateLimit.resetSeconds / 60)} minutes before retrying.` },
        { status: 429 }
      );
    }

    // 2. Generate 6-digit OTP
    const isDev = process.env.NODE_ENV !== 'production';
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Store hashed OTP with 5-minute expiry in database
    if (isSupabaseConfigured && supabase) {
      try {
        const otpHash = hashOtp(otpCode, identifier);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        // Invalidate previous unexpired OTPs for this identifier
        let invalidateQuery = supabase.from('otp_sessions').update({ verified: true }).eq('verified', false);
        if (cleanEmail) {
          invalidateQuery = invalidateQuery.eq('email', cleanEmail);
        } else {
          invalidateQuery = invalidateQuery.eq('phone', cleanPhone);
        }
        await invalidateQuery;

        await supabase.from('otp_sessions').insert([
          {
            email: cleanEmail || null,
            phone: cleanPhone || null,
            otp_hash: otpHash,
            expires_at: expiresAt,
            verified: false,
            ip_address: ip,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (dbErr) {
        console.warn('OTP session DB insert warning:', dbErr);
      }
    }

    // 4. Record DPDP Consent
    if (consentGiven && isSupabaseConfigured && supabase) {
      try {
        await supabase.from('consent_records').insert([
          {
            consent_type: 'authentication_and_order_updates',
            consent_version: 'v2.2',
            ip_address: ip,
            user_agent: request.headers.get('user-agent') || null,
            granted_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.warn('DPDP consent insert warning:', err);
      }
    }

    // 5. Dispatch OTP via Email (Primary) or WhatsApp/SMS (Mock Fallback)
    if (cleanEmail) {
      const emailResult = await sendOtpEmail(cleanEmail, otpCode);

      if (!emailResult.success) {
        console.error('Failed to send OTP email via Resend:', emailResult.error);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.', details: emailResult.error },
          { status: 502 }
        );
      }

      // Log notification event #1
      await dispatchNotification({
        eventNumber: 1, // OTP_SENT
        userId: `anon_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
        recipientEmail: cleanEmail,
        recipientPhone: formattedPhone || undefined,
        variables: { otp: otpCode },
      });

      return NextResponse.json({
        success: true,
        message: 'OTP sent via Email',
        email: cleanEmail,
        remainingAttempts: rateLimit.remaining,
        ...(isDev && { devOtp: otpCode }),
      });
    }

    // Phone-only flow (WhatsApp skipped / mocked)
    await dispatchNotification({
      eventNumber: 1, // OTP_SENT
      userId: `anon_${cleanPhone}`,
      recipientPhone: formattedPhone!,
      variables: { otp: otpCode },
    });

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched to ${formattedPhone}.`,
      remainingAttempts: rateLimit.remaining,
      ...(isDev && { devOtp: otpCode }),
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Auth OTP dispatch error:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch verification code. Please try again.', details: errorMsg },
      { status: 500 }
    );
  }
}
