import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'artsy_auth_token';

export interface AuthUserPayload {
  id: string;
  role: 'client' | 'freelancer' | 'admin' | string;
  phone?: string;
  email?: string;
  full_name?: string;
  onboarding_status?: string | null;
  tracking_id?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  status?: string;
  [key: string]: any;
}

function getSigningSecret(): string {
  return process.env.COOKIE_SIGNING_SECRET || 'artsy-production-default-cookie-signing-secret-2026-locked';
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Binary(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  hash = hash.slice(0, 8);

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= (j & 0xff) << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength | 0;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;

      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : ((w[i - 16] || 0) +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                (w[i - 7] || 0) +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [
        (temp1 + temp2) | 0,
        a,
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function hexToBinary(hex: string): string {
  let binary = '';
  for (let i = 0; i < hex.length; i += 2) {
    binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return binary;
}

function utf8ToBinary(str: string): string {
  return unescape(encodeURIComponent(str));
}

function computeHmacSha256(key: string, message: string): string {
  const blockSize = 64;
  let keyBinary = utf8ToBinary(key);
  if (keyBinary.length > blockSize) {
    keyBinary = hexToBinary(sha256Binary(keyBinary));
  }
  while (keyBinary.length < blockSize) {
    keyBinary += '\x00';
  }

  let oKeyPad = '';
  let iKeyPad = '';
  for (let i = 0; i < blockSize; i++) {
    oKeyPad += String.fromCharCode(keyBinary.charCodeAt(i) ^ 0x5c);
    iKeyPad += String.fromCharCode(keyBinary.charCodeAt(i) ^ 0x36);
  }

  const inner = sha256Binary(iKeyPad + utf8ToBinary(message));
  const outer = sha256Binary(oKeyPad + hexToBinary(inner));
  return outer;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function base64Encode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf-8');
  }
  return decodeURIComponent(escape(atob(str)));
}

/**
 * Signs an auth user payload using HMAC-SHA256.
 * Format: {base64(JSON)}.{hmac_signature}
 */
export function signAuthCookieValue(payload: AuthUserPayload): string {
  const jsonStr = JSON.stringify(payload);
  const payloadBase64 = base64Encode(jsonStr);
  const secret = getSigningSecret();
  const signature = computeHmacSha256(secret, payloadBase64);
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies HMAC-SHA256 signature and parses user payload.
 * Returns null if signature is invalid, missing, or payload is malformed.
 */
export function verifyAndParseAuthCookie(cookieValue?: string | null): AuthUserPayload | null {
  if (!cookieValue) return null;

  try {
    let raw = cookieValue;
    try {
      raw = decodeURIComponent(raw);
    } catch {}

    const parts = raw.split('.');
    if (parts.length !== 2) {
      // Reject any cookie that is not strictly in {payloadBase64}.{signature} format
      return null;
    }

    const [payloadBase64, signature] = parts;
    const secret = getSigningSecret();
    const expectedSig = computeHmacSha256(secret, payloadBase64);

    if (constantTimeEqual(signature, expectedSig)) {
      const jsonStr = base64Decode(payloadBase64);
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && parsed.id) {
        return parsed as AuthUserPayload;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Helper to extract and verify authenticated user directly from a NextRequest or Request object.
 */
export function getAuthenticatedUser(request: NextRequest | Request): AuthUserPayload | null {
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

    return verifyAndParseAuthCookie(cookieVal);
  } catch {
    return null;
  }
}
