'use client';

import Image from 'next/image';
import Link from 'next/link';

const ARCHIVE_ITEMS = [
  {
    category: 'Wedding Cinema',
    title: 'The Rajasthan Palace Celebration',
    description:
      'Multi-day footage ingest across four camera packages. Precision audio synchronization on non-timecode ambient recordings, finished with custom Rec.709 film emulations to accentuate architectural golden hours.',
    cutter: 'Senior Fellow Colorist',
    timeline: '06 Calendar Days',
    image: '/images/reels/wedding-palace.jpg',
    reversed: false,
  },
  {
    category: 'Commercial Campaign',
    title: 'Nomad Labs Vertical Editorial',
    description:
      'High-velocity editorial constructed from 100fps runway captures. Bespoke rhythmic sound foley synced directly with textile cuts and speed ramps to elevate retention past 42% on paid channels.',
    cutter: 'Kinetic Motion Lead',
    timeline: '6x Hook Variants',
    image: '/images/reels/neon-fashion.jpg',
    reversed: true,
  },
  {
    category: 'Automotive Showcase',
    title: 'Solaris Electric Motor Launch',
    description:
      'Multi-layer CG asset integration, subtle technical typography overlays, and visceral synthesized electric powertrain sound design engineered for worldwide commercial broadcast.',
    cutter: 'VFX & Master Suite',
    timeline: '3840 × 2160 UHD',
    image: '/images/reels/automotive-supercar.jpg',
    reversed: false,
  },
];

export default function ProductionArchive() {
  return (
    <section
      className="w-full py-24 sm:py-32 bg-[#F5F5F7]"
      id="verified-production-archive"
    >
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="mb-14">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
              Verified production archive
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#86868B] font-normal leading-relaxed">
              Every deliverable is logged with complete render metadata, color specifications, and verified delivery timelines.
            </p>
          </div>
        </div>

        {/* 3 Borderless White Cards with Soft Diffuse Shadow */}
        <div className="flex flex-col gap-8">
          {ARCHIVE_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.07)]"
            >
              {/* Media Pane */}
              <div
                className={`lg:col-span-6 relative h-64 sm:h-80 lg:h-auto overflow-hidden bg-[#1D1D1F] ${
                  item.reversed ? 'order-1 lg:order-2' : ''
                }`}
              >
                <div className="relative w-full h-full min-h-[260px]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    loading="eager"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>

              {/* Editorial Data Pane */}
              <div
                className={`lg:col-span-6 p-8 sm:p-10 flex flex-col justify-between gap-6 ${
                  item.reversed ? 'order-2 lg:order-1' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-[#3B82F6]">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold tracking-[-0.03em] text-[#1D1D1F] leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-[#86868B] font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-[#F5F5F7] grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[#86868B] block text-xs font-normal">
                      Assigned Cutter
                    </span>
                    <span className="text-[#1D1D1F] font-semibold mt-1 block text-sm">
                      {item.cutter}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#86868B] block text-xs font-normal">
                      Delivery Window
                    </span>
                    <span className="text-[#1D1D1F] font-semibold mt-1 block text-sm">
                      {item.timeline}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View Full Archive CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm group"
          >
            <span>Explore Complete Production Archive (12+ Cinematic Cuts)</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
