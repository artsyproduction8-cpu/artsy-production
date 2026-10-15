import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import ContactClient from './ContactClient';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Contact Artsy Production — Studio Inquiries & Booking',
  description:
    'Contact Artsy Production studio for post-production inquiries, urgent project timelines, and custom commercial briefs. Connect via phone, WhatsApp, or email.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
  ]);

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || process.env.SUPER_ADMIN_PHONE || '+91-XXXXXXXXXX';
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || `https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}`;
  const businessAddress = process.env.BUSINESS_ADDRESS || 'Artsy Production Studio, Bandra Kurla Complex, Mumbai, Maharashtra 400051, India';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-clip flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          {/* Header Strip */}
          <div className="max-w-3xl mb-12">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1D1D1F] leading-tight">
              Contact Artsy Production Studio
            </h1>
            <p className="mt-4 text-sm sm:text-base text-[#86868B] leading-relaxed">
              Have a multi-camera wedding epic, commercial campaign, or high-volume content pipeline? Connect directly with our post-production supervisors to discuss timelines, custom pricing matrices, or urgent rush SLAs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Direct Ingestion Form */}
            <div className="lg:col-span-7">
              <ContactClient />
            </div>

            {/* Right Column: Physical Studio Details & Channels */}
            <div className="lg:col-span-5 space-y-6">
              {/* Studio Direct Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1D1D1F] mb-1">
                    Studio Communications
                  </h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">
                    Direct access to studio coordinators and post-supervisors. We operate dedicated encrypted communication channels for every active production contract.
                  </p>
                </div>

                <div className="space-y-4 pt-2 text-xs">
                  <div className="flex items-start gap-3.5">
                    <span className="text-lg">📍</span>
                    <div>
                      <div className="font-bold text-[#1D1D1F]">Physical Studio Address</div>
                      <div className="text-[#86868B] leading-relaxed mt-0.5">{businessAddress}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="text-lg">📞</span>
                    <div>
                      <div className="font-bold text-[#1D1D1F]">Telephone &amp; Desk Inquiries</div>
                      <div className="text-[#86868B] mt-0.5">{supportPhone}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="text-lg">💬</span>
                    <div>
                      <div className="font-bold text-[#1D1D1F]">WhatsApp Studio Hotline</div>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3B82F6] hover:underline font-semibold mt-0.5 inline-block"
                      >
                        Message via WhatsApp (Fastest Response) ↗
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="text-lg">✉️</span>
                    <div>
                      <div className="font-bold text-[#1D1D1F]">Direct Editorial Email</div>
                      <a href="mailto:hello@artsyproduction.com" className="text-[#3B82F6] hover:underline mt-0.5 inline-block">
                        hello@artsyproduction.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <span className="text-lg">⏰</span>
                    <div>
                      <div className="font-bold text-[#1D1D1F]">Operational Studio Hours</div>
                      <div className="text-[#86868B] mt-0.5">Monday – Friday: 09:00 AM – 07:00 PM IST</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Quotation Callout */}
              <div className="bg-[#1D1D1F] text-white rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-lg font-bold">Need Immediate Pricing?</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Skip the inquiry queue by using our interactive self-service order configurator. Select your exact footage profiles, turnarounds, and obtain an instant binding price quote.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/book"
                    className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-xs"
                  >
                    Configure Quote →
                  </Link>
                  <Link
                    href="/work"
                    className="px-5 py-2.5 rounded-xl border border-white/20 hover:border-white text-white text-xs font-bold uppercase tracking-wider text-center transition-colors"
                  >
                    Browse Work
                  </Link>
                </div>
              </div>
            </div>
          </div>



          {/* Common Contact FAQs */}
          <section className="mt-16 pt-12 border-t border-[#E5E5E7]">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F]">
                Frequently Asked Contact Questions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7] space-y-2">
                <h3 className="text-sm font-bold text-[#1D1D1F]">What is your typical inquiry turnaround time?</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  During studio operational hours (Monday to Friday, 9:00 AM – 7:00 PM IST), our post-production supervisors respond to inquiries within 4 business hours. Urgent WhatsApp inquiries are prioritized.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E7] space-y-2">
                <h3 className="text-sm font-bold text-[#1D1D1F]">Can you accommodate same-week emergency deadlines?</h3>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Yes. We maintain emergency 24-hour and 48-hour rush SLA sprint capacity for urgent commercial campaigns, keynote sizzles, and time-sensitive media releases. Specify your deadline in the form above.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
