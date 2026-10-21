import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import CreatorsClient from './CreatorsClient';
import { breadcrumbSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Film Editors & Colorists | Artsy',
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
    name: 'Film Editors & Colorists | Artsy',
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

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Hero Header with Expanded Editorial Copy */}
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1D1D1F] leading-tight">
            Film Editors &amp; Colorists
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#86868B] max-w-2xl mx-auto leading-relaxed">
            Every editor and colorist in our collective is rigorously evaluated across technical color science, auditory storytelling, and deadline discipline. We reject 97% of applicants so you never have to gamble on quality.
          </p>
        </div>

        {/* Creator Recruitment Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-xs mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-[#1D1D1F] mb-1">
              Are You a Video Editor?
            </div>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Join the Artsy creator team. Get regular client projects, clear instructions, and quick bank payouts for every video you edit.
            </p>
          </div>
          <Link
            href="/freelancer/onboarding"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <span>Apply as a Creator</span>
            <span>→</span>
          </Link>
        </div>

        {/* Interactive Filtering & Roster */}
        <CreatorsClient />
      </main>

      <Footer />
    </div>
  );
}
