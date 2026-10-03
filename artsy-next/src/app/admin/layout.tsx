'use client';

import { usePathname } from 'next/navigation';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public login page does not render admin shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <AdminHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <AdminSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
