'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import { loadPricingMatrix, getServicesOverview, DEFAULT_PRICING_MATRIX } from '@/lib/pricing/catalog-matrix';

export default function ServicesPage() {
  const [categories, setCategories] = useState(() => getServicesOverview(DEFAULT_PRICING_MATRIX));

  useEffect(() => {
    // Hydrate from live deployed store
    const syncCatalog = () => {
      const live = loadPricingMatrix();
      setCategories(getServicesOverview(live));
    };

    syncCatalog();

    window.addEventListener('artsy_pricing_updated', syncCatalog);
    window.addEventListener('artsy_catalog_deployed', syncCatalog);
    window.addEventListener('storage', syncCatalog);

    return () => {
      window.removeEventListener('artsy_pricing_updated', syncCatalog);
      window.removeEventListener('artsy_catalog_deployed', syncCatalog);
      window.removeEventListener('storage', syncCatalog);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <Navbar />

      <main className="w-full pt-20 sm:pt-24 pb-14 max-w-full flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          
          {/* Header Strip */}
          <div className="max-w-2xl mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Select your production suite
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868B] leading-relaxed">
              Transparent unit pricing, precision turnaround SLAs, and deterministic post-engineering by vetted senior colorists.
            </p>
          </div>

          {/* Category Detail Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between hover:border-[#3B82F6]/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {cat.badge}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#86868B] font-medium">
                      <span>{cat.subCount}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#1D1D1F]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {cat.turnaround.split('(')[0].trim()}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#1D1D1F]">
                    {cat.title}
                  </h2>

                  <p className="mt-1 text-xs text-[#86868B] leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Sub-Category Rate Preview Pills */}
                  <div className="mt-3.5 pt-3 border-t border-[#F5F5F7]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D1D1F] block mb-2">
                      Sub-Category Formats &amp; Base Rates:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subHighlights.map((sub, i) => (
                        <Link
                          key={i}
                          href={`/book?service=${cat.id}&sub=${sub.subId}`}
                          className="px-2 py-0.5 rounded bg-[#F5F5F7] hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 text-[#1D1D1F] text-[11px] font-medium border border-transparent transition-all cursor-pointer"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F5F5F7] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[#86868B] block tracking-wide">
                      Starting Single-Cam
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-[#1D1D1F]">
                      {cat.startingRate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={cat.href}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#E5E5E7] hover:border-[#1D1D1F] text-[#1D1D1F] text-[11px] font-bold uppercase tracking-wider transition-colors"
                    >
                      <span>Rates &amp; Specs</span>
                    </Link>
                    <Link
                      href={`/book?service=${cat.id}`}
                      className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-[11px] font-bold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      <span>Book Cut</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}