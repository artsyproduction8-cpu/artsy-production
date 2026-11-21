'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StudioVideoModal, { ModalVideoItem } from './StudioVideoModal';

interface ArchiveMeta {
  label: string;
  value: string;
}

interface ArchiveItem {
  category: string;
  title: string;
  description: string;
  image: string;
  videoUrl: string;
  masterUrl: string;
  meta: ArchiveMeta[];
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const ARCHIVE_ITEMS: ArchiveItem[] = [
  {
    category: 'Wedding Cinema',
    title: 'Chandni & Harihar — Grand Reception Film',
    description:
      'A lavish Bollywood-grade wedding reception celebration featuring dynamic choreography and Shreyas Iyer on the dance floor, color graded to perfection with pristine acoustic pacing.',
    image: getStreamUrl('thumbnails/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Chandni  Harihar’s Reception Film — Shreyas Iyer Steals the Dance Floor.mp4'),
    meta: [
      { label: 'Color Grading', value: 'Studio Rec.709 Master' },
      { label: 'Turnaround', value: '5 Working Days' },
    ],
  },
  {
    category: 'Wedding Cinema',
    title: 'Akash & Mayuri — Mumbai Wedding Highlights',
    description:
      'An emotional, grand Mumbai wedding film capturing traditional rituals, intimate candid exchanges, and breathtaking golden-hour cinematography mastered in Rec.709 color science.',
    image: getStreamUrl('thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_preview.mp4'),
    masterUrl: getStreamUrl('Wedding/Akash  Mayuri Wedding Film — Cinematic Highlights  Mumbai Wedding Videographer.mp4'),
    meta: [
      { label: 'Edit Narrative', value: 'Full Feature & Teaser' },
      { label: 'Deliverables', value: '4K Master + Social Cut' },
    ],
  },
  {
    category: 'Pre-Wedding Films',
    title: 'Anoop & Ansa — Cinematic Pre-Wedding Film',
    description:
      'An evocative romance set against scenic mountain vistas and serene lakeside shores, edited with poetic cadence, seamless speed ramps, and warm filmic contrast.',
    image: getStreamUrl('thumbnails/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_preview.mp4'),
    masterUrl: getStreamUrl('Pre wedding/ANOOP & ANSA pre wedding Low Res.mp4'),
    meta: [
      { label: 'Post Suite', value: 'Color & Acoustic Master' },
      { label: 'Turnaround', value: 'Express Delivery' },
    ],
  },
];

export default function ProductionArchive() {
  const [activeModalVideo, setActiveModalVideo] = useState<ModalVideoItem | null>(null);
  const [modalStartTime, setModalStartTime] = useState(0);

  const handleOpenMaster = (item: ArchiveItem, e?: React.MouseEvent) => {
    let curTime = 0;
    if (e) {
      const container = (e.currentTarget as HTMLElement).closest('.group') || (e.currentTarget as HTMLElement);
      const vid = container.querySelector('video');
      if (vid && vid.currentTime > 0) {
        curTime = vid.currentTime;
      }
    }
    setModalStartTime(curTime);
    setActiveModalVideo({
      title: item.title,
      category: item.category,
      videoUrl: item.masterUrl || item.videoUrl,
      poster: item.image,
      aspect: '16/9',
      description: item.description,
    });
  };

  return (
    <section
      className="w-full py-20 sm:py-28 bg-[#F5F5F7]"
      id="verified-production-archive"
    >
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <div className="max-w-2xl">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#3B82F6] block mb-1.5">
              Verified Delivery
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1D1D1F]">
              Production standards &amp; delivery
            </h2>
            <p className="mt-3 text-base text-[#86868B] font-normal leading-relaxed">
              Real studio deliverables crafted with emotive storytelling, deterministic color grading, and acoustic precision.
            </p>
          </div>
        </div>

        {/* 3 Borderless White Cards with Live Video Panes */}
        <div className="flex flex-col gap-8">
          {ARCHIVE_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)]"
            >
              {/* Media Video Pane */}
              <div
                onClick={(e) => handleOpenMaster(item, e)}
                className="lg:col-span-6 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-black cursor-pointer group select-none"
                title={`Click to watch ${item.title} in full studio master player`}
              >
                <div className="relative w-full h-full min-h-[260px]">
                  <video
                    src={item.videoUrl}
                    poster={item.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Sleek Glass Play Overlay on Hover */}
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl shadow-2xl transition-transform duration-300 group-hover:scale-110">
                      ▶
                    </div>
                    <span className="mt-2 text-xs font-semibold text-white tracking-wider uppercase drop-shadow-md">
                      Play Full Master
                    </span>
                  </div>

                  {/* Corner Badge */}
                  <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                    Rec.709 Master
                  </div>
                </div>
              </div>

              {/* Editorial Data Pane */}
              <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#3B82F6]">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] leading-snug">
                    <button
                      type="button"
                      onClick={(e) => handleOpenMaster(item, e)}
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
                      onClick={(e) => handleOpenMaster(item, e)}
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

      {/* Full Studio Video Player Modal */}
      <StudioVideoModal
        video={activeModalVideo}
        onClose={() => setActiveModalVideo(null)}
        startTime={modalStartTime}
      />
    </section>
  );
}

