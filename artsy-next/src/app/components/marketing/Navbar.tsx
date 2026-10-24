'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleHomePath } from '@/lib/auth';
import { DEFAULT_PRICING_MATRIX } from '@/lib/pricing/catalog-matrix';

interface NavbarProps {
  onSearch?: (term: string) => void;
  searchTerm?: string;
}

interface SearchEntry {
  id: string;
  title: string;
  category: string;
  href: string;
  keywords: string[];
}

const CATALOG_SERVICE_ENTRIES: SearchEntry[] = DEFAULT_PRICING_MATRIX.flatMap((cat) =>
  cat.products
    .filter((prod) => prod.active)
    .map((prod) => ({
      id: `svc-${cat.id}-${prod.id}`,
      title: `${prod.name} (₹${prod.basePrice.toLocaleString('en-IN')})`,
      category: `${cat.title} Services`,
      href: `/book?category=${cat.id}&sub=${prod.id}`,
      keywords: [
        prod.name.toLowerCase(),
        cat.title.toLowerCase(),
        cat.id.toLowerCase(),
        prod.duration.toLowerCase(),
        ...(prod.deliverables || []).map((d) => d.toLowerCase()),
        'cinematic',
        'editing',
        'video',
      ],
    }))
);

const STATIC_NAVIGATION_ENTRIES: SearchEntry[] = [
  {
    id: 'nav-services',
    title: 'All Post-Production Services',
    category: 'Catalog Overview',
    href: '/services',
    keywords: ['services', 'packages', 'pricing', 'overview', 'rates', 'video'],
  },
  {
    id: 'nav-wedding',
    title: 'Wedding Cinema Packages (From ₹2,000)',
    category: 'Wedding Services',
    href: '/services/wedding',
    keywords: ['wedding', 'film', 'marriage', 'cinematic', 'teaser', 'highlight', 'story'],
  },
  {
    id: 'nav-brand',
    title: 'Brand & Commercial Video (From ₹1,500)',
    category: 'Brand Services',
    href: '/services/brand',
    keywords: ['brand', 'commercial', 'product', 'fashion', 'ugc', 'social', 'ad'],
  },
  {
    id: 'nav-corporate',
    title: 'Corporate & Event Films (From ₹1,500)',
    category: 'Corporate Services',
    href: '/services/corporate',
    keywords: ['corporate', 'keynote', 'event', 'presentation', 'interview', 'summit'],
  },
  {
    id: 'nav-personal',
    title: 'Personal & Lifestyle Films (From ₹1,000)',
    category: 'Personal Services',
    href: '/services/personal',
    keywords: ['personal', 'travel', 'birthday', 'anniversary', 'baby shower', 'lifestyle'],
  },
  {
    id: 'creators-dir',
    title: 'Verified Editors & Colorists',
    category: 'Creators',
    href: '/creators',
    keywords: ['creator', 'editor', 'freelancer', 'talent', 'hire', 'portfolio'],
  },
  {
    id: 'port-work',
    title: 'Official Video Showcase & Lightbox',
    category: 'Portfolio',
    href: '/work',
    keywords: ['portfolio', 'work', 'sample', 'showcase', 'video', 'watch', 'cinematic'],
  },
  {
    id: 'portal-dash',
    title: 'Client Dashboard',
    category: 'Client Portal',
    href: '/client',
    keywords: ['client', 'dashboard', 'portal', 'orders', 'active'],
  },
  {
    id: 'portal-masters',
    title: 'Final Downloads & Masters',
    category: 'Client Portal',
    href: '/client/masters',
    keywords: ['master', 'final', 'download', '4k', 'export'],
  },
  {
    id: 'portal-invoices',
    title: 'Invoices',
    category: 'Client Portal',
    href: '/client/invoices',
    keywords: ['invoice', 'receipt', 'tax', 'gst', 'bill', 'payment'],
  },
  {
    id: 'portal-files',
    title: 'Files Storage',
    category: 'Client Portal',
    href: '/client/files',
    keywords: ['files', 'footage', 'storage', 'raw', 'b2', 'drive'],
  },
  {
    id: 'portal-profile',
    title: 'Profile & Workspace',
    category: 'Client Portal',
    href: '/client/profile',
    keywords: ['profile', 'studio', 'logo', 'otp', 'whatsapp', 'email'],
  },
  {
    id: 'portal-support',
    title: 'Help & Support',
    category: 'Client Portal',
    href: '/client/support',
    keywords: ['help', 'support', 'contact', 'faq'],
  },
  {
    id: 'faq-sla',
    title: 'SLA Guarantees & FAQs',
    category: 'FAQ',
    href: '/#faq-section',
    keywords: ['faq', 'question', 'sla', 'turnaround', 'refund', 'policy'],
  },
];

