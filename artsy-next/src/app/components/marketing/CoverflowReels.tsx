'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ReelCard {
  title: string;
  category: string;
  aspect: '16/9' | '9/16';
  image: string;
  videoUrl: string;
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const FEATURED_MIX: ReelCard[] = [
  {
    title: 'Chandni & Harihar — Grand Reception',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_preview.mp4'),
  },
  {
    title: 'Anoop & Ansa — Viral Wedding Reel',
    category: 'Cinematic Reel',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/ANOOP___ANSA_REEL_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/ANOOP___ANSA_REEL_low_preview.mp4'),
  },
  {
    title: 'Juhi & Swapnil — Grand North Indian',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_preview.mp4'),
  },
  {
    title: 'Kuhu — Haldi Celebration Reel',
    category: 'Cinematic Reel',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Kuhu_Haldi_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Kuhu_Haldi_Reel_low_preview.mp4'),
  },
  {
    title: 'Rajat & Nimisha — South Indian Wedding',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Rajat__Nimishas_South_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Rajat__Nimishas_South_Indian_Wedding_Film___Cinematic_Highlights_preview.mp4'),
  },
  {
    title: 'Shweta — Bridal Solo Reel',
    category: 'Cinematic Reel',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Shweta_Reel_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Shweta_Reel_Low_preview.mp4'),
  },
  {
    title: 'Akash & Mayuri — Mumbai Wedding Film',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_preview.mp4'),
  },
  {
    title: 'Sanket & Rutuja — Sangeet Night Reel',
    category: 'Cinematic Reel',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__preview.mp4'),
  },
];

/**
 * Crystal-Clear Looping Video Player:
 * - Seeks to the vibrant middle segment (skipping any black screens or static titles).
 * - Plays for 12 seconds of peak cinematic action, then loops continuously.
 * - 100% full color vibrancy with ZERO grey wraps, dimming filters, or dark overlays.
 */
