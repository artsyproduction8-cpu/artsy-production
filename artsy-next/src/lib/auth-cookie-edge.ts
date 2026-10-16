import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'artsy_auth_token';
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

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

export function getSigningSecret(): string {
  const rawSecret = process.env.COOKIE_SIGNING_SECRET || process.env.JWT_SECRET;
  const secret = rawSecret ? rawSecret.replace(/^["']|["']$/g, '').trim() : undefined;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL] COOKIE_SIGNING_SECRET must be configured with >= 32 characters in production.');
    }
    return 'artsy_dev_cookie_signing_secret_32_characters_minimum';
  }
  return secret;
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

export function verifyAndParseAuthCookieSync(cookieValue?: string | null): AuthUserPayload | null {
  if (!cookieValue) return null;
  try {
    let raw = cookieValue;
    try {
      raw = decodeURIComponent(raw);
    } catch {}
    const parts = raw.split('.');
    if (parts.length !== 2) return null;
    const [payloadBase64] = parts;
    const jsonStr = typeof Buffer !== 'undefined'
      ? Buffer.from(payloadBase64, 'base64').toString('utf-8')
      : atob(payloadBase64);
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && parsed.id) {
      if (parsed.exp && Date.now() > parsed.exp) return null;
      if (!parsed.token_version || Number(parsed.token_version) < 2) return null;
      return parsed as AuthUserPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAndParseAuthCookie(cookieValue?: string | null): Promise<AuthUserPayload | null> {
  if (!cookieValue) return null;
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

    const jsonStr = typeof Buffer !== 'undefined'
      ? Buffer.from(payloadBase64, 'base64').toString('utf-8')
      : atob(payloadBase64);
    const obj = JSON.parse(jsonStr);
    if (obj && typeof obj === 'object' && obj.id) {
      if (obj.exp && Date.now() > obj.exp) return null;
      if (!obj.token_version || Number(obj.token_version) < 2) return null;
      return obj as AuthUserPayload;
    }
    return null;
  } catch {
    return null;
  }
}
