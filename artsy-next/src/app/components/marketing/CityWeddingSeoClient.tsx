'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import StudioVideoModal, { ModalVideoItem } from './StudioVideoModal';

interface FAQItem {
  question: string;
  answer: string;
}

export interface CityWeddingSeoConfig {
  cityKey: 'mumbai' | 'delhi' | 'bangalore' | 'goa';
  cityName: string;
  cityShort: string;
  tagline?: string;
  heroHeading: string;
  heroSub: string;
  localHubDescription?: string;
  localVenues?: string[];
  faqs: FAQItem[];
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const SAMPLES = [
  {
    id: 'w1',
    category: 'Wedding Cinema',
    title: 'Anoop & Ansa — Traditional Christian Wedding',
    description: 'Paced narrative ceremony recap conformed with multi-track vocal speeches, choir audio, and rich filmic color grading.',
    turnaround: '7–10 Working Days',
    image: getStreamUrl('thumbnails/Wedding/ANOOP___ANSA_HIGHLIGHTS_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/ANOOP___ANSA_HIGHLIGHTS_Low_preview.mp4'),
    masterUrl: getStreamUrl('Wedding/ANOOP & ANSA HIGHLIGHTS Low.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Color Grade', value: 'Rec.709 Natural Contrast' },
      { label: 'Audio', value: 'Speech Waveform Sync' },
    ],
  },
  {
    id: 'w2',
    category: 'Wedding Cinema',
    title: 'Akshay & Gauri — Royal Celebration Film',
    description: 'Energetic traditional wedding highlight featuring multi-camera ritual synchronization, vibrant haldi colors, and warm night grades.',
    turnaround: '7–10 Working Days',
    image: getStreamUrl('thumbnails/Wedding/Akshay___Gauri_Highlight_Low__thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akshay___Gauri_Highlight_Low__preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Akshay & Gauri Highlight Low .mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Pacing', value: 'Emotional Story Pacing' },
      { label: 'Resolution', value: '4K Ultra HD Export' },
    ],
  },
  {
    id: 'w3',
    category: 'Wedding Cinema',
    title: 'Sanket & Rutuja — Vibrant Sangeet & Pheras',
    description: 'Full-spectrum Hindu wedding highlight film featuring high-tempo Baraat celebration, ritual pheras, and balanced skin tones.',
    turnaround: '7–10 Working Days',
    image: getStreamUrl('thumbnails/Wedding/Sanket___Rutuja_Highlight_Low__thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Sanket___Rutuja_Highlight_Low__preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Sanket & Rutuja Highlight Low .mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Cut Style', value: 'Rhythmic Celebration Cut' },
      { label: 'Turnaround', value: '7–10 Working Days' },
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
    title: 'Akshay & Gauri — Romantic Golden Hour Reel',
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
    title: 'Kuhu — Vibrant Haldi Celebration',
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

export default function CityWeddingSeoClient({ config }: { config: CityWeddingSeoConfig }) {
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
      category: item.category || `${config.cityName} Wedding Cinema`,
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
            {/* Heading with Brand Blue Underline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1D1D1F] tracking-tight max-w-none leading-tight sm:leading-tight">
              <span className="block">Wedding Video Editing In</span>
              <span className="inline-block relative mt-1 sm:mt-1.5 pb-1 sm:pb-2 text-[#2563EB]">
                {config.cityName} For Videographers
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#3B82F6]/80 rounded-full" />
              </span>
            </h1>

            {/* Editorial Subtext */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-[#6E6E73] font-normal leading-relaxed sm:leading-[1.6] max-w-2xl">
              {config.heroSub}
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

      {/* 3. CONTINUOUS AUTO-PLAYING REELS RIBBON */}
      <section className="w-full py-4 sm:py-6 bg-[#0A0A0A] text-white border-y border-white/[0.08] overflow-hidden relative select-none" id="reels">
        <div className="relative w-full overflow-hidden flex">
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10 pointer-events-none" />

          {/* Track 1 */}
          <div className="animate-marquee-twin flex shrink-0 items-center gap-2 sm:gap-2.5 pr-2 sm:pr-2.5 py-1">
            {TRACK_REELS.map((reel, rIdx) => (
              <div
                key={`city-t1-${reel.id}-${rIdx}`}
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
                key={`city-t2-${reel.id}-${rIdx}`}
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

      {/* 4. RECENT COMPLETED EDITS SHOWCASE */}
      <section className="w-full py-10 sm:py-16 bg-[#F5F5F7]" id="showcase">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
              Recent completed wedding edits
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#86868B]">
              Real studio deliverables crafted with emotive storytelling, clean color grading, and acoustic polish.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SAMPLES.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-[#E5E5E7] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:border-slate-300"
              >
                <div>
                  <div
                    onClick={() => handleOpenMaster(item, idx, false)}
                    className="relative aspect-[16/9] w-full bg-[#0A0A0C] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="object-cover w-full h-full pointer-events-none select-none transition-transform duration-700 group-hover:scale-105"
                    />
                    <video
                      ref={(el) => {
                        videoRefs.current[idx] = el;
                      }}
                      src={item.videoUrl}
                      poster={item.image}
                      muted
                      loop
                      playsInline
                      preload="none"
                      onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        target.muted = true;
                        target.play().catch(() => {});
                      }}
                      onMouseLeave={(e) => {
                        const target = e.currentTarget;
                        target.pause();
                        target.currentTime = 0;
                      }}
                      className="absolute inset-0 object-cover w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-lg shadow-2xl transition-transform duration-300 group-hover:scale-110">
                        ▶
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#86868B] mb-2">
                      <span className="uppercase tracking-wider text-[#2563EB]">{item.category}</span>
                      <span>{item.turnaround}</span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-[#1D1D1F] tracking-tight group-hover:text-[#2563EB] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#6E6E73] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#F5F5F7] grid grid-cols-2 gap-2 text-xs">
                      {item.meta.map((m, mIdx) => (
                        <div key={mIdx}>
                          <span className="text-[#86868B] block text-[11px]">{m.label}</span>
                          <span className="font-semibold text-[#1D1D1F] line-clamp-1">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                  <button
                    type="button"
                    onClick={() => handleOpenMaster(item, idx, false)}
                    className="w-full py-2.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    ▶ Watch Master Film
                  </button>
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
              Simple, transparent editing packages
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
              Standard 7–10 working days delivery SLA with 1 free revision round included with every project.
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

                  <div className="my-6 pb-6 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">{pkg.price}</span>
                      <span className={`text-xs ${pkg.popular ? 'text-white/70' : 'text-[#86868B]'}`}>
                        / {pkg.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {pkg.points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-[#3B82F6] font-bold">✓</span>
                        <span className={pkg.popular ? 'text-white/90' : 'text-[#1D1D1F]'}>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={pkg.ctaHref}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-center transition-all ${
                    pkg.popular
                      ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md'
                      : 'bg-[#1D1D1F] hover:bg-[#2D2D2F] text-white'
                  }`}
                >
                  {pkg.ctaText} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="w-full py-12 sm:py-16 bg-white border-t border-[#F5F5F7]" id="faq">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
              Frequently asked questions
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#86868B]">
              Quick answers about our editing process, audio sync, color grading, and turnaround times.
            </p>
          </div>

          <div className="space-y-3">
            {config.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-[#E5E5E7] rounded-2xl overflow-hidden transition-all bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#1D1D1F] hover:text-[#2563EB] transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="text-lg leading-none font-bold text-[#86868B]">
                    {openMap[idx] ? '−' : '+'}
                  </span>
                </button>
                {openMap[idx] && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-[#6E6E73] leading-relaxed border-t border-[#F5F5F7]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CALL TO ACTION */}
      <section className="w-full py-12 sm:py-16 bg-[#F5F5F7] border-t border-[#E5E5E7]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1D1D1F] tracking-tight">
            Ready to get your wedding video edited?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B] max-w-xl mx-auto">
            Send us your footage link and we will start working on your highlight film today.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book?category=wedding&sub=highlight-teaser"
              className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm"
            >
              Book an Edit (From ₹5,000) →
            </Link>
            <a
              href="https://wa.me/918369251112?text=Hi%20Artsy!%20I%20have%20wedding%20footage%20ready%20for%20editing%20and%20would%20like%20a%20quick%20quote."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#E5E5E7] border border-[#E5E5E7] text-[#1D1D1F] font-semibold text-xs sm:text-sm transition-all"
            >
              Chat on WhatsApp 💬
            </a>
          </div>
        </div>
      </section>

      {/* 8. MODAL MASTER LIGHTBOX */}
      {modalVideo && (
        <StudioVideoModal
          video={modalVideo}
          startTime={startTime}
          onClose={() => setModalVideo(null)}
        />
      )}
    </div>
  );
}
