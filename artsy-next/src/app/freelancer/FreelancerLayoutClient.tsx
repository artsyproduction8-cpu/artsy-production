'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, setCurrentUser, PRESET_USERS } from '@/lib/auth';

export default function FreelancerLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
              agreement_accepted: data.user.agreement_accepted !== undefined ? data.user.agreement_accepted : (user?.agreement_accepted !== false),
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

      // 3.2 State Machine Guard for Freelancers:
      // Only approved creators can access the Dashboard.
      // Missing/null status -> must be forced back to /freelancer/onboarding.
      // Pending review -> must be routed to /freelancer/pending-approval.
      if (user.role === 'freelancer') {
        if (user.onboarding_status === 'approved') {
          setAuthorized(true);
          return;
        }
        if (user.onboarding_status === 'pending' || user.onboarding_status === 'pending_review') {
          router.push('/freelancer/pending-approval');
          return;
        }
        if (user.onboarding_status === 'rejected') {
          router.push('/freelancer/rejected');
          return;
        }
        router.push('/freelancer/onboarding');
        return;
      }

      setAuthorized(true);
    }

    checkAuth();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
