'use client';

import Link from 'next/link';
import { useAuth, logout } from '@/lib/auth';

export default function FreelancerHeader() {
  const { user } = useAuth();
  const creatorName = user?.full_name || 'Aarav Sen';
  const creatorInitials =
    creatorName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AS';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0A] border-b border-[#262626]">
      <div className="h-16 w-full px-6 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/freelancer" className="flex flex-col select-none group">
            <span className="font-extrabold text-[15px] leading-tight tracking-[0.18em] text-white group-hover:text-blue-400 transition-colors uppercase">
              ARTSY
            </span>
            <span className="font-mono text-[7.5px] leading-none tracking-[0.24em] text-[#86868B] uppercase">
              PLACE FOR PERSPECTIVE
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => logout()}
            className="text-xs font-semibold uppercase px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
          <div className="pl-2 border-l border-white/10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs select-none">
              {creatorInitials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
