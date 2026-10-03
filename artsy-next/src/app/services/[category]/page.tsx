'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import {
  loadPricingMatrix,
  getCategoryDetailMap,
  DEFAULT_PRICING_MATRIX,
  ServiceCategory,
} from '@/lib/pricing/catalog-matrix';

export default function ServiceCategoryDetailPage() {
  const params = useParams<{ category: string }>();
  const rawKey = (params?.category || 'wedding').toLowerCase();
  const categoryKey = rawKey === 'ugc' || rawKey === 'brand_ugc' ? 'brand' : rawKey;

  const [matrix, setMatrix] = useState<ServiceCategory[]>(DEFAULT_PRICING_MATRIX);

  useEffect(() => {
    const sync = () => {
      const live = loadPricingMatrix();
      setMatrix(live);
    };

    sync();

    window.addEventListener('artsy_pricing_updated', sync);
    window.addEventListener('artsy_catalog_deployed', sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('artsy_pricing_updated', sync);
      window.removeEventListener('artsy_catalog_deployed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const categoryMap = getCategoryDetailMap(matrix);
  const category = categoryMap[categoryKey] || categoryMap['wedding'] || Object.values(categoryMap)[0];
  const activeTabs = matrix.map((c) => ({ id: c.id, label: c.title }));

  if (!category) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
        <Navbar />
        <main className="w-full pt-28 pb-20 max-w-full flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Category not found</h1>
            <Link href="/services" className="mt-4 inline-block text-blue-600">Back to Services</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-hidden flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          
          {/* Top Breadcrumb & Switcher Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors uppercase tracking-wider"
            >
              <span>←</span>
              <span>All Services</span>
            </Link>

            {/* Category Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E5E5E7]">
              {activeTabs.map((tab) => {
                const isActive = tab.id === categoryKey;
                return (
                  <Link
                    key={tab.id}
                    href={`/services/${tab.id}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#1D1D1F] text-white shadow-xs'
                        : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Category Hero Banner */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.04)] mb-10">
            <div className="inline-block text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              {category.badge}
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              {category.title}
            </h1>
            <p className="mt-3 text-base sm:text-lg font-semibold text-[#1D1D1F]/90">
              {category.tagline}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-[#86868B] max-w-3xl leading-relaxed">
              {category.description}
            </p>
          </div>

          {/* Sub-Category Catalog Grid */}
          <div className="mb-14">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                {category.title} Packages
              </h2>
              <span className="text-xs font-semibold text-[#86868B]">
                {category.subCategories.length} Active Formats
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.subCategories.map((sub: any) => (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl p-6 sm:p-7 border flex flex-col justify-between transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] ${
                    sub.popular
                      ? 'border-[#3B82F6] shadow-[0_4px_20px_rgba(59,130,246,0.08)] relative'
                      : 'border-[#E5E5E7]'
                  }`}
                >
                  {sub.popular && (
                    <span className="absolute -top-3 right-6 bg-[#3B82F6] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                      Popular
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
                        {sub.name}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F5F5F7] text-[#86868B] shrink-0">
                        {sub.duration}
                      </span>
                    </div>

                    <p className="text-xs text-[#86868B] leading-relaxed mb-4">
                      {sub.description}
                    </p>

                    {/* Price Block */}
                    <div className="bg-[#F5F5F7] rounded-xl p-4 mb-5">
                      <div className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                        ₹{sub.basePrice.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-[#86868B] mt-1.5 flex justify-between">
                        <span>SLA: {sub.standardDelivery}</span>
                        <span>{sub.rushOptions}</span>
                      </div>
                    </div>

                    {/* Deliverables Checklist */}
                    <div className="space-y-2 mb-6">
                      <div className="text-[11px] uppercase font-bold text-[#1D1D1F] tracking-wider">
                        Deliverable Scope
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#424245]">
                        {sub.deliverables.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="text-[#3B82F6] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Direct Book Action */}
                  <Link
                    href={`/book?service=${categoryKey}&sub=${sub.id}&basePrice=${sub.basePrice}&subName=${encodeURIComponent(sub.name)}`}
                    className="w-full py-3 px-4 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Configure &amp; Book</span>
                    <span>→</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}