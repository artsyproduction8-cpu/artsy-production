'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
  r2_key?: string;
}

interface WorkClientProps {
  initialVideos?: PortfolioVideo[];
}

type CategoryFilter = 'all' | 'wedding' | 'pre-wedding' | 'teaser' | 'reels';

/**
 * High-performance, viewport-aware video preview card.
 * Uses IntersectionObserver so ONLY visible cards decode video, preventing GPU and network choking.
 * Automatically skips 2-second black title slates (starts at 1.8s) for instant cinematic impact.
 */
function VideoCardPreview({
  src,
  title,
  category,
}: {
  src: string;
  title: string;
  category: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 1. Viewport-Aware Observer: Only mount src and decode when in or near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.05,
        rootMargin: '150px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Play when in view, pause when scrolled far away
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInView) return;

    video.muted = true;
    video.defaultMuted = true;

    if (!hasError) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    }
  }, [isInView, hasError]);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-white/70">
        <span className="text-3xl mb-1">🎬</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/50">{title}</span>
      </div>
    );
  }

  const isReel = category.toLowerCase().includes('reel');

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      {/* Studio Master Resolution Badge */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white/95 font-mono text-[9px] font-bold tracking-wider uppercase border border-white/10 shadow-xs">
          {isReel ? '9:16 REEL' : '4K UHD'}
        </span>
      </div>

      {/* Subtle loader shimmer before first frame paints */}
      {!isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#18181B] to-[#0A0A0A] text-white/40">
          <div className="w-5 h-5 border-2 border-white/20 border-t-[#3B82F6] rounded-full animate-spin mb-2" />
          <span className="text-[9px] font-mono tracking-widest uppercase text-white/40">Loading 4K Cut</span>
        </div>
      )}

      {isInView ? (
        <video
          ref={videoRef}
          src={src}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
          className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          onLoadedData={() => setIsPlaying(true)}
          onPlaying={() => setIsPlaying(true)}
          onError={() => setHasError(true)}
          onCanPlay={(e) => {
            e.currentTarget.muted = true;
            e.currentTarget.defaultMuted = true;
            e.currentTarget.play().then(() => setIsPlaying(true)).catch(() => {});
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Premium Modal Video Player.
 * Automatically skips initial slate, initiates playback, handles browser audio autoplay
 * policy with a smooth unmute trigger, and displays authentic 4K master credentials.
 */
function ModalVideoPlayer({ video }: { video: PortfolioVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (el.currentTime < 1.0) {
      try {
        el.currentTime = 1.5;
      } catch {}
    }

    const p = el.play();
    if (p !== undefined) {
      p.catch(() => {
        // Fallback to muted autoplay if unmuted autoplay is blocked by browser policy
        el.muted = true;
        setIsAudioMuted(true);
        el.play().catch(() => {});
      });
    }
  }, [video.video_url]);

  const toggleUnmute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setIsAudioMuted(false);
  };

  return (
    <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
      {/* Audio Unmute Banner */}
      {isAudioMuted && (
        <button
          type="button"
          onClick={toggleUnmute}
          className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-black backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 border border-white/20 transition-all cursor-pointer shadow-lg hover:scale-105"
        >
          <span>🔇 Audio Muted by Browser</span>
          <span className="text-[#3B82F6] font-bold underline">Tap to Unmute 🔊</span>
        </button>
      )}

      {/* Quality Badge */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[#3B82F6] font-mono text-xs font-bold tracking-wider uppercase border border-[#3B82F6]/30 shadow-lg">
          4K ULTRA HD • DIRECT EDGE STREAM
        </span>
      </div>

      <video
        ref={videoRef}
        src={video.video_url}
        controls
        playsInline
        preload="auto"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export default function WorkClient({ initialVideos = [] }: WorkClientProps) {
  const [videos, setVideos] = useState<PortfolioVideo[]>(initialVideos);
  const [prevInitial, setPrevInitial] = useState<PortfolioVideo[]>(initialVideos);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [selectedVideo, setSelectedVideo] = useState<PortfolioVideo | null>(null);

  // Sync state if initialVideos changes (React-recommended pattern during render)
  if (initialVideos !== prevInitial) {
    setPrevInitial(initialVideos);
    if (initialVideos.length > 0) {
      setVideos(initialVideos);
    }
  }

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

  // Clean, deterministic filter logic matching the 4 studio categories
  const filteredVideos =
    filter === 'all'
      ? videos
      : videos.filter((item) => {
          const cat = (item.category || '').toLowerCase();
          if (filter === 'wedding') {
            return cat.includes('wedding') && !cat.includes('pre-wedding') && !cat.includes('teaser');
          }
          if (filter === 'pre-wedding') {
            return cat.includes('pre-wedding') || cat.includes('pre wedding');
          }
          if (filter === 'teaser') {
            return cat.includes('teaser') || cat.includes('trailer');
          }
          if (filter === 'reels') {
            return cat.includes('reel');
          }
          return cat.includes(filter);
        });

  // Calculate counts for category pills
  const counts = {
    all: videos.length,
    wedding: videos.filter((v) => {
      const c = (v.category || '').toLowerCase();
      return c.includes('wedding') && !c.includes('pre-wedding') && !c.includes('teaser');
    }).length,
    'pre-wedding': videos.filter((v) => {
      const c = (v.category || '').toLowerCase();
      return c.includes('pre-wedding') || c.includes('pre wedding');
    }).length,
    teaser: videos.filter((v) => {
      const c = (v.category || '').toLowerCase();
      return c.includes('teaser') || c.includes('trailer');
    }).length,
    reels: videos.filter((v) => (v.category || '').toLowerCase().includes('reel')).length,
  };

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

        {/* Interactive Filter Pills with Live Counts */}
        <div className="mt-8 flex flex-wrap items-center gap-2.5 pt-6 border-t border-[#F5F5F7]">
          {[
            { id: 'all', label: 'All Portfolio', count: counts.all },
            { id: 'wedding', label: 'Wedding Cinema', count: counts.wedding },
            { id: 'pre-wedding', label: 'Pre-Wedding Films', count: counts['pre-wedding'] },
            { id: 'teaser', label: 'Teasers & Trailers', count: counts.teaser },
            { id: 'reels', label: 'Cinematic Reels', count: counts.reels },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as CategoryFilter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === tab.id
                  ? 'bg-[#1D1D1F] text-white shadow-xs'
                  : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5E7]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-black/5 text-[#86868B]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Portfolio Showcase Grid */}
      <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-8">
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="group bg-white rounded-3xl border border-[#E5E5E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] hover:border-[#3B82F6]/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* 16:9 Aspect Video Preview Container */}
                <div>
                  <div className="relative aspect-video w-full bg-[#0A0A0A] overflow-hidden">
                    <VideoCardPreview
                      src={video.video_url}
                      title={video.title}
                      category={video.category}
                    />

                    {/* Click Shield to trigger modal */}
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={() => setSelectedVideo(video)}
                    />

                    {/* Subtle dark tint */}
                    <div className="absolute inset-0 bg-black/5 pointer-events-none group-hover:bg-transparent transition-colors" />
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#3B82F6]">
                        {video.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#86868B] uppercase">
                        Master Cut
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#1D1D1F] leading-snug group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                      {video.title}
                    </h3>

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
                    <span>Play Master</span>
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
            ))}
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
              <div className="flex items-center gap-3 truncate max-w-[85%]">
                <span className="px-2 py-0.5 rounded-md bg-[#3B82F6]/20 text-[#3B82F6] font-mono text-[10px] font-bold uppercase tracking-wider border border-[#3B82F6]/30">
                  {selectedVideo.category}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white truncate">
                  {selectedVideo.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-xl font-bold ml-4 shrink-0"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Video Player (High-Definition Native Player) */}
            <ModalVideoPlayer video={selectedVideo} />

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 bg-[#18181B] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs max-w-xl">
                <div className="text-white font-semibold flex items-center gap-2">
                  <span>Cinematic Post-Production Master</span>
                  <span className="text-[#3B82F6] font-mono text-[10px]">• 4K UHD</span>
                </div>
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
                    Direct 4K Stream ↗
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
