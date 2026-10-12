/**
 * Leakage Protection & Data Masking Helpers
 * Artsy Production Platform
 */

/**
 * Formats a name to First Name + Last Initial (e.g., "Aarav Sen" -> "Aarav S.")
 */
export function formatPublicCreatorName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return 'Artsy Creator';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstName} ${lastInitial}.`;
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

/**
 * Masks PAN numbers (e.g., "ABCDE1234F" -> "ABCDE****F")
 */
export function maskPAN(pan?: string | null): string {
  if (!pan || pan.length < 10) return '••••••••••';
  return `${pan.slice(0, 5)}****${pan.slice(-1)}`;
}
