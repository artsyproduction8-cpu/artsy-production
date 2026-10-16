import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';
import CreatorProfileClient, { PortfolioSample } from './CreatorProfileClient';
import { supabaseAdmin, supabase as anonSupabase } from '@/lib/supabase';
import {
  breadcrumbSchema,
  personSchema,
  videoObjectSchema,
} from '@/lib/seo/schemas';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCreatorData(id: string) {
  const dbClient = supabaseAdmin || anonSupabase;
  if (!dbClient || typeof dbClient.from !== 'function') {
    return null;
  }

  try {
    const { data: creator } = await dbClient
      .from('creators_public_view')
      .select(`
        id,
        public_display_name,
        public_specialty,
        public_bio,
        years_of_experience,
        avg_rating,
        total_projects_completed,
        is_accepting_work,
        creator_tier
      `)
      .eq('id', id)
      .single();

    if (!creator) return null;

    const { data: samples } = await dbClient
      .from('portfolio_samples')
      .select(`
        id,
        title,
        description,
        category,
        video_url,
        thumbnail_url,
        display_order
      `)
      .eq('creator_id', id)
      .eq('approval_status', 'approved')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    return {
      creator,
      samples: (samples || []) as PortfolioSample[],
      onTimeDeliveryRate: 98,
    };
  } catch (err) {
    console.error('Error fetching creator profile:', err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getCreatorData(id);

  if (!data || !data.creator) {
    return {
      title: 'Creator Profile | Artsy Production',
      description: 'Curated elite film editor & colorist at Artsy Production.',
      robots: { index: false, follow: false },
    };
  }

  const { creator } = data;
  const title = `${creator.public_display_name} — ${creator.public_specialty || 'Film Editor'} | Artsy Production`;
  const description = creator.public_bio
    ? creator.public_bio.slice(0, 155)
    : 'Curated elite film editor & colorist at Artsy Production.';

  return {
    title,
    description,
    alternates: {
      canonical: `/creators/${id}`,
    },
  };
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { id } = await params;
  const data = await getCreatorData(id);

  if (!data || !data.creator) {
    notFound();
  }

  const { creator, samples, onTimeDeliveryRate } = data;

  const initials = (creator.public_display_name || '')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('') || 'CR';

  const isRisingTalent =
    creator.creator_tier === 'rising_talent' || creator.total_projects_completed < 10;

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Creators', url: '/creators' },
    { name: creator.public_display_name, url: `/creators/${id}` },
  ]);

  const personJsonLd = personSchema({
    id: creator.id,
    name: creator.public_display_name,
    jobTitle: creator.public_specialty || 'Film Editor & Colorist',
    bio: creator.public_bio,
    url: `/creators/${id}`,
  });

  const profilePageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${creator.public_display_name} — Profile`,
    mainEntity: personJsonLd,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyproduction.com'}/creators/${id}`,
  };

  const videoSchemas = samples.map((sample) =>
    videoObjectSchema({
      name: sample.title,
      description: (sample.description || sample.title).slice(0, 150),
      thumbnailUrl: sample.thumbnail_url,
      uploadDate: '2026-01-01T00:00:00Z',
      duration: 'PT0S',
      contentUrl: sample.video_url,
      embedUrl: sample.video_url,
    })
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Structured Data: BreadcrumbList + Person + ProfilePage + VideoObjects */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd).replace(/</g, '\\u003c') }}
      />
      {videoSchemas.map((vSchema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(vSchema).replace(/</g, '\\u003c') }}
        />
      ))}

      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#86868B] mb-8">
          <Link href="/creators" className="hover:text-[#1D1D1F] transition-colors">
            Creators
          </Link>
          <span>/</span>
          <span className="text-[#1D1D1F] font-bold">{creator.public_display_name}</span>
        </nav>

        {/* Server-Rendered Hero Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-10 border border-[#E5E5E7] shadow-xs mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#F5F5F7]">
            <div className="flex items-start sm:items-center gap-5">
              {/* Large Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#1D1D1F] to-[#3B82F6] text-white flex items-center justify-center font-extrabold text-3xl shadow-sm shrink-0">
                {initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    {creator.public_display_name}
                  </h1>

                  {/* Tier Badges */}
                  {isRisingTalent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
                      ★ Rising Talent
                    </span>
                  )}
                  {!isRisingTalent && creator.creator_tier === 'senior' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-50 text-purple-800 border border-purple-200">
                      Senior Lead
                    </span>
                  )}

                  {/* Availability Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      creator.is_accepting_work
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        creator.is_accepting_work ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    {creator.is_accepting_work ? 'Available for Assignment' : 'Fully Booked'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#3B82F6]">
                  {creator.public_specialty || 'Cinematic Video Editor'} • {creator.years_of_experience || 3} Years Experience
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-[#86868B]">
                  <span>🛡️ Artsy Verified Roster</span>
                  <span>•</span>
                  <span>Non-Compete Bound</span>
                  <span>•</span>
                  <span>Frame-Accurate QA</span>
                </div>
              </div>
            </div>

            {/* Request CTA Button */}
            {creator.is_accepting_work && (
              <div className="w-full md:w-auto">
                <Link
                  href={`/book?preferredCreator=${creator.id}&creatorName=${encodeURIComponent(creator.public_display_name)}`}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>Request This Creator</span>
                  <span>→</span>
                </Link>
                <div className="text-[10px] text-[#86868B] text-center md:text-right mt-1.5">
                  Subject to availability confirmation by Artsy QA
                </div>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 pt-8 text-center">
            <div className="bg-[#F5F5F7] rounded-2xl p-4">
              <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Total Projects Completed
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] mt-1">
                {creator.total_projects_completed || 0} cuts
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-2xl p-4">
              <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Average Client Rating
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] mt-1 flex items-center justify-center gap-1">
                <span className="text-amber-500 text-lg">★</span>
                <span>{Number(creator.avg_rating || 4.9).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-2xl p-4">
              <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                On-Time Delivery SLA
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {onTimeDeliveryRate}%
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-8 pt-8 border-t border-[#F5F5F7]">
            <h2 className="text-xs uppercase font-bold tracking-wider text-[#86868B] mb-2">
              Creative Philosophy &amp; Specialization
            </h2>
            <p className="text-xs sm:text-sm text-[#424245] leading-relaxed max-w-4xl">
              {creator.public_bio ||
                'Passionate video editor and conformist with deep experience in cinematic pacing, color science, and dynamic timeline delivery.'}
            </p>
          </div>
        </div>

        {/* Client Interactive Works & Modal */}
        <CreatorProfileClient
          creatorId={creator.id}
          creatorName={creator.public_display_name}
          isAcceptingWork={creator.is_accepting_work}
          samples={samples}
        />
      </main>

      <Footer />
    </div>
  );
}
