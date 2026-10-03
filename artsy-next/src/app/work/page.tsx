'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/marketing/Navbar';
import Footer from '../components/marketing/Footer';

interface WorkItem {
  id: string;
  category: 'wedding' | 'brand' | 'product' | 'corporate' | 'music';
  categoryLabel: string;
  title: string;
  client: string;
  aspect: '16:9' | '9:16' | 'Dual (16:9 + 9:16)';
  runtime: string;
  image: string;
  videoUrl?: string;
  cutter: string;
  gradeProfile: string;
  audioMaster: string;
  deliveryTimeline: string;
  description: string;
  tags: string[];
  bookCategory: string;
}

const PORTFOLIO_ITEMS: WorkItem[] = [
  {
    id: 'work-1',
    category: 'wedding',
    categoryLabel: 'Wedding Cinema',
    title: 'The Udaipur Palace Royal Celebration',
    client: 'Royal Rajasthan Heritage',
    aspect: 'Dual (16:9 + 9:16)',
    runtime: '4 Min Highlight + 60s Teaser',
    image: '/images/portfolio-wedding-1.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Senior Fellow Colorist (DaVinci Resolve)',
    gradeProfile: 'Rec.709 Kodak 2383 Film Print LUT',
    audioMaster: '32-Bit Float Dialogue Denoise & Ambient Scoring',
    deliveryTimeline: '06 Calendar Days (Rush SLA Met)',
    description:
      'Four multi-camera Sony FX3/FX6 packages ingested across 3 celebration days. Non-timecode ambient audio synchronized with wireless lavalier ceremony speech tracks, finished with custom warm sunset film LUT emulation.',
    tags: ['4K Cinema', 'Multi-Cam Waveform Sync', 'Film Emulation', 'Speech Mastering'],
    bookCategory: 'wedding',
  },
  {
    id: 'work-2',
    category: 'brand',
    categoryLabel: 'Brand & Commercial',
    title: 'Nomad Labs High-Retention Fashion Runway',
    client: 'Nomad DTC Paris',
    aspect: '9:16',
    runtime: '45s Reel + 4x Hook Variants',
    image: '/images/portfolio-brand-1.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Kinetic Motion Lead (Premiere Pro & After Effects)',
    gradeProfile: 'DaVinci Wide Gamut High-Contrast Commercial',
    audioMaster: 'Bespoke Rhythmic Textile Foley & Bass Drops',
    deliveryTimeline: '04 Working Days (48h Turnaround Available)',
    description:
      '120fps high-speed runway captures transformed into a high-retention vertical hook commercial. Rhythmic audio foley locked to fabric motion and micro speed-ramps to achieve 42% completion rate on paid social channels.',
    tags: ['Viral Hook', 'Speed Ramps', 'Sound Foley', '9:16 Vertical'],
    bookCategory: 'brand',
  },
  {
    id: 'work-3',
    category: 'product',
    categoryLabel: 'Product & Commercial',
    title: 'Apex Chronograph Macro Mechanical Showcase',
    client: 'Apex Timepieces Geneva',
    aspect: '16:9',
    runtime: '60s Macro Showcase Master',
    image: '/images/portfolio-product-1.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: '3D & Commercial Post Lead',
    gradeProfile: 'ACEScc Precision Metallic Lustre Conforming',
    audioMaster: 'Mechanical Gear Ticks & Atmospheric Sub-Bass',
    deliveryTimeline: '05 Working Days',
    description:
      'Microscope lens captures of mechanical movement combined with 3D exploded cutaway assets. Digital dust and scratch cleanup, sub-millimeter stabilization, and pristine metallic glare grading.',
    tags: ['Macro 4K', 'Dust/Scratch Cleanup', '3D Motion', 'Metallic Color Conforming'],
    bookCategory: 'brand',
  },
  {
    id: 'work-4',
    category: 'wedding',
    categoryLabel: 'Wedding Cinema',
    title: 'Heritage S-Log3 Gamut Conform Ceremony',
    client: 'Destination Jaipur Nuptials',
    aspect: '16:9',
    runtime: '3 Min Cinematic Highlight + 30s Reel',
    image: '/images/portfolio-wedding-2.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Senior Wedding Editor (Premiere Pro & DaVinci)',
    gradeProfile: 'Sony S-Log3 to ARRI Alexa 709 Emulation',
    audioMaster: 'Multi-Track Vedic Chants & Vows Equalization',
    deliveryTimeline: '07 Working Days',
    description:
      'Intricate daytime outdoor lighting balanced against high-contrast indoor candlelight. Dynamic range preserved with skin-tone protection masks and multi-channel stem audio mastering.',
    tags: ['Sony S-Log3', 'Vows Audio Polish', 'Skin-Tone Masking', 'Licensed Score'],
    bookCategory: 'wedding',
  },
  {
    id: 'work-5',
    category: 'corporate',
    categoryLabel: 'Corporate & Keynotes',
    title: 'Horizon Fintech Global Keynote & Summit',
    client: 'Horizon Technologies Bangalore',
    aspect: '16:9',
    runtime: '12 Min Executive Cut + 90s Sizzle Reel',
    image: '/images/portfolio-corporate-1.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Executive Corporate Broadcast Editor',
    gradeProfile: 'Clean Corporate Cool Neutral Rec.709',
    audioMaster: 'iZotope RX Spectral Denoise & Dialogue Leveler',
    deliveryTimeline: '05 Working Days',
    description:
      'Multi-speaker keynote recorded in high-echo convention hall conformed to broadcast clarity with spectral acoustic repair. Key financial chart slide callouts and dynamic animated lower-thirds.',
    tags: ['Multi-Cam Speech', 'Spectral Denoise', 'Animated Graphics', 'Investor Sizzle'],
    bookCategory: 'corporate',
  },
  {
    id: 'work-6',
    category: 'brand',
    categoryLabel: 'Brand & Commercial',
    title: 'Fintech Mobile Flow Kinetic App Commercial',
    client: 'NeoBank Direct DTC',
    aspect: '9:16',
    runtime: '30s High-Velocity Direct Response Cut',
    image: '/images/portfolio-brand-2.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Viral Commercial Specialist',
    gradeProfile: 'Vibrant Punchy Modern Digital Rec.709',
    audioMaster: 'UI Sound Effects & Hyper-Charged Voiceover Polish',
    deliveryTimeline: '03 Working Days',
    description:
      'Kinetic device mockups, UI screen recordings, and rapid-fire visual hooks designed for mobile acquisition campaigns. Tested against 6 different intro variations.',
    tags: ['Mobile UI Conform', 'Direct Response', 'Voiceover Polish', 'High-Velocity'],
    bookCategory: 'brand',
  },
  {
    id: 'work-7',
    category: 'wedding',
    categoryLabel: 'Wedding Cinema',
    title: 'The Rajasthan Royal Palace Celebration',
    client: 'Heritage Fort Weddings',
    aspect: '16:9',
    runtime: '5 Min Narrative Story Cut',
    image: '/images/reels/wedding-palace.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Lead Cinematic Narrative Editor',
    gradeProfile: 'Rec.709 Film Contrast & Royal Gold Warmth',
    audioMaster: 'Binaural Ambient Soundscapes & Acoustic Strings',
    deliveryTimeline: '08 Working Days (Complimentary Revision Pass)',
    description:
      'Multi-day footage across four cameras. Precision audio synchronization on non-timecode ambient recordings, finished with custom Rec.709 film emulations to accentuate architectural golden hours.',
    tags: ['Royal Palace', 'Ambient Foley', 'Rec.709 Grade', 'Emotional Arc'],
    bookCategory: 'wedding',
  },
  {
    id: 'work-8',
    category: 'brand',
    categoryLabel: 'Brand & Commercial',
    title: 'Neon Fashion Cyberpunk Editorial',
    client: 'CyberApparel London',
    aspect: '9:16',
    runtime: '30s Fashion Lookbook Reel',
    image: '/images/reels/neon-fashion.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'High-Velocity Editorial Lead',
    gradeProfile: 'High Saturation Neon Cyan & Magenta Color Conforming',
    audioMaster: 'Synthwave Sound Design with Sub-Bass Impacts',
    deliveryTimeline: '04 Working Days',
    description:
      '100fps night-runway captures with customized chromatic aberration, geometric text tracking, and punchy transitions matching high-bpm electronic music tracks.',
    tags: ['Cyberpunk', 'High-Speed Runway', 'Neon Colorist', 'Hook Reel'],
    bookCategory: 'brand',
  },
  {
    id: 'work-9',
    category: 'product',
    categoryLabel: 'Product & Commercial',
    title: 'Aura Botanical Luxury Serum Commercial',
    client: 'Aura Clean Beauty',
    aspect: 'Dual (16:9 + 9:16)',
    runtime: '45s Commercial Spot',
    image: '/images/reels/luxury-product.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Commercial Macro Specialist',
    gradeProfile: 'Clean High-Key Luminescence & Skin Glow Master',
    audioMaster: 'Subtle Droplet Foley & Atmospheric Pads',
    deliveryTimeline: '05 Working Days',
    description:
      'High-speed liquid droplet macro shots conformed with soft beauty grade lighting. Precise product bottle label color consistency across both vertical social and widescreen broadcast formats.',
    tags: ['Beauty & Cosmetics', 'Liquid Macro', 'Label Precision', 'Dual Aspect'],
    bookCategory: 'brand',
  },
  {
    id: 'work-10',
    category: 'music',
    categoryLabel: 'Music & Live Events',
    title: 'Solaris Electric Hypercar Worldwide Launch',
    client: 'Solaris Motor Corporation',
    aspect: '16:9',
    runtime: '90s Commercial Broadcast Teaser',
    image: '/images/reels/automotive-supercar.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Automotive Commercial VFX Lead',
    gradeProfile: 'Deep Obsidian Shadow Tone & Carbon Fiber Detail',
    audioMaster: 'Synthesized Electric Motor Torque & Exhaust Sweep',
    deliveryTimeline: '06 Working Days',
    description:
      'Multi-layer CG asset integration, subtle technical typography overlays, and visceral synthesized electric powertrain sound design engineered for worldwide commercial broadcast.',
    tags: ['Automotive', 'CGI Integration', 'Sound Design', '4K Broadcast'],
    bookCategory: 'brand',
  },
  {
    id: 'work-11',
    category: 'music',
    categoryLabel: 'Music & Live Events',
    title: 'Electric Pulse Music Festival Mainstage Aftermovie',
    client: 'Pulse Live Global',
    aspect: '9:16',
    runtime: '60s Festival Reel',
    image: '/images/reels/dj-festival.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Event & Festival Cut Specialist',
    gradeProfile: 'Dynamic Stage Lighting Conformed for Mobile Displays',
    audioMaster: 'Crowd Ambience Balanced with Clean Soundboard Mix',
    deliveryTimeline: '04 Working Days',
    description:
      'Low-light festival stage footage denoised and stabilized. Beat-matched visual cuts aligned with live crowd energy and pyrotechnic timing.',
    tags: ['Festival Reel', 'Low-Light Denoise', 'Crowd Audio', 'Beat Match'],
    bookCategory: 'personal',
  },
  {
    id: 'work-12',
    category: 'music',
    categoryLabel: 'Music & Live Events',
    title: 'Velvet Underground Arena Concert Master',
    client: 'Velvet Touring Agency',
    aspect: '16:9',
    runtime: '7 Min Concert Narrative Film',
    image: '/images/reels/concert-rock.jpg',
    videoUrl: '/images/showreel.mp4',
    cutter: 'Concert Post Supervisor',
    gradeProfile: '35mm Film Grain Simulation & Stage Lighting Grade',
    audioMaster: '32-Channel Live Multitrack Audio Mix',
    deliveryTimeline: '08 Working Days',
    description:
      'Eight cinema camera angles conformed with 32-channel soundboard audio stems. Seamless cutting between intimate singer close-ups and expansive stadium crowd wide shots.',
    tags: ['Concert Master', 'Multi-Cam 8-Angle', 'Multitrack Mix', 'Film Grain'],
    bookCategory: 'personal',
  },
];

