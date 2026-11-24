'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import StudioVideoModal, { ModalVideoItem } from '../components/marketing/StudioVideoModal';

interface FAQItem {
  question: string;
  answer: string;
}

interface PreWeddingSeoClientProps {
  faqs: FAQItem[];
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const SAMPLES = [
  {
    id: 'pw1',
    category: 'Destination Romance',
    title: 'Anoop & Ansa — Scenic Mountain Romance',
    description: 'Mountain landscape pre-wedding film edited with gentle pacing, smooth speed ramps, and natural contrast.',
    turnaround: '5 Working Days',
    image: getStreamUrl('thumbnails/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_preview.mp4'),
    masterUrl: getStreamUrl('Pre wedding/ANOOP & ANSA pre wedding Low Res.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Color Grading', value: 'Rec.709 Natural Mountain LUT' },
      { label: 'Turnaround', value: '5 Working Days' },
    ],
  },
  {
    id: 'pw2',
    category: 'Heritage & Sunset',
    title: 'Akshay & Gauri — Sunset Heritage Romance',
    description: 'Outdoor pre-wedding visual narrative with cinematic drone pacing, warm backlight skin tones, and lyrical music sync.',
    turnaround: '5 Working Days',
    image: getStreamUrl('thumbnails/Pre_wedding/Akshay_Pre_wedding_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/Akshay_Pre_wedding_Low_preview.mp4'),
    masterUrl: getStreamUrl('Pre wedding/Akshay Pre wedding Low.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Drone Sync', value: '4K Speed-Ramped Flow' },
      { label: 'Audio Design', value: 'Ambient Foliage & Music Bed' },
    ],
  },
  {
    id: 'pw3',
    category: 'Coastal Destination',
    title: 'Matan & Lihi — Coastal Destination Love Story',
    description: 'Coastal destination love story featuring dynamic speed ramps, ocean sunset grading, and intimate dialogue conform.',
    turnaround: '5 Working Days',
    image: getStreamUrl('thumbnails/Pre_wedding/Matan___Lihi_cine_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/Matan___Lihi_cine_Low_preview.mp4'),
    masterUrl: getStreamUrl('Pre wedding/Matan & Lihi cine Low.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Edit Style', value: 'Rhythmic Ocean Flow' },
      { label: 'Master Codec', value: 'ProRes 422 4K Export' },
    ],
  },
];

const REELS_DATA = [
  {
    id: 'r1',
    title: 'Anoop & Ansa — Viral Wedding Reel',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/ANOOP___ANSA_REEL_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/ANOOP___ANSA_REEL_low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/ANOOP & ANSA REEL low.mp4'),
    description: 'High-energy vertical wedding reel conformed with quick cuts, licensed soundtrack beats, and natural color grading.',
  },
  {
    id: 'r2',
    title: 'Akash — Groom Entry & Celebration',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Akash_Reel_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Akash_Reel_Low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Akash Reel Low.mp4'),
    description: 'Dynamic groom entry celebration reel conformed for maximum social retention and viral Instagram engagement.',
  },
  {
    id: 'r3',
    title: 'Akshay & Gauri — Romantic Wedding Reel',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Akshay___Gauri_Reel__2__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Akshay___Gauri_Reel__2__Low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Akshay & Gauri Reel (2) Low.mp4'),
    description: 'Romantic couple portrait reel featuring golden hour backlight, emotional pacing, and clean color tone balance.',
  },
  {
    id: 'r4',
    title: 'Shweta — Bridal Solo Highlights',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Shweta_Reel_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Shweta_Reel_Low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Shweta Reel Low.mp4'),
    description: 'Elegant bridal solo portrait film capturing jewelry details, traditional attire, and candid smiles.',
  },
  {
    id: 'r5',
    title: 'Kuhu — Haldi Celebration Vibe',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Kuhu_Haldi_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Kuhu_Haldi_Reel_low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Kuhu Haldi Reel low.mp4'),
    description: 'Vibrant haldi ritual reel conformed with joyful color science, rhythmic musical cadence, and authentic emotions.',
  },
  {
    id: 'r6',
    title: 'Anroop & Jeemol — Wedding Highlights',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Anroop___Jeemol_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Anroop___Jeemol_Reel_low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Anroop & Jeemol Reel low.mp4'),
    description: 'Fast-paced ceremony recap reel conformed for mobile displays with cinematic speed transitions.',
  },
  {
    id: 'r7',
    title: 'Monish & Jisha — Cinematic Couple Reel',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Monish___Jisha_Reel__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Monish___Jisha_Reel__Low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Monish & Jisha Reel  Low.mp4'),
    description: 'Intimate candid couple moments conformed with gentle slow motion and warm filmic skin tones.',
  },
  {
    id: 'r8',
    title: 'Sanket & Rutuja — Sangeet Night Reel',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__preview.mp4'),
    masterUrl: getStreamUrl('Reel/Sanket & Rutuja - Sangeet Reel Low .mp4'),
    description: 'Electric dance floor energy and live choreography cut to high-tempo wedding music beats.',
  },
];

