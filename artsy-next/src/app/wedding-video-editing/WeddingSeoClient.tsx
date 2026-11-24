'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import StudioVideoModal, { ModalVideoItem } from '../components/marketing/StudioVideoModal';

interface FAQItem {
  question: string;
  answer: string;
}

interface WeddingSeoClientProps {
  faqs: FAQItem[];
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const SAMPLES = [
  {
    id: 's1',
    category: 'Wedding Highlights',
    title: 'Chandni & Harihar — Grand Reception Film',
    description: 'Multi-camera reception film conformed with live choreography, golden-hour color balancing, and clean dialogue pacing.',
    turnaround: '7–10 Working Days',
    image: getStreamUrl('thumbnails/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Chandni  Harihar’s Reception Film — Shreyas Iyer Steals the Dance Floor.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Color Grading', value: 'Studio Rec.709 Master' },
      { label: 'Turnaround', value: '7–10 Working Days' },
    ],
  },
  {
    id: 's2',
    category: 'Wedding Highlights',
    title: 'Akash & Mayuri — Mumbai Wedding Highlights',
    description: 'Traditional Mumbai wedding capturing rituals and candid moments conformed in Rec.709 color science.',
    turnaround: '7–10 Working Days',
    image: getStreamUrl('thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Akash  Mayuri Wedding Film — Cinematic Highlights  Mumbai Wedding Videographer.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Edit Narrative', value: 'Full Feature & Teaser' },
      { label: 'Deliverables', value: '4K Master + Social Cut' },
    ],
  },
  {
    id: 's3',
    category: 'Pre-Wedding Films',
    title: 'Anoop & Ansa — Scenic Mountain Romance',
    description: 'Mountain landscape pre-wedding film edited with gentle pacing, smooth speed ramps, and natural contrast.',
    turnaround: 'Express Delivery',
    image: getStreamUrl('thumbnails/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_preview.mp4'),
    masterUrl: getStreamUrl('Pre wedding/ANOOP & ANSA pre wedding Low Res.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Post Suite', value: 'Color & Audio Balance' },
      { label: 'Turnaround', value: 'Express Delivery' },
    ],
  },
];

