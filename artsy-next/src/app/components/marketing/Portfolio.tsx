'use client';

import { useState } from 'react';

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<'all' | 'wedding' | 'reels' | 'commercial'>('all');

  const PORTFOLIO_ITEMS = [
    {
      id: 'p1',
      category: 'wedding',
      badge: '16:9 RAW MASTER',
      duration: '04:32 MIN',
      client: 'CLIENT: DEV & ANANYA // UDAIPUR PALACE',
      title: 'THE ROYAL HERITAGE HIGHLIGHT',
      desc: 'Multi-cam timeline conform, custom warm highlight rolloff, and binaural audio reconstruction.',
      colorInfo: 'COLOR: ARRI LOG-C TO REC709',
      image: '/images/portfolio-wedding-1.jpg',
      badgeBg: 'bg-[#D02020]'
    },
    {
      id: 'p2',
      category: 'reels',
      badge: '9:16 VERTICAL',
      duration: '00:30 SEC',
      client: 'CLIENT: PULSE STREETWEAR BERLIN',
      title: 'AUTUMN COLLECTION VIRAL DROP',
      desc: 'Aggressive 120bpm cut pacing, custom sub-bass drop triggers, and speed-ramp kinetic text.',
      colorInfo: 'METRICS: 1.8M ORGANIC VIEWS',
      image: '/images/portfolio-brand-1.jpg',
      badgeBg: 'bg-[#2850CE]'
    },
    {
      id: 'p3',
      category: 'commercial',
      badge: '4:5 SQUARE PLUS',
      duration: '00:45 SEC',
      client: 'CLIENT: CHRONO ARCHITECT GENEVA',
      title: 'TITANIUM SERIES LAUNCH CUT',
      desc: 'Zero-compression 4K DCI master workflow, sensor dust retouching, and mechanical clockwork foley.',
      colorInfo: 'COLOR: ACEScc OCIO COLORSPACE',
      image: '/images/portfolio-product-1.jpg',
      badgeBg: 'bg-[#F1C121] text-[#1C1B1B]'
    },
    {
      id: 'p4',
      category: 'wedding',
      badge: '16:9 DCI 4K',
      duration: '03:15 MIN',
      client: 'CLIENT: ARJUN & TARA // GOA CLIFFS',
      title: 'COASTAL SUNSET NARRATIVE TEASER',
      desc: 'Cinematic drone plates, natural ambient wave leveling, and soft film-stock emulation grade.',
      colorInfo: 'COLOR: KODAK 5207 VISION3',
      image: '/images/portfolio-wedding-2.jpg',
      badgeBg: 'bg-[#D02020]'
    },
    {
      id: 'p5',
      category: 'reels',
      badge: '9:16 HOOK REEL',
      duration: '00:25 SEC',
      client: 'CLIENT: ELEVATE HYDRATION NYC',
      title: 'HIGH-RETENTION UGC HOOK CAMPAIGN',
      desc: 'Frame-accurate rhythm cuts, dynamic kinetic subtitles, and platform sound balancing.',
      colorInfo: 'METRICS: 3.4x ROAS CONVERSION',
      image: '/images/portfolio-brand-2.jpg',
      badgeBg: 'bg-[#2850CE]'
    },
    {
      id: 'p6',
      category: 'commercial',
      badge: '16:9 4K MASTER',
      duration: '12:40 MIN',
      client: 'CLIENT: VECTOR DYNAMICS // BLR TECH',
      title: 'ANNUAL TECH SUMMIT BROADCAST',
      desc: 'Multi-camera speaker angle conform, slide-deck picture-in-picture, and speech isolation.',
      colorInfo: 'BROADCAST EBU R128 AUDIO',
      image: '/images/portfolio-corporate-1.jpg',
      badgeBg: 'bg-[#1C1B1B] text-[#F1C121]'
    }
  ];

  const filteredItems = PORTFOLIO_ITEMS.filter(
    (item) => activeTab === 'all' || item.category === activeTab
  );

  return (
    <section className="w-full bg-[#F0EDEC] py-16 md:py-24 px-4 md:px-8 border-b-4 border-[#1C1B1B]" id="work">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Section Header & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-[#1C1B1B] pb-6">
          <div>
            <div className="inline-block px-3 py-1 bg-[#2850CE] text-white font-label-sm uppercase tracking-wider mb-2 font-bold border border-[#1C1B1B]">
              [03] CUT INDEX
            </div>
            <h2 className="font-headline-xl uppercase tracking-tight text-[#1C1B1B]">
              SELECTED WORKS
            </h2>
          </div>

          {/* Bauhaus Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              ['all', 'ALL EDITS [24]'],
              ['wedding', 'WEDDINGS'],
              ['reels', 'VERTICAL REELS'],
              ['commercial', 'COMMERCIAL']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2 font-label-sm uppercase font-bold border-2 border-[#1C1B1B] shadow-[2px_2px_0px_0px_#1c1b1b] transition-all cursor-pointer ${
                  activeTab === key
                    ? 'bg-[#1C1B1B] text-white shadow-none translate-x-[1px] translate-y-[1px]'
                    : 'bg-[#FFFFFF] text-[#1C1B1B] hover:bg-[#2850CE] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-[#FFFFFF] border-4 border-[#1C1B1B] shadow-[8px_8px_0px_0px_#1c1b1b] overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-transform"
            >
              <div className="relative w-full h-64 overflow-hidden bg-[#1C1B1B] border-b-4 border-[#1C1B1B]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute top-3 left-3 bg-[#1C1B1B]/90 text-white px-2.5 py-1 font-label-sm uppercase font-bold border border-white/20">
                  {item.badge}
                </div>
                <div className={`absolute top-3 right-3 text-white px-2.5 py-1 font-label-sm uppercase font-black border border-[#1C1B1B] ${item.badgeBg}`}>
                  {item.duration}
                </div>
              </div>

              <div className="p-6 flex flex-col justify-between flex-1 bg-[#FFFFFF]">
                <div>
                  <div className="font-label-sm uppercase text-[#D02020] font-black tracking-wider">
                    {item.client}
                  </div>
                  <h4 className="font-headline-sm uppercase text-[#1C1B1B] mt-2 font-black leading-tight">
                    {item.title}
                  </h4>
                  <p className="font-body-sm text-[#5C403C] mt-2 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t-2 border-[#1C1B1B] flex items-center justify-between font-label-sm text-[#1C1B1B] uppercase font-bold">
                  <span>{item.colorInfo}</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}