const TRACK_REELS = [...REELS_DATA, ...REELS_DATA, ...REELS_DATA];

const PACKAGES = [
  {
    name: 'Cinematic Teaser Cut',
    badge: 'QUICK PREMIERE',
    turnaround: '5 Working Days',
    price: '₹2,000',
    period: 'per film',
    description: 'High-impact 60–90 second teaser designed for Save-the-Date announcements and Instagram premiere.',
    points: [
      '60–90 Second Cinematic Teaser (16:9 & 9:16)',
      'Drone sweep speed ramping & stabilization',
      'Atmospheric licensed musical scoring',
      'Rec.709 film print LUT color grading',
      'Ambient audio Foley design (Wind, Ocean, Waves)',
      '1 Free Revision Round included',
      '4K ProRes Master + Social Export',
    ],
    popular: false,
    ctaText: 'Book Teaser Cut',
    ctaHref: '/book?category=wedding&sub=teaser-only',
  },
  {
    name: 'Narrative Story Film',
    badge: 'MOST POPULAR',
    turnaround: '5 Working Days',
    price: '₹5,000',
    period: 'per film',
    description: 'Full 3–5 minute cinematic love story with emotional pacing, dialogue sync, and scenic transitions.',
    points: [
      '3–5 Minute Narrative Pre-Wedding Film',
      'Dual-format master: 16:9 Widescreen + 9:16 Cut',
      'Vocal dialogue sync & acoustic cleanup',
      'Color tone matching across drone & ground cameras',
      'Full licensed orchestral / acoustic scoring',
      '1 Free Revision Round included',
      'Full 4K Master Deliverable',
    ],
    popular: true,
    ctaText: 'Book Story Film',
    ctaHref: '/book?category=wedding&sub=highlight-teaser',
  },
  {
    name: 'Complete Destination Suite',
    badge: 'FULL SUITE',
    turnaround: '5 Working Days',
    price: '₹8,000',
    period: 'complete package',
    description: 'Comprehensive destination pre-wedding package including full film, cinematic teaser, and viral social reel.',
    points: [
      '3–5 Minute Extended Love Story Film',
      '60 Second Cinematic Teaser Cut',
      '30–60 Second Vertical Instagram Reel (9:16)',
      'Complete drone footage & gimbal stabilization',
      'Multi-track audio sound design & dialogue polish',
      '1 Free Revision Round included',
      'Dual-format master delivery package',
    ],
    popular: false,
    ctaText: 'Book Destination Suite',
    ctaHref: '/book?category=wedding&sub=trinity-bundle',
  },
];

function LoopingReelVideo({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }, [src]);

  return (
    <>
      <img
        src={poster}
        alt=""
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-xl sm:rounded-2xl"
      />
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-xl sm:rounded-2xl transition-transform duration-700 group-hover:scale-105"
      />
    </>
  );
}

