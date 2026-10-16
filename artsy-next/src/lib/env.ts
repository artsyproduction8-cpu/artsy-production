/**
 * ARTSY PRODUCTION — Environment Variable Validator
 * ==================================================
 * Validates that all required environment variables are set and meet security
 * constraints before the application processes requests.
 *
 * In production (NODE_ENV === 'production'):
 * - Refuses to start (throws fatal error) if any critical variable is missing,
 *   malformed, or set to an insecure default/placeholder.
 *
 * In development:
 * - Emits structured console warnings for missing variables and supplies safe fallbacks.
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  COOKIE_SIGNING_SECRET: string;
  JWT_SECRET?: string;
  PII_ENCRYPTION_KEY: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  RESEND_API_KEY?: string;
  CRON_SECRET?: string;
}

const isPlaceholder = (val?: string): boolean => {
  if (!val) return true;
  const lower = val.toLowerCase().trim();
  return (
    lower.includes('your-') ||
    lower.includes('placeholder') ||
    lower.includes('[paste') ||
    lower.includes('will_be_provided') ||
    lower === ''
  );
};

export function validateEnvironment(): EnvConfig {
  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  // 1. Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl || isPlaceholder(supabaseUrl)) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing or contains placeholder values.');
  } else {
    try {
      const parsed = new URL(supabaseUrl);
      if (isProd && parsed.protocol !== 'https:') {
        errors.push('NEXT_PUBLIC_SUPABASE_URL must use https:// in production for TLS encryption.');
      }
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL.');
    }
  }

  // 2. Supabase Anon Key
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  if (!anonKey || isPlaceholder(anonKey)) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or contains placeholder values.');
  }

  // 3. Supabase Service Role Key (Required in production for admin & backend operations)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (isProd && (!serviceKey || isPlaceholder(serviceKey))) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production for secure server operations.');
  }

  // 4. Cookie Signing Secret / JWT Secret
  const cookieSecret = (process.env.COOKIE_SIGNING_SECRET || process.env.JWT_SECRET)?.trim();
  if (!cookieSecret || isPlaceholder(cookieSecret)) {
    errors.push('COOKIE_SIGNING_SECRET or JWT_SECRET is required to sign authentication cookies.');
  } else if (cookieSecret.length < 32) {
    errors.push('COOKIE_SIGNING_SECRET must be at least 32 characters long for cryptographic security.');
  }

  // 5. PII Encryption Key (AES-256-GCM)
  const piiKey = process.env.PII_ENCRYPTION_KEY?.trim();
  if (isProd && (!piiKey || isPlaceholder(piiKey))) {
    errors.push('PII_ENCRYPTION_KEY must be configured in production for AES-256 financial data encryption.');
  } else if (piiKey && piiKey.length < 32) {
    errors.push('PII_ENCRYPTION_KEY must be at least 32 characters (or 64 hex characters) long.');
  }

  // 6. Fail-closed in Production
  if (isProd && errors.length > 0) {
    const errorBanner = [
      '================================================================================',
      '[FATAL STARTUP ERROR] CRITICAL ENVIRONMENT CONFIGURATION MISSING',
      '================================================================================',
      ...errors.map((err) => `  ✗ ${err}`),
      '================================================================================',
      'The application has refused to start to prevent unauthenticated, unencrypted, or',
      'compromised execution in production. Please set the required environment variables.',
      '================================================================================',
    ].join('\n');
    console.error(errorBanner);
    throw new Error(errorBanner);
  } else if (!isProd && errors.length > 0) {
    console.warn('[ENV VALIDATION WARNING] Development environment is running with fallback settings:');
    errors.forEach((err) => console.warn(`  ! ${err}`));
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    SUPABASE_URL: supabaseUrl || 'http://localhost:54321',
    SUPABASE_ANON_KEY: anonKey || 'dev-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    COOKIE_SIGNING_SECRET: cookieSecret || 'artsy_dev_cookie_signing_secret_32_characters_minimum',
    JWT_SECRET: process.env.JWT_SECRET,
    PII_ENCRYPTION_KEY: piiKey || 'artsy_dev_pii_encryption_key_32_characters_minimum',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  };
}

// Execute pre-flight validation on server module load
export const env = validateEnvironment();
