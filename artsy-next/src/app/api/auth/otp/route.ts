import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rateLimit';
import { dispatchNotification } from '@/lib/whatsapp/dispatcher';
import { sendWhatsAppOTP } from '@/lib/whatsapp/openwa-dispatcher';
import { sendOtpEmail } from '@/lib/email/dispatcher';
import { supabase, isSupabaseConfigured } from '@/../lib/supabase';
import { signAuthCookieValue, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

// Helper for legacy sha256 fallback compatibility
function legacyHashOtp(otp: string, identifier: string): string {
  return crypto.createHash('sha256').update(`${otp}:${identifier}:${process.env.PII_ENCRYPTION_KEY || 'dev_salt'}`).digest('hex');
}

interface LocalOtpSession {
  identifier: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

declare global {
  var __memoryOtpSessions: Map<string, LocalOtpSession> | undefined;
}
const memoryOtpSessions: Map<string, LocalOtpSession> =
  globalThis.__memoryOtpSessions || (globalThis.__memoryOtpSessions = new Map());

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const body = await request.json().catch(() => ({}));
    const { email, phone, action = 'send', code, role = 'client', consentGiven = true } = body;

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    let cleanPhone = phone ? String(phone).replace(/\D/g, '') : null;
    if (cleanPhone && cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    }

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ error: 'Email or phone number is required.' }, { status: 400 });
    }

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
    }

    if (cleanPhone && !cleanEmail && cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian phone number.' }, { status: 400 });
    }

    const formattedPhone = cleanPhone
      ? `+91${cleanPhone}`
      : null;

    const identifier = cleanEmail || cleanPhone!;

    const isDev = process.env.NODE_ENV === 'development';
    const shouldExposeDevOtp =
      process.env.NODE_ENV === 'development' &&
      process.env.MOCK_WHATSAPP === 'true';

    // ────────────────────────────────────────────────────────
    // ACTION: LOOKUP — Identify user role and name dynamically
    // ────────────────────────────────────────────────────────
    if (action === 'lookup') {
      // 1. Fixed Studio Director Admin Anchor
      if (cleanPhone === '7777078742') {
        return NextResponse.json({
          exists: true,
          role: 'admin',
          name: 'Studio Director (Admin)',
          isNewUser: false,
        });
      }

      // 2. Query dynamic user records from Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          let userQuery = supabase.from('users').select('id, full_name, email, phone, role, status');
          if (cleanEmail) {
            userQuery = userQuery.eq('email', cleanEmail);
          } else if (cleanPhone) {
            userQuery = userQuery.or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`);
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

      // 3. New user (allows them to register as Client or Creator/Editor)
      return NextResponse.json({
        exists: false,
        role: null,
        name: null,
        isNewUser: true,
      });
    }

    // ────────────────────────────────────────────────────────
    // ACTION: VERIFY — Check submitted OTP against stored hash
    // ────────────────────────────────────────────────────────
    const isVerifyAction = action === 'verify' || body.verify === true;
    if (isVerifyAction) {
      if (!code) {
        return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
      }

      const inputCode = String(code).trim();

      // Check in-memory store first
      const memSession =
        memoryOtpSessions.get(identifier) ||
        (cleanPhone ? memoryOtpSessions.get(cleanPhone) : undefined) ||
        (cleanPhone ? memoryOtpSessions.get(`+91${cleanPhone}`) : undefined) ||
        (cleanEmail ? memoryOtpSessions.get(cleanEmail) : undefined);

      let sessionVerified = false;

      if (memSession) {
        if (Date.now() > memSession.expiresAt) {
          return NextResponse.json(
            { error: 'This code has expired. Request a new one.' },
            { status: 401 }
          );
        }

        if (memSession.attempts >= 5) {
          return NextResponse.json(
            { error: 'Too many attempts. Please request a new code.', remainingAttempts: 0 },
            { status: 429 }
          );
        }

        let isMatch = false;
        if (isDev && (inputCode === '123456' || inputCode === '4210')) {
          isMatch = true;
        } else {
          try {
            isMatch = await bcrypt.compare(inputCode, memSession.otpHash);
          } catch {
            isMatch = false;
          }
        }

        if (!isMatch) {
          memSession.attempts += 1;
          if (memSession.attempts >= 5) {
            return NextResponse.json(
              { error: 'Too many attempts. Please request a new code.', remainingAttempts: 0 },
              { status: 429 }
            );
          }
          const remaining = Math.max(0, 5 - memSession.attempts);
          return NextResponse.json(
            {
              error: `Incorrect code. ${remaining} attempts remaining.`,
              remainingAttempts: remaining,
            },
            { status: 401 }
          );
        }

        memSession.verified = true;
        sessionVerified = true;
      }

      // If not matched in memory, check Supabase otp_sessions or dev bypass
      if (!sessionVerified) {
        let dbMatched = false;
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: dbSession } = await supabase
              .from('otp_sessions')
              .select('id, phone, otp_hash, expires_at, verified')
              .eq('phone', cleanPhone || identifier)
              .eq('verified', false)
              .gt('expires_at', new Date().toISOString())
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (dbSession) {
              if (dbSession.otp_hash.startsWith('$2a$') || dbSession.otp_hash.startsWith('$2b$')) {
                dbMatched = await bcrypt.compare(inputCode, dbSession.otp_hash);
              } else if (dbSession.otp_hash.length === 64) {
                dbMatched = legacyHashOtp(inputCode, identifier) === dbSession.otp_hash;
              }
              if (dbMatched) {
                await supabase.from('otp_sessions').update({ verified: true }).eq('id', dbSession.id);
                sessionVerified = true;
              }
            }
          } catch (e) {
            console.warn('Supabase OTP lookup warning:', e);
          }
        }

        if (!sessionVerified && isDev && (inputCode === '123456' || inputCode === '4210')) {
          sessionVerified = true;
        }

        if (!sessionVerified) {
          return NextResponse.json(
            { error: 'Invalid or expired OTP. Please request a new code.' },
            { status: 401 }
          );
        }
      }

      // Find or create user in public.users
      let existingUser: any = null;
      if (isSupabaseConfigured && supabase) {
        try {
          let userQuery = supabase.from('users').select('*');
          if (cleanEmail) {
            userQuery = userQuery.eq('email', cleanEmail);
          } else {
            userQuery = userQuery.or(`phone.eq.${cleanPhone},phone.ilike.%${cleanPhone}%`);
          }
          const { data } = await userQuery.maybeSingle();
          existingUser = data;
        } catch (uErr) {
          console.warn('User query error:', uErr);
        }
      }

      let resolvedUser: any;
      let isNewUser = false;

      if (existingUser) {
        resolvedUser = existingUser;
        if (cleanPhone === '7777078742') {
          resolvedUser.role = 'admin';
        }
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('users').update({ updated_at: new Date().toISOString() }).eq('id', existingUser.id);
          } catch {}
        }
      } else {
        isNewUser = true;
        const userChosenRole = (role === 'freelancer' || role === 'editor') ? 'freelancer' : 'client';
        const defaultRole = cleanPhone === '7777078742' ? 'admin' : userChosenRole;
        const defaultName = cleanPhone === '7777078742'
          ? 'Studio Director (Admin)'
          : (cleanEmail ? cleanEmail.split('@')[0] : (defaultRole === 'freelancer' ? 'Creator Member' : 'Valued Client'));

        const newUserData = {
          email: cleanEmail || `${cleanPhone}@artsyprod.studio`,
          phone: formattedPhone || (cleanPhone ? `+91${cleanPhone}` : undefined),
          full_name: defaultName,
          role: defaultRole,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured && supabase) {
          try {
            const { data: createdUser, error: insertErr } = await supabase
              .from('users')
              .insert([newUserData])
              .select()
              .single();

            if (insertErr || !createdUser) {
              resolvedUser = {
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `usr_${cleanPhone || Date.now()}`,
                ...newUserData,
              };
            } else {
              resolvedUser = createdUser;
            }
          } catch {
            resolvedUser = {
              id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `usr_${cleanPhone || Date.now()}`,
              ...newUserData,
            };
          }
        } else {
          resolvedUser = {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `usr_${cleanPhone || Date.now()}`,
            ...newUserData,
          };
        }
      }

      const finalRole: 'client' | 'freelancer' | 'admin' =
        cleanPhone === '7777078742' ? 'admin' : (resolvedUser.role || role || 'client');

      let onboarding_status: 'pending' | 'approved' | 'rejected' | null = null;
      let tracking_id: string | null = null;
      let rejection_reason: string | null = null;
      let rejected_at: string | null = null;

      if (finalRole === 'freelancer') {
        try {
          if (isSupabaseConfigured && supabase && resolvedUser.id) {
            const { data: profile } = await supabase
              .from('creator_profiles')
              .select('*')
              .eq('id', resolvedUser.id)
              .maybeSingle();

            if (profile) {
              const rawStatus = profile.approval_status || 'pending';
              if (rawStatus === 'approved') {
                onboarding_status = 'approved';
              } else if (rawStatus === 'rejected') {
                onboarding_status = 'rejected';
                rejection_reason = profile.rejection_reason || null;
                rejected_at = profile.rejected_at || profile.updated_at || new Date().toISOString();
              } else {
                onboarding_status = 'pending';
              }
              tracking_id = profile.tracking_id || (profile as any).trackingId || (resolvedUser as any).tracking_id || `ART-2026-VET-${String(resolvedUser.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0')}`;
            }
          }
        } catch (pErr) {
          console.warn('Creator profile lookup warning:', pErr);
        }

        // If not found in creator_profiles table
        if (!onboarding_status) {
          if (!isNewUser) {
            const uStatus = (resolvedUser as any).onboarding_status;
            if (uStatus === 'approved') {
              onboarding_status = 'approved';
            } else if (uStatus === 'rejected') {
              onboarding_status = 'rejected';
              rejection_reason = (resolvedUser as any).rejection_reason || 'Portfolio did not meet current studio criteria.';
              rejected_at = (resolvedUser as any).rejected_at || (resolvedUser as any).updated_at || new Date().toISOString();
            } else {
              onboarding_status = 'pending';
              tracking_id = (resolvedUser as any).tracking_id || `ART-2026-VET-${String(resolvedUser.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0')}`;
            }
          } else {
            // Brand new freelancer user prior to completing onboarding
            onboarding_status = null;
            tracking_id = null;
            rejection_reason = null;
            rejected_at = null;
          }
        }
      }

      const userPayload = {
        id: String(resolvedUser.id),
        role: finalRole,
        phone: resolvedUser.phone || formattedPhone || (cleanPhone ? `+91${cleanPhone}` : ''),
        email: resolvedUser.email || cleanEmail || '',
        onboarding_status,
        tracking_id,
        rejection_reason,
        rejected_at,
        full_name: resolvedUser.full_name || 'Valued Member',
        status: 'active',
      };

      const response = NextResponse.json({
        success: true,
        user: {
          id: userPayload.id,
          role: userPayload.role,
          phone: userPayload.phone,
          email: userPayload.email,
          onboarding_status: userPayload.onboarding_status,
          tracking_id: userPayload.tracking_id,
          rejection_reason: userPayload.rejection_reason,
          rejected_at: userPayload.rejected_at,
        },
      });

      const signedCookie = signAuthCookieValue(userPayload);
      response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      });

      return response;
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

    // 3. Store hashed OTP with 5-minute expiry in memory + database (Fix 3B)
    const otpHash = await bcrypt.hash(otpCode, 10);
    const expiresAtMs = Date.now() + 5 * 60 * 1000;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    // Save in memory for instant verification and attempt tracking
    const sessionObj: LocalOtpSession = {
      identifier,
      otpHash,
      expiresAt: expiresAtMs,
      attempts: 0,
      verified: false,
    };
    memoryOtpSessions.set(identifier, sessionObj);
    if (cleanPhone) {
      memoryOtpSessions.set(cleanPhone, sessionObj);
      memoryOtpSessions.set(`+91${cleanPhone}`, sessionObj);
    }
    if (cleanEmail) {
      memoryOtpSessions.set(cleanEmail, sessionObj);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('otp_sessions')
          .update({ verified: true })
          .eq('phone', cleanPhone || identifier)
          .eq('verified', false);

        await supabase.from('otp_sessions').insert([
          {
            phone: cleanPhone || identifier,
            otp_hash: otpHash,
            expires_at: expiresAtIso,
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
        ...(shouldExposeDevOtp && { devOtp: otpCode }),
      });
    }

    // Track 2: Resend Email (Vercel production default or fallback)
    if (cleanEmail && process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('YOUR_RESEND_KEY')) {
      const emailResult = await sendOtpEmail(cleanEmail, otpCode);

      if (!emailResult.success) {
        console.error('Failed to send OTP email via Resend:', emailResult.error);
        if (isDev) {
          console.log(`[DEV OTP Email Fallback] Email: ${cleanEmail}, Code: ${otpCode}`);
          return NextResponse.json({
            success: true,
            message: 'OTP generated for development testing (email fallback)',
            channel: 'email',
            email: cleanEmail,
            remainingAttempts: rateLimit.remaining,
            ...(shouldExposeDevOtp && { devOtp: otpCode }),
          });
        }
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
        ...(shouldExposeDevOtp && { devOtp: otpCode }),
      });
    }

    // Track 3: Gated Mock Mode or Development Fallback
    if (isDev) {
      console.log(`[DEV OTP Dispatch] Identifier: ${identifier}, Generated OTP: ${otpCode}`);
      return NextResponse.json({
        success: true,
        message: 'OTP dispatched (development testing mode)',
        channel: 'dev',
        remainingAttempts: rateLimit.remaining,
        ...(shouldExposeDevOtp && { devOtp: otpCode }),
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
