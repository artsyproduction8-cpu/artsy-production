'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, ArtsyUser } from '@/lib/auth';

export default function FreelancerPendingApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<ArtsyUser | null>(null);
  const [trackingId, setTrackingId] = useState<string>('ART-2026-VET-4115');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const activeUser = getCurrentUser();

    // Access Control:
    // 1. Redirect to /auth/login if not authenticated
    if (!activeUser) {
      router.replace('/auth/login?redirect=/freelancer/pending-approval');
      return;
    }

    // 2. Redirect to /freelancer if onboarding_status='approved'
    if (activeUser.role === 'freelancer' && activeUser.onboarding_status === 'approved') {
      router.replace('/freelancer');
      return;
    }

    // 3. Must be role='freelancer'
    if (activeUser.role !== 'freelancer' && activeUser.role !== 'admin') {
      router.replace('/client');
      return;
    }

    setUser(activeUser);

    // Resolve Tracking ID
    let resolvedTrackingId = activeUser.tracking_id;

    if (!resolvedTrackingId) {
      try {
        const storedProfile = localStorage.getItem('artsy_creator_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          if (profile.trackingId || profile.tracking_id) {
            resolvedTrackingId = profile.trackingId || profile.tracking_id;
          }
        }
      } catch {}
    }

    if (!resolvedTrackingId) {
      try {
        resolvedTrackingId = sessionStorage.getItem('artsy_tracking_id');
      } catch {}
    }

    if (!resolvedTrackingId) {
      // Deterministic formatted tracking ID fallback
      const cleanId = (activeUser.id || '4115').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
      resolvedTrackingId = `ART-${new Date().getFullYear()}-VET-${cleanId.padStart(4, '0')}`;
    }

    setTrackingId(resolvedTrackingId);
    setIsCheckingAuth(false);
  }, [router]);

  const handleCopyTrackingId = async () => {
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const textArea = document.createElement('textarea');
      textArea.value = trackingId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center font-sans text-xs text-[#86868B]">
        Checking application status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-10 px-4 sm:px-6 font-sans text-[#1D1D1F] flex flex-col justify-center items-center">
      {/* Centered card, max-width 600px */}
      <div className="w-full max-w-[600px] bg-white border border-[#E5E5E7] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* 1. Header Bar: ARTSY • + [Log out] button (top right) */}
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Under Review
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Application under review
            </h1>

            {/* 3. Subtext */}
            <p className="text-sm text-[#86868B] leading-relaxed">
              Thank you for applying to Artsy. Your creator profile is being reviewed by our curation team.
            </p>
          </div>

          {/* 4. Tracking ID box (bordered, prominent) */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-[#3B82F6]/30 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#3B82F6]">
                TRACKING ID
              </span>
              <span className="text-lg sm:text-xl font-mono font-extrabold text-[#1D1D1F] tracking-tight">
                {trackingId}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyTrackingId}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-[#E5E5E7] hover:border-[#3B82F6] text-[#1D1D1F] text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <span>Copy</span>
                  <span className="text-[#86868B] text-[11px]">📋</span>
                </>
              )}
            </button>
          </div>

          {/* 5. Timeline & 6. Notification Note */}
          <div className="space-y-2 p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#1D1D1F]">
              <span className="text-sm">⏱️</span>
              <span>Expected review timeline: <strong>3 business days</strong></span>
            </div>
            <p className="text-[#86868B] leading-relaxed pl-6">
              You will receive a WhatsApp message and email once a decision has been made.
            </p>
          </div>

          {/* 7. Divider */}
          <hr className="border-t border-[#E5E5E7]" />

          {/* 8. Section: "What happens next?" */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F]">
              What happens next?
            </h2>

            <ol className="space-y-2.5 text-xs text-[#48484A]">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span className="leading-snug">
                  Our curation team reviews your showreel and portfolio
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span className="leading-snug">
                  If shortlisted, we schedule a 15-minute video call interview
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span className="leading-snug">
                  On approval, you get access to the Creator Station and start receiving job offers
                </span>
              </li>
            </ol>
          </div>

          {/* 9. Divider */}
          <hr className="border-t border-[#E5E5E7]" />

          {/* 10. Support Link */}
          <div className="text-center pt-1">
            <Link
              href="mailto:creators@artsyproduction.in"
              className="text-xs font-semibold text-[#3B82F6] hover:underline inline-flex items-center gap-1"
            >
              Questions? Contact our creator team →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
