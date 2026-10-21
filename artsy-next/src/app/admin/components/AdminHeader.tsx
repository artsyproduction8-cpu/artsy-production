'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, logout } from '@/lib/auth';

const ADMIN_PAGES = [
  { label: 'Admin Dashboard', href: '/admin' },
  { label: 'Clients & Projects', href: '/admin/clients' },
  { label: 'Creator Network', href: '/admin/freelancers' },
  { label: 'Creator Requests', href: '/admin/creator-requests' },
  { label: 'Submissions Queue', href: '/admin/submissions' },
  { label: 'Payments & Payouts', href: '/admin/payments' },
  { label: 'Pricing & Plans', href: '/admin/pricing' },
  { label: 'User Accounts', href: '/admin/users' },
  { label: 'Audit Logs', href: '/admin/audit-log' },
];

export default function AdminHeader() {
  const { user, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const adminName = user?.full_name || 'Studio Admin';
  const adminInitials = adminName
    .split(/\s+/)
    .filter((n) => n.length > 0)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AD';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0A] border-b border-[#262626]">
      <div className="h-16 w-full px-6 md:px-8 flex items-center justify-between">
        {/* Left Brand Lockup -> Navigates to Landing Page */}
        <div className="flex items-center gap-6">
          <Link href="/" title="Go to Artsy Landing Page" className="flex flex-col select-none group">
            <span className="font-extrabold text-[15px] leading-tight tracking-[0.18em] text-white group-hover:text-blue-400 transition-colors uppercase">
              ARTSY
            </span>
            <span className="font-mono text-[8px] leading-none tracking-[0.24em] text-[#86868B] group-hover:text-white transition-colors uppercase">
              STUDIO ADMIN
            </span>
          </Link>
        </div>

        {/* Right Section: User Avatar with Dropdown */}
        <div className="flex items-center gap-3">
          <Link
            href="/services"
            className="hidden sm:inline-flex text-xs font-semibold uppercase px-3 py-1.5 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            Services Specs
          </Link>

          <div className="relative" ref={menuRef}>
            {loading || !user ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse border border-white/10" />
            ) : (
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer select-none"
                title={`${adminName} (Admin Control)`}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {adminInitials}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-white max-w-[120px] truncate">
                  {adminName.split(' ')[0]}
                </span>
              </button>
            )}

            {/* Compact Admin Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-60 bg-[#18181B] border border-white/15 rounded-xl p-2 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Info Header */}
                <div className="px-3 py-2 border-b border-white/10 mb-1.5">
                  <div className="text-xs font-bold text-white truncate">{adminName}</div>
                  <div className="text-[10px] text-white/60 font-mono mt-0.5 truncate">{user?.role === 'super_admin' ? 'Super Admin' : 'Admin'} • {user?.email || 'lilsammy96@gmail.com'}</div>
                </div>

                {/* Admin Pages Section */}
                <div className="px-2.5 py-1 flex items-center justify-between">
                  <span className="text-[9px] font-bold font-mono text-white/50 uppercase tracking-wider">Admin Pages</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Control</span>
                </div>

                {/* List of Pages */}
                <div className="space-y-0.5 mt-0.5 max-h-60 overflow-y-auto">
                  {ADMIN_PAGES.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#E4E4E7] hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="border-t border-white/10 my-1.5"></div>

                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span>Landing Page Home</span>
                  <span className="font-mono text-[9px] text-white/40">/</span>
                </Link>

                <div className="border-t border-white/10 my-1.5"></div>
                <div className="px-2.5 py-1 text-[9px] font-bold font-mono text-white/50 uppercase tracking-wider">
                  Inspect Portals
                </div>
                <Link
                  href="/client"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <span>Client Portal</span>
                  <span className="text-[10px]">🏢</span>
                </Link>
                <Link
                  href="/freelancer"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  <span>Creator Studio</span>
                  <span className="text-[10px]">🎨</span>
                </Link>

                <div className="border-t border-white/10 my-1.5"></div>

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Sign Out</span>
                  <span className="text-[10px] font-mono">⌘Q</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
