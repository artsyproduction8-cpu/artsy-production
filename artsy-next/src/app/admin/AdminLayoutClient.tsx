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
    // 0. Nuke browser cache / local storage if v2 migration flag is not present
    if (typeof window !== 'undefined' && !localStorage.getItem('artsy_admin_v2')) {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('artsy_')) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
        localStorage.setItem('artsy_admin_v2', 'true');
      } catch (e) {
        console.warn('[AdminLayoutClient] Local storage cleanup warning:', e);
      }
      window.location.reload();
      return;
    }

    async function checkAuth() {
      let user = getCurrentUser();

      // Normalize super admin role
      if (user && isSuperAdminAccount(user)) {
        user.role = 'super_admin';
      }

      // 1. If client already has a super_admin or admin in localStorage/sessionStorage,
      // sync the session cookie with the server
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

          if (!syncRes.ok) {
            console.warn('[AdminLayoutClient] Session sync rejected by server:', syncRes.status);
            logout();
            localStorage.removeItem('artsy_auth_user');
            router.push('/admin/login?error=sync_failed');
            return;
          }

          const syncData = await syncRes.json().catch(() => ({}));
          if (syncData.user) {
            setCurrentUser(syncData.user);
            user = syncData.user;
          } else {
            console.warn('[AdminLayoutClient] Session sync succeeded but no user data returned');
            logout();
            localStorage.removeItem('artsy_auth_user');
            router.push('/admin/login?error=no_user_data');
            return;
          }
        } catch (syncErr) {
          console.error('[AdminLayoutClient] Failed to sync session cookie:', syncErr);
          logout();
          localStorage.removeItem('artsy_auth_user');
          router.push('/admin/login?error=network_error');
          return;
        }
      }

      // 2. If no user in local storage, check if active HTTP-only session cookie already exists on server
      if (!user) {
        try {
          const res = await fetch('/api/auth/session', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
          });
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

      // 3. In local dev preview fallback (strictly excluded from production builds)
      if (
        process.env.NODE_ENV !== 'production' &&
        !user &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        const fallback = PRESET_USERS.super_admin;
        setCurrentUser(fallback);
        user = fallback;
        try {
          const fbRes = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: fallback }),
            credentials: 'include',
          });
          if (!fbRes.ok) {
            logout();
            localStorage.removeItem('artsy_auth_user');
            router.push('/admin/login');
            return;
          }
        } catch {
          logout();
          localStorage.removeItem('artsy_auth_user');
          router.push('/admin/login');
          return;
        }
      }

      // 4. If no authenticated user, redirect to login
      if (!user) {
        logout();
        localStorage.removeItem('artsy_auth_user');
        router.push('/admin/login');
        return;
      }

      // 5. If unauthorized role, reject and redirect
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        logout();
        localStorage.removeItem('artsy_auth_user');
        router.push('/admin/login?unauthorized=true');
        return;
      }

      // 6. Authorized: render children only after server session cookie is confirmed
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
    <div className="min-h-screen bg-[#F5F5F7]">
      <AdminHeader />
      <div className="flex pt-16">
        <AdminSidebar />
        <main className="flex-1 lg:pl-72 min-h-[calc(100vh-4rem)] p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