function LoopingHighlightVideo({
  src,
  poster,
  priority = false,
}: {
  src: string;
  poster?: string;
  priority?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startMidRef = useRef<number>(0);
  const hasSeekedRef = useRef<boolean>(false);

  const initMidpoint = (video: HTMLVideoElement) => {
    if (hasSeekedRef.current) return;
    const dur = video.duration;
    if (dur && Number.isFinite(dur) && dur > 4) {
      const mid = Math.max(3.5, Math.floor(dur * 0.45));
      startMidRef.current = mid;
      try {
        video.currentTime = mid;
        hasSeekedRef.current = true;
      } catch {}
      video.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !hasSeekedRef.current) return;
    const maxPlayTime = startMidRef.current + 12;
    if (video.currentTime >= maxPlayTime || (video.duration && video.currentTime >= video.duration - 0.5)) {
      video.currentTime = startMidRef.current;
      video.play().catch(() => {});
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startMidRef.current;
    video.play().catch(() => {});
  };

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload={priority ? 'auto' : 'metadata'}
      onLoadedMetadata={(e) => initMidpoint(e.currentTarget)}
      onLoadedData={(e) => initMidpoint(e.currentTarget)}
      onCanPlay={(e) => initMidpoint(e.currentTarget)}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      className="object-cover w-full h-full pointer-events-none group-hover:scale-105 transition-transform duration-700 ease-out opacity-100"
    />
  );
}

export default function CoverflowReels() {
  const [currentIndex, setCurrentIndex] = useState(2);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const currentDeltaXRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const isHoveredRef = useRef(false);

  const total = FEATURED_MIX.length;
  const AUTOPLAY_INTERVAL = 4200;
  const DRAG_SENSITIVITY = 260;
  const SWIPE_THRESHOLD = 40;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Continuous auto-rotation
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHoveredRef.current && !isPointerDownRef.current) {
        nextSlide();
      }
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide]);

  // Pointer drag logic
  const handlePointerStart = (clientX: number) => {
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = clientX;
    currentDeltaXRef.current = 0;
    setIsDragging(true);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isPointerDownRef.current) return;
    const deltaX = clientX - startXRef.current;
    currentDeltaXRef.current = deltaX;

    if (Math.abs(deltaX) > 6) {
      hasDraggedRef.current = true;
    }

    const offsetFraction = -deltaX / DRAG_SENSITIVITY;
    const clampedOffset = Math.max(-0.85, Math.min(0.85, offsetFraction));
    setDragOffset(clampedOffset);
  };

  const handlePointerEnd = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);
    setDragOffset(0);

    const deltaX = currentDeltaXRef.current;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }

    currentDeltaXRef.current = 0;
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  return (
    <section
      className="w-full py-16 sm:py-24 bg-white overflow-hidden relative"
      id="featured-reels"
    >
      {/* Section Header */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 mb-8 text-center sm:text-left">
        <span className="text-[11px] font-bold tracking-widest uppercase text-[#3B82F6] block mb-1.5">
          Selected Showcase
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1D1D1F]">
          Cinematic craftsmanship in motion.
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#86868B] max-w-2xl">
          Explore our master wedding films, pre-wedding cinema, and high-velocity vertical reels.
        </p>
      </div>

      {/* 3D Coverflow Container (Pure Mix, Auto-Rotating, Zero Clutter) */}
      <div
        ref={wrapperRef}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          handlePointerEnd();
        }}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest('button')) return;
          handlePointerStart(e.clientX);
        }}
        onMouseMove={(e) => handlePointerMove(e.clientX)}
        onMouseUp={handlePointerEnd}
        onTouchStart={(e) => handlePointerStart(e.touches[0].clientX)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
        onTouchEnd={handlePointerEnd}
        onTouchCancel={handlePointerEnd}
        className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-8 py-2 select-none cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* 3D Stage Viewport */}
        <div className="coverflow-stage relative w-full h-[460px] sm:h-[530px] flex items-center justify-center overflow-hidden pointer-events-none">
          {FEATURED_MIX.map((item, idx) => {
            let diff = idx - currentIndex;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const effectiveDiff = diff + dragOffset;
            const absDiff = Math.abs(effectiveDiff);

            let transform = '';
            let zIndex = 0;
            let opacity = 0;
            let isCenter = false;
            let pointerEvents: 'auto' | 'none' = 'none';

            const is169 = item.aspect === '16/9';

            if (absDiff < 0.5) {
              // Centered active card
              const scale = 1.04 - absDiff * 0.08;
              const rotateY = effectiveDiff * -14;
              const translateZ = 80 - absDiff * 60;
              const translateX = effectiveDiff * (is169 ? 220 : 170);

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = 35;
              opacity = 1;
              pointerEvents = 'auto';
              isCenter = true;
            } else if (absDiff <= 1.8) {
              // Flanking visible cards (No artificial brightness dimming)
              const sign = effectiveDiff > 0 ? 1 : -1;
              const normDist = absDiff;
              const spacing = is169 ? (240 + (normDist - 1) * 170) : (190 + (normDist - 1) * 140);
              const translateX = sign * spacing;
              const rotateY = sign * -15;
              const translateZ = -40 * normDist;
              const scale = Math.max(0.78, 0.92 - normDist * 0.08);
              const opacityVal = Math.max(0.65, 0.92 - normDist * 0.15);

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = Math.round(25 - absDiff * 5);
              opacity = opacityVal;
              pointerEvents = 'auto';
            } else {
              // Culled distant cards
              transform = `translate(-50%, -50%) translate3d(0, 0, -280px) scale(0.55)`;
              zIndex = 0;
              opacity = 0;
              pointerEvents = 'none';
            }

            const widthClass = is169
              ? 'w-[320px] sm:w-[460px] md:w-[500px] aspect-video'
              : 'w-[200px] sm:w-[250px] md:w-[270px] aspect-[9/16]';

            return (
              <div
                key={`mix-${idx}`}
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                    return;
                  }
                  if (currentIndex !== idx) {
                    setCurrentIndex(idx);
                  }
                }}
                style={{
                  transform,
                  zIndex,
                  opacity,
                  pointerEvents,
                }}
                className={`coverflow-card ${widthClass} rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A0A0A] cursor-pointer group transition-[border,box-shadow] duration-300 ${
                  isDragging ? 'is-dragging' : ''
                } ${
                  isCenter
                    ? 'border border-white/25 shadow-[0_24px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/5'
                    : 'border border-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.08)]'
                }`}
              >
                <div className="relative w-full h-full bg-black">
                  {/* Crystal-Clear Live Looping Video Clip - Pure Color, NO Grey Overlays */}
                  <LoopingHighlightVideo
                    src={item.videoUrl}
                    poster={item.image}
                    priority={absDiff < 1.5}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
