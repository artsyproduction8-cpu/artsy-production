// lib/auth-utils.ts
// Server-safe auth utilities. No React hooks.

export type UserRole = 'client' | 'freelancer' | 'admin' | 'super_admin';

export const CANONICAL_SUPER_ADMIN_PHONE = '7777078742';
export const CANONICAL_SUPER_ADMIN_EMAIL = 'lilsammy96@gmail.com';
export const CANONICAL_SUPER_ADMIN_FORMATTED_PHONE = '+91 77770 78742';

// 918369251112 is strictly public support (WhatsApp chat and phone call desk for help & support)
export const PUBLIC_SUPPORT_PHONE_RAW = '8369251112';

/**
 * Robust check for whether an account represents the single canonical Super Admin.
 * Matches 7777078742 and lilsammy96@gmail.com, or SUPER_ADMIN_PHONE / SUPER_ADMIN_EMAIL.
 * Strictly guarantees that 8369251112 is NEVER treated as super admin or admin.
 */
export const isSuperAdminAccount = (
  user: { phone?: string | null; email?: string | null; role?: string | null } | null | undefined
): boolean => {
  if (!user) return false;

  const cleanPhone = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
  const cleanEmail = user.email ? user.email.toLowerCase().trim() : '';

  // Explicit safety block: support phone is NOT super admin or admin
  if (cleanPhone === PUBLIC_SUPPORT_PHONE_RAW) {
    return false;
  }

  if (user.role === 'super_admin') return true;

  const envPhone = process.env.SUPER_ADMIN_PHONE?.replace(/\D/g, '').slice(-10);
  const envEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

  if (cleanPhone && (cleanPhone === CANONICAL_SUPER_ADMIN_PHONE || (envPhone && cleanPhone === envPhone))) {
    return true;
  }
  if (cleanEmail && (cleanEmail === CANONICAL_SUPER_ADMIN_EMAIL || (envEmail && cleanEmail === envEmail))) {
    return true;
  }
  return false;
};

export const getRoleHomePath = (role: UserRole | string | null | undefined): string => {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin';
    case 'freelancer':
      return '/freelancer';
    case 'client':
    default:
      return '/client-dashboard';
  }
};

export const isAdminRole = (role: UserRole | string | null | undefined): boolean => {
  return role === 'admin' || role === 'super_admin';
};
