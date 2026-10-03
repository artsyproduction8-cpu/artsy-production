'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative w-full bg-white pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden border-b border-[#F5F5F7]">
      {/* Background Ghost Watermark */}
      <div 
        aria-hidden="true" 
        className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.04] text-[#1D1D1F] text-[110px] lg:text-[180px] font-extrabold whitespace-nowrap tracking-tighter leading-none z-0"
      >
        POST // 24FPS
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
        <div className="flex flex-col items-start max-w-5xl">
          
          {/* Heading with MODERN CREATIVE TEAMS in Blue with Underline */}
          <h1 className="text-4xl sm:text-6xl lg:text-[70px] lg:leading-[72px] font-extrabold text-[#1D1D1F] uppercase tracking-tight max-w-none">
            <span className="block">CINEMATIC</span>
            <span className="block mt-1 whitespace-nowrap">POST-PRODUCTION FOR</span>
            <span className="block mt-1 text-[#3B82F6] underline decoration-[#3B82F6] decoration-4 underline-offset-8">
              <span className="block">MODERN CREATIVE</span>
              <span className="block mt-1">TEAMS</span>
            </span>
          </h1>

          {/* Balanced Editorial Subtext */}
          <p className="mt-6 text-base sm:text-lg text-[#86868B] font-normal leading-[1.6] max-w-2xl">
            Two-sided post-production studio and technological platform. Curated elite film editors, seamless cloud workflow, and transparent pricing for weddings, high-growth brands, and corporate cinema.
          </p>

          {/* Minimalist Metrics Strip (3 Columns) */}
          <div className="mt-14 pt-8 border-t border-[#F5F5F7] w-full grid grid-cols-2 sm:grid-cols-3 gap-8 max-w-2xl">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                48h
              </div>
              <div className="text-xs text-[#86868B] mt-1 font-normal">
                Average First Cut
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                99.4%
              </div>
              <div className="text-xs text-[#86868B] mt-1 font-normal">
                SLA Adherence Rate
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                1,400+
              </div>
              <div className="text-xs text-[#86868B] mt-1 font-normal">
                Commercial Revisions
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}