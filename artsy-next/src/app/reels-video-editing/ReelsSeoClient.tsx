'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import StudioVideoModal, { ModalVideoItem } from '../components/marketing/StudioVideoModal';

interface FAQItem {
  question: string;
  answer: string;
}

interface ReelsSeoClientProps {
  faqs: FAQItem[];
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

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
    turnaround: '48 Hours Express',
    stats: 'Hook Locked to Beat Drop',
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
    turnaround: '48 Hours Express',
    stats: 'Speed-Ramped Crowd Choreography',
  },
  {
    id: 'r3',
    title: 'Akshay & Gauri — Romantic Golden Hour Reel',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Akshay___Gauri_Reel__2__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Akshay___Gauri_Reel__2__Low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Akshay & Gauri Reel (2) Low.mp4'),
    description: 'Romantic couple portrait reel featuring golden hour backlight, emotional pacing, and clean color tone balance.',
    turnaround: '48 Hours Express',
    stats: 'Warm Filmic Skin Tone Grade',
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
    turnaround: '48 Hours Express',
    stats: 'Macro Detail Acoustic Polish',
  },
  {
    id: 'r5',
    title: 'Kuhu — Vibrant Haldi Celebration',
    category: 'Cinematic Reels',
    aspect: '9/16' as const,
    image: getStreamUrl('thumbnails/Reel_/Kuhu_Haldi_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Kuhu_Haldi_Reel_low_preview.mp4'),
    masterUrl: getStreamUrl('Reel/Kuhu Haldi Reel low.mp4'),
    description: 'Vibrant haldi ritual reel conformed with joyful color science, rhythmic musical cadence, and authentic emotions.',
    turnaround: '48 Hours Express',
    stats: 'High-Saturation Rec.709 Tone',
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
    turnaround: '48 Hours Express',
    stats: 'Seamless Transition Cutpoints',
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
    turnaround: '48 Hours Express',
    stats: 'Candid Motion Pacing',
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
    turnaround: '48 Hours Express',
    stats: 'Rhythmic Beat Synchronization',
  },
];

const TRACK_REELS = [...REELS_DATA, ...REELS_DATA, ...REELS_DATA];

