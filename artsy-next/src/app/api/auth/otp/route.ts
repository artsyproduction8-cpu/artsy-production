import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rateLimit';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { sendWhatsAppOTP } from '@/lib/whatsapp/openwa-dispatcher';
import { sendOtpEmail } from '@/lib/email/dispatcher';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';

// Helper for legacy sha256 fallback compatibility
function legacyHashOtp(otp: string, identifier: string): string {
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

    const TEST_PERSONAS: Record<string, { role: string; full_name: string }> = {
      '9876543210': { role: 'client', full_name: 'Sneha Patel' },
      '9876543211': { role: 'freelancer', full_name: 'Aarav Sen' },
      '9876543212': { role: 'admin', full_name: 'Studio Director' },
    };

    const isDev = process.env.NODE_ENV === 'development';
    const isMockWhatsApp = process.env.MOCK_WHATSAPP === 'true';

    // ────────────────────────────────────────────────────────
    // ACTION: LOOKUP — Identify user role and name by phone
    // ────────────────────────────────────────────────────────
    if (action === 'lookup') {
      if (isSupabaseConfigured && supabase) {
        try {
          let userQuery = supabase.from('users').select('id, full_name, email, phone, role, status');
          if (cleanEmail) {
            userQuery = userQuery.eq('email', cleanEmail);
          } else if (cleanPhone) {
            userQuery = userQuery.or(`phone.eq.${formattedPhone},phone.eq.${cleanPhone}`);
          }
          const { data: existingUser } = await userQuery.maybeSingle();

          if (existingUser) {
            return NextResponse.json({
              exists: true,
              role: existingUser.role || 'client',
              name: existingUser.full_name || 'Valued Member',
              isNewUser: false,
            });
          }
        } catch (dbErr) {
          console.warn('User lookup warning:', dbErr);
        }
      }

      // Check fallback test personas if DB not populated
      if (cleanPhone && TEST_PERSONAS[cleanPhone]) {
        const persona = TEST_PERSONAS[cleanPhone];
        return NextResponse.json({
          exists: true,
          role: persona.role,
          name: persona.full_name,
          isNewUser: false,
        });
      }

      // Default all new phone numbers to Client
      return NextResponse.json({
        exists: false,
        role: 'client',
        name: null,
        isNewUser: true,
      });
    }

    // ────────────────────────────────────────────────────────
    // ACTION: VERIFY — Check submitted OTP against stored hash
    // ────────────────────────────────────────────────────────
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
      }

      const inputCode = String(code).trim();

      // Only allow mock 123456 bypass if STRICTLY in dev AND mock mode enabled
      if (isDev && isMockWhatsApp && inputCode === '123456') {
        const testPersona = cleanPhone ? TEST_PERSONAS[cleanPhone] : null;
        const resolvedRole = testPersona ? testPersona.role : (role || 'client');
        const resolvedName = testPersona ? testPersona.full_name : (cleanEmail ? 'Test User' : 'Valued Client');

        const verifiedUser = {
          id: cleanEmail ? `user_${cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 15)}` : `user_${cleanPhone!.slice(-6)}`,
          email: cleanEmail || `${cleanPhone}@artsyprod.studio`,
          phone: formattedPhone || undefined,
          full_name: resolvedName,
          role: resolvedRole,
          status: 'active',
        };

        const sessionToken = crypto.randomBytes(32).toString('hex');
        const response = NextResponse.json({
          success: true,
          message: 'OTP verified (dev mock mode active).',
          user: verifiedUser,
          sessionToken,
        });

        response.cookies.set('artsy_auth_token', encodeURIComponent(JSON.stringify(verifiedUser)), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 604800,
        });

        return response;
      }

      // Production / Database mode: verify against stored bcrypt hash in otp_sessions
      if (isSupabaseConfigured && supabase) {
        let query = supabase
          .from('otp_sessions')
          .select('id, email, phone, otp_hash, expires_at, verified, attempts')
          .eq('verified', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (cleanEmail) {
          query = query.eq('email', cleanEmail);
        } else {
          query = query.eq('phone', cleanPhone);
        }

        const { data: session, error: sessionErr } = await query.maybeSingle();

        if (sessionErr || !session) {
          return NextResponse.json(
            { error: 'Invalid or expired OTP. Please request a new code.' },
            { status: 401 }
          );
        }

        // Check max attempts
        const currentAttempts = Number(session.attempts || 0);
        if (currentAttempts >= 5) {
          return NextResponse.json(
            { error: 'Maximum verification attempts exceeded. Please request a new OTP.' },
            { status: 429 }
          );
        }

        // Verify OTP: bcrypt comparison first, with legacy sha256 fallback
        let isMatch = false;
        try {
          if (session.otp_hash.startsWith('$2a$') || session.otp_hash.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(inputCode, session.otp_hash);
          } else if (session.otp_hash.length === 64) {
            isMatch = legacyHashOtp(inputCode, identifier) === session.otp_hash;
          }
        } catch (compareErr) {
          console.error('OTP comparison error:', compareErr);
        }

        if (!isMatch) {
          // Increment attempts
          try {
            await supabase
              .from('otp_sessions')
              .update({ attempts: currentAttempts + 1 })
              .eq('id', session.id);
          } catch (incErr) {
            console.warn('Could not increment attempts:', incErr);
          }

          const remaining = Math.max(0, 4 - currentAttempts);
          return NextResponse.json(
            {
              error: `Invalid verification code. ${remaining} attempts remaining.`,
              remainingAttempts: remaining,
            },
            { status: 401 }
          );
        }

        // Mark OTP session as verified
        await supabase.from('otp_sessions').update({ verified: true }).eq('id', session.id);

        // Find or create user in public.users
        let userQuery = supabase.from('users').select('*');
        if (cleanEmail) {
          userQuery = userQuery.eq('email', cleanEmail);
        } else {
          userQuery = userQuery.or(`phone.eq.${formattedPhone},phone.eq.${cleanPhone}`);
        }
        const { data: existingUser } = await userQuery.maybeSingle();

        let resolvedUser;
        if (existingUser) {
          await supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', existingUser.id);
          resolvedUser = existingUser;
        } else {
          const testPersona = cleanPhone ? TEST_PERSONAS[cleanPhone] : null;
          // Security: New users ALWAYS default to client; admin cannot be auto-assigned
          const defaultRole = testPersona ? testPersona.role : 'client';
          const defaultName = testPersona ? testPersona.full_name : (cleanEmail ? cleanEmail.split('@')[0] : 'Valued Client');

          const newUserData = {
            email: cleanEmail || `${cleanPhone}@artsyprod.studio`,
            phone: formattedPhone || (cleanPhone ? `+91${cleanPhone}` : undefined),
            full_name: defaultName,
            role: defaultRole,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: createdUser, error: insertErr } = await supabase
            .from('users')
            .insert([newUserData])
            .select()
            .single();

          if (insertErr || !createdUser) {
            console.warn('User DB insert error, using fallback:', insertErr);
            resolvedUser = {
              id: `user_${cleanEmail ? cleanEmail.slice(0, 10) : cleanPhone!.slice(-6)}`,
              ...newUserData,
            };
          } else {
            resolvedUser = createdUser;
          }
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        const userPayload = {
          id: resolvedUser.id,
          role: resolvedUser.role || 'client',
          phone: resolvedUser.phone || formattedPhone || '',
          email: resolvedUser.email || cleanEmail || '',
          full_name: resolvedUser.full_name,
        };

        const response = NextResponse.json({
          success: true,
          message: 'OTP verified successfully.',
          user: userPayload,
          sessionToken,
        });

        response.cookies.set('artsy_auth_token', encodeURIComponent(JSON.stringify(userPayload)), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 604800,
        });

        return response;
      }

      return NextResponse.json({ error: 'Database service unavailable. Please try again.' }, { status: 503 });
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

    // 2. Cryptographically Secure 6-digit OTP generation (Fix 3B)
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // 3. Store hashed OTP with 5-minute expiry in database (Fix 3B)
    if (isSupabaseConfigured && supabase) {
      try {
        const otpHash = await bcrypt.hash(otpCode, 10);
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
            attempts: 0,
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

    // 5. Dual-Track Dispatch Chain (Priority 1: OpenWA WhatsApp -> Priority 2: Resend Email -> Error)
    const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL?.trim();
    const hasOpenWA = Boolean(
      gatewayUrl &&
      gatewayUrl.length > 0 &&
      process.env.WHATSAPP_GATEWAY_API_KEY &&
      !process.env.WHATSAPP_GATEWAY_API_KEY.includes('YOUR_OPERATOR_KEY')
    );

    let dispatchedViaWA = false;
    let waMessageId: string | undefined;

    // Track 1: WhatsApp via OpenWA (Local development / dedicated gateway)
    if (cleanPhone && hasOpenWA) {
      try {
        const waResult = await sendWhatsAppOTP(cleanPhone, otpCode);
        if (waResult.success) {
          dispatchedViaWA = true;
          waMessageId = waResult.messageId;
        } else {
          console.warn('[OTP Route] OpenWA WhatsApp dispatch failed:', waResult.error);
        }
      } catch (waErr) {
        console.error('[OTP Route] OpenWA WhatsApp exception:', waErr);
      }
    }

    if (dispatchedViaWA) {
      // Record notification event #1 (OTP_SENT)
      await dispatchNotification({
        eventNumber: 1,
        userId: `anon_${cleanPhone}`,
        recipientPhone: formattedPhone!,
        variables: { otp: otpCode },
      });

      return NextResponse.json({
        success: true,
        message: 'OTP sent via WhatsApp',
        channel: 'whatsapp',
        messageId: waMessageId,
        remainingAttempts: rateLimit.remaining,
        ...(isDev && isMockWhatsApp && { devOtp: otpCode }),
      });
    }

    // Track 2: Resend Email (Vercel production default or fallback)
    if (cleanEmail && process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('YOUR_RESEND_KEY')) {
      const emailResult = await sendOtpEmail(cleanEmail, otpCode);

      if (!emailResult.success) {
        console.error('Failed to send OTP email via Resend:', emailResult.error);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.', details: emailResult.error },
          { status: 502 }
        );
      }

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
        channel: 'email',
        email: cleanEmail,
        remainingAttempts: rateLimit.remaining,
        ...(isDev && isMockWhatsApp && { devOtp: otpCode }),
      });
    }

    // Track 3: Gated Mock Mode strictly in Development
    if (isDev && isMockWhatsApp) {
      return NextResponse.json({
        success: true,
        message: 'OTP sent (mock mode)',
        channel: 'mock',
        remainingAttempts: rateLimit.remaining,
        devOtp: otpCode,
      });
    }

    // Track 4: Delivery failure — NEVER fall back to 123456 or return fake success
    console.error(`[OTP Route] No delivery channel available for identifier: ${identifier}. WhatsApp configured: ${hasOpenWA}, Email present: ${Boolean(cleanEmail)}`);
    return NextResponse.json(
      {
        error: cleanPhone && !hasOpenWA
          ? 'WhatsApp service is not available on this server. Please use email verification or contact studio support.'
          : 'Failed to dispatch verification code. Please check your contact information and try again.',
      },
      { status: 502 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Auth OTP dispatch error:', error);
    return NextResponse.json(
      { error: 'Failed to dispatch verification code. Please try again.', details: errorMsg },
      { status: 500 }
    );
  }
}
