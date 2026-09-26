'use client';

import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

const CATEGORIES = [
  {
    id: 'wedding',
    title: 'Wedding',
    badge: 'LUXURY CINEMA',
    startingRate: '₹1,500',
    subCount: '7 Formats',
    turnaround: '7–10 Days Standard (Rush: +₹2,000)',
    description: 'Story-driven emotional pacing, multi-angle audio sync, and custom Rec.709 film LUT grading.',
    subHighlights: ['Highlight + Teaser (₹5,000)', 'Highlight (₹4,000)', 'Teaser (₹2,000)', 'Trinity Bundle (₹8,000)', 'Cinematic Story (₹8,000–₹10,000)'],
    href: '/services/wedding',
  },
  {
    id: 'brand',
    title: 'Brand',
    badge: 'GROWTH & DTC',
    startingRate: '₹3,000',
    subCount: '5 Formats',
    turnaround: '7–10 Days Standard (48h Rush Available)',
    description: 'High-velocity commercial hooks, kinetic typography, and motion sound design for DTC campaigns.',
    subHighlights: ['Product Video (₹3,000)', 'Brand Video (₹3,000)', 'Fashion Video (₹3,000)', 'Ad Film (₹10,000)', 'Explainer Video (₹8,000)'],
    href: '/services/brand',
  },
  {
    id: 'corporate',
    title: 'Corporate',
    badge: 'EXECUTIVE',
    startingRate: '₹8,000',
    subCount: '4 Formats',
    turnaround: '7–10 Days Standard (Rush: +₹1,000/2,000)',
    description: 'Conference summits, executive keynote presentations, and investor sizzle reels with audio normalization.',
    subHighlights: ['Event Highlight (₹12,000)', 'Corporate Film (₹15,000)', 'Testimonial (₹10,000)', 'Internal Training (₹8,000)'],
    href: '/services/corporate',
  },
  {
    id: 'personal',
    title: 'Personal / Other',
    badge: 'LIFE MILESTONES',
    startingRate: '₹1,000',
    subCount: '8 Formats',
    turnaround: '7–10 Days Standard (Rush: +₹1,000/2,000)',
    description: 'Birthdays, engagements, baby showers, memorials, and anniversaries with custom musical scoring.',
    subHighlights: ['Birthday (₹1,000–₹5,000)', 'Engagement (₹1,000–₹5,500)', 'Baby Shower (₹1,000–₹5,000)', 'Memorial (₹3,000–₹5,000)', 'Maternity (₹1,000)'],
    href: '/services/personal',
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-hidden flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          
          {/* Header Strip */}
          <div className="max-w-2xl mb-10">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Select your production suite
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#86868B] leading-relaxed">
              Transparent unit pricing, precision turnaround SLAs, and deterministic post-engineering by vetted senior colorists.
            </p>
          </div>

          {/* Category Detail Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-7 sm:p-8 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {cat.badge}
                    </span>
                    <span className="text-xs text-[#86868B] font-medium">
                      {cat.subCount}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                    {cat.title}
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-[#86868B] leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Sub-Category Rate Preview Pills */}
                  <div className="mt-5 pt-5 border-t border-[#F5F5F7]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D1D1F] block mb-2.5">
                      Sub-Category Formats &amp; Base Rates:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subHighlights.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-[#F5F5F7] text-[#1D1D1F] text-xs font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#F5F5F7] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#86868B] block">
                      Starting Single-Cam
                    </span>
                    <span className="text-xl font-extrabold text-[#1D1D1F]">
                      {cat.startingRate}
                    </span>
                  </div>

                  <Link
                    href={cat.href}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <span>View All {cat.title} Rates →</span>
                  </Link>
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