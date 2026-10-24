'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, hasAcceptedAgreement } from '@/lib/auth';

export default function FreelancerContractPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    const hasSigned = Boolean(
      user.agreement_signed_at ||
      user.agreement_accepted ||
      hasAcceptedAgreement(user)
    );

    if (hasSigned) {
      router.replace('/freelancer');
    } else {
      router.replace('/freelancer/onboarding');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
