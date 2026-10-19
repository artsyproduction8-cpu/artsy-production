'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, setCurrentUser, PRESET_USERS } from '@/lib/auth';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      let user = getCurrentUser();

      if (!user) {
        try {
          const res = await fetch('/api/auth/session');
          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.user) {
              const u = {
                id: data.user.id || 'usr-superadmin-000',
                email: data.user.email || 'lilsammy96@gmail.com',
                phone: data.user.phone || '+91 77770 78742',
                full_name: data.user.full_name || 'Studio Owner (Super Admin)',
                role: data.user.role || 'super_admin',
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
      // In local dev fallback (strictly excluded from production builds)
      if (process.env.NODE_ENV !== 'production' && !user && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        const fallback = PRESET_USERS.super_admin;
        setCurrentUser(fallback);
        user = fallback;
      }

      if (!user) {
        router.push('/auth/login?redirect=/admin');
        return;
      }

      if (user.role !== 'admin' && user.role !== 'super_admin') {
        router.push('/auth/login?unauthorized=true');
        return;
      }

      // Sync active HTTP-only admin session cookie to ensure all subsequent admin API requests are authorized
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user }),
          credentials: 'include',
        });
      } catch {
        // Non-fatal background sync
      }

      setAuthorized(true);
    }

    checkAuth();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <AdminHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <AdminSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
