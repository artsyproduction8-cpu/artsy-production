import type { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

(function assertDistinctSecrets() {
  const jwt = process.env.JWT_SECRET;
  const cookie = process.env.COOKIE_SIGNING_SECRET;

  if (jwt && cookie && jwt === cookie) {
    console.warn(
      '[SECURITY] JWT_SECRET and COOKIE_SIGNING_SECRET are identical. ' +
      'They MUST be different values. Rotate manually.'
    );
  }
})();

export const AUTH_COOKIE_NAME = 'artsy_auth_token';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (§3.3, §1.4)

export type UserRole = 'client' | 'freelancer' | 'admin' | 'super_admin';

export interface AuthUserPayload {
  id: string;
  role: UserRole | string;
  phone?: string;
  email?: string;
  full_name?: string;
  onboarded?: boolean;
  onboarding_status?: string | null;
  tracking_id?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  status?: string;
  token_version?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Resolves cookie signing secret with strict fail-closed enforcement.
 * Refuses to use any default fallback string if secrets are missing.
 */
function getSigningSecret(): string {
  const rawSecret = process.env.COOKIE_SIGNING_SECRET || process.env.JWT_SECRET;
  const secret = rawSecret ? rawSecret.replace(/^["']|["']$/g, '').trim() : undefined;

  if (!secret || secret.length < 32) {
    throw new Error(
      '[FATAL] COOKIE_SIGNING_SECRET or JWT_SECRET must be set and >= 32 chars. ' +
      'Refusing to sign or verify cookies with a default value.'
    );
  }

  return secret;
}

// In-memory token_version cache (30-second TTL to minimize DB overhead on high-throughput routes)
interface CachedTokenVersion {
  version: number;
  cachedAt: number;
}
const tokenVersionCache = new Map<string, CachedTokenVersion>();
const CACHE_TTL_MS = 30 * 1000;

export function invalidateUserTokenVersionCache(userId: string, newVersion?: number) {
  if (newVersion !== undefined) {
    tokenVersionCache.set(userId, { version: newVersion, cachedAt: Date.now() });
  } else {
    tokenVersionCache.delete(userId);
  }
}

export async function getUserTokenVersion(userId: string): Promise<number | null> {
  const cached = tokenVersionCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.version;
  }

  try {
    const { supabaseAdmin, supabase } = await import('@/lib/supabase');
    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) return null;

    const { data, error } = await dbClient
      .from('users')
      .select('token_version')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data && data.token_version !== undefined && data.token_version !== null) {
      const ver = Number(data.token_version);
      tokenVersionCache.set(userId, { version: ver, cachedAt: Date.now() });
      return ver;
    }
  } catch (err) {
    // Non-fatal fallback for unconfigured environments
  }
  return null;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let c = 0;
  for (let i = 0; i < a.length; i++) {
    c |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return c === 0;
}

async function computeWebHmac(secret: string, data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  throw new Error('No Web Crypto available');
}

/**
 * Signs an auth user payload using HMAC-SHA256 (Node.js crypto).
 * Format: {base64(JSON)}.{hmac_signature}
 */
export function signAuthCookieValue(payload: AuthUserPayload): string {
  const payloadWithExp: AuthUserPayload = {
    ...payload,
    exp: payload.exp || Date.now() + SESSION_DURATION_MS,
  };
  const jsonStr = JSON.stringify(payloadWithExp);
  const payloadBase64 = Buffer.from(jsonStr, 'utf-8').toString('base64');
  const secret = getSigningSecret();
  const signature = createHmac('sha256', secret).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

/**
 * Synchronously verifies HMAC-SHA256 signature, expiry, and structure.
 * Returns null if signature is invalid, missing, expired, or payload is malformed.
 */
export function verifyAndParseAuthCookieSync(cookieValue?: string | null): AuthUserPayload | null {
  if (!cookieValue) return null;

  try {
    let raw = cookieValue;
    try {
      raw = decodeURIComponent(raw);
    } catch {}

    const parts = raw.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [payloadBase64, signature] = parts;
    const secret = getSigningSecret();

    let expectedSigHex: string;
    try {
      expectedSigHex = createHmac('sha256', secret).update(payloadBase64).digest('hex');
    } catch {
      return null;
    }

    const expected = Buffer.from(expectedSigHex, 'hex');
    const actual = Buffer.from(signature, 'hex');

    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }

    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && parsed.id) {
      if (parsed.exp && Date.now() > parsed.exp) {
        return null;
      }
      if (!parsed.token_version || Number(parsed.token_version) < 2) {
        return null;
      }
      return parsed as AuthUserPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Verifies HMAC-SHA256 signature and validates current token_version against the database.
 * Supports both Node.js environment and Next.js Edge runtime (via Web Crypto API).
 */
export async function verifyAndParseAuthCookie(cookieValue?: string | null): Promise<AuthUserPayload | null> {
  if (!cookieValue) return null;

  let parsed = verifyAndParseAuthCookieSync(cookieValue);

  // If sync verification failed (e.g. Edge runtime), fallback to Web Crypto
  if (!parsed) {
    try {
      let raw = cookieValue;
      try {
        raw = decodeURIComponent(raw);
      } catch {}

      const parts = raw.split('.');
      if (parts.length !== 2) return null;

      const [payloadBase64, signature] = parts;
      const secret = getSigningSecret();
      const expectedSigHex = await computeWebHmac(secret, payloadBase64);

      if (!constantTimeEqual(expectedSigHex, signature)) {
        return null;
      }

      let jsonStr: string;
      if (typeof Buffer !== 'undefined') {
        jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
      } else {
        jsonStr = atob(payloadBase64);
      }

      const obj = JSON.parse(jsonStr);
      if (obj && typeof obj === 'object' && obj.id) {
        if (obj.exp && Date.now() > obj.exp) return null;
        if (!obj.token_version || Number(obj.token_version) < 2) return null;
        parsed = obj as AuthUserPayload;
      }
    } catch {
      return null;
    }
  }

  if (!parsed) return null;

  // Server-side revocation check: verify against DB token_version
  const dbVersion = await getUserTokenVersion(parsed.id);
  if (dbVersion !== null) {
    const cookieVersion = Number(parsed.token_version || 1);
    if (cookieVersion < dbVersion) {
      return null; // Token version revoked on server
    }
  }

  return parsed;
}

/**
 * Helper to extract and verify authenticated user directly from a NextRequest or Request object.
 */
export async function getAuthenticatedUser(request: NextRequest | Request): Promise<AuthUserPayload | null> {
  try {
    let cookieVal: string | undefined;

    if ('cookies' in request && typeof (request as NextRequest).cookies?.get === 'function') {
      cookieVal = (request as NextRequest).cookies.get(AUTH_COOKIE_NAME)?.value;
    } else {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]*)`));
      if (match) {
        cookieVal = match[1];
      }
    }

    return await verifyAndParseAuthCookie(cookieVal);
  } catch {
    return null;
  }
}
