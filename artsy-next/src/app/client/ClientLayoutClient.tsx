'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, setCurrentUser, PRESET_USERS } from '@/lib/auth';

export default function ClientLayoutClient({ children }: { children: React.ReactNode }) {
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
              full_name: data.user.full_name || user?.full_name || 'Client Partner',
              display_name: data.user.display_name || user?.display_name,
              avatar_url: data.user.avatar_url || user?.avatar_url,
              studio_details: data.user.studio_details || user?.studio_details,
              role: data.user.role || user?.role || 'client',
              status: data.user.status || user?.status || 'active',
              onboarded: data.user.onboarded !== undefined ? Boolean(data.user.onboarded) : (user?.onboarded ?? false),
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
        user = PRESET_USERS.client;
        setCurrentUser(user);
      }

      if (!user) {
        router.push('/auth/login');
        return;
      }

      if (user.role === 'freelancer') {
        router.push('/freelancer');
        return;
      }

      if (user.role !== 'client' && user.role !== 'admin' && user.role !== 'super_admin') {
        router.push('/auth/login');
        return;
      }

      // 4.1 Client Workflow State Machine Guard:
      // If client has not completed onboarding, block direct URL access to Dashboard/Files
      // and redirect to the Setup Form (/client/profile?setup=true).
      if (user.role === 'client' && !user.onboarded) {
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        if (pathname !== '/client/profile' && pathname !== '/client/studio') {
          router.push('/client/profile?setup=true');
          return;
        }
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
