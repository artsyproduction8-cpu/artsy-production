import type { Metadata } from 'next';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';
import WorkClient, { PortfolioVideo } from './WorkClient';
import { breadcrumbSchema, videoObjectSchema } from '@/lib/seo/schemas';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portfolio — Cinematic Reels | Artsy Production',
  description: "Explore Artsy Production's cinematic video editing, color grading, and commercial reels for luxury weddings, direct-to-consumer brands, and corporate cinema.",
  alternates: {
    canonical: '/work',
  },
};

async function getCompanyPortfolio(): Promise<PortfolioVideo[]> {
  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return [];
  }

  try {
    let { data: samples, error } = await dbClient
      .from('portfolio_samples')
      .select('id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, created_at')
      .is('creator_id', null)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error && dbClient !== anonSupabase && anonSupabase) {
      console.warn('[Public /work Warning] Primary dbClient failed, falling back to anon client:', error.message);
      const fb = await anonSupabase
        .from('portfolio_samples')
        .select('id, title, description, category, video_url, thumbnail_url, youtube_id, display_order, created_at')
        .is('creator_id', null)
        .eq('is_visible', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!fb.error && fb.data) {
        samples = fb.data;
        error = null;
      }
    }

    if (error) {
      console.error('[Public /work GET Error]', error);
      return [];
    }

    const BLOCKED_YOUTUBE_IDS = ['dQw4w9WgXcQ', 'test087694'];
    return (samples || [])
      .filter((s: any) => s.youtube_id && !BLOCKED_YOUTUBE_IDS.includes(s.youtube_id) && (s.approval_status === undefined || s.approval_status === 'approved'))
      .map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description || null,
      category: s.category || 'Wedding Cinema',
      video_url: s.video_url,
      thumbnail_url: s.thumbnail_url || (s.youtube_id ? `https://img.youtube.com/vi/${s.youtube_id}/hqdefault.jpg` : ''),
      youtube_id: s.youtube_id || '',
      display_order: s.display_order ?? 0,
      created_at: s.created_at,
    }));
  } catch (err) {
    console.error('[Public /work GET Error]', err);
    return [];
  }
}

export default async function WorkPage() {
  const dbVideos = await getCompanyPortfolio();

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

  const videoSchemas = dbVideos.map((item: any) =>
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
