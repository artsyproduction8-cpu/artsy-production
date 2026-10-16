'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientStudioRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/client/profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
