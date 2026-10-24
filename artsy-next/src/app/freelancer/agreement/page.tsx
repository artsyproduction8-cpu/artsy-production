'use client';

import { useState } from 'react';
import { useAuth, hasAcceptedAgreement, recordAgreementAcceptance } from '@/lib/auth';
import FreelancerHeader from '../components/FreelancerHeader';
import FreelancerSidebar from '../components/FreelancerSidebar';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function FreelancerAgreementPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const signed = Boolean(user?.agreement_signed_at || user?.agreement_accepted || hasAcceptedAgreement(user));

  const creatorName = user?.full_name || 'Creator Partner';
  const signedTimestamp = user?.agreement_signed_at || user?.agreement_accepted_at || 'Verified';

  useEffect(() => {
    if (!loading && user) {
      const hasSigned = Boolean(user.agreement_signed_at || user.agreement_accepted || hasAcceptedAgreement(user));
      if (!hasSigned) {
        router.replace('/freelancer/onboarding');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <FreelancerHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 shadow-sm flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-emerald-700 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Creator Agreement
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
              Creator Agreement &amp; Non-Disclosure Agreement (NDA)
            </h1>
            <p className="text-xs text-[#86868B] mt-1">
              Party: <span className="font-bold text-[#1D1D1F]">{creatorName}</span> • Artsy Creative Services Private Limited
            </p>
          </div>

          <div className="shrink-0">
            {signed ? (
              <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <span>✓</span>
                <span>Signed &amp; Active</span>
              </span>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <span>⚠️</span>
                <span>Signature Pending</span>
              </span>
            )}
          </div>
        </div>

        {/* Agreement Clauses Text */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E5E7] shadow-xs space-y-6 text-xs text-[#1D1D1F] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">1. Video Editing Services</h2>
            <p className="text-[#86868B]">
              You agree to provide professional video editing, color grading, and audio mixing according to the project requirements provided by the client.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">2. Privacy &amp; Confidentiality</h2>
            <p className="text-[#86868B]">
              All client footage, raw videos, audio, and project files are strictly confidential. You agree never to share, leak, or post any client footage without explicit permission.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">3. Work Ownership &amp; Delivery</h2>
            <p className="text-[#86868B]">
              Completed video projects and assets are transferred to the client upon completion and payout.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[#1D1D1F]">4. Payouts &amp; Compensation</h2>
            <p className="text-[#86868B]">
              You receive 70% of the project value for every completed project. Payments are transferred directly to your bank account upon client sign-off and approval.
            </p>
          </section>

          {/* Signature Action Section */}
          <div className="pt-6 border-t border-[#F5F5F7]">
            {signed ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>✓</span>
                    <span>Legally Executed &amp; Recorded</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-mono">
                    Signatory: {creatorName} • Agreement Version: 1.0 • Executed: {signedTimestamp}
                  </div>
                </div>
                <button
                  onClick={() => alert('Printing / Downloading official agreement copy...')}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors shadow-2xs text-center"
                >
                  Download Agreement ↓
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>The Creator Agreement &amp; NDA must be executed during onboarding. Redirecting...</span>
                <button
                  onClick={() => router.push('/freelancer/onboarding')}
                  className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold"
                >
                  Go to Onboarding &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  </div>
</div>
  );
}
