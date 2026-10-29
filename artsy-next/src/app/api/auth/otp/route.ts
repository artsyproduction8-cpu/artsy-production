import { NextRequest, NextResponse, after } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendMetaOTP } from '@/lib/whatsapp/meta-cloud-dispatcher';
import { sendOtpEmail } from '@/lib/email/dispatcher';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
const supabase = supabaseAdmin;
import { signAuthCookieValue, AUTH_COOKIE_NAME, getAuthenticatedUser } from '@/lib/auth-cookie';
import { createErrorResponse } from '@/lib/api-response';
import { isSuperAdminAccount, CANONICAL_SUPER_ADMIN_PHONE, CANONICAL_SUPER_ADMIN_EMAIL } from '@/lib/auth-utils';

// Helper for legacy sha256 fallback compatibility
function legacyHashOtp(otp: string, identifier: string): string {
  return crypto.createHash('sha256').update(`${otp}:${identifier}:${process.env.PII_ENCRYPTION_KEY || 'dev_salt'}`).digest('hex');
}

interface LocalOtpSession {
  identifier: string;
  phone?: string | null;
  email?: string | null;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
  role?: string;
  isNewUser?: boolean;
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
    const { email, phone, identifier: inputIdentifier, action = 'send', code, consentGiven = true } = body;

    // Phase 3: Robust Role & Intent Extraction (Prevent client fallback bug)
    const rawRole = (body.role || body.intent || body.signup_intent || body.requestedRole || '')
      .toString()
      .trim()
      .toLowerCase();
    const isFreelancerRoleOrIntent = rawRole === 'freelancer' || rawRole === 'creator';
    const isSuperAdminRoleOrIntent = rawRole === 'super_admin';
    const isAdminRoleOrIntent = rawRole === 'admin';
    const parsedRole: 'client' | 'freelancer' | 'admin' | 'super_admin' =
      isFreelancerRoleOrIntent
        ? 'freelancer'
        : isSuperAdminRoleOrIntent
        ? 'super_admin'
        : isAdminRoleOrIntent
        ? 'admin'
        : 'client';
    const role = parsedRole;

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