const SEARCH_DIRECTORY: SearchEntry[] = [
  ...CATALOG_SERVICE_ENTRIES,
  ...STATIC_NAVIGATION_ENTRIES,
];

const CLIENT_PAGES = [
  { label: 'Dashboard', href: '/client' },
  { label: 'My Projects', href: '/client/projects' },
  { label: 'Review', href: '/client/review' },
  { label: 'Final Downloads', href: '/client/masters' },
  { label: 'Invoices', href: '/client/invoices' },
  { label: 'Files', href: '/client/files' },
  { label: 'Profile', href: '/client/profile' },
  { label: 'Help & Support', href: '/client/support' },
];

const CREATOR_PAGES = [
  { label: 'Active Projects', href: '/freelancer' },
  { label: 'Portfolio', href: '/freelancer/portfolio' },
  { label: 'Earnings', href: '/freelancer/payouts' },
  { label: 'Profile', href: '/freelancer/profile' },
  { label: 'Agreement & NDA', href: '/freelancer/agreement' },
];

const ADMIN_PAGES = [
  { label: 'Admin Dashboard', href: '/admin' },
  { label: 'Clients & Projects', href: '/admin/clients' },
  { label: 'Creator Network', href: '/admin/freelancers' },
  { label: 'Creator Requests', href: '/admin/creator-requests' },
  { label: 'Submissions Queue', href: '/admin/submissions' },
  { label: 'Official Portfolio', href: '/admin/portfolio' },
  { label: 'Payments & Payouts', href: '/admin/payments' },
  { label: 'Pricing & Plans', href: '/admin/pricing' },
  { label: 'User Accounts', href: '/admin/users' },
  { label: 'Audit Logs', href: '/admin/audit-log' },
];

