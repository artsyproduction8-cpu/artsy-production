'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WorkItem, PORTFOLIO_ITEMS } from './portfolio-data';

type CategoryFilter = 'all' | 'wedding' | 'brand' | 'product' | 'corporate' | 'music';

export default function WorkClient() {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedVideo, setSelectedVideo] = useState<WorkItem | null>(null);

  const filteredItems = filter === 'all' ? PORTFOLIO_ITEMS : PORTFOLIO_ITEMS.filter((item) => item.category === filter);

  return (
    <>
      {/* Header Hero */}
      <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 mb-12">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1D1D1F] uppercase">
            CINEMATIC ARCHIVE
          </h1>
          <p className="text-base sm:text-lg text-[#86868B] leading-relaxed">
            Explore our curated portfolio across luxury wedding films, high-velocity DTC brand commercials, macro product showcases, and executive keynotes. Every project is conformed with deterministic color science and acoustic mastering.
          </p>
        </div>

        {/* Interactive Filter Pills */}
        <div className="mt-8 flex flex-wrap items-center gap-2 pt-6 border-t border-[#F5F5F7]">
          {[
            { id: 'all', label: 'All Portfolio' },
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
    </>
  );
}
