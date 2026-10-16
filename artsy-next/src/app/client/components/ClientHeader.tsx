'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, logout } from '@/lib/auth';

export default function ClientHeader() {
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape
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

  const CLIENT_PAGES = [
    { label: 'Dashboard', href: '/client' },
    { label: 'My Projects', href: '/client/projects' },
    { label: 'Review Drafts', href: '/client/review' },
    { label: 'Final Downloads', href: '/client/masters' },
    { label: 'Invoices & Receipts', href: '/client/invoices' },
    { label: 'Files & Footage', href: '/client/files' },
    { label: 'Profile & Studio', href: '/client/profile' },
    { label: 'Help & Support', href: '/client/support' },
  ];

  const clientName = user?.full_name || 'Client';
  const clientInitials = clientName.trim()
    ? clientName
        .split(/\s+/)
        .filter((n) => n.length > 0)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'CL';

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
              CLIENT PORTAL
            </span>
          </Link>
        </div>

        {/* Right Section: Start Project & User Avatar with Dropdown */}
        <div className="flex items-center gap-3">
          <Link
            href="/book"
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
          >
            + Start New Project
          </Link>

          {/* User Avatar & Dropdown Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer select-none"
              title={`${clientName} (Client Profile)`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Client Logo"
                  className="w-8 h-8 rounded-full object-cover border border-white/20 bg-white shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {clientInitials}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-medium text-white max-w-[120px] truncate">
                {clientName.split(' ')[0]}
              </span>
            </button>

            {/* Compact Client Pages Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-60 bg-[#18181B] border border-white/15 rounded-xl p-2 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Profile Info Header */}
                <div className="px-3 py-2 border-b border-white/10 mb-1.5">
                  <div className="text-xs font-bold text-white truncate">{clientName}</div>
                  <div className="text-[10px] text-white/60 font-mono mt-0.5 truncate">Client • {user?.email}</div>
                </div>

                {/* Client Pages Header */}
                <div className="px-2.5 py-1 flex items-center justify-between">
                  <span className="text-[9px] font-bold font-mono text-white/50 uppercase tracking-wider">Client Pages</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Portal</span>
                </div>

                {/* Client Pages Links */}
                <div className="space-y-0.5 mt-0.5 max-h-60 overflow-y-auto">
                  {CLIENT_PAGES.map((item) => (
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

                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <>
                    <div className="border-t border-white/10 my-1.5"></div>
                    <div className="px-2.5 py-1 text-[9px] font-bold font-mono text-white/50 uppercase tracking-wider">
                      Staff Switcher
                    </div>
                    <Link
                      href="/freelancer"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <span>Creator Studio</span>
                      <span className="text-[10px]">🎨</span>
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    >
                      <span>Admin Operations</span>
                      <span className="text-[10px]">⚙️</span>
                    </Link>
                  </>
                )}

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
