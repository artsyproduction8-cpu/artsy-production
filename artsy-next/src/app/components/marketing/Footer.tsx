'use client';

import Link from 'next/link';

export default function Footer() {
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://www.youtube.com/@artsyproduction';
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/artsyproduction';
  const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://www.linkedin.com/company/artsy-production';
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/917777078742';

  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/10 py-14 sm:py-16 text-white">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          {/* Brand & Mission & Social Links */}
          <div className="lg:col-span-5 flex flex-col items-start gap-3">
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

            {/* Social Links Row */}
            <div className="flex items-center gap-3 mt-3">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube Channel"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FF0000] hover:text-white flex items-center justify-center text-xs font-bold transition-all text-[#DCDFE3]"
              >
                YT
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E1306C] hover:text-white flex items-center justify-center text-xs font-bold transition-all text-[#DCDFE3]"
              >
                IG
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#0077B5] hover:text-white flex items-center justify-center text-xs font-bold transition-all text-[#DCDFE3]"
              >
                IN
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Business"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#25D366] hover:text-white flex items-center justify-center text-xs font-bold transition-all text-[#DCDFE3]"
              >
                WA
              </a>
            </div>
          </div>

          {/* Studio Navigation & Discovery */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider !text-white text-white">
              Studio &amp; Suites
            </h4>
            <ul className="flex flex-col gap-2 text-xs font-medium text-[#DCDFE3]">
              <li>
                <Link href="/work" className="text-[#3B82F6] hover:underline transition-colors font-semibold">
                  Cinematic Portfolio Archive →
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  All Production Suites
                </Link>
              </li>
              <li>
                <Link href="/creators" className="hover:text-white transition-colors">
                  Vetted Creators Roster
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing &amp; Package Matrix
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Our Studio
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact &amp; Studio Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider !text-white text-white">
              Support
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
                  href={`tel:${(process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+917777078742').replace(/\s+/g, '')}`}
                >
                  {process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 77770 78742'}
                </a>
              </p>
              <p className="text-xs text-[#DCDFE3]/80 mt-0.5">
                Support Hours: Mon – Fri, 9:00 AM – 6:00 PM IST
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Compliance Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-[#DCDFE3]/70 font-sans">
          <div>© 2026 ARTSY PRODUCTION. ALL RIGHTS RESERVED.</div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy (DPDP)</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <Link href="/grievance" className="hover:text-white transition-colors">Grievance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}