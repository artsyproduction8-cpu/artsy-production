'use client';

import { useState, useEffect } from 'react';

import type { UserRole } from './auth-utils';
import { getRoleHomePath, isAdminRole, isSuperAdminAccount } from './auth-utils';

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
  agreement_signed_at?: string;
  agreement_version?: string;
  onboarding_status?: OnboardingStatus | null;
  tracking_id?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  created_at: string;
  updated_at: string;
  studio_details?: any;
  creator_profile?: any;
}

// Preset standard test accounts for instant role demo & testing
export const PRESET_USERS: Record<UserRole, ArtsyUser> = {
  super_admin: {
    id: '50d2d4d3-b55f-4c9c-8281-a3fa324c52ad',
    email: 'lilsammy96@gmail.com',
    full_name: 'Studio Owner (Super Admin)',
    phone: '+91 77770 78742',
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
    phone: '+91 9876543210',
    role: 'admin',
    status: 'active',
    avatar_url: '',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z'
  }
};

// Auth storage key
const AUTH_STORAGE_KEY = 'artsy_auth_user';

// Get current user from sessionStorage (preferred for active tab) or localStorage (fallback)
export const getCurrentUser = (): ArtsyUser | null => {
  if (typeof window === 'undefined') return null;

  try {
    const sessionStr = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      if (parsed && parsed.id) return parsed;
    }
  } catch {}

  try {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEY);
    if (userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed && parsed.id) return parsed;
    }
  } catch {}

  return null;
};

// Set current user in sessionStorage / localStorage and server cookie via session endpoint
export const setCurrentUser = (user: ArtsyUser | null) => {
  if (typeof window === 'undefined') return;

  if (user) {
    try {
      // Store full active user profile in sessionStorage (isolated to current tab session, cleared on tab close)
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));

      // Store active user profile in persistent localStorage and sessionStorage
      const persistentUser: ArtsyUser = {
        id: user.id,
        email: user.email || '',
        phone: user.phone || '',
        full_name: user.full_name || '',
        display_name: user.display_name || '',
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url || '',
        onboarded: user.onboarded,
        agreement_accepted: user.agreement_accepted,
        agreement_accepted_at: user.agreement_accepted_at,
        agreement_version: user.agreement_version,
        onboarding_status: user.onboarding_status,
        tracking_id: user.tracking_id,
        rejection_reason: user.rejection_reason,
        rejected_at: user.rejected_at,
        studio_details: user.studio_details || null,
        creator_profile: user.creator_profile || null,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persistentUser));
    } catch {}

    // Sync with server HttpOnly signed cookie (prevents client-side unsigned cookie tampering)
    fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
      credentials: 'include',
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
    fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' }).catch(() => {});
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
        credentials: 'include',
      });
    } else {
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
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
    let isMounted = true;

    const syncUser = () => {
      const current = getCurrentUser();
      if (isMounted) {
        setUser(current);
      }
    };

    // Hydrate immediately from persistent local cache
    syncUser();

    // Fetch fresh profile data directly from database on page load via /api/user/me
    const refreshProfile = async () => {
      try {
        const res = await fetch('/api/user/me', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.status === 401) {
          const active = getCurrentUser();
          if (active && (active.role === 'admin' || active.role === 'super_admin' || isSuperAdminAccount(active))) {
            console.warn('[useAuth] Preserving admin session despite 401 from /api/user/me');
            return;
          }
          if (isMounted) {
            setUser(null);
          }
          try {
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {}
          return;
        }

        if (!res.ok) {
          // If server error (500, 502, 503, etc.), DO NOT clear local session
          console.warn('[useAuth] /api/user/me returned status', res.status, '- preserving local session');
          return;
        }

        const data = await res.json().catch(() => null);
        if (data && data.authenticated && data.user) {
          if (isMounted) {
            setUser(data.user);
          }
          try {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
            const sanitizedUser: ArtsyUser = {
              id: data.user.id,
              email: data.user.email || '',
              phone: data.user.phone || '',
              full_name: data.user.full_name || '',
              display_name: data.user.display_name || '',
              role: data.user.role,
              status: data.user.status,
              avatar_url: data.user.avatar_url || '',
              onboarded: data.user.onboarded,
              agreement_accepted: data.user.agreement_accepted,
              agreement_accepted_at: data.user.agreement_accepted_at,
              agreement_version: data.user.agreement_version,
              onboarding_status: data.user.onboarding_status,
              tracking_id: data.user.tracking_id,
              rejection_reason: data.user.rejection_reason,
              rejected_at: data.user.rejected_at,
              created_at: data.user.created_at,
              updated_at: data.user.updated_at,
            };
            if (data.user.studio_details) {
              (sanitizedUser as any).studio_details = data.user.studio_details;
              localStorage.setItem('artsy_client_profile', JSON.stringify(data.user.studio_details));
            }
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitizedUser));
            window.dispatchEvent(new Event('artsy_profile_updated'));
          } catch {}
        }
      } catch (err) {
        // Network error / connection blip -> DO NOT clear local session
        console.warn('[useAuth] Network blip fetching /api/user/me - preserving local session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    refreshProfile();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        if (!e.newValue) {
          try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
        }
        syncUser();
      }
    };

    const handleLocalAuthChange = () => {
      syncUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('artsy_auth_change', handleLocalAuthChange);

    return () => {
      isMounted = false;
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
  return Boolean(u?.agreement_signed_at || u?.agreement_accepted);
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