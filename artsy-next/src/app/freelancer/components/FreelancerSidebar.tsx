'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, logout } from '@/lib/auth';

export default function FreelancerSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const creatorName = user?.full_name || 'Aarav Sen';
  const creatorInitials =
    creatorName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AS';

  const navItems = [
    { label: 'Active Job Slate', href: '/freelancer' },
    { label: 'Project Workroom #8841', href: '/freelancer/work/AP-8841' },
    { label: 'Earnings Ledger & Payouts', href: '/freelancer/payouts' },
    { label: 'Software & Gear Profile', href: '/freelancer/profile' },
    { label: 'Master Agreement & NDA', href: '/freelancer/agreement' },
  ];

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex w-72 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-[#E5E5E7] z-40 p-6 flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F]">{creatorName}</div>
            <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Senior Cutter • Vetted
            </span>
          </div>

          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/freelancer'
                  ? pathname === '/freelancer'
                  : item.href.startsWith('/freelancer/work')
                  ? pathname.startsWith('/freelancer/work')
                  : pathname === item.href || pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 text-xs rounded-xl transition-colors ${
                    isActive
                      ? 'bg-[#3B82F6]/10 text-[#3B82F6] font-semibold'
                      : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] font-medium'
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
          <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs select-none shrink-0">
            {creatorInitials}
          </div>
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
            item.href === '/freelancer'
              ? pathname === '/freelancer'
              : item.href.startsWith('/freelancer/work')
              ? pathname.startsWith('/freelancer/work')
              : pathname === item.href || pathname.startsWith(item.href);

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
