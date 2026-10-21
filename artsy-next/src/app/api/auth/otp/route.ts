import { NextRequest, NextResponse, after } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendMetaOTP } from '@/lib/whatsapp/meta-cloud-dispatcher';
import { sendOtpEmail } from '@/lib/email/dispatcher';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
const supabase = supabaseAdmin;
import { signAuthCookieValue, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';
import { createErrorResponse } from '@/lib/api-response';
import { isSuperAdminAccount, CANONICAL_SUPER_ADMIN_PHONE, CANONICAL_SUPER_ADMIN_EMAIL } from '@/lib/auth-utils';

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
  role?: string;
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
    const { email, phone, identifier: inputIdentifier, action = 'send', code, role = 'client', consentGiven = true } = body;

    // Security Fix #4: Return generic response for lookup without user enumeration
    if (action === 'lookup') {
      return NextResponse.json({ success: true });
    }

    const rawEmail = email || (inputIdentifier && String(inputIdentifier).includes('@') ? inputIdentifier : null);
    const rawPhone = phone || (inputIdentifier && !String(inputIdentifier).includes('@') ? inputIdentifier : null);

    const cleanEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : null;
    let cleanPhone = rawPhone ? String(rawPhone).replace(/\D/g, '') : null;
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
    const shouldExposeDevOtp = isDev;


    // ────────────────────────────────────────────────────────
    // ACTION: VERIFY — Check submitted OTP against stored hash
    // ────────────────────────────────────────────────────────
    const isVerifyAction = action === 'verify' || body.verify === true;
    if (isVerifyAction) {
      const submittedCode = code || body.otp;
      if (!submittedCode) {
        return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });
      }

      const inputCode = String(submittedCode).trim();

      // Security Fix L: Distributed rate limiting on OTP verification (10 attempts per 10 mins per identifier)
      const verifyLimit = await checkRateLimit(`verify_${identifier}`, 'auth', 10, 600);
      if (!verifyLimit.allowed && !isDev) {
        return NextResponse.json(
          { error: `Too many attempts. Wait ${Math.ceil(verifyLimit.resetSeconds / 60)} minutes.` },
          { status: 429 }
        );
      }

      // Check in-memory store first
      const memSession =
        memoryOtpSessions.get(identifier) ||
        (cleanPhone ? memoryOtpSessions.get(cleanPhone) : undefined) ||
        (cleanPhone ? memoryOtpSessions.get(`+91${cleanPhone}`) : undefined) ||
        (cleanEmail ? memoryOtpSessions.get(cleanEmail) : undefined);

      let sessionRole: string | null = memSession?.role || null;
      let sessionVerified = false;

      if (isDev && inputCode === '123456') {
        sessionVerified = true;
      } else if (memSession) {
        const isMemExpired = Date.now() > memSession.expiresAt;
        if (!isMemExpired && memSession.attempts < 5) {
          let isMatch = false;
          try {
            isMatch = await bcrypt.compare(inputCode, memSession.otpHash);
          } catch {
            isMatch = false;
          }

          if (isMatch) {
            memSession.verified = true;
            sessionVerified = true;
          }
        }
      }

      // If not matched in memory, check Supabase otp_sessions
      if (!sessionVerified) {
        let dbMatched = false;
        if (isSupabaseConfigured && supabase) {
          try {
            const { data: dbSession } = await supabase
              .from('otp_sessions')
              .select('id, phone, otp_hash, expires_at, verified, role')
              .eq('phone', cleanPhone || identifier)
              .eq('verified', false)
              .gt('expires_at', new Date().toISOString())
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (dbSession) {
              if (dbSession.role) {
                sessionRole = dbSession.role;
              }
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


        if (!sessionVerified) {
          if (memSession) {
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

          return NextResponse.json(
            { error: 'Invalid or expired OTP. Please request a new code.' },
            { status: 401 }
          );
        }
      }

      if (body.purpose === 'verify_only') {
        return NextResponse.json({
          success: true,
          verified: true,
          message: 'Contact detail verified successfully.',
          destination: cleanEmail || formattedPhone,
        });
      }

      // Find or create user in public.users
      let existingUser: any = null;
      const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : null;
      if (isSupabaseConfigured && dbClient) {
        try {
          let userQuery = dbClient.from('users').select('*');
          if (cleanEmail && cleanPhone) {
            userQuery = userQuery.or(`email.eq.${cleanEmail},phone.eq.+91${cleanPhone},phone.eq.91${cleanPhone},phone.eq.${cleanPhone}`);
          } else if (cleanEmail) {
            userQuery = userQuery.eq('email', cleanEmail);
          } else {
            userQuery = userQuery.or(`phone.eq.+91${cleanPhone},phone.eq.91${cleanPhone},phone.eq.${cleanPhone}`);
          }
          const { data, error } = await userQuery.maybeSingle();
          if (!error && data) {
            existingUser = data;
          }
        } catch (uErr) {
          console.warn('User query error:', uErr);
        }
      }

      const isSuperAdminIdentifier = Boolean(
        isSuperAdminAccount({ phone: cleanPhone, email: cleanEmail }) ||
        isSuperAdminAccount(existingUser)
      );
      let resolvedUser: any;
      let isNewUser = false;

      if (existingUser) {
        resolvedUser = existingUser;
        if (isSuperAdminIdentifier) {
          resolvedUser.role = 'super_admin';
        }
        if (isSupabaseConfigured && dbClient) {
          try {
            const updates: any = { updated_at: new Date().toISOString() };
            if (!existingUser.token_version || Number(existingUser.token_version) < 2) {
              updates.token_version = 2;
              resolvedUser.token_version = 2;
            }
            await dbClient.from('users').update(updates).eq('id', existingUser.id);
          } catch {}
        }
      } else {
        isNewUser = true;
        const requestedRole: 'client' | 'freelancer' = (role === 'freelancer' || sessionRole === 'freelancer') ? 'freelancer' : 'client';
        const defaultRole = isSuperAdminIdentifier ? 'super_admin' : requestedRole;
        const dbRole = isSuperAdminIdentifier ? 'admin' : requestedRole;
        const generatedUserId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `usr_${cleanPhone || Date.now()}`;
        const defaultName = isSuperAdminIdentifier
          ? 'Studio Owner (Super Admin)'
          : null;

        const newUserData = {
          id: generatedUserId,
          email: isSuperAdminIdentifier
            ? CANONICAL_SUPER_ADMIN_EMAIL
            : (cleanEmail || `${cleanPhone || Date.now()}@artsyprod.studio`),
          phone: isSuperAdminIdentifier
            ? `+91${CANONICAL_SUPER_ADMIN_PHONE}`
            : (formattedPhone || (cleanPhone ? `+91${cleanPhone}` : '+919876543210')),
          full_name: defaultName,
          role: dbRole,
          status: 'active',
          token_version: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured && dbClient) {
          try {
            const { error: insertErr } = await dbClient
              .from('users')
              .insert([newUserData]);

            if (insertErr) {
              console.warn('[OTP Route] User insert warning:', insertErr);
            }

            resolvedUser = {
              ...newUserData,
              role: defaultRole,
            };

            // If freelancer, ensure creator profile row is also created in DB
            if (requestedRole === 'freelancer') {
              try {
                await dbClient.from('creator_profiles').insert([{
                  id: generatedUserId,
                  approval_status: 'pending',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }]);
              } catch (cpErr) {
                console.warn('[OTP Route] Creator profile insert warning:', cpErr);
              }
            }
          } catch (createErr) {
            console.warn('[OTP Route] User creation exception:', createErr);
            resolvedUser = {
              ...newUserData,
              role: defaultRole,
            };
          }
        } else {
          resolvedUser = {
            ...newUserData,
            role: defaultRole,
          };
        }
      }

      const finalRole: 'client' | 'freelancer' | 'admin' | 'super_admin' =
        isSuperAdminIdentifier ? 'super_admin' : (resolvedUser.role || 'client');

      let onboarding_status: 'pending' | 'approved' | 'rejected' | 'pending_review' | null = null;
      let tracking_id: string | null = null;
      let rejection_reason: string | null = null;
      let rejected_at: string | null = null;

      if (finalRole === 'freelancer') {
        try {
          if (isSupabaseConfigured && dbClient && resolvedUser.id) {
            const { data: profile } = await dbClient
              .from('creator_profiles')
              .select('*')
              .eq('id', resolvedUser.id)
              .maybeSingle();

            if (profile) {
              const rawStatus = profile.onboarding_status || profile.approval_status || 'pending';
              if (rawStatus === 'approved') {
                onboarding_status = 'approved';
              } else if (rawStatus === 'rejected') {
                onboarding_status = 'rejected';
                rejection_reason = profile.rejection_reason || null;
                rejected_at = profile.rejected_at || profile.updated_at || new Date().toISOString();
              } else if (rawStatus === 'pending_review' || rawStatus === 'pending') {
                onboarding_status = rawStatus as any;
              } else {
                onboarding_status = 'pending_review';
              }
              tracking_id = profile.tracking_id || (profile as any).trackingId || (resolvedUser as any).tracking_id || `ART-2026-VET-${String(resolvedUser.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase().padStart(4, '0')}`;
              if (!resolvedUser.full_name && profile.public_display_name) {
                resolvedUser.full_name = profile.public_display_name;
              }
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

      const userPayload: any = {
        id: String(resolvedUser.id),
        role: finalRole,
        phone: resolvedUser.phone || formattedPhone || (cleanPhone ? `+91${cleanPhone}` : ''),
        email: resolvedUser.email || cleanEmail || '',
        full_name: resolvedUser.full_name ?? null,
        onboarded: Boolean(resolvedUser.onboarded),
        status: 'active',
        token_version: Number(resolvedUser.token_version && Number(resolvedUser.token_version) >= 2 ? resolvedUser.token_version : 2),
      };

      if (finalRole === 'freelancer') {
        userPayload.onboarding_status = onboarding_status;
        userPayload.tracking_id = tracking_id;
        userPayload.rejection_reason = rejection_reason;
        userPayload.rejected_at = rejected_at;
      }

      // Security Fix J: Record DPDP Consent with valid user_id
      if (consentGiven && isSupabaseConfigured && dbClient && resolvedUser?.id) {
        try {
          await dbClient.from('consent_records').insert([
            {
              user_id: resolvedUser.id,
              consent_type: 'authentication_and_order_updates',
              consent_version: 'v2.2',
              ip_address: ip && ip.includes('.') ? ip : null,
              user_agent: request.headers.get('user-agent') || null,
              granted_at: new Date().toISOString(),
            },
          ]);
        } catch (err) {
          console.warn('DPDP consent insert warning:', err);
        }
      }

      const response = NextResponse.json({
        success: true,
        isNewUser,
        user: {
          id: userPayload.id,
          role: userPayload.role,
          phone: userPayload.phone,
          email: userPayload.email,
          full_name: userPayload.full_name,
          display_name: resolvedUser.display_name || null,
          studio_details: resolvedUser.studio_details || null,
          avatar_url: resolvedUser.avatar_url || null,
          status: resolvedUser.status || 'active',
          onboarded: userPayload.onboarded,
          onboarding_status: userPayload.onboarding_status,
          tracking_id: userPayload.tracking_id,
          rejection_reason: userPayload.rejection_reason,
          rejected_at: userPayload.rejected_at,
          created_at: resolvedUser.created_at || new Date().toISOString(),
          updated_at: resolvedUser.updated_at || new Date().toISOString(),
        },
      });

      // Issue minimal JWT auth cookie containing ONLY id, role, token_version, and exp
      const signedCookie = signAuthCookieValue({
        id: String(resolvedUser.id),
        role: finalRole,
        token_version: Number(resolvedUser.token_version && Number(resolvedUser.token_version) >= 2 ? resolvedUser.token_version : 2),
      });
      response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 86400,
      });

      return response;
    }

    // ────────────────────────────────────────────────────────
    // ACTION: SEND — Generate and dispatch OTP
    // ────────────────────────────────────────────────────────

    // 1. Rate Limiting Check (Fix P: Split identifier and IP buckets)
    const identifierLimit = await checkRateLimit(identifier, 'auth', 5, 600);
    if (!identifierLimit.allowed) {
      const resp = NextResponse.json(
        { error: `Too many OTP requests. Please wait ${Math.ceil(identifierLimit.resetSeconds / 60)} minutes before retrying.` },
        { status: 429 }
      );
      resp.headers.set('X-RateLimit-Limit', '5');
      resp.headers.set('X-RateLimit-Remaining', '0');
      return resp;
    }

    const ipLimit = await checkRateLimit(`ip_${ip}`, 'auth', 30, 600);
    if (!ipLimit.allowed) {
      const resp = NextResponse.json(
        { error: `Too many requests from this network. Please wait ${Math.ceil(ipLimit.resetSeconds / 60)} minutes before retrying.` },
        { status: 429 }
      );
      resp.headers.set('X-RateLimit-Limit', '30');
      resp.headers.set('X-RateLimit-Remaining', '0');
      return resp;
    }

    const remainingAttempts = Math.min(identifierLimit.remaining, ipLimit.remaining);
    const sendResponse = (payload: any, init?: { status?: number }) => {
      const resp = NextResponse.json(payload, init);
      resp.headers.set('X-RateLimit-Limit', '5');
      resp.headers.set('X-RateLimit-Remaining', Math.max(0, remainingAttempts).toString());
      resp.headers.set('X-RateLimit-Mode', identifierLimit.mode === 'redis' ? 'redis' : 'in-memory-fallback');
      return resp;
    };

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
      role: role || 'client',
    };
    memoryOtpSessions.set(identifier, sessionObj);
    if (cleanPhone) {
      memoryOtpSessions.set(cleanPhone, sessionObj);
      memoryOtpSessions.set(`+91${cleanPhone}`, sessionObj);
    }
    if (cleanEmail) {
      memoryOtpSessions.set(cleanEmail, sessionObj);
    }

    // 3. Prepare Database Session Storage Promise
    const insertDbSessionPromise = (async () => {
      const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : null;
      if (isSupabaseConfigured && dbClient && typeof dbClient.from === 'function') {
        try {
          const updateQuery = cleanPhone
            ? dbClient.from('otp_sessions').update({ verified: true }).eq('phone', cleanPhone).eq('verified', false)
            : dbClient.from('otp_sessions').update({ verified: true }).eq('email', cleanEmail!).eq('verified', false);
          await updateQuery;

          await dbClient.from('otp_sessions').insert([
            {
              phone: cleanPhone || null,
              email: cleanEmail || null,
              otp_hash: otpHash,
              expires_at: expiresAtIso,
              verified: false,
              ip_address: ip,
              role: role || 'client',
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (dbErr) {
          console.warn('OTP session DB insert warning:', dbErr);
        }
      }
    })();

    // 4. Dispatch Chain (Option B: Parallel Execution of DB Storage + WhatsApp + Email)
    const hasMetaWA = Boolean(
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      !process.env.WHATSAPP_ACCESS_TOKEN.includes('WILL_BE_PROVIDED')
    );
    const hasResend = Boolean(
      process.env.RESEND_API_KEY &&
      !process.env.RESEND_API_KEY.includes('your-resend') &&
      !process.env.RESEND_API_KEY.includes('YOUR_RESEND_KEY')
    );

    const requestedChannel = (body.channel || body.preferredChannel) as string | undefined;
    const shouldSendWhatsApp = Boolean(cleanPhone && hasMetaWA && process.env.WHATSAPP_OTP_TEMPLATE_NAME && requestedChannel !== 'email');
    const shouldSendEmail = Boolean(cleanEmail && hasResend && requestedChannel !== 'whatsapp');

    // Run DB session storage, WhatsApp dispatch, and Email dispatch concurrently
    const [_, waResult, emailResult] = await Promise.all([
      insertDbSessionPromise,
      shouldSendWhatsApp ? sendMetaOTP(cleanPhone!, otpCode) : Promise.resolve(null),
      shouldSendEmail ? sendOtpEmail(cleanEmail!, otpCode) : Promise.resolve(null),
    ]);

    // Non-blocking asynchronous audit logging via Next.js after() (zero latency penalty)
    after(async () => {
      const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : null;
      if (!dbClient || typeof dbClient.from !== 'function') return;

      const logRows: any[] = [];
      if (waResult) {
        logRows.push({
          channel: 'whatsapp_otp',
          recipient: cleanPhone,
          event_number: 1,
          provider_message_id: waResult.messageId || null,
          status: waResult.success ? 'sent' : 'failed',
          error_message: waResult.error || null,
          created_at: new Date().toISOString(),
        });
      }
      if (emailResult) {
        logRows.push({
          channel: 'email',
          recipient: cleanEmail,
          event_number: 1,
          provider_message_id: emailResult.id || null,
          status: emailResult.success ? 'sent' : 'failed',
          error_message: emailResult.error || null,
          created_at: new Date().toISOString(),
        });
      }

      if (logRows.length > 0) {
        try {
          await dbClient.from('notification_delivery_log').insert(logRows);
        } catch (err: any) {
          console.warn('[OTP Route] notification_delivery_log background insert warning:', err);
        }
      }
    });

    const waOk = waResult?.success;
    const emailOk = emailResult?.success;

    // Both WhatsApp and Email succeeded
    if (waOk && emailOk) {
      return sendResponse({
        success: true,
        message: 'OTP sent via WhatsApp and Email',
        channel: 'all',
        channels: ['whatsapp', 'email'],
        messageId: waResult?.messageId,
        remainingAttempts,
        ...(shouldExposeDevOtp && { devOtp: otpCode }),
      });
    }

    // Only WhatsApp succeeded
    if (waOk) {
      return sendResponse({
        success: true,
        message: 'OTP sent via WhatsApp',
        channel: 'whatsapp',
        channels: ['whatsapp'],
        messageId: waResult?.messageId,
        remainingAttempts,
        ...(shouldExposeDevOtp && { devOtp: otpCode }),
      });
    }

    // Only Email succeeded
    if (emailOk) {
      return sendResponse({
        success: true,
        message: 'OTP sent via Email',
        channel: 'email',
        channels: ['email'],
        remainingAttempts,
        ...(shouldExposeDevOtp && { devOtp: otpCode }),
      });
    }

    // Development fallback
    if (isDev) {
      if (process.env.OTP_DEBUG === 'true') {
        console.log('[DEV OTP Dispatch] Identifier: [REDACTED], Generated OTP: [REDACTED]');
      }
      return sendResponse({
        success: true,
        message: 'OTP dispatched (development testing mode)',
        channel: 'dev',
        remainingAttempts,
        devOtp: otpCode,
      });
    }

    // Delivery failure handling
    const errorDetails = [
      waResult && !waResult.success ? `WhatsApp: ${waResult.error}` : null,
      emailResult && !emailResult.success ? `Email: ${emailResult.error}` : null,
    ].filter(Boolean).join(' | ');

    console.error(`[OTP Route] All delivery channels failed for ${identifier}: ${errorDetails}`);
    return sendResponse(
      {
        error: errorDetails
          ? `Delivery failed (${errorDetails}). Please check your contact information and try again.`
          : 'Failed to dispatch verification code. Please try again.',
      },
      { status: 502 }
    );
  } catch (error: unknown) {
    return createErrorResponse(error, 'Unable to process authentication request. Please try again.', 500);
  }
}