const PACKAGES = [
  {
    name: 'Single Reel Cut',
    badge: 'STARTER',
    turnaround: '48 Hours Express',
    price: '₹2,000',
    period: 'per reel',
    description: 'High-impact 9:16 vertical reel conformed for Instagram, TikTok, and YouTube Shorts.',
    points: [
      '30–60 Second Vertical Social Cut (9:16)',
      'Hook timing locked to first 3 seconds',
      'Music beat waveform alignment & drop sync',
      'Rec.709 color balance & skin-tone polish',
      'Audio leveling & background noise cleanup',
      '1 Free Revision Round included',
      '1080x1920 Full HD Mobile Master',
    ],
    popular: false,
    ctaText: 'Book Single Reel',
    ctaHref: '/book?category=wedding&sub=reel-only',
  },
  {
    name: 'Reel Trio Bundle (3 Reels)',
    badge: 'MOST POPULAR',
    turnaround: '48 Hours Express',
    price: '₹5,000',
    period: 'for 3 reels',
    description: 'Complete 3-part social campaign capturing emotional, energetic, and candid moments.',
    points: [
      '3 Distinct 9:16 Vertical Video Reels',
      'Mix of emotional, party, and detail cuts',
      'Trending audio & soundtrack beat matching',
      'Color tone consistency across all 3 videos',
      'Kinetic animated text & title hooks',
      '1 Free Revision Round per reel',
      'Optimized high-bitrate MP4 exports',
    ],
    popular: true,
    ctaText: 'Book 3-Reel Bundle',
    ctaHref: '/book?category=wedding&sub=trinity-bundle',
  },
  {
    name: 'Reel Master Suite (5 Reels)',
    badge: 'MAXIMUM VALUE',
    turnaround: '72 Hours SLA',
    price: '₹8,000',
    period: 'for 5 reels',
    description: 'Full week social content slate for studios and brands looking for consistent viral reach.',
    points: [
      '5 Complete Vertical 9:16 Social Edits',
      'Full sequence coverage (Entry, Ceremony, Details, Dance, Outro)',
      'Custom cover thumbnails for Instagram grid',
      'Dynamic speed ramps & sound design foley',
      'Dedicated lead editor assignment',
      '1 Free Revision Round included',
      'Full 4K ProRes & Web Master Deliverables',
    ],
    popular: false,
    ctaText: 'Book 5-Reel Suite',
    ctaHref: '/book?category=wedding&sub=master-package',
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

export default function ReelsSeoClient({ faqs }: ReelsSeoClientProps) {
  const [openMap, setOpenMap] = useState<Record<number, boolean>>({
    0: true,
    1: true,
  });
  const [modalVideo, setModalVideo] = useState<ModalVideoItem | null>(null);
  const [startTime, setStartTime] = useState(0);

  const toggleFaq = (idx: number) => {
    setOpenMap((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleOpenMaster = (item: (typeof REELS_DATA)[0]) => {
    setStartTime(0);
    setModalVideo({
      title: item.title,
      category: item.category || 'Cinematic Reels',
      videoUrl: item.masterUrl || item.videoUrl,
      poster: item.image,
      aspect: '9/16',
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
          REELS // 9:16
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="flex flex-col items-start max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1D1D1F] tracking-tight max-w-none leading-tight sm:leading-tight">
              <span className="block">Instagram Reels &amp; Short-Form</span>
              <span className="inline-block relative mt-1 sm:mt-1.5 pb-1 sm:pb-2 text-[#2563EB]">
                Video Editing For Creators &amp; Studios
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#3B82F6]/80 rounded-full" />
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-[#6E6E73] font-normal leading-relaxed sm:leading-[1.6] max-w-2xl">
              Send us your raw clips. We cut to the beat, grade your colors, add kinetic captions, and deliver high-retention 9:16 vertical edits within 48 hours.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/book?category=wedding&sub=reel-only"
                className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm hover:scale-[1.01]"
              >
                Book a Reel (From ₹2,000) →
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
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">1. Share Your Raw Clips</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  Drop a Google Drive or Dropbox link with your camera files and your choice of trending Instagram audio or song.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">2. Rhythmic Beat Cut &amp; Color Grade</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  We hook viewers in the first 3 seconds, synchronize cuts to musical drops, balance skin tones, and mix audio.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">3. 48-Hour Ready-to-Post Delivery</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  Review your reel draft, request any tweaks, and download optimized 1080x1920 MP4 files ready for social posting.
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
                key={`r-t1-${reel.id}-${rIdx}`}
                onClick={() => handleOpenMaster(reel)}
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
                key={`r-t2-${reel.id}-${rIdx}`}
                onClick={() => handleOpenMaster(reel)}
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

      {/* 4. RECENT REELS SHOWCASE */}
      <section className="w-full py-10 sm:py-16 bg-[#F5F5F7]" id="showcase">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
              Recent completed reels &amp; social teasers
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
              Every cut is synchronized to soundtrack transients with custom pacing, vibrant skin tones, and mobile-optimized retention.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {REELS_DATA.slice(0, 4).map((reel) => (
              <div
                key={`showcase-${reel.id}`}
                onClick={() => handleOpenMaster(reel)}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[#E5E5E7] flex flex-col group cursor-pointer transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
              >
                <div className="relative aspect-[9/16] overflow-hidden bg-black select-none">
                  <video
                    src={reel.videoUrl}
                    poster={reel.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-lg shadow-2xl transition-transform duration-300 group-hover:scale-110">
                      ▶
                    </div>
                    <span className="mt-2 text-[10px] font-semibold text-white tracking-wider uppercase drop-shadow-md">
                      Watch Reel
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 bg-white">
                  <div>
                    <h3 className="font-bold text-sm text-[#1D1D1F] line-clamp-1 group-hover:text-[#3B82F6] transition-colors">
                      {reel.title}
                    </h3>
                    <p className="text-xs text-[#86868B] mt-1 line-clamp-2 leading-relaxed">
                      {reel.description}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#F5F5F7] flex items-center justify-between text-[11px] font-medium text-[#86868B]">
                    <span className="text-emerald-600 font-semibold">{reel.turnaround}</span>
                    <span>{reel.stats}</span>
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
              Simple, transparent reels pricing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
              No hidden retainers. 48-hour delivery SLA with 1 free revision round included with every reel.
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
              Quick answers about audio sync, revisions, formats, and turnarounds.
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
            Ready to upgrade your reels &amp; social videos?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
            Drop your footage link and we will deliver your 9:16 mobile edit within 48 hours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book?category=wedding&sub=reel-only"
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
