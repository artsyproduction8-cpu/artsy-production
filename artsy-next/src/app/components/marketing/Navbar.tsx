'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleHomePath } from '@/lib/auth';

interface NavbarProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
}

export default function Navbar({ onSearch, searchTerm = '' }: NavbarProps) {
  const router = useRouter();
  const { user, role, isAuthenticated, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(searchTerm);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
    if (e.key === 'Enter') {
      if (onSearch) {
        onSearch(searchVal);
      } else {
        const query = searchVal.trim().toLowerCase();
        setIsSearchOpen(false);
        if (query.includes('wedding') || query.includes('ugc') || query.includes('service') || query.includes('product') || query.includes('corporate') || query.includes('price')) {
          if (window.location.pathname !== '/') {
            router.push('/services');
          } else {
            const el = document.getElementById('services-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        } else if (query.includes('reel') || query.includes('work') || query.includes('portfolio') || query.includes('cut')) {
          if (window.location.pathname !== '/') {
            router.push('/#featured-reels');
          } else {
            const el = document.getElementById('featured-reels');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        } else if (query.includes('archive') || query.includes('case') || query.includes('benchmark') || query.includes('deliverable')) {
          if (window.location.pathname !== '/') {
            router.push('/#verified-production-archive');
          } else {
            const el = document.getElementById('verified-production-archive');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        } else if (query.includes('faq') || query.includes('question') || query.includes('refund') || query.includes('sla')) {
          if (window.location.pathname !== '/') {
            router.push('/#faq-section');
          } else {
            const el = document.getElementById('faq-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const roleLabel = role === 'admin' ? 'Studio Admin' : role === 'freelancer' ? 'Creator' : 'Client';
  const roleHome = role ? getRoleHomePath(role) : '/client/review';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="h-16 max-w-[1200px] mx-auto px-6 sm:px-8 flex items-center justify-between relative">
        
        {/* Full-width Search Overlay */}
        {isSearchOpen && (
          <div className="absolute inset-0 bg-[#0A0A0A] z-50 flex items-center px-6 sm:px-8 justify-between">
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-white/70 select-none">
                  search
                </span>
              </div>
              <input
                ref={searchInputRef}
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="SEARCH REELS, SERVICES, ARCHIVE SPECS..."
                type="text"
                className="w-full bg-transparent border-0 p-0 text-sm uppercase tracking-wider text-white placeholder-white/40 focus:ring-0 focus:outline-none"
              />
            </div>
            <button
              type="button"
              aria-label="Close search"
              onClick={() => setIsSearchOpen(false)}
              className="text-white/70 hover:text-white flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl leading-none">close</span>
              </div>
            </button>
          </div>
        )}

        {/* Brand Lockup */}
        <Link href="/" className="flex flex-col items-center justify-center leading-none select-none group">
          <span className="text-[20px] sm:text-[22px] font-extrabold uppercase tracking-[-0.03em] text-white leading-none group-hover:text-white/80 transition-colors">
            ARTSY
          </span>
          <span className="font-mono text-[7.5px] sm:text-[8px] font-semibold tracking-[1.6px] uppercase text-[#DCDFE3]/80 mt-1.5 leading-none text-center">
            PLACE FOR PERSPECTIVE
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/book"
            className="text-[12.5px] font-semibold text-white hover:text-[#3B82F6] transition-colors uppercase tracking-wider py-1"
          >
            BOOK NOW
          </Link>
          <Link
            href="/services"
            className="text-[12.5px] font-semibold text-white hover:text-[#3B82F6] transition-colors uppercase tracking-wider py-1"
          >
            SERVICES
          </Link>
          <Link
            href="/work"
            className="text-[12.5px] font-semibold text-white hover:text-[#3B82F6] transition-colors uppercase tracking-wider py-1"
          >
            WORK
          </Link>
        </nav>

        {/* Right Action Group */}
        <div className="flex items-center gap-3">
          
          {/* Search Toggle Button */}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px] leading-none text-white">search</span>
            </div>
          </button>

          {!isAuthenticated ? (
            <>
              {/* FIND JOB Button */}
              <Link
                href="/auth/login?intent=freelancer"
                className="hidden sm:inline-flex items-center justify-center min-w-[88px] h-8 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-transparent border border-white/30 hover:border-white hover:bg-white hover:text-[#0A0A0A] transition-all whitespace-nowrap"
              >
                FIND JOB
              </Link>

              {/* LOGIN / SIGNUP Button */}
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center min-w-[72px] h-8 px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-[#3B82F6] hover:bg-[#2563EB] shadow-sm transition-all whitespace-nowrap"
              >
                LOGIN
              </Link>
            </>
          ) : (
            <div className="relative flex items-center gap-2">
              {/* Direct Role Dashboard Link */}
              <Link
                href={roleHome}
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white bg-[#3B82F6] hover:bg-[#2563EB] shadow-sm transition-all"
              >
                {role === 'admin' ? 'ADMIN CONSOLE' : role === 'freelancer' ? 'CREATOR HUB' : 'CLIENT DASHBOARD'}
              </Link>

              {/* User Avatar & Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title={`${user?.full_name} (${roleLabel})`}
              >
                <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {getInitials(user?.full_name)}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-white max-w-[100px] truncate">
                  {user?.full_name?.split(' ')[0]}
                </span>
                <span className="material-symbols-outlined text-sm text-white/70">
                  arrow_drop_down
                </span>
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-[#1D1D1F] border border-white/15 rounded-xl p-2 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-white/10 mb-1">
                    <div className="text-xs font-bold text-white truncate">{user?.full_name}</div>
                    <div className="text-[10px] text-white/60 font-mono mt-0.5">{roleLabel} • {user?.email}</div>
                  </div>

                  <Link
                    href={roleHome}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors"
                  >
                    <span>Dashboard</span>
                    <span className="text-[10px] text-[#3B82F6] font-semibold">Open →</span>
                  </Link>

                  {role === 'client' && (
                    <Link
                      href="/book"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors"
                    >
                      <span>Book New Cut</span>
                    </Link>
                  )}

                  {role === 'freelancer' && (
                    <Link
                      href="/freelancer/onboarding"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-white/10 transition-colors"
                    >
                      <span>Update Portfolio</span>
                    </Link>
                  )}

                  <div className="border-t border-white/10 my-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="md:hidden p-1.5 text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <span className="material-symbols-outlined text-xl leading-none">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-white/15 px-6 py-5 flex flex-col gap-3 shadow-2xl">
          <Link
            href="/book"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-semibold uppercase tracking-wider text-white hover:text-[#3B82F6] py-1 transition-colors"
          >
            BOOK NOW
          </Link>
          <Link
            href="/services"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-semibold uppercase tracking-wider text-white hover:text-[#3B82F6] py-1 transition-colors"
          >
            SERVICES
          </Link>
          <Link
            href="/work"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sm font-semibold uppercase tracking-wider text-white hover:text-[#3B82F6] py-1 transition-colors"
          >
            WORK
          </Link>
          <div className="pt-3 border-t border-white/15 flex flex-col gap-2">
            {!isAuthenticated ? (
              <div className="flex gap-3">
                <Link
                  href="/auth/login?intent=freelancer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 border border-white/30 rounded-lg text-xs font-semibold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all"
                >
                  FIND JOB
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-[#3B82F6] text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#2563EB] transition-all"
                >
                  LOGIN
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between py-1 text-xs text-white/70">
                  <span>Logged in as <strong>{user?.full_name}</strong> ({roleLabel})</span>
                </div>
                <Link
                  href={roleHome}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-[#3B82F6] text-white rounded-lg text-xs font-semibold uppercase tracking-wider"
                >
                  Go to {roleLabel} Dashboard →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-center py-2 border border-red-500/40 text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}