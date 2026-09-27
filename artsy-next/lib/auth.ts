import { useState, useEffect } from 'react';

// Auth types
export type UserRole = 'client' | 'freelancer' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended' | 'banned';

export type OnboardingStatus =
  | 'registered'
  | 'incomplete'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'deactivated';

export interface ArtsyUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  agreement_accepted?: boolean;
  agreement_accepted_at?: string;
  agreement_version?: string;
  onboarding_status?: OnboardingStatus;
  created_at: string;
  updated_at: string;
}

// Preset standard test accounts for instant role demo & testing
export const PRESET_USERS: Record<UserRole, ArtsyUser> = {
  client: {
    id: 'usr-client-001',
    email: 'client@artsyprod.studio',
    full_name: 'Sneha Patel',
    phone: '+91 9876543210',
    role: 'client',
    status: 'active',
    avatar_url: '',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z'
  },
  freelancer: {
    id: 'usr-editor-002',
    email: 'editor@artsyprod.studio',
    full_name: 'Aarav Sen',
    phone: '+91 9876543211',
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
    email: 'admin@artsyprod.studio',
    full_name: 'Studio Director',
    phone: '+91 9876543212',
    role: 'admin',
    status: 'active',
    avatar_url: '',
    created_at: '2025-01-10T00:00:00.000Z',
    updated_at: '2025-01-10T00:00:00.000Z'
  }
};

export const getRoleHomePath = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'freelancer':
      return '/freelancer';
    case 'client':
    default:
      return '/client/review';
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
  } catch (e) {
    return null;
  }
};

// Set current user in localStorage and cookie, and dispatch reactive event
export const setCurrentUser = (user: ArtsyUser | null) => {
  if (typeof window === 'undefined') return;

  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    document.cookie = `artsy_auth_token=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    document.cookie = 'artsy_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // Notify active components in the current window
  window.dispatchEvent(new Event('artsy_auth_change'));
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
export const logout = (redirectTo: string = '/auth/login') => {
  setCurrentUser(null);
  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
};

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