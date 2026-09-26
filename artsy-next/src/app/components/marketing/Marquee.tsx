'use client';

export default function Marquee() {
  const CRAFT_ITEMS = [
    'WEDDING CINEMATIC FILMS',
    'DAVINCI 4K HDR COLOR GRADE',
    'MULTI-CAM CEREMONY SYNC',
    'VIRAL RETENTION HOOK REELS',
    '3D PRODUCT CUTAWAYS',
    'IZOTOPE SPEECH AUDIO CLEANUP',
    'EXECUTIVE SUMMIT KEYNOTES',
    'TIMESTAMPED COLLABORATION',
    '4–6 DAY INTERNAL SLA',
    'CURATED ARTSY CREATORS'
  ];

  return (
    <section className="py-6 bg-[#16233F] overflow-hidden border-y border-[#16233F]/20 text-white select-none">
      <div className="flex overflow-hidden relative">
        <div className="marquee-track flex items-center gap-10 whitespace-nowrap">
          {/* First loop */}
          {CRAFT_ITEMS.map((item, i) => (
            <div key={`m1-${i}`} className="inline-flex items-center gap-6">
              <span className="font-mono text-[13px] font-bold tracking-widest text-[#FFFFFF]/90">
                {item}
              </span>
              <span className="font-mono text-[#3D7DC2] text-[14px]">✦</span>
            </div>
          ))}

          {/* Repeat loop for infinite scroll */}
          {CRAFT_ITEMS.map((item, i) => (
            <div key={`m2-${i}`} className="inline-flex items-center gap-6">
              <span className="font-mono text-[13px] font-bold tracking-widest text-[#FFFFFF]/90">
                {item}
              </span>
              <span className="font-mono text-[#3D7DC2] text-[14px]">✦</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}