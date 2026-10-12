// src/lib/auth-utils.ts
// Re-export server-safe auth utilities for root and src path aliases

export type { UserRole } from '../../lib/auth-utils';
export { getRoleHomePath, isAdminRole } from '../../lib/auth-utils';
