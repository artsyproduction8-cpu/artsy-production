'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, logout } from '@/lib/auth';

export default function ClientSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const clientName = user?.full_name || 'Sneha Patel';

  const clientInitials =
    clientName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'SP';

  const navItems = [
    { label: 'Dashboard Overview', href: '/client' },
    { label: 'My Projects', href: '/client/projects' },
    { label: 'Timestamped Review', href: '/client/review' },
    { label: 'Completed Masters', href: '/client/masters' },
    { label: 'Tax Invoices', href: '/client/invoices' },
    { label: 'My Files & Retention', href: '/client/files' },
    { label: 'Notifications', href: '/client/notifications' },
    { label: 'Support & Grievance', href: '/client/support' },
    { label: 'Profile Settings', href: '/client/profile' },
    { label: 'Workspace & Ingest Setup', href: '/client/studio' },
  ];

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex w-72 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-[#E5E5E7] z-40 p-6 flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F]">{clientName}</div>
            <span className="inline-block mt-1 text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded">
              Verified Producer
            </span>
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
          <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs select-none shrink-0">
            {clientInitials}
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
