'use client';

import Link from 'next/link';

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
    meta: [
      { label: 'Post Suite', value: 'Color & Acoustic Master' },
      { label: 'Turnaround', value: 'Express Delivery' },
    ],
  },
];

export default function ProductionArchive() {
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
              <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-black">
                <div className="relative w-full h-full min-h-[260px]">
                  <video
                    src={item.videoUrl}
                    poster={item.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                  />
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
                    <Link
                      href="/work"
                      className="hover:text-[#3B82F6] transition-colors focus:underline focus:outline-none"
                    >
                      {item.title}
                    </Link>
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-[#86868B] font-normal">
                    {item.description}
                  </p>

                  <div className="mt-4">
                    <Link
                      href="/work"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] group transition-colors"
                      aria-label={`View production breakdown for ${item.title}`}
                    >
                      <span>View in Portfolio</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
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
    </section>
  );
}
