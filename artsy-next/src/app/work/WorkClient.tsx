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
 * - Continuous Seamless Auto-Replay: Quad-layer loop shield (onEnded, onTimeUpdate, onSeeked, loop).
 * - Compact & Quiet: Pure video focus with zero unnecessary tags or overlays.
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
  
  const previewStartTime = isPreview ? 0 : (isReel ? 0.1 : isTeaser ? 1.5 : isPreWedding ? 4.5 : 5.0);

  // Viewport observation: activates playback when in view, pauses when out of view
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

  // Seamless continuous replay function
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#141416] text-white/60">
        <span className="text-2xl mb-1">🎬</span>
        <span className="text-[10px] font-mono tracking-widest uppercase text-white/40 px-3 text-center truncate w-full">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0A0A0A] overflow-hidden">
      {/* Smooth Loading Shimmer */}
      <div
        className={`absolute inset-0 bg-[#0A0A0A] flex items-center justify-center transition-opacity duration-500 pointer-events-none z-5 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-[#3B82F6] animate-spin" />
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
 * Adaptive Aspect-Ratio Video Player.
 * - Detects 9:16 vertical reels vs 16:9 widescreen films automatically.
 * - Fits reels snugly in portrait mode without blank space on left/right.
 * - Clean, distraction-free player with zero backend links or overlays.
 */
function ModalVideoPlayer({
  video,
  isVertical,
  onDetectAspect,
}: {
  video: PortfolioVideo;
  isVertical: boolean;
  onDetectAspect?: (vertical: boolean) => void;
}) {
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
    <div
      className={`relative w-full bg-black overflow-hidden flex items-center justify-center group ${
        isVertical ? 'aspect-[9/16] max-h-[78vh] mx-auto' : 'aspect-video'
      }`}
    >
      {/* Unmute Prompt if muted by browser policy */}
      {isMutedByPolicy && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-6 left-6 z-20 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-[#3B82F6] text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-xl cursor-pointer"
        >
          <span>🔊</span>
          <span>Click to Unmute</span>
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
          if (vid.videoHeight > vid.videoWidth && onDetectAspect) {
            onDetectAspect(true);
          }
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
  const [isModalVertical, setIsModalVertical] = useState(false);

  // Sync state if initialVideos changes
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
      const isReel = (selectedVideo.category || '').toLowerCase().includes('reel');
      setIsModalVertical(isReel);
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedVideo]);

  // Clean filter logic matching the 4 studio categories
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
      {/* Header Hero - Clean & Simple */}
      <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 mb-8">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1D1D1F] uppercase">
            PORTFOLIO
          </h1>
          <p className="text-sm sm:text-base text-[#86868B] leading-relaxed">
            Explore our video edits across wedding cinema, pre-wedding films, teasers, and vertical reels.
          </p>
        </div>

        {/* Clean Filter Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-[#F5F5F7]">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'wedding', label: 'Wedding Cinema', count: counts.wedding },
            { id: 'pre-wedding', label: 'Pre-Wedding', count: counts['pre-wedding'] },
            { id: 'teaser', label: 'Teasers & Trailers', count: counts.teaser },
            { id: 'reels', label: 'Reels', count: counts.reels },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as CategoryFilter)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
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

      {/* Portfolio Showcase Grid - Compact Cards with Big Video Area */}
      <section className="w-full max-w-[1200px] mx-auto px-6 sm:px-8">
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredVideos.map((video, idx) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="group bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-[#3B82F6]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                {/* Video Area (Dominant & Prominent) */}
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
                  </div>

                  {/* Compact Info Area */}
                  <div className="p-3.5 sm:p-4 pb-2 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3B82F6] block">
                      {video.category}
                    </span>

                    <h3 className="text-sm sm:text-base font-bold text-[#1D1D1F] leading-snug group-hover:text-[#3B82F6] transition-colors truncate">
                      {video.title}
                    </h3>

                    {video.description && (
                      <p className="text-xs text-[#86868B] leading-relaxed line-clamp-1">
                        {video.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Compact Card Action Bar */}
                <div className="p-3.5 sm:p-4 pt-2.5 border-t border-[#F5F5F7] mt-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#3B82F6] group-hover:underline flex items-center gap-1">
                    <span>Watch</span>
                    <span className="text-[9px]">▶</span>
                  </span>

                  <Link
                    href={`/book?category=${encodeURIComponent((video.category || '').toLowerCase().includes('wedding') ? 'wedding' : 'brand')}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-lg bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-[11px] font-semibold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    Book Cut →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="p-16 text-center bg-white rounded-2xl border border-[#E5E5E7]">
            <div className="w-12 h-12 rounded-xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-3 text-xl">
              🎬
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F]">Portfolio Coming Soon</h3>
            <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
              Our official company reels are being updated. Check back shortly or book a custom cut directly.
            </p>
          </div>
        )}
      </section>

      {/* Video Lightbox Modal with Dynamic Aspect Ratio */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedVideo(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedVideo.title}
        >
          <div
            className={`relative w-full ${
              isModalVertical ? 'max-w-md sm:max-w-sm' : 'max-w-4xl lg:max-w-5xl'
            } bg-[#141414] border border-[#262626] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate max-w-[85%]">
                <span className="px-2 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] font-mono text-[9px] font-bold uppercase tracking-wider">
                  {selectedVideo.category}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {selectedVideo.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-base font-bold ml-2 shrink-0"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Video Player (Adaptive: 9:16 for Reels, 16:9 for Widescreen) */}
            <ModalVideoPlayer
              video={selectedVideo}
              isVertical={isModalVertical}
              onDetectAspect={(vert) => setIsModalVertical(vert)}
            />

            {/* Clean Modal Footer (No Backend Links or Clutter) */}
            <div className="p-3.5 sm:p-4 bg-[#18181B] border-t border-white/10 flex items-center justify-between gap-3">
              <div className="text-xs text-white/90 truncate max-w-[65%]">
                <span className="font-semibold">{selectedVideo.title}</span>
              </div>
              <Link
                href={`/book?category=${encodeURIComponent((selectedVideo.category || '').toLowerCase().includes('wedding') ? 'wedding' : 'brand')}`}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm shrink-0"
              >
                Book This Cut →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
