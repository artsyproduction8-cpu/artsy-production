'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LiteYouTubeEmbed from '@/components/LiteYouTubeEmbed';
import { extractYouTubeId } from '@/lib/youtube';
import { PORTFOLIO_ITEMS, WorkItem } from './portfolio-data';

export interface PortfolioVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string;
  youtube_id: string;
  display_order?: number;
  created_at?: string;
}

interface WorkClientProps {
  initialVideos?: PortfolioVideo[];
}

type CategoryFilter = 'all' | 'wedding' | 'brand' | 'product' | 'corporate' | 'music';

export default function WorkClient({ initialVideos = [] }: WorkClientProps) {
  const [videos, setVideos] = useState<PortfolioVideo[]>(initialVideos);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedVideo, setSelectedVideo] = useState<PortfolioVideo | WorkItem | null>(null);

  // Re-fetch on mount so client reflects newly added videos in real-time
  useEffect(() => {
    async function fetchFreshVideos() {
      try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.samples) && data.samples.length > 0) {
          setVideos(data.samples);
        }
      } catch (err) {
        console.error('Failed to load portfolio samples:', err);
      }
    }
    fetchFreshVideos();
  }, []);

  const hasDbVideos = videos.length > 0;

  // Filter logic
  const filteredDbVideos = filter === 'all'
    ? videos
    : videos.filter((item) => {
        const cat = (item.category || '').toLowerCase();
        if (filter === 'wedding') return cat.includes('wedding');
        if (filter === 'brand') return cat.includes('brand') || cat.includes('commercial') || cat.includes('social');
        if (filter === 'product') return cat.includes('product') || cat.includes('commercial');
        if (filter === 'corporate') return cat.includes('corporate') || cat.includes('documentary');
        if (filter === 'music') return cat.includes('music') || cat.includes('event');
        return cat.includes(filter);
      });

  const filteredStaticItems = filter === 'all'
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter((item) => item.category === filter);

  return (
    <>
      {/* Header Hero */}
      <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 mb-12">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1D1D1F] uppercase">
            CINEMATIC ARCHIVE
          </h1>
          <p className="text-base sm:text-lg text-[#86868B] leading-relaxed">
            Explore Artsy Production&apos;s official portfolio across luxury wedding films, pre-wedding cinema, and high-velocity commercial cuts. Every film is crafted with emotive storytelling, deterministic color grading, and acoustic precision.
          </p>
        </div>

        {/* Interactive Filter Pills */}
        <div className="mt-8 flex flex-wrap items-center gap-2 pt-6 border-t border-[#F5F5F7]">
          {[
            { id: 'all', label: 'All Portfolio' },
            { id: 'wedding', label: 'Wedding Cinema' },
            { id: 'brand', label: 'Brand & Commercial' },
            { id: 'product', label: 'Product & Showcase' },
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
        {hasDbVideos ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDbVideos.map((video) => {
              const ytid = video.youtube_id || extractYouTubeId(video.video_url) || '';

              return (
                <div
                  key={video.id}
                  className="group bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:border-[#3B82F6]/50 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top media container */}
                  <div>
                    <div className="relative aspect-video w-full bg-black overflow-hidden">
                      {ytid ? (
                        <LiteYouTubeEmbed
                          id={ytid}
                          title={video.title}
                          thumbnailUrl={video.thumbnail_url}
                        />
                      ) : (
                        <div
                          className="relative w-full h-full cursor-pointer group"
                          onClick={() => setSelectedVideo(video)}
                        >
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/90 text-[#1D1D1F] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-xl ml-0.5 leading-none">▶</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-[#1D1D1F] text-white uppercase tracking-wider text-[10px] font-bold">
                          {video.category || 'Wedding Cinema'}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Official Film
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#1D1D1F] leading-snug group-hover:text-[#3B82F6] transition-colors">
                        {video.title}
                      </h3>

                      {/* Description rendered in muted text color under title; hidden gracefully if absent */}
                      {video.description && (
                        <p className="text-sm text-gray-400 leading-relaxed mt-2 line-clamp-3">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-6 pt-0 border-t border-[#F5F5F7] mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedVideo(video)}
                      className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Preview Reel</span>
                      <span>↗</span>
                    </button>

                    <Link
                      href={`/book?category=${encodeURIComponent((video.category || '').toLowerCase().includes('wedding') ? 'wedding' : 'brand')}`}
                      className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                    >
                      Order Cut →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback static showcase if database is temporarily unavailable */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStaticItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:border-[#3B82F6]/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className="relative aspect-video w-full bg-[#141414] overflow-hidden cursor-pointer"
                    onClick={() => setSelectedVideo(item)}
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-white z-10">
                      <span className="px-2.5 py-1 rounded-md bg-[#0A0A0A]/80 backdrop-blur-md border border-white/10 uppercase tracking-wider text-[10px]">
                        {item.categoryLabel}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-[#3B82F6] text-[#1D1D1F] group-hover:text-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                        <span className="text-xl ml-0.5 leading-none">▶</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold text-[#1D1D1F] leading-snug group-hover:text-[#3B82F6] transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-400 leading-relaxed mt-2 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-[#F5F5F7] mt-4 flex items-center justify-between">
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
            ))}
          </div>
        )}
      </section>

      {/* Video Preview Lightbox Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between text-white">
              <div>
                <span className="text-[10px] font-mono text-[#3B82F6] uppercase font-bold tracking-wider">
                  {'category' in selectedVideo ? selectedVideo.category : 'Film'} • Artsy Production
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
              {(() => {
                const ytid =
                  ('youtube_id' in selectedVideo && selectedVideo.youtube_id)
                    ? selectedVideo.youtube_id
                    : ('video_url' in selectedVideo && selectedVideo.video_url)
                    ? extractYouTubeId(selectedVideo.video_url)
                    : null;

                if (ytid) {
                  return (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0&modestbranding=1`}
                      title={selectedVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                if ('videoUrl' in selectedVideo && selectedVideo.videoUrl) {
                  return (
                    <video
                      src={selectedVideo.videoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  );
                }

                return (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs">
                    No preview video available
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#1A1A1A] border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="text-white font-semibold">Cinematic Post-Production Master</div>
                <div className="text-gray-400">Artsy Studio Official Film</div>
              </div>
              <div className="flex items-center gap-3">
                {'video_url' in selectedVideo && selectedVideo.video_url && (
                  <a
                    href={selectedVideo.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl border border-[#333] hover:border-white text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    YouTube ↗
                  </a>
                )}
                <Link
                  href={`/book?category=${encodeURIComponent(('category' in selectedVideo && (selectedVideo.category || '').toLowerCase().includes('wedding')) ? 'wedding' : 'brand')}`}
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
