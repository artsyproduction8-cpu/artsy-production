'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, logout } from '@/lib/auth';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const adminName = user?.full_name || 'Studio Director';

  interface NavItem {
    label: string;
    href: string;
    exact?: boolean;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  const navItems: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin', exact: true },
        { label: 'Server Costs', href: '/admin/infra-costs' },
      ],
    },
    {
      group: 'People & Network',
      items: [
        { label: 'Clients', href: '/admin/clients' },
        { label: 'Creators', href: '/admin/freelancers' },
        { label: 'Creator Requests', href: '/admin/creator-requests' },
        { label: 'Submissions', href: '/admin/submissions' },
        { label: 'Portfolio', href: '/admin/portfolio' },
        { label: 'Vetting', href: '/admin/vetting' },
        { label: 'Users & Roles', href: '/admin/users' },
      ],
    },
    {
      group: 'Finances',
      items: [
        { label: 'Payments', href: '/admin/payments' },
        { label: 'Payouts', href: '/admin/payouts' },
        { label: 'Refunds', href: '/admin/refunds' },
        { label: 'Disputes', href: '/admin/disputes' },
      ],
    },
    {
      group: 'Settings & Logs',
      items: [
        { label: 'Notifications', href: '/admin/notifications' },
        { label: 'Audit Log', href: '/admin/audit-log' },
        { label: 'Pricing & Plans', href: '/admin/pricing' },
        { label: 'Catalog', href: '/admin/catalog' },
        { label: 'Vault Storage', href: '/admin/vault' },
        { label: 'System Health', href: '/admin/telemetry' },
      ],
    },
  ];

  const flatNavItems = navItems.flatMap((g) => g.items);

  return (
    <>
      <aside className="hidden lg:flex w-72 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-[#E5E5E7] z-40 p-6 flex-col justify-between shadow-xs">
        <div className="space-y-6">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F]">{adminName}</div>
            <span className="inline-block mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Verified Admin
            </span>
          </div>

          <nav className="flex flex-col space-y-4">
            {navItems.map((group) => (
              <div key={group.group} className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1A6] px-3 pb-0.5">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#3B82F6]/10 text-[#3B82F6]'
                          : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#F5F5F7]">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full text-center py-2.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Horizontal Navigation Bar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-30 bg-white border-b border-[#E5E5E7] px-4 py-2.5 overflow-x-auto flex items-center gap-2 no-scrollbar shadow-2xs">
        {flatNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');

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
