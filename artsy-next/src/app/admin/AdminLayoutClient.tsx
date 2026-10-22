'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, setCurrentUser, logout, PRESET_USERS } from '@/lib/auth';
import { isSuperAdminAccount } from '@/lib/auth-utils';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. Authoritative check: Check server-side HTTP-only session cookie
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            const role = data.user.role;
            if (role === 'admin' || role === 'super_admin' || isSuperAdminAccount(data.user)) {
              if (isMounted) {
                setCurrentUser(data.user);
                setAuthorized(true);
              }
              return;
            } else {
              // Authenticated but unauthorized role for admin portal
              if (isMounted) {
                router.push('/admin/login?unauthorized=true');
              }
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[AdminLayoutClient] Server session check warning:', err);
      }

      // 2. Client-side fallback check (e.g. if user is stored locally and needs session sync)
      let user = getCurrentUser();
      if (user && isSuperAdminAccount(user)) {
        user.role = 'super_admin';
      }

      if (user && (user.role === 'super_admin' || user.role === 'admin')) {
        try {
          const syncRes = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
            body: JSON.stringify({ user }),
            credentials: 'include',
          });

          if (syncRes.ok) {
            const syncData = await syncRes.json().catch(() => ({}));
            if (syncData.user) {
              if (isMounted) {
                setCurrentUser(syncData.user);
                setAuthorized(true);
              }
              return;
            }
          }
        } catch (syncErr) {
          console.warn('[AdminLayoutClient] Session sync warning:', syncErr);
        }
      }

      // 3. Local dev preview fallback (strictly excluded from production builds)
      if (
        process.env.NODE_ENV !== 'production' &&
        !user &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        const fallback = PRESET_USERS.super_admin;
        try {
          const fbRes = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: fallback }),
            credentials: 'include',
          });
          if (fbRes.ok) {
            if (isMounted) {
              setCurrentUser(fallback);
              setAuthorized(true);
            }
            return;
          }
        } catch {
          // Dev fallback failed
        }
      }

      // 4. Not authorized: redirect to login without destroying cookies or other user sessions
      if (isMounted) {
        router.push('/admin/login');
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] overflow-x-hidden">
      <AdminHeader />
      <div className="flex pt-16 min-h-screen w-full max-w-full overflow-x-hidden">
        <AdminSidebar />
        <main className="flex-1 lg:pl-72 min-h-[calc(100vh-4rem)] w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="w-full max-w-[1680px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
