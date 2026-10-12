// lib/auth-utils.ts
// Server-safe auth utilities. No React hooks.

export type UserRole = 'client' | 'freelancer' | 'admin' | 'super_admin';

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
