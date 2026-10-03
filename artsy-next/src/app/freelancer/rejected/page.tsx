'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, ArtsyUser } from '@/lib/auth';

export default function FreelancerRejectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<ArtsyUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [daysRemaining, setDaysRemaining] = useState<number>(30);

  useEffect(() => {
    const activeUser = getCurrentUser();

    // Access Control:
    // 1. Redirect to /auth/login if not authenticated
    if (!activeUser) {
      router.replace('/auth/login?redirect=/freelancer/rejected');
      return;
    }

    // 2. Redirect to /freelancer if onboarding_status='approved'
    if (activeUser.onboarding_status === 'approved') {
      router.replace('/freelancer');
      return;
    }

    // 3. Redirect to /freelancer/pending-approval if onboarding_status='pending'
    if (activeUser.onboarding_status === 'pending' || activeUser.onboarding_status === 'pending_review') {
      router.replace('/freelancer/pending-approval');
      return;
    }

    // 4. Must be role='freelancer' (or admin reviewing page)
    if (activeUser.role !== 'freelancer' && activeUser.role !== 'admin') {
      router.replace('/client');
      return;
    }

    setUser(activeUser);

    // Calculate days remaining from user.rejected_at timestamp (30-day cooldown)
    const rejectionTimestamp = activeUser.rejected_at || activeUser.updated_at || new Date().toISOString();
    const rejectedTime = new Date(rejectionTimestamp).getTime();
    const now = Date.now();
    const msPassed = Math.max(0, now - rejectedTime);
    const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, 30 - daysPassed);
    setDaysRemaining(remaining);

    setIsCheckingAuth(false);
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center font-sans text-xs text-[#86868B]">
        Loading application status...
      </div>
    );
  }

  const feedbackText = user?.rejection_reason?.trim() || 'No specific feedback provided.';
  const canReapply = daysRemaining <= 0;

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-10 px-4 sm:px-6 font-sans text-[#1D1D1F] flex flex-col justify-center items-center">
      {/* Centered card, max-width 600px */}
      <div className="w-full max-w-[600px] bg-white border border-[#E5E5E7] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* 1. Header bar: ARTSY • + [Log out] */}
        <div className="px-6 sm:px-8 py-5 border-b border-[#E5E5E7] flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-[-0.04em] text-[#1D1D1F]">
              ARTSY
            </span>
          </Link>

          <button
            type="button"
            onClick={() => logout('/auth/login')}
            className="text-xs font-semibold text-[#86868B] hover:text-red-600 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            Log out
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Status Badge & 2. Heading */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Application Archived
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Application not approved
            </h1>

            {/* 3. Subtext */}
            <p className="text-sm text-[#86868B] leading-relaxed">
              Thank you for your interest in joining Artsy. After reviewing your portfolio, our curation team has decided not to move forward at this time.
            </p>
          </div>

          {/* 4. Feedback box (bordered) */}
          <div className="p-4 sm:p-5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-2">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#86868B]">
              FEEDBACK FROM CURATION TEAM
            </span>
            <p className="text-xs sm:text-sm text-[#1D1D1F] font-medium leading-relaxed italic">
              &ldquo;{feedbackText}&rdquo;
            </p>
          </div>

          {/* 5. Divider */}
          <hr className="border-t border-[#E5E5E7]" />

          {/* 6. Section: "What you can do next" */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F]">
              What you can do next
            </h2>

            <ul className="space-y-2.5 text-xs text-[#48484A]">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0 mt-1.5" />
                <span className="leading-snug">
                  Re-apply after 30 days with an updated portfolio and showreel
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0 mt-1.5" />
                <span className="leading-snug">
                  Book a service as a client — apply your creative skills to your own project
                </span>
              </li>
            </ul>
          </div>

          {/* 7. Re-apply button */}
          <div>
            {canReapply ? (
              <Link
                href="/freelancer/onboarding"
                className="w-full inline-flex items-center justify-center h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
              >
                Re-apply as Creator →
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="w-full h-11 rounded-xl bg-[#E5E5E7] text-[#86868B] text-xs font-bold uppercase tracking-wider cursor-not-allowed select-none"
              >
                Re-apply available in {daysRemaining} days
              </button>
            )}
          </div>

          {/* 8. Divider */}
          <hr className="border-t border-[#E5E5E7]" />

          {/* 9. Support link */}
          <div className="text-center pt-1">
            <Link
              href="mailto:creators@artsyproduction.in"
              className="text-xs font-semibold text-[#3B82F6] hover:underline inline-flex items-center gap-1"
            >
              Questions about this decision? Contact our creator team →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