      // Security Fix L: Distributed rate limiting on OTP verification (5 attempts per 10 mins per identifier)
      const verifyLimit = await checkRateLimit(`verify_${identifier}`, 'auth', 5, 600);
      if (!verifyLimit.allowed) {
        return NextResponse.json(
          { error: `Too many failed attempts. Session locked. Please request a new code in ${Math.ceil(verifyLimit.resetSeconds / 60)} minutes.`, remainingAttempts: 0 },
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

      if (memSession) {
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
            let sessionQuery = supabase
              .from('otp_sessions')
              .select('id, phone, email, otp_hash, expires_at, verified, role')
              .eq('verified', false)
              .gt('expires_at', new Date().toISOString())
              .order('created_at', { ascending: false });

            if (cleanPhone && cleanEmail) {
              sessionQuery = sessionQuery.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},email.eq.${cleanEmail}`);
            } else if (cleanPhone) {
              sessionQuery = sessionQuery.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
            } else if (cleanEmail) {
              sessionQuery = sessionQuery.eq('email', cleanEmail);
            } else {
              sessionQuery = sessionQuery.eq('phone', identifier);
            }

            const { data: dbSession } = await sessionQuery.limit(1).maybeSingle();

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
              memSession.expiresAt = 0;
              memSession.verified = false;
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
            // Phase 1: Verify phone and email strictly match for existing user
            if (cleanEmail && cleanPhone) {
              const recEmail = (existingUser.email || '').toLowerCase().trim();
              const recPhone = (existingUser.phone || '').replace(/\D/g, '').slice(-10);
              if ((recEmail && recEmail !== cleanEmail) || (recPhone && recPhone !== cleanPhone)) {
                return NextResponse.json(
                  { error: 'Invalid credentials. Phone and email do not match account records.' },
                  { status: 401 }
                );
              }
            }
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

      const isFreelancerRequest =
        isFreelancerRoleOrIntent ||
        role === 'freelancer' ||
        sessionRole === 'freelancer' ||
        sessionRole === 'creator' ||
        memSession?.role === 'freelancer' ||
        memSession?.role === 'creator';

      if (existingUser) {
        resolvedUser = existingUser;
        if (isSuperAdminIdentifier) {
          resolvedUser.role = 'super_admin';
        } else if (existingUser.role === 'client' && isFreelancerRequest) {
          // If an existing client logs in with creator intent, update their role to freelancer
          resolvedUser.role = 'freelancer';
          if (isSupabaseConfigured && dbClient) {
            try {
              await dbClient.from('users').update({ role: 'freelancer', updated_at: new Date().toISOString() }).eq('id', existingUser.id);
            } catch (rErr) {
              console.warn('[OTP Route] Error updating user role to freelancer:', rErr);
            }
          }
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
        const requestedRole: 'client' | 'freelancer' = isFreelancerRequest ? 'freelancer' : 'client';
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

            // If freelancer, creator profile will be created upon onboarding application submission
            // Do not insert premature pending approval profile
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
        isSuperAdminIdentifier ? 'super_admin' : (resolvedUser.role || (isFreelancerRequest ? 'freelancer' : 'client'));

      // Non-blocking welcome notification for new users
      if (isNewUser) {
        try {
          const { dispatchNotification } = await import('@/lib/whatsapp/dispatcher');
          const isCreatorNew = finalRole === 'freelancer' || isFreelancerRequest;
          await dispatchNotification({
            eventNumber: isCreatorNew ? 2 : 3,
            userId: resolvedUser.id,
            recipientPhone: cleanPhone ? `+91${cleanPhone}` : undefined,
            recipientEmail: cleanEmail || undefined,
            variables: {
              name: resolvedUser.full_name || (isCreatorNew ? 'Creator Partner' : 'Client'),
              role: isCreatorNew ? 'freelancer' : 'client',
              accountId: resolvedUser.id,
            },
            actionUrl: isCreatorNew
              ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/freelancer/onboarding`
              : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/client`,
          });
        } catch (notifErr) {
          console.warn('[OTP Route] Non-fatal welcome notification dispatch warning:', notifErr);
        }
      }

      let onboarding_status: 'pending' | 'approved' | 'rejected' | 'pending_review' | null = null;
      let tracking_id: string | null = null;
      let rejection_reason: string | null = null;
      let rejected_at: string | null = null;
      let agreement_signed_at: string | null = null;
      let agreement_accepted: boolean = false;

      if (finalRole === 'freelancer') {
        let profileFound = false;
        try {
          if (isSupabaseConfigured && dbClient && resolvedUser.id) {
            const { data: profile } = await dbClient
              .from('creator_profiles')
              .select('*')
              .eq('id', resolvedUser.id)
              .maybeSingle();

            if (profile) {
              profileFound = true;
              const isProfileDeleted = Boolean(profile.deleted_at || resolvedUser.status === 'deleted');
              if (isProfileDeleted) {
                // Profile was deleted or reset: creator starts fresh at /freelancer/onboarding
                onboarding_status = null;
                tracking_id = null;
                rejection_reason = null;
                rejected_at = null;
                agreement_signed_at = null;
                agreement_accepted = false;
              } else if (profile.approval_status === 'approved' || profile.onboarding_status === 'approved') {
                onboarding_status = 'approved';
                tracking_id = profile.tracking_id || (profile as any).trackingId || (resolvedUser as any).tracking_id || null;
                agreement_signed_at = profile.agreement_signed_at || profile.agreement_accepted_at || null;
                agreement_accepted = Boolean(profile.agreement_signed_at || profile.agreement_accepted_at || profile.agreement_accepted);
              } else if (profile.approval_status === 'rejected' || profile.onboarding_status === 'rejected') {
                onboarding_status = 'rejected';
                rejection_reason = profile.rejection_reason || null;
                rejected_at = profile.rejected_at || profile.updated_at || new Date().toISOString();
                tracking_id = profile.tracking_id || (profile as any).trackingId || (resolvedUser as any).tracking_id || null;
                agreement_signed_at = profile.agreement_signed_at || profile.agreement_accepted_at || null;
                agreement_accepted = Boolean(profile.agreement_signed_at || profile.agreement_accepted_at || profile.agreement_accepted);
              } else if (
                profile.onboarding_status === 'pending_review' ||
                profile.onboarding_status === 'pending' ||
                profile.approval_status === 'pending' ||
                Boolean(profile.tracking_id)
              ) {
                onboarding_status = 'pending_review';
                tracking_id = profile.tracking_id || (profile as any).trackingId || (resolvedUser as any).tracking_id || null;
                agreement_signed_at = profile.agreement_signed_at || profile.agreement_accepted_at || null;
                agreement_accepted = Boolean(profile.agreement_signed_at || profile.agreement_accepted_at || profile.agreement_accepted);
              } else {
                // Application form has not been submitted yet
                onboarding_status = null;
                tracking_id = null;
                rejection_reason = null;
                rejected_at = null;
                agreement_signed_at = null;
                agreement_accepted = false;
              }
              if (!resolvedUser.full_name && profile.public_display_name) {
                resolvedUser.full_name = profile.public_display_name;
              }
            }
          }
        } catch (pErr) {
          console.warn('Creator profile lookup warning:', pErr);
        }

        // Strict rule: If the user has no creator_profiles row, onboarding_status MUST be null
        if (!profileFound) {
          onboarding_status = null;
          tracking_id = null;
          rejection_reason = null;
          rejected_at = null;
          agreement_signed_at = null;
          agreement_accepted = false;
        }
      }

      const userPayload: any = {
        id: String(resolvedUser.id),
        role: finalRole,
        phone: resolvedUser.phone || formattedPhone || (cleanPhone ? `+91${cleanPhone}` : ''),
        email: resolvedUser.email || cleanEmail || '',
        full_name: resolvedUser.full_name ?? null,
        onboarded: finalRole === 'freelancer' ? Boolean(resolvedUser.onboarded && onboarding_status !== null) : Boolean(resolvedUser.onboarded),
        status: 'active',
        token_version: Number(resolvedUser.token_version && Number(resolvedUser.token_version) >= 2 ? resolvedUser.token_version : 2),
      };

      if (finalRole === 'freelancer') {
        userPayload.onboarding_status = onboarding_status;
        userPayload.tracking_id = tracking_id;
        userPayload.rejection_reason = rejection_reason;
        userPayload.rejected_at = rejected_at;
        userPayload.agreement_signed_at = agreement_signed_at;
        userPayload.agreement_accepted = agreement_accepted;
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
          agreement_signed_at: userPayload.agreement_signed_at || null,
          agreement_accepted: userPayload.agreement_accepted || false,
          created_at: resolvedUser.created_at || new Date().toISOString(),
          updated_at: resolvedUser.updated_at || new Date().toISOString(),
        },
      });

      // Issue HMAC auth cookie containing id, role, token_version, and state machine fields
      const signedCookie = signAuthCookieValue({
        id: String(resolvedUser.id),
        role: finalRole,
        token_version: Number(resolvedUser.token_version && Number(resolvedUser.token_version) >= 2 ? resolvedUser.token_version : 2),
        onboarded: Boolean(userPayload.onboarded),
        onboarding_status: userPayload.onboarding_status || null,
        tracking_id: userPayload.tracking_id || null,
        email: userPayload.email,
        phone: userPayload.phone,
        full_name: userPayload.full_name,
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

    const dbClient = (supabaseAdmin && typeof supabaseAdmin.from === 'function') ? supabaseAdmin : null;

    // ────────────────────────────────────────────────────────
    // PURPOSE: VERIFY_ONLY — Single-channel verification (Profile Contact Updates)
    // ────────────────────────────────────────────────────────
    if (body.purpose === 'verify_only') {
      const authUser = await getAuthenticatedUser(request);

      // 1. Email Verification Branch
      if (cleanEmail) {
        if (dbClient && isSupabaseConfigured) {
          const { data: conflictUser } = await dbClient
            .from('users')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (conflictUser && (!authUser || conflictUser.id !== authUser.id)) {
            return sendResponse(
              { error: 'This email address is already associated with another account.' },
              { status: 400 }
            );
          }
        }

        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAtMs = Date.now() + 5 * 60 * 1000;
        const expiresAtIso = new Date(expiresAtMs).toISOString();

        const sessionObj: LocalOtpSession = {
          identifier: cleanEmail,
          phone: null,
          email: cleanEmail,
          otpHash,
          expiresAt: expiresAtMs,
          attempts: 0,
          verified: false,
          role: role || 'freelancer',
          isNewUser: false,
        };
        memoryOtpSessions.set(cleanEmail, sessionObj);
        memoryOtpSessions.set(identifier, sessionObj);

        if (dbClient && isSupabaseConfigured && typeof dbClient.from === 'function') {
          try {
            await dbClient.from('otp_sessions').update({ verified: true }).eq('email', cleanEmail).eq('verified', false);
            await dbClient.from('otp_sessions').insert([
              {
                phone: null,
                email: cleanEmail,
                otp_hash: otpHash,
                expires_at: expiresAtIso,
                verified: false,
                ip_address: ip,
                role: role || 'freelancer',
                created_at: new Date().toISOString(),
              },
            ]);
          } catch (dbErr) {
            console.warn('[OTP Route] verify_only DB insert warning:', dbErr);
          }
        }

        const emailResult = await sendOtpEmail(cleanEmail, otpCode);
        if (emailResult && !emailResult.success && !isDev) {
          return sendResponse(
            { error: `Failed to deliver email OTP: ${emailResult.error || 'Please check your email address.'}` },
            { status: 400 }
          );
        }

        return sendResponse({
          success: true,
          message: 'Verification OTP sent to your email address.',
          channel: 'email',
          remainingAttempts,
          ...(shouldExposeDevOtp && { devOtp: otpCode }),
        });
      }

      // 2. WhatsApp / Phone Verification Branch
      if (cleanPhone) {
        if (cleanPhone.length !== 10) {
          return sendResponse(
            { error: 'Please enter a valid 10-digit Indian phone number.' },
            { status: 400 }
          );
        }

        if (dbClient && isSupabaseConfigured) {
          const { data: conflictUser } = await dbClient
            .from('users')
            .select('id')
            .or(`phone.eq.+91${cleanPhone},phone.eq.91${cleanPhone},phone.eq.${cleanPhone}`)
            .maybeSingle();

          if (conflictUser && (!authUser || conflictUser.id !== authUser.id)) {
            return sendResponse(
              { error: 'This phone number is already registered to another account.' },
              { status: 400 }
            );
          }
        }

        const otpCode = crypto.randomInt(100000, 1000000).toString();
        const otpHash = await bcrypt.hash(otpCode, 10);
        const expiresAtMs = Date.now() + 5 * 60 * 1000;
        const expiresAtIso = new Date(expiresAtMs).toISOString();

        const sessionObj: LocalOtpSession = {
          identifier: cleanPhone,
          phone: cleanPhone,
          email: null,
          otpHash,
          expiresAt: expiresAtMs,
          attempts: 0,
          verified: false,
          role: role || 'freelancer',
          isNewUser: false,
        };
        memoryOtpSessions.set(cleanPhone, sessionObj);
        memoryOtpSessions.set(`+91${cleanPhone}`, sessionObj);
        memoryOtpSessions.set(identifier, sessionObj);

        if (dbClient && isSupabaseConfigured && typeof dbClient.from === 'function') {
          try {
            await dbClient.from('otp_sessions').update({ verified: true }).eq('phone', cleanPhone).eq('verified', false);
            await dbClient.from('otp_sessions').insert([
              {
                phone: cleanPhone,
                email: null,
                otp_hash: otpHash,
                expires_at: expiresAtIso,
                verified: false,
                ip_address: ip,
                role: role || 'freelancer',
                created_at: new Date().toISOString(),
              },
            ]);
          } catch (dbErr) {
            console.warn('[OTP Route] verify_only DB insert warning:', dbErr);
          }
        }

        const waResult = await sendMetaOTP(cleanPhone, otpCode);
        if (waResult && !waResult.success && !isDev) {
          return sendResponse(
            { error: `Failed to deliver WhatsApp OTP: ${waResult.error || 'Please check your phone number.'}` },
            { status: 400 }
          );
        }

        return sendResponse({
          success: true,
          message: 'Verification OTP sent to your WhatsApp number.',
          channel: 'whatsapp',
          remainingAttempts,
          ...(shouldExposeDevOtp && { devOtp: otpCode }),
        });
      }

      return sendResponse({ error: 'Valid email address or phone number is required.' }, { status: 400 });
    }

    // ────────────────────────────────────────────────────────
    // PHASE 1: STRICT AUTHENTICATION (CREDENTIAL MATCHING)
    // ────────────────────────────────────────────────────────

    let isExistingUser = false;
    let isNewUser = false;

    if (isSupabaseConfigured && dbClient) {
      try {
        let userByPhone: any = null;
        let userByEmail: any = null;

        if (cleanPhone) {
          const { data: phoneUser } = await dbClient
            .from('users')
            .select('*')
            .or(`phone.eq.+91${cleanPhone},phone.eq.91${cleanPhone},phone.eq.${cleanPhone}`)
            .maybeSingle();
          userByPhone = phoneUser;
        }

        if (cleanEmail) {
          const { data: emailUser } = await dbClient
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();
          userByEmail = emailUser;
        }

        // Canonical Super Admin Credentials Check
        const isSuperAdminPhone = cleanPhone && (CANONICAL_SUPER_ADMIN_PHONE.includes(cleanPhone) || cleanPhone === '7777078742');
        const isSuperAdminEmail = cleanEmail && cleanEmail.toLowerCase() === CANONICAL_SUPER_ADMIN_EMAIL.toLowerCase();

        if (isSuperAdminPhone || isSuperAdminEmail) {
          if (!isSuperAdminPhone || !isSuperAdminEmail) {
            return NextResponse.json(
              { error: 'Invalid credentials. Phone and email do not match our records.' },
              { status: 401 }
            );
          }
        }

        if (userByPhone || userByEmail) {
          isExistingUser = true;

          // If found by phone, verify cleanEmail strictly matches the user's stored email
          if (userByPhone) {
            const recordedEmail = (userByPhone.email || '').toLowerCase().trim();
            if (cleanEmail && recordedEmail && recordedEmail !== cleanEmail) {
              return NextResponse.json(
                { error: 'Invalid credentials. Phone and email do not match our records.' },
                { status: 401 }
              );
            }
          }

          // If found by email, verify cleanPhone strictly matches the user's stored phone
          if (userByEmail) {
            const recordedPhone = (userByEmail.phone || '').replace(/\D/g, '').slice(-10);
            if (cleanPhone && recordedPhone && recordedPhone !== cleanPhone) {
              return NextResponse.json(
                { error: 'Invalid credentials. Phone and email do not match our records.' },
                { status: 401 }
              );
            }
          }

          // If found by both, they MUST reference the exact same user record
          if (userByPhone && userByEmail && userByPhone.id !== userByEmail.id) {
            return NextResponse.json(
              { error: 'Invalid credentials. Phone and email do not match our records.' },
              { status: 401 }
            );
          }
        } else {
          isNewUser = true;
          // First-Time User Signup: both phone number and email are required
          if (!cleanPhone || !cleanEmail) {
            return NextResponse.json(
              { error: 'Both a valid 10-digit Indian phone number and email address are required for registration.' },
              { status: 400 }
            );
          }
        }
      } catch (authMatchErr) {
        console.warn('[OTP Route] Auth match lookup warning:', authMatchErr);
      }
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
      phone: cleanPhone,
      email: cleanEmail,
      otpHash,
      expiresAt: expiresAtMs,
      attempts: 0,
      verified: false,
      role: role || 'client',
      isNewUser,
    };
    memoryOtpSessions.set(identifier, sessionObj);
    if (cleanPhone) {
      memoryOtpSessions.set(cleanPhone, sessionObj);
      memoryOtpSessions.set(`+91${cleanPhone}`, sessionObj);
    }
    if (cleanEmail) {
      memoryOtpSessions.set(cleanEmail, sessionObj);
    }

    // Database session storage helper
    const persistDbSession = async () => {
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
    };

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

    // ────────────────────────────────────────────────────────
    // 1.2 First-Time User Signup: Simultaneous Delivery & Dual-Channel Requirement
    // ────────────────────────────────────────────────────────
    if (isNewUser) {
      const [waResult, emailResult] = await Promise.all([
        cleanPhone ? sendMetaOTP(cleanPhone, otpCode) : Promise.resolve({ success: false, error: 'Phone missing' }),
        cleanEmail ? sendOtpEmail(cleanEmail, otpCode) : Promise.resolve({ success: false, error: 'Email missing' }),
      ]);

      const waOk = Boolean(waResult?.success);
      const emailOk = Boolean(emailResult?.success);

      // If WhatsApp delivery fails OR Email delivery fails: invalidate OTP & block login
      if (!waOk || !emailOk) {
        memoryOtpSessions.delete(identifier);
        if (cleanPhone) {
          memoryOtpSessions.delete(cleanPhone);
          memoryOtpSessions.delete(`+91${cleanPhone}`);
        }
        if (cleanEmail) {
          memoryOtpSessions.delete(cleanEmail);
        }

        const failDetails = [];
        if (!waOk) failDetails.push(`WhatsApp (${waResult?.error || 'failed'})`);
        if (!emailOk) failDetails.push(`Email (${emailResult?.error || 'failed'})`);

        console.error(`[OTP Route] Signup dual-delivery requirement failed for ${identifier}: ${failDetails.join(', ')}`);
        return sendResponse(
          {
            error: `Registration verification delivery failed: ${failDetails.join(' and ')}. Both WhatsApp and Email delivery must succeed. Please check your phone number and email address.`,
          },
          { status: 400 }
        );
      }

      await persistDbSession();

      after(async () => {
        if (!dbClient || typeof dbClient.from !== 'function') return;
        try {
          await dbClient.from('notification_delivery_log').insert([
            {
              channel: 'whatsapp_otp',
              recipient: cleanPhone,
              event_number: 1,
              provider_message_id: ('messageId' in waResult && typeof waResult.messageId === 'string') ? waResult.messageId : null,
              status: 'sent',
              created_at: new Date().toISOString(),
            },
            {
              channel: 'email',
              recipient: cleanEmail,
              event_number: 1,
              provider_message_id: ('id' in emailResult && typeof emailResult.id === 'string') ? emailResult.id : null,
              status: 'sent',
              created_at: new Date().toISOString(),
            },
          ]);
        } catch {}
      });

      return sendResponse({
        success: true,
        message: 'OTP sent via WhatsApp and Email',
        channel: 'all',
        channels: ['whatsapp', 'email'],
        remainingAttempts,
        ...(shouldExposeDevOtp && { devOtp: otpCode }),
      });
    }

    // ────────────────────────────────────────────────────────
    // 1.1 Existing User Login: Send to Verified Channels
    // ────────────────────────────────────────────────────────
    const requestedChannel = (body.channel || body.preferredChannel) as string | undefined;
    const shouldSendWhatsApp = Boolean(cleanPhone && hasMetaWA && process.env.WHATSAPP_OTP_TEMPLATE_NAME && requestedChannel !== 'email');
    const shouldSendEmail = Boolean(cleanEmail && hasResend && requestedChannel !== 'whatsapp');

    const [_, waResult, emailResult] = await Promise.all([
      persistDbSession(),
      shouldSendWhatsApp ? sendMetaOTP(cleanPhone!, otpCode) : Promise.resolve(null),
      shouldSendEmail ? sendOtpEmail(cleanEmail!, otpCode) : Promise.resolve(null),
    ]);

    after(async () => {
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
        } catch {}
      }
    });

    const waOk = waResult?.success;
    const emailOk = emailResult?.success;

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

    if (isDev) {
      return sendResponse({
        success: true,
        message: 'OTP dispatched (development testing mode)',
        channel: 'dev',
        remainingAttempts,
        devOtp: otpCode,
      });
    }

    const errorDetails = [
      waResult && !waResult.success ? `WhatsApp: ${waResult.error}` : null,
      emailResult && !emailResult.success ? `Email: ${emailResult.error}` : null,
    ].filter(Boolean).join(' | ');

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
