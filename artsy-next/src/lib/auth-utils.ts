// src/lib/auth-utils.ts
// Re-export server-safe auth utilities for root and src path aliases

export type { UserRole } from '../../lib/auth-utils';
export {
  getRoleHomePath,
  isAdminRole,
  isSuperAdminAccount,
  CANONICAL_SUPER_ADMIN_PHONE,
  CANONICAL_SUPER_ADMIN_EMAIL,
  CANONICAL_SUPER_ADMIN_FORMATTED_PHONE,
  PUBLIC_SUPPORT_PHONE_RAW,
} from '../../lib/auth-utils';
