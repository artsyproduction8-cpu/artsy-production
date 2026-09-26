'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/10 py-14 sm:py-16 text-white">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-4 flex flex-col items-start gap-3">
            <Link href="/" className="flex flex-col items-start leading-none select-none group">
              <span className="text-[22px] font-extrabold uppercase tracking-tight text-white leading-none group-hover:text-white/80 transition-colors">
                ARTSY
              </span>
              <span className="font-mono text-[9px] font-semibold tracking-[1.5px] uppercase text-[#DCDFE3]/80 mt-1 leading-none">
                PLACE FOR PERSPECTIVE
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-[#DCDFE3] max-w-sm font-normal mt-1">
              High-performance editorial post-production studio pairing elite creative editors with international cinema, commercial campaigns, and creators.
            </p>
          </div>

          {/* Services Links */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Creative Catalog
            </h4>
            <ul className="flex flex-col gap-2 text-xs font-medium text-[#DCDFE3]">
              <li>
                <Link href="/services" className="text-[#3B82F6] hover:underline transition-colors font-semibold">
                  All Production Suites →
                </Link>
              </li>
              <li>
                <Link href="/services/wedding" className="hover:text-white transition-colors">
                  Wedding Highlight Cinema
                </Link>
              </li>
              <li>
                <Link href="/services/ugc" className="hover:text-white transition-colors">
                  Brand &amp; Performance Ads
                </Link>
              </li>
              <li>
                <Link href="/services/product" className="hover:text-white transition-colors">
                  Product &amp; Commercial Showcase
                </Link>
              </li>
              <li>
                <Link href="/services/corporate" className="hover:text-white transition-colors">
                  Corporate &amp; Keynote Sizzle
                </Link>
              </li>
              <li>
                <Link href="/services/personal" className="hover:text-white transition-colors">
                  Personal &amp; Life Milestones
                </Link>
              </li>
            </ul>
          </div>

          {/* Role Portals */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Portals &amp; Roles
            </h4>
            <ul className="flex flex-col gap-2 text-xs font-medium text-[#DCDFE3]">
              <li>
                <Link href="/auth/login?role=client" className="hover:text-white transition-colors">
                  Client Review Hub
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-white transition-colors">
                  Book Commission
                </Link>
              </li>
              <li>
                <Link href="/auth/login?role=freelancer" className="hover:text-white transition-colors">
                  Creator Job Slate
                </Link>
              </li>
              <li>
                <Link href="/freelancer/onboarding" className="hover:text-white transition-colors">
                  Editor Onboarding
                </Link>
              </li>
              <li>
                <Link href="/auth/login?role=admin" className="hover:text-white transition-colors">
                  Studio Admin Ops
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Studio Support
            </h4>
            <div className="flex flex-col gap-2 text-xs text-[#DCDFE3]">
              <p>
                <span className="text-white font-semibold">Email:</span>{' '}
                <a
                  className="text-[#3B82F6] hover:underline"
                  href="mailto:artsyproduction8@gmail.com"
                >
                  artsyproduction8@gmail.com
                </a>
              </p>
              <p>
                <span className="text-white font-semibold">Phone:</span>{' '}
                <a
                  className="hover:text-white transition-colors"
                  href="tel:+918369251112"
                >
                  +91 836 925 1112
                </a>
              </p>
              <p className="text-xs text-[#DCDFE3]/80 mt-0.5">
                Support Hours: Mon – Fri, 9:00 AM – 6:00 PM IST
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Compliance Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-[#DCDFE3]/70 font-mono">
          <div>© 2026 ARTSY PRODUCTION. ALL RIGHTS RESERVED.</div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy (DPDP)</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <Link href="/services" className="hover:text-white transition-colors">Services</Link>
            <Link href="/book" className="hover:text-white transition-colors">Book Cut</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Portal Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}