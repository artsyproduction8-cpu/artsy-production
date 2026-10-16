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

      // In local dev mode, immediately fallback so there is zero spinner delay (excluded from production)
      const isLocalhost = process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (!user && isLocalhost) {
        user = PRESET_USERS.client;
        setCurrentUser(user);
      }

      if (!user) {
        try {
          const res = await fetch('/api/auth/session');
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user) {
              const u = {
                id: data.user.id || 'usr-client-001',
                email: data.user.email || 'client@artsyproduction.com',
                full_name: data.user.full_name || 'Client Partner',
                role: data.user.role || 'client',
                status: 'active' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              setCurrentUser(u);
              user = u;
            }
          }
        } catch {
          // ignore
        }
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
