/**
 * Leakage Protection & Data Masking Helpers
 * Artsy Production Platform
 */

/**
 * Formats a name to First Name + Surname Initial (e.g., "Shivratan Kanojiya" -> "Shivratan K", "Jane Doe" -> "Jane D")
 * Respects single names (e.g. "Shreyas") and protects creator PII.
 */
export function formatPublicCreatorName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return '';
  const cleaned = fullName.trim();
  const lower = cleaned.toLowerCase();
  if (
    lower === 'creator partner' ||
    lower === 'creator' ||
    lower === 'creator member' ||
    lower === 'artsy creator'
  ) {
    return 'Artsy Creator';
  }
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  // If already formatted like "Shivratan K" or "Shivratan K."
  if (parts.length === 2 && parts[1].replace(/\.$/, '').length === 1) {
    return `${parts[0]} ${parts[1].replace(/\.$/, '').toUpperCase()}`;
  }

  const firstName = parts[0];
  const lastPart = parts[parts.length - 1].replace(/\.$/, '');
  const lastInitial = lastPart[0]?.toUpperCase() || '';
  return `${firstName} ${lastInitial}`;
}

/**
 * Masks an email address for leakage protection (e.g., "aarav.sen@gmail.com" -> "a***@***.com")
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '—';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}***`;
  const domainParts = domain.split('.');
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : 'com';
  return `${maskedLocal}@***.${tld}`;
}

/**
 * Masks a phone number for leakage protection (e.g., "+919876543210" -> "+91 98*** **210")
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const start = clean.slice(-10, -8);
    const end = clean.slice(-3);
    return `+91 ${start}*** **${end}`;
  }
  return '•••• ••••••';
}

import { maskPAN, maskBankAccount, maskIFSC } from './crypto/pii';

export { maskPAN, maskBankAccount, maskIFSC };

