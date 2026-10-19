'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, logout } from '@/lib/auth';

export default function ClientSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const syncAvatar = () => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        const storedProfile = localStorage.getItem('artsy_client_profile');
        if (storedProfile) {
          const p = JSON.parse(storedProfile);
          if (p.logoUrl) {
            setAvatarUrl(p.logoUrl);
            return;
          }
        }
        const storedAuth = localStorage.getItem('artsy_auth_user');
        if (storedAuth) {
          const u = JSON.parse(storedAuth);
          if (u.avatar_url) {
            setAvatarUrl(u.avatar_url);
            return;
          }
        }
      } catch {}
    }
    setAvatarUrl('');
  };

  useEffect(() => {
    syncAvatar();

    const handleUpdate = () => syncAvatar();
    window.addEventListener('artsy_auth_change', handleUpdate);
    window.addEventListener('artsy_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('artsy_auth_change', handleUpdate);
      window.removeEventListener('artsy_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const clientName = user?.display_name || user?.full_name || 'Client';

  const clientInitials = clientName.trim()
    ? clientName
        .split(/\s+/)
        .filter((n) => n.length > 0)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'CL';

  const navItems = [
    { label: 'Dashboard', href: '/client' },
    { label: 'My Projects', href: '/client/projects' },
    { label: 'Review', href: '/client/review' },
    { label: 'Final Downloads', href: '/client/masters' },
    { label: 'Invoices', href: '/client/invoices' },
    { label: 'Files', href: '/client/files' },
    { label: 'Profile', href: '/client/profile' },
    { label: 'Help & Support', href: '/client/support' },
  ];

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex w-72 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-[#E5E5E7] z-40 p-6 flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F]">{clientName}</div>
            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Admin Preview
              </span>
            ) : (
              <span className="inline-block mt-1 text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded">
                Verified Client
              </span>
            )}
          </div>

          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/client'
                  ? pathname === '/client' || pathname === '/client-dashboard'
                  : pathname === item.href || (item.href !== '/client' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                      : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User & Sign Out */}
        <div className="pt-4 border-t border-[#E5E5E7] flex items-center gap-3">
          {avatarUrl || user?.avatar_url ? (
            <img
              src={avatarUrl || user?.avatar_url}
              alt="Profile Logo"
              className="w-8 h-8 rounded-full object-cover border border-[#E5E5E7] shrink-0 bg-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs select-none shrink-0">
              {clientInitials}
            </div>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="flex-1 text-center py-1.5 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Horizontal Navigation Bar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-white border-b border-[#E5E5E7] px-4 py-2.5 overflow-x-auto flex items-center gap-2 no-scrollbar shadow-2xs">
        {navItems.map((item) => {
          const isActive =
            item.href === '/client'
              ? pathname === '/client' || pathname === '/client-dashboard'
              : pathname === item.href || (item.href !== '/client' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#3B82F6]/10 text-[#3B82F6] font-semibold'
                  : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] font-medium'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
