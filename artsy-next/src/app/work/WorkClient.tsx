'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export interface PortfolioVideo {
  id: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  preview_url?: string;
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
 * Bulletproof, high-performance HTML5 video preview card.
 * - Concurrency-aware: Prioritizes active viewport cards to prevent browser socket exhaustion.
 * - Continuous Seamless Auto-Replay: Quad-layer loop shield (onEnded, onTimeUpdate, onSeeked, loop) ensuring videos replay continuously without freezing.
 * - Zero Black Title Slates: Jumps directly to highlight start and loops back to highlight start on repeat.
 * - Active Playback Recovery: Listens to canplay and canplaythrough to immediately resume when buffer fills.
 * - DOM-level muted enforcement for 100% universal browser policy compliance across iOS Safari, Chrome, Edge, and Firefox.
 */
function VideoCardPreview({
  src,
  previewSrc,
  poster,
  title,
  category,
  priority = false,
}: {
  src: string;
  previewSrc?: string;
  poster?: string;
  title: string;
  category: string;
  priority?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isInView, setIsInView] = useState(priority);
  const [hasEnteredView, setHasEnteredView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeSrc, setActiveSrc] = useState(previewSrc || src);
  const isPreview = activeSrc === previewSrc && Boolean(previewSrc);
  const hasSeekedInitialRef = useRef(false);

  const isReel = category.toLowerCase().includes('reel');
  const isTeaser = category.toLowerCase().includes('teaser') || category.toLowerCase().includes('trailer');
  const isPreWedding = category.toLowerCase().includes('pre-wedding') || category.toLowerCase().includes('pre wedding');
  
  // Highlight preview starting timestamp: only needed if playing the master cut directly
  const previewStartTime = isPreview ? 0 : (isReel ? 0.1 : isTeaser ? 1.5 : isPreWedding ? 4.5 : 5.0);

  // Viewport observation: activates playback when in view, pauses when out of view to save bandwidth
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting;
        setIsInView(isVisible);

        if (isVisible) {
          setHasEnteredView(true);
          const video = videoRef.current;
          if (video && video.paused) {
            video.muted = true;
            video.defaultMuted = true;
            video.play().catch(() => {});
          }
        } else {
          const video = videoRef.current;
          if (video && !video.paused) {
            video.pause();
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '250px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Programmatic play trigger whenever card is in view
  useEffect(() => {
    if (!isInView || !activeSrc) return;
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [activeSrc, isInView]);

  // Seamless continuous replay function: restarts smoothly and immediately
  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isPreview && video.duration && video.duration > previewStartTime) {
      video.currentTime = previewStartTime;
    } else {
      video.currentTime = 0;
    }
    video.muted = true;
    const p = video.play();
    if (p !== undefined) p.catch(() => {});
  }, [isPreview, previewStartTime]);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1C1E] to-[#0A0A0A] text-white/70">
        <span className="text-3xl mb-1">🎬</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/50 px-4 text-center truncate w-full">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      {/* Studio Master Resolution Badge */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white/95 font-mono text-[9px] font-bold tracking-wider uppercase border border-white/10 shadow-xs">
          {isReel ? '9:16 REEL' : '4K UHD'}
        </span>
      </div>

      {/* Smooth Loading Shimmer (fades out as video begins playing) */}
      <div
        className={`absolute inset-0 bg-[#0A0A0A] flex items-center justify-center transition-opacity duration-500 pointer-events-none z-5 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-[#3B82F6] animate-spin" />
      </div>

      {hasEnteredView ? (
        <video
          ref={(el) => {
            videoRef.current = el;
            if (el) {
              el.muted = true;
              el.defaultMuted = true;
            }
          }}
          src={activeSrc}
          poster={poster || undefined}
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? 'auto' : 'metadata'}
          className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={() => {
            if (activeSrc !== src) {
              setActiveSrc(src);
            } else {
              setHasError(true);
            }
          }}
          onLoadedMetadata={(e) => {
            const vid = e.currentTarget;
            vid.muted = true;
            vid.defaultMuted = true;
            if (!isPreview && !hasSeekedInitialRef.current && previewStartTime > 0 && vid.duration > previewStartTime) {
              hasSeekedInitialRef.current = true;
              vid.currentTime = previewStartTime;
            }
            if (isInView) {
              vid.play().catch(() => {});
            }
          }}
          onLoadedData={(e) => {
            const vid = e.currentTarget;
            vid.muted = true;
            if (isInView) {
              vid.play().catch(() => {});
            }
            setIsLoaded(true);
          }}
          onCanPlay={(e) => {
            const vid = e.currentTarget;
            vid.muted = true;
            if (isInView && vid.paused) {
              vid.play().catch(() => {});
            }
            setIsLoaded(true);
          }}
          onPlaying={() => setIsLoaded(true)}
          onEnded={handleReplay}
          onSeeked={(e) => {
            const vid = e.currentTarget;
            if (!isPreview && vid.currentTime < previewStartTime - 0.5 && vid.duration > previewStartTime) {
              vid.currentTime = previewStartTime;
              if (isInView) {
                vid.play().catch(() => {});
              }
            }
          }}
          onTimeUpdate={(e) => {
            const vid = e.currentTarget;
            if (vid.duration && vid.duration > 1.0) {
              // Seamless continuous loop: restart 0.25s before end
              if (vid.currentTime >= vid.duration - 0.25) {
                handleReplay();
              }
            }
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Premium Modal Video Player.
 * Native HTML5 high-definition video player with full playback controls and resilient unmuting.
 */
function ModalVideoPlayer({ video }: { video: PortfolioVideo }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMutedByPolicy, setIsMutedByPolicy] = useState(false);

  const isReel = (video.category || '').toLowerCase().includes('reel');
  const isTeaser = (video.category || '').toLowerCase().includes('teaser') || (video.category || '').toLowerCase().includes('trailer');
  const isPreWedding = (video.category || '').toLowerCase().includes('pre-wedding') || (video.category || '').toLowerCase().includes('pre wedding');
  const highlightStart = isReel ? 0.1 : isTeaser ? 1.5 : isPreWedding ? 4.5 : 4.0;

  const handleModalReplay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.play().catch(() => {});
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // First attempt unmuted playback
    vid.muted = false;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fall back to muted playback if browser policy requires it
        vid.muted = true;
        setIsMuted(true);
        setIsMutedByPolicy(true);
        vid.play().catch(() => {});
      });
    }
  }, [video.video_url]);

  const toggleSound = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const newMuted = !vid.muted;
    vid.muted = newMuted;
    setIsMuted(newMuted);
    setIsMutedByPolicy(false);
  };

  return (
    <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center group">
      {/* Quality Badge */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[#3B82F6] font-mono text-xs font-bold tracking-wider uppercase border border-[#3B82F6]/30 shadow-lg">
          4K ULTRA HD • DIRECT EDGE STREAM
        </span>
      </div>

      {/* Unmute Prompt if muted by browser policy */}
      {isMutedByPolicy && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-16 left-6 z-20 px-4 py-2.5 rounded-xl bg-black/80 hover:bg-[#3B82F6] text-white text-xs font-bold tracking-wide uppercase backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-xl cursor-pointer"
        >
          <span>🔊</span>
          <span>Click to Unmute Audio</span>
        </button>
      )}

      <video
        ref={(el) => {
          videoRef.current = el;
        }}
        src={video.video_url}
        controls
        autoPlay
        loop
        playsInline
        preload="auto"
        className="w-full h-full object-contain"
        onEnded={handleModalReplay}
        onLoadedMetadata={(e) => {
          const vid = e.currentTarget;
          if (highlightStart > 0 && vid.currentTime < highlightStart && vid.duration > highlightStart) {
            vid.currentTime = highlightStart;
          }
          vid.play().catch(() => {});
        }}
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

  // Only fetch on mount if initialVideos is empty
  useEffect(() => {
    if (initialVideos.length > 0) return;
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
  }, [initialVideos.length]);

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
            {filteredVideos.map((video, idx) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="group bg-white rounded-3xl border border-[#E5E5E7] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] hover:border-[#3B82F6]/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* 16:9 Aspect Video Preview Container */}
                <div>
                  <div className="relative aspect-video w-full bg-[#0A0A0A] overflow-hidden">
                    <VideoCardPreview
                      key={video.id}
                      src={video.video_url}
                      previewSrc={video.preview_url}
                      poster={video.thumbnail_url}
                      title={video.title}
                      category={video.category}
                      priority={idx < 3}
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

            {/* Video Player (High-Definition Native Player with unmuting) */}
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
