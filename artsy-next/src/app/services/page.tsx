import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import ServicesClient from './ServicesClient';
import { breadcrumbSchema, serviceSchema } from '@/lib/seo/schemas';
import { DEFAULT_PRICING_MATRIX } from '@/lib/pricing/catalog-matrix';

export const metadata: Metadata = {
  title: 'Video Post-Production Services | Artsy Production',
  description:
    'Professional video post-production services: wedding film editing, commercial color grading, sound design, and social media reels with guaranteed turnaround SLAs.',
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
  ]);

  const serviceSchemas = DEFAULT_PRICING_MATRIX.map((cat) =>
    serviceSchema({
      name: `${cat.title} Post-Production`,
      description: cat.description,
      category: cat.id,
      url: `/services/${cat.id}`,
    })
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      {/* Structured Data: BreadcrumbList + Services */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {serviceSchemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <Navbar />

      <main className="w-full pt-20 sm:pt-24 pb-14 max-w-full flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          {/* Header Strip */}
          <div className="max-w-3xl mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Video Post-Production Services
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#86868B] leading-relaxed">
              Transparent unit pricing, precision turnaround SLAs, and deterministic post-engineering by vetted senior film editors and colorists. From multi-cam wedding epics to viral DTC commercial cuts, every project passes rigorous quality benchmarks before release.
            </p>
          </div>

          {/* Interactive Catalog Component */}
          <ServicesClient />

          {/* Turnaround & SLAs Section */}
          <section className="mt-16 pt-12 border-t border-[#E5E5E7]">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Deterministic Delivery
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                Turnaround Times &amp; Guaranteed SLAs
              </h2>
              <p className="text-sm text-[#86868B] leading-relaxed">
                Video deadlines are non-negotiable. Whether preparing for a scheduled commercial campaign launch, film festival premiere, or urgent brand social release, Artsy guarantees deterministic delivery timelines backed by automated SLA monitors.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1D1D1F] mb-1">Standard Production SLA</div>
                    <p className="text-xs text-[#86868B] mb-3">Comprehensive multi-stage editing, grading, sound mastering, and 2 included review rounds.</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#3B82F6] pt-2 border-t border-[#F5F5F7]">5 – 7 Business Days</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1D1D1F] mb-1">Expedited Fast-Track SLA</div>
                    <p className="text-xs text-[#86868B] mb-3">Priority queue placement with concurrent colorist and sound supervisor assignment.</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#3B82F6] pt-2 border-t border-[#F5F5F7]">3 – 4 Business Days</div>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#1D1D1F] mb-1">Emergency Rush 24-48h SLA</div>
                    <p className="text-xs text-[#86868B] mb-3">Overnight sprint teams dedicated exclusively to your master cut for critical releases.</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-rose-500 pt-2 border-t border-[#F5F5F7]">24 – 48 Hours</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}