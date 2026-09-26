'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import { getCurrentUser, setCurrentUser, PRESET_USERS } from '@/lib/auth';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ARTSY-892410';
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('artsy_confirmed_order');
      if (stored) {
        setConfirmedOrder(JSON.parse(stored));
      }
      // Ensure client role is preserved for this confirmed booking
      if (!getCurrentUser()) {
        setCurrentUser(PRESET_USERS.client);
      }
    }
  }, []);

  const totalAmount = confirmedOrder?.bookingData?.priceBreakdown?.grandTotal || 8000;
  const serviceName = confirmedOrder?.bookingData?.serviceName || 'Wedding Films';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-hidden flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl w-full bg-white rounded-2xl border border-[#E5E5E7]/60 p-8 sm:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          
          {/* Success Header */}
          <div className="text-center mb-8 pb-8 border-b border-[#F5F5F7]">
            <div className="w-16 h-16 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center text-3xl mx-auto mb-4 font-black">
              ✓
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
              ESCROW PAYMENT VERIFIED
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-[-0.03em] mt-3 mb-2">
              Project Booked &amp; Ingestion Initialized
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] max-w-md mx-auto leading-relaxed">
              Order <span className="font-mono font-bold text-[#1D1D1F]">{orderId}</span> has been confirmed. Your project is now entering the Artsy Creator Dispatch Queue.
            </p>
          </div>

          {/* Order Details Grid */}
          <div className="bg-[#F5F5F7] rounded-xl p-6 mb-8 space-y-3 font-mono text-xs text-[#1D1D1F] border border-[#E5E5E7]">
            <div className="flex justify-between">
              <span className="text-[#86868B]">Project Service:</span>
              <span className="font-bold">{serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#86868B]">Order Tracking ID:</span>
              <span className="font-bold">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#86868B]">Total Escrow Deposited:</span>
              <span className="font-bold text-[#3B82F6]">₹{Number(totalAmount).toLocaleString('en-IN')} INR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#86868B]">SLA Guarantee:</span>
              <span className="font-bold text-emerald-600">48h Initial Assembly Delivery</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#E5E5E7]">
              <span className="text-[#86868B]">Statutory Tax Invoice:</span>
              <a
                href={`/api/invoices/${orderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#3B82F6] hover:underline flex items-center gap-1"
              >
                <span>View GST Invoice ↗</span>
              </a>
            </div>
          </div>

          {/* Master Plan 4-Step Pipeline */}
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868B] block mb-4">
              What happens next in our production pipeline
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7]">
                <span className="font-mono text-[11px] font-bold text-[#3B82F6] block mb-1">INGESTION &amp; PROXIES</span>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Our cloud pipeline transcodes your raw footage into lightweight 4K streaming proxies with burnt-in timecodes.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7]">
                <span className="font-mono text-[11px] font-bold text-[#3B82F6] block mb-1">CREATOR DISPATCH</span>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Top-matched verified Artsy Creators receive an anonymised job card. First to claim begins edit within 12 hours.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7]">
                <span className="font-mono text-[11px] font-bold text-[#3B82F6] block mb-1">DAILY PROGRESS</span>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Daily check-ins are logged. Internal creator deadline is 4–6 days to ensure ample buffer for QA.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7]">
                <span className="font-mono text-[11px] font-bold text-[#3B82F6] block mb-1">PREVIEW &amp; REVISIONS</span>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Review the 4K draft in our player and leave timestamped comments directly on the video timeline.
                </p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/client/review"
              className="w-full sm:w-1/2 py-3.5 px-6 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center transition-all shadow-sm"
            >
              Open Frame Review Suite →
            </Link>

            <Link
              href="/"
              className="w-full sm:w-1/2 py-3.5 px-6 border border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7] text-xs font-semibold uppercase tracking-wider rounded-xl text-center transition-all"
            >
              Return to Homepage
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono">Loading Order Confirmation...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}