type CategoryFilter = 'all' | 'wedding' | 'brand' | 'product' | 'corporate' | 'music';

export default function WorkPage() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedVideo, setSelectedVideo] = useState<WorkItem | null>(null);

  const filteredItems = filter === 'all' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter((item) => item.category === filter);

  return (
    <div className="min-h-screen bg-white text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* 00. Top Navigation */}
      <Navbar />

      <main className="w-full pt-28 pb-20 max-w-full overflow-x-clip flex-1">
        {/* Header Hero */}
        <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 mb-12">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1D1D1F] uppercase">
              STUDIO WORK &amp; CINEMATIC ARCHIVE
            </h1>
            <p className="text-base sm:text-lg text-[#86868B] leading-relaxed">
              Explore our curated portfolio across luxury wedding films, high-velocity DTC brand commercials, macro product showcases, and executive keynotes. Every project is conformed with deterministic color science and licensed acoustic mastering.
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center gap-2 pt-6 border-t border-[#F5F5F7]">
            {[
              { id: 'all', label: 'All Work' },
              { id: 'wedding', label: 'Wedding Cinema' },
              { id: 'brand', label: 'Brand & UGC' },
              { id: 'product', label: 'Product & Commercial' },
              { id: 'corporate', label: 'Corporate & Keynotes' },
              { id: 'music', label: 'Music & Events' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as CategoryFilter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#1D1D1F] text-white shadow-sm'
                    : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5E7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Portfolio Showcase Grid */}
        <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:border-[#3B82F6]/50 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Container with Play Overlay */}
                <div
                  className="relative aspect-video w-full bg-[#141414] overflow-hidden cursor-pointer"
                  onClick={() => setSelectedVideo(item)}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                  {/* Badges on Top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white z-10">
                    <span className="px-2.5 py-1 rounded-md bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 uppercase tracking-wider text-[10px]">
                      {item.categoryLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] font-mono text-white/90">
                      {item.aspect}
                    </span>
                  </div>

                  {/* Play Button Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-[#3B82F6] text-[#1D1D1F] group-hover:text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                      <span className="text-xl ml-0.5 leading-none">▶</span>
                    </div>
                  </div>

                  {/* Bottom Strip inside Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-xs text-white z-10 flex items-center justify-between">
                    <span className="font-semibold text-white/90 text-xs truncate max-w-[200px]">
                      {item.runtime}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      ✓ {item.deliveryTimeline.split(' ')[0]} {item.deliveryTimeline.split(' ')[1]}
                    </span>
                  </div>
                </div>

                {/* Card Content Pane */}
                <div className="p-6 flex flex-col justify-between flex-1 gap-5">
                  <div className="space-y-2.5">
                    <div className="text-[11px] font-mono uppercase text-[#86868B] font-semibold">
                      Client: {item.client}
                    </div>
                    <h3 className="text-lg font-bold text-[#1D1D1F] leading-snug group-hover:text-[#3B82F6] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#86868B] leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Technical Meta Strip */}
                  <div className="pt-4 border-t border-[#F5F5F7] space-y-2 text-[11px]">
                    <div className="flex justify-between items-center text-[#86868B]">
                      <span>Conform / Color:</span>
                      <span className="font-semibold text-[#1D1D1F] truncate max-w-[170px]" title={item.gradeProfile}>
                        {item.gradeProfile.split(' ')[0]} {item.gradeProfile.split(' ')[1]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#86868B]">
                      <span>Lead Specialist:</span>
                      <span className="font-semibold text-[#1D1D1F] truncate max-w-[170px]">
                        {item.cutter.split('(')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.tags.slice(0, 3).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded bg-[#F5F5F7] text-[#1D1D1F] text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Link to Book */}
                  <div className="pt-4 border-t border-[#F5F5F7] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(item)}
                      className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Preview Reel</span>
                      <span>↗</span>
                    </button>

                    <Link
                      href={`/book?category=${item.bookCategory}`}
                      className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      Order Cut →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Video Preview Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] font-mono text-[#3B82F6] uppercase font-bold tracking-wider">
                    {selectedVideo.categoryLabel} • {selectedVideo.aspect}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                    {selectedVideo.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="w-9 h-9 rounded-full bg-[#262626] hover:bg-[#333] text-white flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full bg-black">
                <video
                  src={selectedVideo.videoUrl || '/images/showreel.mp4'}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Modal Footer Specifications */}
              <div className="p-4 sm:p-6 bg-[#1A1A1A] border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="text-white font-semibold">{selectedVideo.gradeProfile}</div>
                  <div className="text-[#86868B]">{selectedVideo.audioMaster}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedVideo(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#333] hover:border-white text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    href={`/book?category=${selectedVideo.bookCategory}`}
                    className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Book This Cut →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 06. Studio Footer */}
      <Footer />
    </div>
  );
}
