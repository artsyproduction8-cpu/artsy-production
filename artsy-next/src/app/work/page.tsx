import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import WorkClient from './WorkClient';
import { PORTFOLIO_ITEMS } from './portfolio-data';
import { breadcrumbSchema, videoObjectSchema } from '@/lib/seo/schemas';

export const metadata: Metadata = {
  title: 'Portfolio — Cinematic Reels | Artsy Production',
  description: "Explore Artsy Production's cinematic video editing, color grading, and commercial reels for luxury weddings, direct-to-consumer brands, and corporate cinema.",
  alternates: {
    canonical: '/work',
  },
};

export default function WorkPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Portfolio', url: '/work' },
  ]);

  const collectionPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Portfolio — Cinematic Reels | Artsy Production',
    description: "Explore Artsy Production's cinematic video editing, color grading, and commercial reels.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/work`,
  };

  const videoSchemas = PORTFOLIO_ITEMS.map((item) =>
    videoObjectSchema({
      name: item.title,
      description: item.description.slice(0, 150),
      thumbnailUrl: item.image,
      uploadDate: '2026-01-01T00:00:00Z',
      duration: 'PT0S', // TODO: populate exact ISO duration from video asset metadata
      contentUrl: item.videoUrl ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}${item.videoUrl}` : undefined,
      embedUrl: item.videoUrl ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}${item.videoUrl}` : undefined,
    })
  );

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Structured Data: BreadcrumbList + CollectionPage + VideoObjects */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      {videoSchemas.map((vSchema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vSchema) }}
        />
      ))}

      {/* 00. Top Navigation */}
      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-clip flex-1">
        <WorkClient />
      </main>

      {/* 06. Studio Footer */}
      <Footer />
    </div>
  );
}
