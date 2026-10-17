'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { extractYouTubeId } from '@/lib/youtube';
import YouTubePlayerModal from '@/components/YouTubePlayerModal';

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
  const [selectedVideo, setSelectedVideo] = useState<PortfolioVideo | null>(null);

  // Sync state if initialVideos changes
  useEffect(() => {
    if (initialVideos.length > 0) {
      setVideos(initialVideos);
    }
  }, [initialVideos]);

  // Re-fetch on mount so client always reflects live database portfolio
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

  // Lock body scroll and support Escape key when lightbox is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedVideo(null);
      }
    };

    if (selectedVideo) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedVideo]);

  // Filter logic
  const filteredVideos = filter === 'all'
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

  const selectedYtId = selectedVideo
    ? selectedVideo.youtube_id || extractYouTubeId(selectedVideo.video_url)
    : null;

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
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((video) => {
              const ytid = video.youtube_id || extractYouTubeId(video.video_url) || '';
              const thumbUrl = video.thumbnail_url || (ytid ? `https://img.youtube.com/vi/${ytid}/hqdefault.jpg` : '');

              return (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="group bg-white rounded-3xl border border-[#E5E5E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] hover:border-[#3B82F6]/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  {/* Movie Poster Thumbnail Container (16:9 aspect-video with object-cover) */}
                  <div>
                    <div className="relative aspect-video w-full bg-[#0A0A0A] overflow-hidden">
                      {ytid ? (
                        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${ytid}&playsinline=1&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&vq=highres&hd=1`}
                            title={video.title}
                            className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            tabIndex={-1}
                          />
                        </div>
                      ) : (
                        <img
                          src={thumbUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}

                      {/* Transparent click shield overlay so mouse never touches YouTube player */}
                      <div
                        className="absolute inset-0 z-10 cursor-pointer"
                        onClick={() => setSelectedVideo(video)}
                      />

                      {/* Vignette Gradient Overlay */}
                      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />

                      {/* Category Badge on Top-Left */}
                      <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider text-[10px] font-bold">
                          {video.category || 'Wedding Cinema'}
                        </span>
                      </div>

                      {/* Movie Poster Play Button Overlay on Hover */}
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-[#3B82F6] text-[#1D1D1F] group-hover:text-white flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110">
                          <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>

                      {/* Bottom Tag */}
                      <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
                        <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-mono font-medium">
                          4K Cinema
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Official Film
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] leading-snug group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                        {video.title}
                      </h3>

                      {/* Description rendered in muted text color under title; hidden gracefully if absent */}
                      {video.description && (
                        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-6 pt-0 border-t border-[#F5F5F7] mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#3B82F6] group-hover:underline flex items-center gap-1.5">
                      <span>Watch Film</span>
                      <span className="text-sm">▶</span>
                    </span>

                    <Link
                      href={`/book?category=${encodeURIComponent((video.category || '').toLowerCase().includes('wedding') ? 'wedding' : 'brand')}`}
                      onClick={(e) => e.stopPropagation()}
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
          /* Clean empty state when no videos match */
          <div className="p-16 text-center bg-white rounded-3xl border border-[#E5E5E7] shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-4 text-2xl">
              🎬
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F]">Portfolio Coming Soon</h3>
            <p className="text-sm text-[#86868B] mt-1.5 max-w-md mx-auto">
              Official company portfolio reels are currently being curated. Please check back shortly or order a custom edit cut directly.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                href="/book"
                className="px-5 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3B82F6] transition-colors"
              >
                Book a Project →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Video Lightbox Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedVideo.title}
        >
          <div
            className="relative w-full max-w-5xl bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between text-white">
              <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[85%]">
                {selectedVideo.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-xl font-bold ml-4 shrink-0"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Video Player (16:9 Aspect Ratio with YouTube Iframe API for 1080p/4K highres quality) */}
            <div className="relative aspect-video w-full bg-black">
              {selectedYtId ? (
                <YouTubePlayerModal videoId={selectedYtId} title={selectedVideo.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs">
                  Video preview unavailable
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#18181B] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs max-w-xl">
                <div className="text-white font-semibold">Cinematic Post-Production Master</div>
                {selectedVideo.description && (
                  <p className="text-gray-400 line-clamp-2 leading-relaxed">
                    {selectedVideo.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {selectedVideo.video_url && (
                  <a
                    href={selectedVideo.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl border border-white/20 hover:border-white text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    YouTube ↗
                  </a>
                )}
                <Link
                  href={`/book?category=${encodeURIComponent((selectedVideo.category || '').toLowerCase().includes('wedding') ? 'wedding' : 'brand')}`}
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