const REELS = [
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

const PACKAGES = [
  {
    name: 'Highlight + Teaser',
    badge: 'MOST POPULAR',
    turnaround: '7–10 Working Days',
    price: '₹5,000',
    period: 'per project',
    description: 'Paced narrative wedding highlight paired with a high-impact cinematic teaser for social premiere.',
    points: [
      '3–5 Minute Narrative Highlight Film (16:9)',
      '45–60 Second Cinematic Teaser (16:9 & 9:16)',
      'Multi-camera audio sync across provided mics',
      'Studio Rec.709 color grading & skin-tone balance',
      'Speech volume leveling & licensed soundtrack mix',
      '1 Free Revision Pass included',
      '4K ProRes Master + Web Export',
    ],
    popular: true,
    ctaText: 'Book Highlight + Teaser',
    ctaHref: '/book?category=wedding&sub=highlight-teaser',
  },
  {
    name: 'Trinity: Highlight + Teaser + Reel',
    badge: 'FULL SUITE',
    turnaround: '7–10 Working Days',
    price: '₹8,000',
    period: 'per project',
    description: 'Complete celebration suite featuring narrative highlight, cinematic teaser, and dedicated vertical reel.',
    points: [
      '3–5 Minute Narrative Highlight Film (16:9)',
      '45–60 Second Cinematic Teaser Cut',
      '30–60 Second Vertical Social Reel (9:16)',
      'Full ceremony speech & vow audio conform',
      'Color matching across all provided camera angles',
      '1 Free Revision Pass included',
      'Dual-format master delivery package',
    ],
    popular: false,
    ctaText: 'Book Trinity Suite',
    ctaHref: '/book?category=wedding&sub=trinity-bundle',
  },
  {
    name: 'Cinematic Story + Teaser + Reel',
    badge: 'ARCHIVAL MASTER',
    turnaround: '7–10 Working Days',
    price: '₹10,000',
    period: 'per project',
    description: 'Comprehensive archival master package with full longform documentary cut plus short social deliverables.',
    points: [
      '10–15 Minute Extended Documentary Story Film',
      '45–60 Second Cinematic Teaser Cut',
      '30–60 Second Vertical Social Reel (9:16)',
      'Complete ceremony & ritual chronological assembly',
      'Archival dialogue matching & master sound design',
      '1 Free Revision Pass included',
      'Full Archival 4K Master Deliverable',
    ],
    popular: false,
    ctaText: 'Book Master Package',
    ctaHref: '/book?category=wedding&sub=master-package',
  },
];

const TRACK_REELS = [...REELS, ...REELS, ...REELS];

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
      {/* 1. Underlying Sharp Rec.709 Frame: Always visible, guarantees ZERO black boxes */}
      <img
        src={poster}
        alt=""
        loading="eager"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-xl sm:rounded-2xl"
      />
      {/* 2. Seamless Auto-playing Looping Video */}
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

export default function WeddingSeoClient({ faqs }: WeddingSeoClientProps) {
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
      category: item.category || 'Wedding Cinema',
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
        {/* Background Ghost Watermark */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.035] text-[#1D1D1F] text-[110px] lg:text-[180px] font-extrabold whitespace-nowrap tracking-tighter leading-none z-0"
        >
          WEDDING // 24FPS
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="flex flex-col items-start max-w-4xl">
            {/* Heading with Artsy Brand Blue Underline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1D1D1F] tracking-tight max-w-none leading-tight sm:leading-tight">
              <span className="block">Wedding Video Editing For</span>
              <span className="inline-block relative mt-1 sm:mt-1.5 pb-1 sm:pb-2 text-[#2563EB]">
                Photographers &amp; Studios
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#3B82F6]/80 rounded-full" />
              </span>
            </h1>

            {/* Editorial Subtext */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-[#6E6E73] font-normal leading-relaxed sm:leading-[1.6] max-w-2xl">
              Send us your raw footage. We organize your clips, sync your audio, balance your colors, and edit your wedding film so you can deliver to your clients on time.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/book?category=wedding&sub=highlight-teaser"
                className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm hover:scale-[1.01]"
              >
                Book an Edit (From ₹5,000) →
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

      {/* 2. HOW IT WORKS (CLEAN & MINIMAL WITHOUT EXTRA TAGS) */}
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
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">1. Share Your Footage</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  Send a Google Drive, Dropbox, or OneDrive link with your camera clips and music choices.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">2. We Edit &amp; Color Grade</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  We select the best takes, sync multi-camera audio, balance skin tones, and cut smoothly to music.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">3. Review &amp; 4K Master</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  Watch your preview draft, request any adjustments, and download full 4K ProRes exports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTINUOUS AUTO-PLAYING WEDDING REELS (SEAMLESS INFINITE MARQUEE) */}
      <section className="w-full py-4 sm:py-6 bg-[#0A0A0A] text-white border-y border-white/[0.08] overflow-hidden relative select-none" id="reels">
        {/* Seamless Moving Marquee Track */}
        <div className="relative w-full overflow-hidden flex">
          {/* Edge Fade Gradients for smooth entrance/exit */}
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

          {/* Track 1 (Primary Sequence) */}
          <div className="animate-marquee-twin flex shrink-0 items-center gap-2 sm:gap-2.5 pr-2 sm:pr-2.5 py-1">
            {TRACK_REELS.map((reel, rIdx) => (
              <div
                key={`t1-${reel.id}-${rIdx}`}
                onClick={() => handleOpenMaster(reel, undefined, true)}
                className="relative flex-shrink-0 w-[120px] sm:w-[145px] md:w-[165px] aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-[#141414] border border-white/15 shadow-[0_6px_24px_rgba(0,0,0,0.55)] group cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:border-white/40"
              >
                <LoopingReelVideo src={reel.videoUrl} poster={reel.image} />
                {/* Glass Play Overlay on Hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-xs sm:text-sm shadow-xl transition-transform duration-300 group-hover:scale-110">
                    ▶
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Track 2 (Identical Twin for 100% Gapless Infinite Loop) */}
          <div className="animate-marquee-twin flex shrink-0 items-center gap-2 sm:gap-2.5 pr-2 sm:pr-2.5 py-1" aria-hidden="true">
            {TRACK_REELS.map((reel, rIdx) => (
              <div
                key={`t2-${reel.id}-${rIdx}`}
                onClick={() => handleOpenMaster(reel, undefined, true)}
                className="relative flex-shrink-0 w-[120px] sm:w-[145px] md:w-[165px] aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-[#141414] border border-white/15 shadow-[0_6px_24px_rgba(0,0,0,0.55)] group cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:border-white/40"
              >
                <LoopingReelVideo src={reel.videoUrl} poster={reel.image} />
                {/* Glass Play Overlay on Hover */}
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

      {/* 4. RECENT EDITS (MATCHING ARTSY PRODUCTION ARCHIVE WITHOUT TAGS) */}
      <section className="w-full py-10 sm:py-16 bg-[#F5F5F7]" id="showcase">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
              Recent completed wedding edits
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
              Real studio deliverables crafted with emotive storytelling, clean color grading, and acoustic precision.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5">
            {SAMPLES.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)]"
              >
                {/* Media Video Pane (Left Column) */}
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

                    {/* Glass Play Overlay on Hover */}
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

                {/* Editorial Data Pane (Right Column) */}
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

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenMaster(item, idx, false)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                      >
                        <span>Watch Master</span>
                        <span>▶</span>
                      </button>
                      <Link
                        href="/work"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                      >
                        <span>Full Portfolio</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Metadata Specification Grid */}
                  <div className="pt-5 border-t border-[#F5F5F7] grid grid-cols-2 gap-4">
                    {item.meta.map((m, mIdx) => (
                      <div key={mIdx}>
                        <span className="text-[#86868B] block text-xs font-normal">
                          {m.label}
                        </span>
                        <span className="text-[#1D1D1F] font-semibold mt-0.5 block text-sm">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING PACKAGES */}
      <section className="w-full py-10 sm:py-16 bg-white" id="pricing">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="mb-6 sm:mb-8 max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Simple pricing
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
              Transparent rates per wedding project. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`bg-white rounded-3xl p-7 sm:p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                  pkg.popular
                    ? 'border-[#3B82F6] shadow-[0_8px_30px_rgba(59,130,246,0.12)] relative md:-translate-y-2'
                    : 'border-[#E5E5E7] shadow-xs hover:border-[#1D1D1F]/20'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                    {pkg.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-extrabold text-[#1D1D1F] mb-2">{pkg.name}</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed mb-6">{pkg.description}</p>

                  <div className="p-4 rounded-2xl bg-[#F5F5F7] mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-[#1D1D1F]">
                        {pkg.price}
                      </span>
                      <span className="text-xs text-[#86868B] font-medium">{pkg.period}</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                      Includes 1 revision round + color grading
                    </span>
                  </div>

                  {/* Included Scope */}
                  <ul className="space-y-2.5 text-xs text-[#424245] mb-8">
                    {pkg.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#3B82F6] font-bold mt-0.5">✓</span>
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={pkg.ctaHref}
                  className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all shadow-xs block ${
                    pkg.popular
                      ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white'
                      : 'bg-[#1D1D1F] hover:bg-[#3B82F6] text-white'
                  }`}
                >
                  {pkg.ctaText} →
                </Link>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-[#86868B]">
            * All edits are made strictly using the video, audio, and music files you provide. Turnaround starts once footage is received.
          </p>
        </div>
      </section>

      {/* 6. FAQ (CLEAN & ACCORDION) */}
      <section className="w-full py-16 sm:py-20 bg-[#F5F5F7]" id="faq">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Frequently answered questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
              Everything you need to know about file upload, music, style matching, and delivery.
            </p>
          </div>

          {/* Clean Borderless FAQ Accordion List Divided By Border Lines */}
          <div className="max-w-3xl divide-y divide-[#E5E5E7]">
            {faqs.map((faq, idx) => {
              const isOpen = !!openMap[idx];
              return (
                <div key={idx} className="py-4 first:pt-0">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left flex items-center justify-between font-semibold text-sm sm:text-base tracking-[-0.02em] text-[#1D1D1F] hover:text-[#3B82F6] transition-colors cursor-pointer outline-none"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`text-xl text-[#3B82F6] font-light transition-transform duration-200 leading-none ml-4 flex-shrink-0 ${
                        isOpen ? 'rotate-45' : 'rotate-0'
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-xs sm:text-[13.5px] leading-relaxed text-[#86868B] font-normal pr-8">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA SECTION */}
      <section className="w-full py-14 sm:py-16 bg-white text-center border-t border-[#E5E5E7]/60">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
            Ready to get your wedding video edited?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B] leading-relaxed">
            Send us your footage link and we will start working on your highlight film.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book?category=wedding&sub=highlight-teaser"
              className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-colors shadow-sm"
            >
              Book an Edit (From ₹5,000) →
            </Link>
            <a
              href="https://wa.me/918369251112?text=Hi%20Artsy,%20I%20have%20wedding%20footage%20for%20editing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] font-semibold text-xs sm:text-sm transition-colors"
            >
              Chat on WhatsApp 💬
            </a>
          </div>
        </div>
      </section>

      {/* Full Studio Video Player Modal */}
      <StudioVideoModal
        video={modalVideo}
        onClose={() => setModalVideo(null)}
        startTime={startTime}
      />
    </div>
  );
}
