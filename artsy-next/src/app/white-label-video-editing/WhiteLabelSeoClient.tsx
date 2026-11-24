'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import StudioVideoModal, { ModalVideoItem } from '../components/marketing/StudioVideoModal';

interface FAQItem {
  question: string;
  answer: string;
}

interface WhiteLabelSeoClientProps {
  faqs: FAQItem[];
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const SAMPLES = [
  {
    id: 'wl1',
    category: 'Celebrity Grand Reception',
    title: 'Celebrity Grand Reception Film (White-Label Production)',
    description: 'Multi-camera reception film conformed under strict white-label studio SLA with live choreography audio sync.',
    turnaround: '5 Working Days',
    image: getStreamUrl('thumbnails/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Chandni  Harihar’s Reception Film — Shreyas Iyer Steals the Dance Floor.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Studio Security', value: '100% Strict Mutual NDA' },
      { label: 'Branding', value: 'Unbranded Client Player' },
    ],
  },
  {
    id: 'wl2',
    category: 'Agency Wedding Highlights',
    title: 'Full Wedding Highlight Film (Agency Standard)',
    description: 'Traditional Indian wedding assembly and DaVinci color grade delivered ready for studio client presentation.',
    turnaround: '5 Working Days',
    image: getStreamUrl('thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Akash  Mayuri Wedding Film — Cinematic Highlights  Mumbai Wedding Videographer.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Color Pipeline', value: 'Custom Studio Film LUT' },
      { label: 'Master Delivery', value: '4K ProRes + Web Export' },
    ],
  },
  {
    id: 'wl3',
    category: 'Destination Romance',
    title: 'Scenic Destination Love Story (Studio Cut)',
    description: 'Mountain drone and gimbal footage conformed smoothly without studio watermarks for third-party brand delivery.',
    turnaround: '5 Working Days',
    image: getStreamUrl('thumbnails/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_preview.mp4'),
    masterUrl: getStreamUrl('Pre wedding/ANOOP & ANSA pre wedding Low Res.mp4'),
    aspect: '16/9' as const,
    meta: [
      { label: 'Drone Flow', value: 'Speed-Ramped Landscape' },
      { label: 'SLA Guarantee', value: 'Deterministic Turnaround' },
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
    name: 'On-Demand Per Project',
    badge: 'FLEXIBLE',
    turnaround: '7–10 Working Days',
    price: '₹5,000',
    period: 'per film',
    description: 'Pay as you go. Outsource individual client edits during peak volume without monthly commitments.',
    points: [
      '100% White-Label: Delivered under your studio brand',
      'Mutual Non-Disclosure Agreement (NDA) protected',
      'Unbranded review link for your client presentations',
      'Full multi-cam sync & DaVinci Rec.709 color grading',
      '1 Free Revision Round included per project',
      '4K ProRes Master + Web Delivery Package',
    ],
    popular: false,
    ctaText: 'Book Single Project',
    ctaHref: '/book?category=wedding&sub=highlight-teaser',
  },
  {
    name: 'Studio Growth (5 Projects/Mo)',
    badge: 'MOST POPULAR FOR STUDIOS',
    turnaround: '5 Working Days / Project',
    price: '₹22,500',
    period: '₹4,500 / project',
    description: 'Designed for active studios handling 4 to 8 weddings monthly wanting a dedicated senior cutter.',
    points: [
      '5 Complete Client Deliverables (Highlight + Teaser)',
      'Dedicated lead editor matched to your studio style',
      'Custom LUT profile & project presets logged',
      'Priority 5-day delivery SLA window',
      'Dedicated Studio Desk on WhatsApp / Slack',
      'Priority 24h revision turnaround',
      'Comprehensive monthly GST business invoicing',
    ],
    popular: true,
    ctaText: 'Start Studio Retainer',
    ctaHref: '/book?category=wedding&sub=white-label-retainer-5',
  },
  {
    name: 'Agency Scale (10 Projects/Mo)',
    badge: 'ENTERPRISE RETROFIT',
    turnaround: '48–72h / Project',
    price: '₹40,000',
    period: '₹4,000 / project',
    description: 'Maximum studio throughput for high-volume wedding cinematographers and production houses.',
    points: [
      '10 Complete Wedding Deliverables (Full Suite + Reels)',
      'Dedicated two-editor cluster + QC supervisor',
      '48–72 Hour Express Rush turnaround priority',
      'Direct timeline project file handoff (PRPROJ/DRP)',
      'Unlimited minor text and audio polish passes',
      'Archival cloud storage for 60 days included',
      'Dedicated account manager and deterministic SLAs',
    ],
    popular: false,
    ctaText: 'Scale With Artsy',
    ctaHref: '/book?category=wedding&sub=white-label-retainer-10',
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

export default function WhiteLabelSeoClient({ faqs }: WhiteLabelSeoClientProps) {
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
      category: item.category || 'White-Label Cinema',
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
          WHITE-LABEL // NDA
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="flex flex-col items-start max-w-4xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#1D1D1F] tracking-tight max-w-none leading-tight sm:leading-tight">
              <span className="block">White-Label Video Editing For</span>
              <span className="inline-block relative mt-1 sm:mt-1.5 pb-1 sm:pb-2 text-[#2563EB]">
                Photography Studios &amp; Agencies
                <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#3B82F6]/80 rounded-full" />
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-[#6E6E73] font-normal leading-relaxed sm:leading-[1.6] max-w-2xl">
              Scale your studio output without full-time editor payroll. We edit in the background under strict NDA, matching your custom color presets and delivery guidelines.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/book?category=wedding&sub=highlight-teaser"
                className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm hover:scale-[1.01]"
              >
                Start an Edit (From ₹5,000) →
              </Link>
              <a
                href="#pricing"
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] font-semibold text-xs sm:text-sm transition-all"
              >
                View Volume Pricing
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
              How white-label partnership works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">1. Style Onboarding &amp; NDA</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  We sign a mutual NDA and log your studio LUTs, resolution specs, and pacing preferences into your private studio profile.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">2. Dedicated Post Production</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  Your footage is ingested and cut by assigned lead editors following your studio guidelines with internal studio QC check.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] mb-1.5">3. White-Label Delivery</h3>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                  You receive an unbranded review player link and high-bitrate 4K master downloads ready to deliver directly to your client.
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
                key={`wl-t1-${reel.id}-${rIdx}`}
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
                key={`wl-t2-${reel.id}-${rIdx}`}
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

      {/* 4. RECENT WHITE-LABEL SHOWCASE */}
      <section className="w-full py-10 sm:py-16 bg-[#F5F5F7]" id="showcase">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
              Recent completed studio &amp; agency films
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#86868B] font-normal leading-relaxed">
              Every project is finished with studio-grade color science, unbranded client playback, and airtight NDA confidentiality.
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
                      Outsource Your Edits →
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
              White-label studio outsourcing pricing
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
              Pay per project or save with guaranteed monthly volume retainers. All contracts backed by mutual NDA.
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
              Common questions from studio owners and production agencies regarding white-label operations.
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
            Ready to scale your studio capacity?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
            Connect with our post supervisor to discuss NDA terms, volume SLAs, and custom studio presets.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/book?category=wedding&sub=highlight-teaser"
              className="px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm"
            >
              Start an Edit (From ₹5,000) →
            </Link>
            <a
              href="https://wa.me/918369251112"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F] font-semibold text-xs sm:text-sm transition-all inline-flex items-center gap-2"
            >
              Studio Desk WhatsApp ↗
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
