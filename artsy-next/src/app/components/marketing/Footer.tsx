'use client';

import Link from 'next/link';

export default function Footer() {
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://www.youtube.com/@artsyproduction';
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/artsy__production/';
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || (process.env.NEXT_PUBLIC_SUPPORT_PHONE ? `https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_PHONE.replace(/[^0-9]/g, '')}` : 'https://wa.me/');

  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/10 py-14 sm:py-16 text-white">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          {/* Brand & Mission & Social Links */}
          <div className="lg:col-span-5 flex flex-col items-start gap-3">
            <Link href="/" className="flex flex-col items-start leading-none select-none group">
              <span className="text-2xl font-extrabold uppercase tracking-tight text-white leading-none group-hover:text-white/80 transition-colors">
                ARTSY
              </span>
              <span className="font-mono text-xs font-semibold tracking-[1.2px] uppercase text-[#DCDFE3]/80 mt-1 leading-none">
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
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#FF0000] hover:text-white flex items-center justify-center transition-all text-[#DCDFE3]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#E1306C] hover:text-white flex items-center justify-center transition-all text-[#DCDFE3]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Business"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all text-[#DCDFE3]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Studio Navigation & Discovery */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Studio &amp; Suites
            </h3>
            <ul className="flex flex-col gap-2 text-xs font-medium text-[#DCDFE3]">
              <li>
                <Link href="/work" className="hover:text-white transition-colors">
                  Cinematic Portfolio Archive
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
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact &amp; Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Support
            </h3>
            <div className="flex flex-col gap-2 text-xs text-[#DCDFE3]">
              <p>
                <span className="text-white font-semibold">Email:</span>{' '}
                <a
                  className="text-[#3B82F6] hover:text-blue-400 hover:underline transition-colors"
                  href="mailto:artsyproduction8@gmail.com"
                >
                  artsyproduction8@gmail.com
                </a>
              </p>
              <p>
                <span className="text-white font-semibold">Phone:</span>{' '}
                <a
                  className="text-[#3B82F6] hover:text-blue-400 hover:underline transition-colors"
                  href={`tel:${(process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+917777078742').replace(/\s+/g, '')}`}
                >
                  {process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 77770 78742'}
                </a>
              </p>
              <p className="text-xs text-[#DCDFE3]">
                <span className="text-white font-semibold">Support Hours:</span> Mon – Fri, 9:00 AM – 6:00 PM IST
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Compliance Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-[#DCDFE3]/70 font-sans">
          <div className="text-center sm:text-left">© 2026 ARTSY PRODUCTION. ALL RIGHTS RESERVED.</div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy (DPDP)</Link>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}