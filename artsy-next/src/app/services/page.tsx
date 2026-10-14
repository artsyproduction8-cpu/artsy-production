import type { Metadata } from 'next';
import Link from 'next/link';
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold uppercase tracking-wider mb-3">
              Cinematic Suites &amp; SLAs
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Video Post-Production Services
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#86868B] leading-relaxed">
              Transparent unit pricing, precision turnaround SLAs, and deterministic post-engineering by vetted senior film editors and colorists. From multi-cam wedding epics to viral DTC commercial cuts, every project passes rigorous quality benchmarks before release.
            </p>
          </div>

          {/* Interactive Catalog Component */}
          <ServicesClient />

          {/* Expanded Editorial Content: 5-Stage Process */}
          <section className="mt-16 pt-12 border-t border-[#E5E5E7]">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                Our 5-Stage Post-Production Pipeline
              </h2>
              <p className="mt-2 text-sm text-[#86868B] leading-relaxed">
                We engineered our studio workflow to eliminate creative friction and revision lag. Every project progresses through five specialized production stages handled by dedicated craft specialists.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                {
                  step: '01',
                  title: 'Ingest & Checksum',
                  desc: 'High-speed cloud ingestion with MD5 hash validation, multi-camera audio sync, proxy generation, and camera profile normalization.',
                },
                {
                  step: '02',
                  title: 'Story Assembly',
                  desc: 'Pacing-driven narrative assembly by vetted genre-specific editors. Dialogue curation, b-roll weaving, and rhythm-locked pacing.',
                },
                {
                  step: '03',
                  title: 'Color Science',
                  desc: 'DaVinci Resolve Studio color conforming in ACEScc or DaVinci Wide Gamut. Matching multi-brand camera packages with cinema print film LUTs.',
                },
                {
                  step: '04',
                  title: 'Sound Architecture',
                  desc: 'Dialogue spectral denoising with iZotope RX, acoustic leveling, bespoke foley design, and licensed music mastering with dynamic sub-bass.',
                },
                {
                  step: '05',
                  title: 'Master Packaging',
                  desc: 'ProRes 422 HQ archives, optimized H.264/H.265 social web masters, vertical 9:16 cutdowns, clean subtitle burn-ins, and chapter markers.',
                },
              ].map((item) => (
                <div key={item.step} className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
                  <div className="text-xl font-mono font-bold text-[#3B82F6] mb-2">{item.step}</div>
                  <h3 className="text-base font-bold text-[#1D1D1F] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Turnaround & SLAs Section */}
          <section className="mt-16 pt-12 border-t border-[#E5E5E7]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Deterministic Delivery
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                  Turnaround Times &amp; Guaranteed SLAs
                </h2>
                <p className="text-sm text-[#86868B] leading-relaxed">
                  Video deadlines are non-negotiable. Whether preparing for a scheduled commercial campaign launch, film festival premiere, or urgent brand social release, Artsy guarantees deterministic delivery timelines backed by automated SLA monitors.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-xl bg-white border border-[#E5E5E7]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-[#1D1D1F]">Standard Production SLA</span>
                      <span className="text-xs font-mono font-bold text-[#3B82F6]">5 – 7 Business Days</span>
                    </div>
                    <p className="text-xs text-[#86868B]">Comprehensive multi-stage editing, grading, sound mastering, and 2 included review rounds.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#E5E5E7]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-[#1D1D1F]">Expedited Fast-Track SLA</span>
                      <span className="text-xs font-mono font-bold text-[#3B82F6]">3 – 4 Business Days</span>
                    </div>
                    <p className="text-xs text-[#86868B]">Priority queue placement with concurrent colorist and sound supervisor assignment.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#E5E5E7]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-[#1D1D1F]">Emergency Rush 24-48h SLA</span>
                      <span className="text-xs font-mono font-bold text-rose-500">24 – 48 Hours</span>
                    </div>
                    <p className="text-xs text-[#86868B]">Overnight sprint teams dedicated exclusively to your master cut for critical releases.</p>
                  </div>
                </div>
              </div>

              {/* Tools We Use */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-[#1D1D1F]">
                    Industry-Standard Post-Production Tools
                  </h3>
                  <p className="mt-1.5 text-xs text-[#86868B] leading-relaxed">
                    Our creators work natively in industry-leading non-linear editing software and audio engineering workstations to guarantee studio-level fidelity.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { tool: 'DaVinci Resolve Studio 19', role: 'Color Grading & ACES Conform' },
                    { tool: 'Adobe Premiere Pro', role: 'Multi-Cam Assembly & Editorial' },
                    { tool: 'Adobe After Effects', role: 'Motion Design & Kinetic Typography' },
                    { tool: 'Apple Final Cut Pro', role: 'High-Throughput Social Reels' },
                    { tool: 'Pro Tools & iZotope RX', role: 'Spectral Repair & Stem Mixing' },
                    { tool: 'Frame.io Collaboration', role: 'Timecode-Accurate Cloud Reviews' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#F5F5F7] space-y-1">
                      <div className="text-xs font-bold text-[#1D1D1F]">{item.tool}</div>
                      <div className="text-[11px] text-[#86868B]">{item.role}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#F5F5F7] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link
                    href="/work"
                    className="text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1"
                  >
                    <span>View portfolio case studies</span>
                    <span>→</span>
                  </Link>

                  <Link
                    href="/book"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-xs"
                  >
                    Configure Project Quote →
                  </Link>
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