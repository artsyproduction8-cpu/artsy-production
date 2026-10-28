import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_DEV_KEY = 'artsy_production_secret_encryption_key_2026_32char'; // 32 chars minimum

function getKey(): Buffer {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[FATAL] PII_ENCRYPTION_KEY must be set and >= 32 characters in production');
    }
  }
  return crypto.createHash('sha256').update(String(key || DEFAULT_DEV_KEY)).digest();
}

/**
 * Encrypt sensitive financial PII (PAN, Bank Account, IFSC) using AES-256-GCM
 * Output format: base64(iv:authTag:ciphertext)
 */
export function encryptPII(plainText: string): string {
  if (!plainText) return '';
  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    const combined = `${iv.toString('hex')}:${authTag}:${encrypted}`;

    return Buffer.from(combined, 'utf8').toString('base64');
  } catch (err: unknown) {
    console.error('PII Encryption failure:', err);
    throw new Error('Encryption operation failed');
  }
}

/**
 * Decrypt sensitive financial PII using AES-256-GCM
 */
export function decryptPII(cipherTextBase64: string): string {
  if (!cipherTextBase64) return '';
  try {
    let combined = '';
    try {
      combined = Buffer.from(cipherTextBase64, 'base64').toString('utf8');
    } catch {
      return cipherTextBase64;
    }

    const parts = combined.split(':');
    if (parts.length !== 3) {
      // Legacy unencrypted records prior to AES-GCM migration
      return cipherTextBase64;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const isHex = /^[0-9a-fA-F]+$/;
    if (!ivHex || !authTagHex || !encryptedHex || !isHex.test(ivHex) || !isHex.test(authTagHex) || !isHex.test(encryptedHex)) {
      return cipherTextBase64;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('[SECURITY WARNING] PII decryption tag verification failed (tampering or corrupted key):', err);
    return '';
  }
}

/**
 * Mask PAN number for secure display: e.g. "ABCDE1234F" -> "XXXXX1234F"
 * Automatically decrypts if an AES-256-GCM encrypted string is passed.
 */
export function maskPAN(pan: string): string {
  if (!pan) return '—';
  let clean = pan.trim().toUpperCase();
  if (clean.length > 15 || clean.includes(':') || clean.includes('=')) {
    const decrypted = decryptPII(pan);
    if (decrypted && decrypted.trim().length === 10) {
      clean = decrypted.trim().toUpperCase();
    }
  }
  if (clean.includes('X') || clean.includes('•') || clean.includes('*')) {
    return clean;
  }
  if (clean.length < 10) return 'XXXXXXXXXX';
  return `XXXXX${clean.slice(5)}`;
}

/**
 * Mask Bank Account Number: e.g. "50100239481234" -> "XXXXXXXXXX1234"
 * Automatically decrypts if an AES-256-GCM encrypted string is passed.
 */
export function maskBankAccount(account: string): string {
  if (!account) return '—';
  let clean = account.trim();
  if (clean.length > 25 || clean.includes(':') || clean.includes('=')) {
    const decrypted = decryptPII(account);
    if (decrypted && decrypted.trim().length >= 9) {
      clean = decrypted.trim();
    }
  }
  if (clean.includes('X') || clean.includes('•') || clean.includes('*')) {
    return clean;
  }
  if (clean.length <= 4) return 'XXXX';
  const lastFour = clean.slice(-4);
  return `${'X'.repeat(clean.length - 4)}${lastFour}`;
}

/**
 * Mask IFSC Code: e.g. "HDFC0000128" -> "HDFC••••128"
 * Automatically decrypts if an AES-256-GCM encrypted string is passed.
 */
export function maskIFSC(ifsc: string): string {
  if (!ifsc) return '—';
  let clean = ifsc.trim().toUpperCase();
  if (clean.length > 20 || clean.includes(':') || clean.includes('=')) {
    const decrypted = decryptPII(ifsc);
    if (decrypted && decrypted.trim().length === 11) {
      clean = decrypted.trim().toUpperCase();
    }
  }
  if (clean.includes('•') || clean.includes('X') || clean.includes('*')) {
    return clean;
  }
  if (clean.length < 11) return 'HDFC•••••••';
  return `${clean.slice(0, 4)}••••${clean.slice(8)}`;
}
