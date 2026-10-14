'use client';

import { useState, useEffect } from 'react';

import type { UserRole } from './auth-utils';
import { getRoleHomePath, isAdminRole } from './auth-utils';

export type { UserRole };
export { getRoleHomePath, isAdminRole };

// Auth types
export type UserStatus = 'active' | 'pending' | 'suspended' | 'banned';

export type OnboardingStatus =
  | 'registered'
  | 'incomplete'
  | 'pending'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'deactivated';

export interface ArtsyUser {
  id: string;
  email: string;
  full_name: string;
  display_name?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  onboarded?: boolean;
  agreement_accepted?: boolean;
  agreement_accepted_at?: string;
  agreement_version?: string;
  onboarding_status?: OnboardingStatus | null;
  tracking_id?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Preset standard test accounts for instant role demo & testing
export const PRESET_USERS: Record<UserRole, ArtsyUser> = {
  super_admin: {
    id: 'usr-superadmin-000',
    email: 'admin@artsyproduction.com',
    full_name: 'Super Admin',
    phone: '+91 9999999999',
    role: 'super_admin',
    status: 'active',
    avatar_url: '',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z'
  },
  client: {
    id: 'usr-client-001',
    email: 'client@artsyproduction.com',
    full_name: 'Client Partner',
    phone: '',
    role: 'client',
    status: 'active',
    avatar_url: '',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z'
  },
  freelancer: {
    id: 'usr-editor-002',
    email: 'creator@artsyproduction.com',
    full_name: 'Creator Partner',
    phone: '',
    role: 'freelancer',
    status: 'active',
    avatar_url: '',
    agreement_accepted: true,
    agreement_accepted_at: '2025-01-10T00:00:00.000Z',
    agreement_version: '1.0',
    onboarding_status: 'approved',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z'
  },
  admin: {
    id: 'usr-admin-003',
    email: 'admin@artsyproduction.in',
    full_name: 'Studio Director (Admin)',
    phone: '+91 7777078742',
    role: 'admin',
    status: 'active',
    avatar_url: '',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z'
  }
};

// Auth storage key
const AUTH_STORAGE_KEY = 'artsy_auth_user';

// Get current user from localStorage
export const getCurrentUser = (): ArtsyUser | null => {
  if (typeof window === 'undefined') return null;

  const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Set current user in localStorage and server cookie via session endpoint
export const setCurrentUser = (user: ArtsyUser | null) => {
  if (typeof window === 'undefined') return;

  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    // Immediate fallback cookie for synchronous browser transitions
    try {
      document.cookie = `artsy_auth_token=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
    // Sync with server HttpOnly signed cookie
    fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    }).catch(() => {});
  } else {
    const LOCAL_KEYS = [
      'artsy_auth_user',
      'artsy_client_profile',
      'artsy_creator_profile',
      'artsy_creator_agreements',
      'artsy_active_booking',
      'artsy_quotes',
      'artsy_financial_ledger',
      'artsy_signup_intent',
      'artsy_pending_auth',
      'artsy_redirect',
    ];
    LOCAL_KEYS.forEach((key) => {
      try { localStorage.removeItem(key); } catch {}
    });

    try { sessionStorage.clear(); } catch {}

    try {
      document.cookie = 'artsy_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'artsy_auth_token=; path=/; max-age=0; SameSite=Lax';
    } catch {}

    // Invalidate server HttpOnly cookie
    fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
  }

  // Notify active components in the current window
  window.dispatchEvent(new Event('artsy_auth_change'));
};

export const setCurrentUserAsync = async (user: ArtsyUser | null): Promise<void> => {
  if (typeof window === 'undefined') return;
  setCurrentUser(user);
  try {
    if (user) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });
    } else {
      await fetch('/api/auth/session', { method: 'DELETE' });
    }
  } catch {}
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Check if user has specific role
export const hasRole = (role: UserRole): boolean => {
  const user = getCurrentUser();
  return user ? user.role === role : false;
};

// Check if user has any of the allowed roles
export const hasAnyRole = (roles: UserRole[]): boolean => {
  const user = getCurrentUser();
  return user ? roles.includes(user.role) : false;
};

// Logout user and redirect to login
export function logout(redirectTo: string = '/auth/login'): void {
  if (typeof window === 'undefined') return;

  // M1: Purge all artsy_* keys from localStorage
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('artsy_'))
      .forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });
  } catch {}

  try { sessionStorage.clear(); } catch {}

  document.cookie = 'artsy_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  document.cookie = 'artsy_auth_token=; path=/; max-age=0; SameSite=Lax';

  fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});

  const destination = redirectTo || '/auth/login';
  if (window.location.pathname !== destination) {
    window.location.href = destination;
  }
}

export const signOut = logout;

// Auth provider hook with reactive local event listening
export const useAuth = () => {
  const [user, setUser] = useState<ArtsyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = () => {
      setUser(getCurrentUser());
      setLoading(false);
    };

    syncUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        syncUser();
      }
    };

    const handleLocalAuthChange = () => {
      syncUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('artsy_auth_change', handleLocalAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('artsy_auth_change', handleLocalAuthChange);
    };
  }, []);

  return {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    logout
  };
};

// Route protection check for client components
export const checkAccess = (allowedRoles: UserRole[]): { allowed: boolean; user: ArtsyUser | null; redirectUrl: string } => {
  const user = getCurrentUser();
  if (!user) {
    return { allowed: false, user: null, redirectUrl: '/auth/login' };
  }

  if (!allowedRoles.includes(user.role)) {
    return { allowed: false, user, redirectUrl: getRoleHomePath(user.role) };
  }

  return { allowed: true, user, redirectUrl: '' };
};

// Check if creator has accepted NDA and Service Agreement
export const hasAcceptedAgreement = (user?: ArtsyUser | null): boolean => {
  const u = user !== undefined ? user : getCurrentUser();
  return !!u?.agreement_accepted;
};

// Record creator agreement acceptance in localStorage and user profile
export const recordAgreementAcceptance = (
  agreementType: 'nda' | 'service_agreement' | 'both' = 'both',
  version: string = '1.0'
): ArtsyUser | null => {
  const user = getCurrentUser();
  if (!user) return null;

  const updated: ArtsyUser = {
    ...user,
    agreement_accepted: true,
    agreement_accepted_at: new Date().toISOString(),
    agreement_version: version,
    onboarding_status: 'approved'
  };

  setCurrentUser(updated);

  if (typeof window !== 'undefined') {
    try {
      const records = JSON.parse(localStorage.getItem('artsy_creator_agreements') || '[]');
      records.push({
        id: `agr-${Date.now()}`,
        creator_id: user.id,
        agreement_type: agreementType,
        version,
        accepted_at: new Date().toISOString(),
        user_agent: navigator.userAgent
      });
      localStorage.setItem('artsy_creator_agreements', JSON.stringify(records));
    } catch {
      // ignore
    }
  }

  return updated;
};

// Check if creator is verified and approved
export const isCreatorApproved = (user?: ArtsyUser | null): boolean => {
  const u = user !== undefined ? user : getCurrentUser();
  if (!u || u.role !== 'freelancer') return false;
  return u.onboarding_status === 'approved';
};

// Check if creator application is pending review
export const isCreatorPending = (user?: ArtsyUser | null): boolean => {
  const u = user !== undefined ? user : getCurrentUser();
  if (!u || u.role !== 'freelancer') return false;
  return u.onboarding_status === 'pending_review';
};

// Update current user's onboarding status
export const updateCurrentUserOnboarding = (status: OnboardingStatus): ArtsyUser | null => {
  const user = getCurrentUser();
  if (!user) return null;
  const updated: ArtsyUser = { ...user, onboarding_status: status };
  setCurrentUser(updated);
  return updated;
};