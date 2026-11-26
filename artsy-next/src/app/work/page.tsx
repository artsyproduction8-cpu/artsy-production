import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import WorkClient from './WorkClient';
import { breadcrumbSchema, videoObjectSchema } from '@/lib/seo/schemas';
import { getEnrichedPortfolioVideos } from '@/lib/portfolio';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Portfolio — Cinematic Reels & Films | Artsy Production',
  description:
    "Explore Artsy Production's cinematic video editing, color grading, and commercial reels for luxury weddings, direct-to-consumer brands, and corporate cinema.",
  alternates: {
    canonical: 'https://artsyproduction.com/work',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Portfolio — Cinematic Reels & Films | Artsy Production',
    description:
      "Explore Artsy Production's cinematic video editing, color grading, and commercial reels for luxury weddings, brands, and corporate cinema.",
    url: 'https://artsyproduction.com/work',
    siteName: 'Artsy Production',
    images: [
      {
        url: 'https://artsyproduction.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'Artsy Production Portfolio',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio — Cinematic Reels & Films | Artsy Production',
    description: "Explore Artsy Production's cinematic video editing, color grading, and commercial reels.",
    images: ['https://artsyproduction.com/logo.png'],
  },
};

export default async function WorkPage() {
  const dbVideos = await getEnrichedPortfolioVideos();

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

  const videoSchemas = dbVideos.map((item) =>
    videoObjectSchema({
      name: item.title,
      description: (item.description || item.title).slice(0, 150),
      thumbnailUrl: item.thumbnail_url || (item.youtube_id ? `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg` : ''),
      uploadDate: item.created_at || '2026-01-01T00:00:00Z',
      duration: 'PT3M30S',
      contentUrl: item.video_url || undefined,
      embedUrl: item.youtube_id ? `https://www.youtube-nocookie.com/embed/${item.youtube_id}` : undefined,
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
        <WorkClient initialVideos={dbVideos} />
      </main>

      {/* 06. Studio Footer */}
      <Footer />
    </div>
  );
}