export default function PreWeddingSeoClient({ faqs }: PreWeddingSeoClientProps) {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });
  const [modalVideo, setModalVideo] = useState<ModalVideoItem | null>(null);
  const [startTime, setStartTime] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const toggleFaq = (idx: number) => {
    setOpenMap((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleOpenMaster = (
    item: {
      title: string;
      category?: string;
      masterUrl: string;
      videoUrl: string;
      image: string;
      description?: string;
      aspect?: '16/9' | '9/16';
    },
    idx?: number,
    isReel?: boolean
  ) => {
    let curTime = 0;
    if (idx !== undefined && videoRefs.current[idx] && videoRefs.current[idx]!.currentTime > 0) {
      curTime = videoRefs.current[idx]!.currentTime;
    }
    setStartTime(curTime);
    setModalVideo({
      title: item.title,
      category: item.category || 'Pre-Wedding Cinema',
      videoUrl: item.masterUrl || item.videoUrl,
      poster: item.image,
      aspect: isReel ? '9/16' : (item.aspect || '16/9'),
      description: item.description,
    });
  };

  return (
    <div className="w-full bg-white text-[#1D1D1F] font-sans antialiased">
      {/* 1. HERO SECTION */}
      <section className="relative w-full bg-white pt-10 pb-12 sm:pt-24 sm:pb-16 overflow-hidden border-b-0 sm:border-b border-[#F5F5F7]">
        <div
          aria-hidden="true"
          className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.035] text-[#1D1D1F] text-[110px] lg:text-[180px] font-extrabold whitespace-nowrap tracking-tighter leading-none z-0"
        >
          ROMANCE // 24FPS
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="flex flex-col items-start max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1D1D1F] tracking-tight max-w-none leading-tight sm:leading-tight">
              <span className="block">Pre-Wedding &amp; Love Story</span>
              <span className="inline-block relative mt-1 sm:mt-1.5 pb-1 sm:pb-2 text-[#2563EB]">
                Video Editing For Photographers
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#3B82F6]/80 rounded-full" />
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-[#6E6E73] font-normal leading-relaxed sm:leading-[1.6] max-w-2xl">
              Turn your destination shoots into cinematic couple films. We conform your drone sweeps, speed ramp movements, balance golden hour skin tones, and deliver in 5 days.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/book?category=wedding&sub=highlight-teaser"
                className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm hover:scale-[1.01]"
              >
                Book an Edit (From ₹2,000) →
              </Link>
              <a
                href="#pricing"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] font-semibold text-xs sm:text-sm transition-all"
              >
                View Packages
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="w-full py-8 sm:py-12 bg-[#F5F5F7] border-b border-[#E5E5E7]/50" id="workflow">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">1. Share Your Destination Files</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  Send your Google Drive or Dropbox link with your camera cards and drone footage.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">2. Pacing, Speed Ramps &amp; Grading</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  We select best takes, match landscape colors, apply speed ramps, and design gentle acoustic soundscapes.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">3. Review &amp; 4K Master Delivery</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  Watch your preview draft, request any adjustments, and download uncompressed 4K master deliverables.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTINUOUS AUTO-PLAYING REELS RIBBON */}
      <section className="w-full py-4 sm:py-6 bg-[#0A0A0A] text-white border-y border-white/[0.08] overflow-hidden relative select-none" id="reels">
        <div className="relative w-full overflow-hidden flex">
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

          {/* Track 1 */}
          <div className="animate-marquee-twin flex shrink-0 items-center gap-2 sm:gap-2.5 pr-2 sm:pr-2.5 py-1">
            {TRACK_REELS.map((reel, rIdx) => (
              <div
                key={`pw-t1-${reel.id}-${rIdx}`}
                onClick={() => handleOpenMaster(reel, undefined, true)}
                className="relative flex-shrink-0 w-[120px] sm:w-[145px] md:w-[165px] aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-[#141414] border border-white/15 shadow-[0_6px_24px_rgba(0,0,0,0.55)] group cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:border-white/40"
              >
                <LoopingReelVideo src={reel.videoUrl} poster={reel.image} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-xs sm:text-sm shadow-xl transition-transform duration-300 group-hover:scale-110">
                    ▶
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Track 2 */}
          <div className="animate-marquee-twin flex shrink-0 items-center gap-2 sm:gap-2.5 pr-2 sm:pr-2.5 py-1" aria-hidden="true">
            {TRACK_REELS.map((reel, rIdx) => (
              <div
                key={`pw-t2-${reel.id}-${rIdx}`}
                onClick={() => handleOpenMaster(reel, undefined, true)}
                className="relative flex-shrink-0 w-[120px] sm:w-[145px] md:w-[165px] aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-[#141414] border border-white/15 shadow-[0_6px_24px_rgba(0,0,0,0.55)] group cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:border-white/40"
              >
                <LoopingReelVideo src={reel.videoUrl} poster={reel.image} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-xs sm:text-sm shadow-xl transition-transform duration-300 group-hover:scale-110">
                    ▶
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. RECENT PRE-WEDDING SHOWCASE */}
      <section className="w-full py-10 sm:py-16 bg-[#F5F5F7]" id="showcase">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
              Recent completed pre-wedding films
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
              Scenic destinations conformed with natural skin tone grades, fluid speed ramps, and bespoke musical scoring.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            {SAMPLES.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)]"
              >
                <div
                  onClick={() => handleOpenMaster(item, idx, false)}
                  className="lg:col-span-6 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-black cursor-pointer group select-none"
                  title={`Click to watch ${item.title} in full studio master player`}
                >
                  <div className="relative w-full h-full min-h-[260px]">
                    <video
                      ref={(el) => {
                        videoRefs.current[idx] = el;
                      }}
                      src={item.videoUrl}
                      poster={item.image}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        ▶
                      </div>
                      <span className="mt-2 text-xs font-semibold text-white tracking-wider uppercase drop-shadow-md">
                        Play Full Master
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between gap-5 bg-white">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] leading-snug">
                      <button
                        type="button"
                        onClick={() => handleOpenMaster(item, idx, false)}
                        className="text-left hover:text-[#3B82F6] transition-colors focus:outline-none cursor-pointer"
                      >
                        {item.title}
                      </button>
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#86868B] font-normal">
                      {item.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-[#F5F5F7]">
                      {item.meta.map((m, mIdx) => (
                        <div key={mIdx}>
                          <div className="text-[10px] text-[#86868B] uppercase font-semibold">
                            {m.label}
                          </div>
                          <div className="text-xs font-bold text-[#1D1D1F] mt-0.5">
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-[#F5F5F7]">
                    <button
                      type="button"
                      onClick={() => handleOpenMaster(item, idx, false)}
                      className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      ▶ Watch Master Film
                    </button>
                    <Link
                      href="/book?category=wedding&sub=highlight-teaser"
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] text-xs font-bold transition-all"
                    >
                      Book This Edit Style →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING & PACKAGES */}
      <section className="w-full py-12 sm:py-16 bg-white" id="pricing">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
              Transparent pre-wedding packages
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
              Every edit includes 4K ProRes exports, drone stabilization, speed ramps, and 1 free revision round.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-[#1D1D1F] text-white shadow-2xl scale-[1.02] border border-white/20'
                    : 'bg-[#F9F9FB] text-[#1D1D1F] border border-[#E5E5E7] hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        pkg.popular
                          ? 'bg-[#3B82F6] text-white'
                          : 'bg-white text-[#6E6E73] border border-[#E5E5E7]'
                      }`}
                    >
                      {pkg.badge}
                    </span>
                    <span className={`text-xs ${pkg.popular ? 'text-white/70' : 'text-[#86868B]'}`}>
                      {pkg.turnaround}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold tracking-tight">{pkg.name}</h3>
                  <p className={`text-xs mt-1.5 leading-relaxed ${pkg.popular ? 'text-white/80' : 'text-[#6E6E73]'}`}>
                    {pkg.description}
                  </p>

                  <div className="mt-5 pb-5 border-b border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight">{pkg.price}</span>
                      <span className={`text-xs ${pkg.popular ? 'text-white/60' : 'text-[#86868B]'}`}>
                        / {pkg.period}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-xs">
                    {pkg.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className={`font-bold mt-0.5 ${pkg.popular ? 'text-[#3B82F6]' : 'text-emerald-600'}`}>
                          ✓
                        </span>
                        <span className={pkg.popular ? 'text-white/90' : 'text-[#424245]'}>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href={pkg.ctaHref}
                    className={`block w-full py-3.5 px-4 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      pkg.popular
                        ? 'bg-[#3B82F6] hover:bg-blue-600 text-white shadow-lg'
                        : 'bg-[#1D1D1F] hover:bg-black text-white'
                    }`}
                  >
                    {pkg.ctaText} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="w-full py-12 sm:py-16 bg-[#F5F5F7] border-t border-[#E5E5E7]" id="faq">
        <div className="max-w-[800px] mx-auto px-6 sm:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
              Frequently asked questions
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868B]">
              Everything you need to know about drone footage, music, and destination turnaround.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#E5E5E7] p-5 shadow-xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-[#1D1D1F] hover:text-[#3B82F6] transition-colors cursor-pointer"
                >
                  <span>{f.question}</span>
                  <span className="text-[#3B82F6] text-lg leading-none ml-4 font-normal">
                    {openMap[i] ? '−' : '+'}
                  </span>
                </button>
                {openMap[i] && (
                  <p className="mt-3 text-xs sm:text-sm text-[#6E6E73] leading-relaxed pt-3 border-t border-[#F5F5F7]">
                    {f.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA STRIP */}
      <section className="w-full py-14 sm:py-20 bg-white border-t border-[#E5E5E7] text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
            Ready to edit your couple’s love story?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
            Send us your footage link and our senior editors will begin cutting your destination film.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book?category=wedding&sub=highlight-teaser"
              className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm"
            >
              Book an Edit (From ₹2,000) →
            </Link>
            <a
              href="https://wa.me/918369251112"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] font-semibold text-xs sm:text-sm transition-all inline-flex items-center gap-2"
            >
              Chat on WhatsApp ↗
            </a>
          </div>
        </div>
      </section>

      {/* Studio Master Modal Player */}
      <StudioVideoModal
        video={modalVideo}
        onClose={() => setModalVideo(null)}
        startTime={startTime}
      />
    </div>
  );
}
