'use client';

import Link from 'next/link';

export default function HowItWorks() {
  const STAGES = [
    {
      num: '1',
      stage: 'STAGE 01',
      title: 'RAW FOOTAGE UPLOAD',
      desc: 'Upload footage via high-speed encrypted Artsy Drive. Automated hash verification checks for frame corruption and missing proxies.',
      tag: 'MD5 CHECKSUM VERIFIED',
      tagColor: 'text-[#D02020]',
      color: 'bg-[#D02020] text-white'
    },
    {
      num: '2',
      stage: 'STAGE 02',
      title: 'SMART CREATOR MATCH',
      desc: 'Our algorithmic supervisor matches your aesthetic profile to a vetted, certified editor specializing strictly in your genre.',
      tag: 'TOP 5% VETTED EDITORS',
      tagColor: 'text-[#2850CE]',
      color: 'bg-[#2850CE] text-white'
    },
    {
      num: '3',
      stage: 'STAGE 03',
      title: 'FRAME-ACCURATE REVIEW',
      desc: 'Receive timestamped review links. Draw on video frames, attach audio notes, and approve iterations with single-click precision.',
      tag: 'FRAME-LEVEL SYNC',
      tagColor: 'text-[#755B00]',
      color: 'bg-[#F1C121] text-[#1C1B1B]'
    },
    {
      num: '4',
      stage: 'STAGE 04',
      title: 'MASTER EXPORT & HANDOFF',
      desc: 'Final delivery in uncompressed 4K masters, social mp4 cutdowns, and clean audio stems. Instant escrow payout released to creator.',
      tag: 'ARCHIVAL ZIP / XML DISPATCH',
      tagColor: 'text-[#1C1B1B]',
      color: 'bg-[#1C1B1B] text-white'
    }
  ];

  return (
    <section className="w-full px-4 md:px-8 py-16 md:py-24 space-y-12 bg-[#FCF9F8] border-b-4 border-[#1C1B1B]" id="how-it-works">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-[#1C1B1B] pb-6">
          <div>
            <div className="inline-block px-3 py-1 bg-[#F1C121] text-[#1C1B1B] font-label-sm uppercase tracking-wider mb-2 font-bold border border-[#1C1B1B]">
              [04] PRODUCTION SYSTEM
            </div>
            <h2 className="font-headline-xl uppercase tracking-tight text-[#1C1B1B]">
              THE PROTOCOL
            </h2>
          </div>
          <p className="font-body-md text-[#5C403C] max-w-md font-medium">
            Engineered for zero dropped frames and instantaneous feedback loops. Every project adheres strictly to our 4-phase Bauhaus execution matrix.
          </p>
        </div>

        {/* 4 Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAGES.map((s) => (
            <div
              key={s.num}
              className="bg-[#FFFFFF] p-6 border-4 border-[#1C1B1B] shadow-[8px_8px_0px_0px_#1c1b1b] relative overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-transform"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-10 h-10 rotate-45 ${s.color} border-2 border-[#1C1B1B] flex items-center justify-center font-headline-sm font-black shadow-md`}>
                    <span className="-rotate-45">{s.num}</span>
                  </div>
                  <span className="font-label-sm uppercase text-[#5C403C] font-black tracking-wider">
                    {s.stage}
                  </span>
                </div>

                <h3 className="font-headline-md uppercase text-[#1C1B1B] mb-2 text-lg font-black leading-snug">
                  {s.title}
                </h3>
                <p className="font-body-sm text-[#5C403C] leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className={`mt-6 pt-3 border-t-2 border-[#1C1B1B]/20 font-label-sm uppercase font-black ${s.tagColor}`}>
                {s.tag}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Strip */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/book"
            className="px-8 py-4 bg-[#D02020] text-white font-label-lg uppercase tracking-wider border-2 border-[#1C1B1B] shadow-[4px_4px_0px_0px_#1c1b1b] hover:bg-[#A9000E] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-black"
          >
            START YOUR PROJECT NOW
          </Link>
        </div>

      </div>
    </section>
  );
}
