'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { calculateLivePrice, ConfiguratorSelections, PriceBreakdown } from '@/lib/pricing/engine';

function PriceSummaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const service = searchParams.get('service') || 'wedding';

  // Requirements configuration based on service selection
  const requirements: ConfiguratorSelections = useMemo(() => {
    switch (service) {
      case 'wedding':
        return {
          cameraAngleValue: 2, // 2–3 Multi-Cam Sync (+₹2,000)
          durationValue: 'highlight', // 3–5 min highlight
          formatValue: 'both', // 16:9 Master + 9:16 Vertical (+₹1,400)
          isRush: false
        };
      case 'brand_ugc':
        return {
          variantValue: 2, // 2 Hook Variations (+₹900)
          durationValue: 'standard', // 45–60s (+₹400)
          formatValue: 'all', // 9:16 + 1:1 + 16:9 Multi-Platform (+₹1,200)
          isRush: false
        };
      case 'store_product':
        return {
          variantValue: 2, // 2 Products Bundle (+₹2,600)
          durationValue: '60s', // Detailed Walkthrough (+₹800)
          formatValue: '9_16',
          isRush: false
        };
      case 'corporate_event':
        return {
          cameraAngleValue: 2, // 2 Cameras Sync (+₹2,500)
          durationValue: 'recap',
          isRush: false
        };
      default:
        return {
          cameraAngleValue: 1,
          durationValue: 'highlight'
        };
    }
  }, [service]);

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const breakdown = calculateLivePrice(service, requirements);
      setPriceBreakdown(breakdown);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [service, requirements]);

  const handleProceedToCheckout = () => {
    if (!priceBreakdown) return;

    if (typeof window !== 'undefined') {
      const activeBooking = {
        serviceKey: service,
        serviceName: priceBreakdown.serviceName,
        requirements,
        priceBreakdown: {
          basePrice: priceBreakdown.basePriceRupees,
          subtotal: priceBreakdown.subtotalRupees,
          gstAmount: Math.round(priceBreakdown.waterfall.gstAmount / 100),
          grandTotal: priceBreakdown.grandTotalRupees,
          estimatedDeliveryDays: priceBreakdown.estimatedDeliveryDays,
          validUntil: priceBreakdown.validUntil
        }
      };
      sessionStorage.setItem('artsy_active_booking', JSON.stringify(activeBooking));
    }

    router.push(`/book/checkout?service=${service}`);
  };

  if (isLoading || !priceBreakdown) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-[#1D1D1F]">
        <div className="w-8 h-8 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin mb-3"></div>
        <div className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
          Calculating Price Summary...
        </div>
      </div>
    );
  }

  const preGstRupees = Math.round(priceBreakdown.waterfall.preGstRevenue / 100);
  const gstRupees = Math.round(priceBreakdown.waterfall.gstAmount / 100);

  return (
    <section className="py-20 bg-[#F5F5F7] min-h-screen text-[#1D1D1F]">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/services"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors"
        >
          ← Back to Creative Catalog
        </Link>

        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest bg-[#3B82F6]/10 px-3 py-1 rounded-full">
            Order Price Summary
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-2">
            Configured Price Summary
          </h1>
          <p className="text-xs text-[#86868B] mt-1">
            All-inclusive escrow pricing. Zero hidden fees. 18% GST absorbed and itemized.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* Service Configuration Header */}
          <div className="pb-6 border-b border-[#F5F5F7] mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#86868B]">Service Package</span>
                <h2 className="text-xl font-extrabold text-[#1D1D1F] mt-0.5">
                  {priceBreakdown.serviceName}
                </h2>
              </div>
              <span className="text-xs font-bold text-[#3B82F6] bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                {priceBreakdown.estimatedDeliveryDays} Days SLA
              </span>
            </div>
          </div>

          {/* Line Item Breakdown */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
              Package &amp; Feature Breakdown
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-[#1D1D1F] font-medium">Base Edit Specification</span>
              <span className="font-mono font-bold text-[#1D1D1F]">
                ₹{priceBreakdown.basePriceRupees.toLocaleString('en-IN')}
              </span>
            </div>

            {priceBreakdown.adjustments.map((adj) => (
              <div key={adj.name} className="flex justify-between items-center text-xs">
                <span className="text-[#86868B] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
                  {adj.name}
                </span>
                <span className="font-mono font-semibold text-[#1D1D1F]">
                  {adj.costRupees >= 0 ? '+' : ''}₹{adj.costRupees.toLocaleString('en-IN')}
                </span>
              </div>
            ))}

            <div className="pt-4 border-t border-[#F5F5F7] space-y-2">
              <div className="flex justify-between text-xs text-[#86868B]">
                <span>Pre-GST Subtotal</span>
                <span className="font-mono">₹{preGstRupees.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-[#86868B]">
                <span>GST (18% Statutory Liability)</span>
                <span className="font-mono">₹{gstRupees.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total Block */}
            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#86868B] block">
                  All-Inclusive Client Total
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  ✓ Protected in Razorpay Escrow
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-[#1D1D1F] font-mono">
                  ₹{priceBreakdown.grandTotalRupees.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* SLA & Security Trust Badges */}
          <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-xs space-y-2 mb-6">
            <div className="flex items-center gap-2 text-[#1D1D1F] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>2 Complimentary Revision Rounds Included</span>
            </div>
            <div className="flex items-center gap-2 text-[#86868B]">
              <span className="text-[#3B82F6]">🔒</span>
              <span>Milestone Release: Editor paid only after your final cut sign-off</span>
            </div>
          </div>

          {/* CTA Action */}
          <button
            type="button"
            onClick={handleProceedToCheckout}
            className="w-full bg-[#1D1D1F] hover:bg-[#3B82F6] text-white py-4 px-6 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-2"
          >
            <span>Proceed to Escrow Checkout</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default function PriceSummary() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading price summary...</div>}>
      <PriceSummaryContent />
    </Suspense>
  );
}