export default function Navbar({ onSearch, searchTerm = '' }: NavbarProps) {
  const router = useRouter();
  const { user, role, isAuthenticated, loading, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(searchTerm);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Sync avatar url
  useEffect(() => {
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
      } catch {}
    }
    setAvatarUrl('');
  }, [user]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter search directory
  const filteredResults = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_DIRECTORY.filter((item) => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const catMatch = item.category.toLowerCase().includes(q);
      const kwMatch = item.keywords.some((k) => k.toLowerCase().includes(q));
      return titleMatch || catMatch || kwMatch;
    });
  }, [searchVal]);

  const handleSelectResult = (entry: SearchEntry) => {
    setIsSearchOpen(false);
    setSearchVal('');
    if (onSearch) onSearch(entry.title);

    if (entry.href.startsWith('/#')) {
      const targetId = entry.href.replace('/#', '');
      if (window.location.pathname === '/') {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(entry.href);
      }
    } else {
      router.push(entry.href);
    }
  };

  const executeSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setIsSearchOpen(false);
    if (onSearch) onSearch(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch(searchVal);
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

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Studio Admin' : role === 'freelancer' ? 'Creator' : 'Client';
  const roleHome = role ? getRoleHomePath(role) : '/client';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="h-[60px] sm:h-16 max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between relative">
        
        {/* Top-Left Brand Logo -> Direct link to Landing Page */}
        <Link
          href="/"
          className="flex flex-col items-center justify-center leading-none select-none group text-left cursor-pointer"
          title="Artsy — Place for Perspective"
        >
          <span className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white leading-none group-hover:text-blue-400 transition-colors">
            ARTSY
          </span>
          <span className="hidden md:block font-mono text-[10px] sm:text-xs font-semibold tracking-[1.2px] uppercase text-[#DCDFE3]/80 mt-1 leading-none text-center whitespace-nowrap">
            PLACE FOR PERSPECTIVE
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8">
          <Link
            href="/services"
            className="text-xs font-semibold text-white hover:text-[#3B82F6] transition-colors uppercase tracking-wider py-1"
          >
            SERVICES
          </Link>
          <Link
            href="/work"
            className="text-xs font-semibold text-white hover:text-[#3B82F6] transition-colors uppercase tracking-wider py-1"
          >
            PORTFOLIO
          </Link>
          <Link
            href="/creators"
            className="text-xs font-semibold text-white hover:text-[#3B82F6] transition-colors uppercase tracking-wider py-1"
          >
            CREATORS
          </Link>
        </nav>

        {/* Right Action Group */}
        <div className="flex items-center gap-4">
          
          {/* Reworked Search Button: Icon Symbol with Small Expanding Input Toggle */}
          <div className="relative flex items-center" ref={searchContainerRef}>
            {isSearchOpen ? (
              <div className="flex items-center bg-[#18181B] border border-white/20 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400/30 rounded-full h-8 px-2.5 transition-all duration-200 w-40 sm:w-52 shadow-lg animate-fade-in">
                <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search..."
                  className="w-full bg-transparent border-0 p-0 pl-2 text-xs text-white placeholder-white/40 focus:ring-0 focus:outline-none"
                />
                {searchVal && (
                  <button
                    type="button"
                    onClick={() => setSearchVal('')}
                    className="text-white/40 hover:text-white text-[10px] px-1"
                    title="Clear"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchVal('');
                  }}
                  className="text-white/40 hover:text-white text-xs px-1 hover:bg-white/10 rounded-full ml-0.5"
                  title="Close search"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label="Search"
                title="Search"
                onClick={() => setIsSearchOpen(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}

            {/* Small live matching suggestions dropdown under the input */}
            {isSearchOpen && searchVal.trim() && (
              <div className="absolute top-10 right-0 w-64 sm:w-72 bg-[#18181B] border border-white/15 rounded-xl shadow-2xl p-2 z-50 text-white animate-fade-in">
                <div className="flex items-center justify-between text-[9px] font-bold font-mono text-white/50 px-2 py-1 uppercase tracking-wider">
                  <span>Suggestions</span>
                  <button
                    type="button"
                    onClick={() => executeSearch(searchVal)}
                    className="text-blue-400 hover:text-blue-300 normal-case font-sans text-xs underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {filteredResults.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-[#86868B]">Press Enter to search entire database</div>
                  ) : (
                    filteredResults.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectResult(item)}
                        className="w-full text-left p-1.5 px-2 rounded-lg hover:bg-white/10 text-xs transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="truncate pr-2">
                          <div className="font-semibold text-white truncate text-xs">{item.title}</div>
                          <div className="text-[10px] text-[#86868B] truncate">{item.category}</div>
                        </div>
                        <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => executeSearch(searchVal)}
                  className="w-full mt-1.5 pt-1.5 border-t border-white/10 text-center text-xs text-blue-400 hover:text-blue-300 font-medium py-1 rounded hover:bg-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search all for &quot;{searchVal.trim()}&quot; →
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 pr-1">
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse border border-white/10" />
            </div>
          ) : !isAuthenticated || !user ? (
            <>
              {/* FIND JOB Secondary Link */}
              <Link
                href="/auth/login?intent=freelancer&redirect=/freelancer/onboarding"
                className="hidden sm:inline-flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white px-2 py-1 transition-colors whitespace-nowrap"
              >
                FIND JOB
              </Link>

              {/* LOGIN Secondary Link: Hidden on mobile to prevent cramping */}
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white px-2.5 py-1 transition-colors whitespace-nowrap"
              >
                LOGIN
              </Link>

              {/* BOOK NOW Primary CTA Button with adequate mobile touch padding */}
              <Link
                href="/book"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#3B82F6] hover:bg-[#2563EB] shadow-sm transition-all whitespace-nowrap"
              >
                BOOK NOW
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4 sm:gap-2">
              <Link
                href="/book"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white bg-[#3B82F6] hover:bg-[#2563EB] shadow-sm transition-all whitespace-nowrap"
              >
                BOOK NOW
              </Link>
              <div className="relative flex items-center gap-2" ref={userMenuRef}>
              {/* User Avatar & Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer select-none"
                title={`${user?.full_name} (${roleLabel})`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User Logo"
                    className="w-8 h-8 rounded-full object-cover border border-white/20 bg-white shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {getInitials(user?.full_name)}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-medium text-white max-w-[100px] truncate">
                  {user?.full_name?.split(' ')[0]}
                </span>
              </button>

              {/* User Menu Dropdown: Compact Client Pages Menu on Top Right User Logo */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 sm:w-60 bg-[#18181B] border border-white/15 rounded-xl p-2 shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Info Header */}
                  <div className="px-3 py-2 border-b border-white/10 mb-1.5">
                    <div className="text-xs font-bold text-white truncate">{user?.full_name}</div>
                    <div className="text-[10px] text-white/60 font-mono mt-0.5 truncate">{roleLabel} • {user?.email}</div>
                  </div>

                  {/* Role-Specific Portal Pages Header */}
                  <div className="px-2.5 py-1 flex items-center justify-between">
                    <span className="text-[9px] font-bold font-mono text-white/50 uppercase tracking-wider">
                      {role === 'admin' || role === 'super_admin' ? 'Admin Control' : role === 'freelancer' ? 'Creator Studio' : 'Client Portal'}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                        role === 'admin' || role === 'super_admin'
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : role === 'freelancer'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {role === 'admin' || role === 'super_admin' ? 'Admin' : role === 'freelancer' ? 'Creator' : 'Client'}
                    </span>
                  </div>

                  {/* Role-Specific Pages Links */}
                  <div className="space-y-0.5 mt-0.5 max-h-60 overflow-y-auto">
                    {(role === 'admin' || role === 'super_admin'
                      ? ADMIN_PAGES
                      : role === 'freelancer'
                      ? CREATOR_PAGES
                      : CLIENT_PAGES
                    ).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#E4E4E7] hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Start New Project Link */}
                  {role === 'client' && (
                    <>
                      <div className="border-t border-white/10 my-1.5"></div>
                      <Link
                        href="/book"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <span>Start New Project</span>
                        <span className="text-[10px] font-semibold">+ New</span>
                      </Link>
                    </>
                  )}

                  <div className="border-t border-white/10 my-1.5"></div>

                  {/* Sign Out */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
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
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            aria-label="Toggle mobile menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-white/10 px-6 py-4 space-y-4">
          {/* Mobile Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchVal.trim();
              if (q) {
                setIsMobileMenuOpen(false);
                router.push(`/search?q=${encodeURIComponent(q)}`);
              }
            }}
            className="flex items-center bg-[#18181B] border border-white/20 rounded-lg px-3 py-2"
          >
            <svg className="w-4 h-4 text-white/50 shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search services, creators, styles..."
              className="bg-transparent border-none text-xs text-white placeholder-white/40 focus:outline-none w-full"
            />
            <button
              type="submit"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 ml-2 shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          <Link
            href="/book"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-semibold text-white hover:text-blue-400"
          >
            BOOK NOW
          </Link>
          <Link
            href="/creators"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-semibold text-white hover:text-blue-400"
          >
            CREATORS
          </Link>
          <Link
            href="/services"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-semibold text-white hover:text-blue-400"
          >
            SERVICES
          </Link>
          <Link
            href="/work"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm font-semibold text-white hover:text-blue-400"
          >
            PORTFOLIO
          </Link>
        </div>
      )}
    </header>
  );
}