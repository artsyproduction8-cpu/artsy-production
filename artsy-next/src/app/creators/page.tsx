import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import CreatorsClient from './CreatorsClient';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Our Creators — Film Editors & Colorists | Artsy',
  description:
    "Meet Artsy Production's curated roster of elite film editors, colorists, and sound designers. Vetted talent for weddings, commercials, and corporate cinema.",
  alternates: {
    canonical: '/creators',
  },
};

export default function PublicCreatorsPage() {
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Creators', url: '/creators' },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Our Creators — Film Editors & Colorists | Artsy',
    description:
      "Meet Artsy Production's curated roster of elite film editors, colorists, and sound designers.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/creators`,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: 3,
    },
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Structured Data: BreadcrumbList + CollectionPage/ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Hero Header with Expanded Editorial Copy */}
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold uppercase tracking-wider mb-3">
            The Top 3% Creative Network
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1D1D1F] leading-tight">
            Our Creators — Film Editors &amp; Colorists
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#86868B] max-w-2xl mx-auto leading-relaxed">
            Every editor and colorist in our collective is rigorously evaluated across technical color science, auditory storytelling, and deadline discipline. We reject 97% of applicants so you never have to gamble on quality.
          </p>
        </div>

        {/* Curation & Standards Spotlight Banner (300+ words requirement) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs mb-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider mb-1">
                Rigorous Auditing
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F] mb-1.5">
                Multi-Stage Portfolio Vetting
              </h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Candidates undergo blind timeline stress-tests. We evaluate their RAW conform skills, organizational discipline, multi-camera audio syncing, and cut efficiency under compressed turnaround windows.
              </p>
            </div>

            <div>
              <div className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider mb-1">
                Engineering Discipline
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F] mb-1.5">
                Color Science &amp; Audio Mastery
              </h3>
              <p className="text-xs text-[#86868B] leading-relaxed">
                Our talent works fluently in ACES, DaVinci Wide Gamut, and Rec.709 color spaces, with proven proficiency in spectral audio restoration, dialogue balancing, and multi-stem audio deliverables.
              </p>
            </div>

            <div className="bg-[#F5F5F7] p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#1D1D1F] mb-1">
                  Are You an Elite Video Editor?
                </div>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Join Artsy&apos;s curated roster. Receive steady premium projects, dedicated account management, and prompt milestone payouts.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/freelancer/onboarding"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:underline"
                >
                  <span>Apply as an Artsy Creator</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Pillars of Vetting Criteria */}
          <div className="pt-6 border-t border-[#F5F5F7]">
            <h3 className="text-sm font-bold text-[#1D1D1F] mb-3">
              What Every Artsy Creator is Vetted &amp; Certified For:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] space-y-1">
                <div className="font-bold text-[#1D1D1F]">1. Color Science</div>
                <div className="text-[#86868B]">CST transform pipelines, ACEScc color conforming, and skin-tone protection masks.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] space-y-1">
                <div className="font-bold text-[#1D1D1F]">2. Audio Spectral Repair</div>
                <div className="text-[#86868B]">iZotope RX denoise, multi-track speech sync, and broadcast loudness compliance.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] space-y-1">
                <div className="font-bold text-[#1D1D1F]">3. Pacing &amp; Emotion</div>
                <div className="text-[#86868B]">Eyeline-matched cutting, rhythm-locked b-roll assembly, and genre-specific narrative arcs.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] space-y-1">
                <div className="font-bold text-[#1D1D1F]">4. SLA Discipline</div>
                <div className="text-[#86868B]">Strict milestone adherence, frame-accurate revision delivery, and non-disclosure compliance.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Filtering & Roster */}
        <CreatorsClient />
      </main>

      <Footer />
    </div>
  );
}
