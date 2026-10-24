'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, setCurrentUser, PRESET_USERS } from '@/lib/auth';

export default function FreelancerLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      let user = getCurrentUser();

      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            const u = {
              ...user,
              ...data.user,
              id: data.user.id || user?.id,
              email: data.user.email || user?.email,
              phone: data.user.phone || user?.phone,
              full_name: data.user.full_name || user?.full_name || 'Creator Partner',
              display_name: data.user.display_name || user?.display_name,
              avatar_url: data.user.avatar_url || user?.avatar_url,
              studio_details: data.user.studio_details || user?.studio_details,
              creator_profile: data.user.creator_profile || user?.creator_profile,
              role: data.user.role || user?.role || 'freelancer',
              status: data.user.status || user?.status || 'active',
              onboarding_status: data.user.onboarding_status !== undefined ? data.user.onboarding_status : (user?.onboarding_status ?? null),
              agreement_signed_at: data.user.agreement_signed_at || user?.agreement_signed_at || null,
              agreement_accepted: Boolean(data.user.agreement_signed_at || data.user.agreement_accepted || user?.agreement_signed_at || user?.agreement_accepted),
              onboarded: data.user.onboarded !== undefined ? data.user.onboarded : (user?.onboarded !== false),
            };
            setCurrentUser(u);
            user = u;
          }
        }
      } catch {
        // ignore
      }

      // In local dev mode without an active user, only set fallback if no cookie/user
      const isLocalhost = process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (!user && isLocalhost) {
        const fallback = PRESET_USERS.freelancer;
        setCurrentUser(fallback);
        user = fallback;
      }

      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (user.role === 'client') {
        router.push('/client');
        return;
      }

      if (user.role !== 'freelancer' && user.role !== 'admin' && user.role !== 'super_admin') {
        router.push('/auth/login');
        return;
      }

      // Admins and Super Admins have unrestricted access across workstation
      if (user.role === 'admin' || user.role === 'super_admin') {
        setAuthorized(true);
        return;
      }

      // State Machine Guard for Freelancers:
      const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
      const status = user.onboarding_status;
      const isOnboardingPage = currentPath.startsWith('/freelancer/onboarding');
      const isPendingPage = currentPath.startsWith('/freelancer/pending-approval');
      const isRejectedPage = currentPath.startsWith('/freelancer/rejected');
      const isContractPage = currentPath.startsWith('/freelancer/contract');
      const isAgreementPage = currentPath.startsWith('/freelancer/agreement');

      const hasSignedAgreement = Boolean(
        user.agreement_signed_at ||
        user.agreement_accepted ||
        (user.creator_profile && (user.creator_profile.agreement_signed_at || user.creator_profile.agreement_accepted_at))
      );

      // Phase 4: Contract route redirects: to onboarding if unsigned, or to dashboard if signed
      if (isContractPage) {
        if (!hasSignedAgreement) {
          router.push('/freelancer/onboarding');
          return;
        } else {
          router.push('/freelancer');
          return;
        }
      }

      if (isAgreementPage && !hasSignedAgreement) {
        router.push('/freelancer/onboarding');
        return;
      }

      // Rule 1: If user with onboarding_status === null (or not onboarded) accesses /freelancer/onboarding, they MUST be allowed
      // If they try to access /freelancer/pending-approval or /freelancer, forcefully redirect back to /freelancer/onboarding
      if (!user.onboarded || status === null || status === undefined) {
        if (isOnboardingPage) {
          setAuthorized(true);
          return;
        }
        router.push('/freelancer/onboarding');
        return;
      }

      // Rule 2: If onboarding_status === 'pending' or 'pending_review'
      if (status === 'pending' || status === 'pending_review') {
        if (isPendingPage) {
          setAuthorized(true);
          return;
        }
        router.push('/freelancer/pending-approval');
        return;
      }

      // Rule 3: If onboarding_status === 'rejected'
      if (status === 'rejected') {
        if (isRejectedPage) {
          setAuthorized(true);
          return;
        }
        router.push('/freelancer/rejected');
        return;
      }

      // Rule 4: If onboarding_status === 'approved'
      if (status === 'approved') {
        if (isOnboardingPage || isPendingPage || isContractPage) {
          router.push('/freelancer');
          return;
        }
        // Permanently skip NDA step for approved creators with agreement_signed_at
        setAuthorized(true);
        return;
      }

      // Default safe fallback
      if (isOnboardingPage) {
        setAuthorized(true);
        return;
      }
      router.push('/freelancer/onboarding');
    }

    checkAuth();
  }, [router, pathname]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
