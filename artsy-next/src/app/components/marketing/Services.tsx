'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadPricingMatrix, DEFAULT_PRICING_MATRIX } from '@/lib/pricing/catalog-matrix';

export default function Services() {
  const [categories, setCategories] = useState(() =>
    DEFAULT_PRICING_MATRIX.map((c) => ({
      id: c.id,
      title: c.title,
      href: `/services/${c.id}`,
    }))
  );

  useEffect(() => {
    const sync = () => {
      const live = loadPricingMatrix();
      setCategories(
        live.map((c) => ({
          id: c.id,
          title: c.title,
          href: `/services/${c.id}`,
        }))
      );
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

  return (
    <section className="w-full py-14 sm:py-20 bg-[#F5F5F7]" id="services-catalog">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="mb-8 max-w-xl">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
            Select a production category
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
            Explore specialized formats, transparent unit rates, guaranteed turnaround SLAs, and verified color grading.
          </p>
        </div>

        {/* Clean Rectangular Category Cards Showing Category Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="bg-white rounded-xl px-6 py-5 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-[#3B82F6] hover:shadow-[0_6px_20px_rgba(59,130,246,0.08)] transition-all duration-200 group flex items-center justify-between cursor-pointer"
            >
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                {cat.title}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}