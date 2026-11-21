'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface ReelCard {
  title: string;
  category: string;
  aspect: '16/9' | '9/16';
  image: string;
  videoUrl: string;
}

const getStreamUrl = (key: string) => `/api/portfolio/stream?key=${encodeURIComponent(key)}`;

const REELS: ReelCard[] = [
  {
    title: 'Chandni & Harihar — Reception Film',
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
    title: 'Akash & Mayuri — Mumbai Highlights',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_preview.mp4'),
  },
  {
    title: 'Sanket & Rutuja — Sangeet Night',
    category: 'Cinematic Reel',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__preview.mp4'),
  },
  {
    title: 'Juhi & Swapnil — Grand North Indian',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_preview.mp4'),
  },
  {
    title: 'Kuhu — Haldi Celebration',
    category: 'Cinematic Reel',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Kuhu_Haldi_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Kuhu_Haldi_Reel_low_preview.mp4'),
  },
  {
    title: 'Akshay & Jagruti — Wedding Teaser',
    category: 'Teaser',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Akshay___Jagruti__Wedding_Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Akshay___Jagruti__Wedding_Teaser_Low_preview.mp4'),
  },
];

export default function CoverflowReels() {
  const [currentIndex, setCurrentIndex] = useState(3);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const currentDeltaXRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const isHoveredRef = useRef(false);

  const total = REELS.length;
  const AUTOPLAY_INTERVAL = 4500;
  const DRAG_SENSITIVITY = 260;
  const SWIPE_THRESHOLD = 40;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay
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
      className="w-full py-20 sm:py-28 bg-white overflow-hidden relative"
      id="featured-reels"
    >
      {/* Section Header */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 mb-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1D1D1F]">
          Featured films &amp; reels
        </h2>
      </div>

      {/* 3D Coverflow Container */}
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
        className="relative w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-4 select-none cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* 3D Stage Viewport */}
        <div className="coverflow-stage relative w-full h-[460px] sm:h-[520px] flex items-center justify-center overflow-hidden pointer-events-none">
          {REELS.map((reel, idx) => {
            let diff = idx - currentIndex;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const effectiveDiff = diff + dragOffset;
            const absDiff = Math.abs(effectiveDiff);

            let transform = '';
            let zIndex = 0;
            let opacity = 0;
            let filter = 'brightness(1)';
            let isCenter = false;
            let pointerEvents: 'auto' | 'none' = 'none';

            if (absDiff < 0.5) {
              // Centered active card
              const scale = 1.05 - absDiff * 0.1;
              const rotateY = effectiveDiff * -15;
              const translateZ = 90 - absDiff * 80;
              const translateX = effectiveDiff * 220;

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = 35;
              opacity = 1;
              filter = 'brightness(1)';
              pointerEvents = 'auto';
              isCenter = true;
            } else if (absDiff <= 1.8) {
              // Flanking visible cards
              const sign = effectiveDiff > 0 ? 1 : -1;
              const normDist = absDiff;
              const translateX = sign * (250 + (normDist - 1) * 180);
              const rotateY = sign * -16;
              const translateZ = -40 * normDist;
              const scale = Math.max(0.8, 0.94 - normDist * 0.08);
              const opacityVal = Math.max(0.55, 0.9 - normDist * 0.2);
              const brightnessVal = Math.max(0.78, 0.92 - normDist * 0.1);

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = Math.round(25 - absDiff * 5);
              opacity = opacityVal;
              filter = `brightness(${brightnessVal})`;
              pointerEvents = 'auto';
            } else {
              // Culled distant cards
              transform = `translate(-50%, -50%) translate3d(0, 0, -280px) scale(0.55)`;
              zIndex = 0;
              opacity = 0;
              pointerEvents = 'none';
            }

            const is169 = reel.aspect === '16/9';
            const widthClass = is169
              ? 'w-[360px] sm:w-[500px] aspect-[16/9]'
              : 'w-[230px] sm:w-[280px] aspect-[9/16]';

            return (
              <div
                key={idx}
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
                  filter,
                  pointerEvents,
                }}
                className={`coverflow-card ${widthClass} rounded-2xl overflow-hidden bg-[#0A0A0A] cursor-pointer group ${
                  isDragging ? 'is-dragging' : ''
                } ${
                  isCenter
                    ? 'ring-2 ring-[#3B82F6] ring-offset-4 ring-offset-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
                    : 'shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div className="relative w-full h-full bg-black">
                  {/* Live Looping Video Clip */}
                  <video
                    src={reel.videoUrl}
                    poster={reel.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload={absDiff < 1.5 ? 'auto' : 'none'}
                    className="object-cover w-full h-full pointer-events-none group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Clean gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Card bottom info */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white pointer-events-none">
                    <span className="text-[11px] font-semibold tracking-wide bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white/90">
                      {reel.category}
                    </span>
                    <span className="text-xs font-bold text-white truncate max-w-[55%] drop-shadow-sm">
                      {reel.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Work Action */}
        <div className="mt-8 text-center">
          <Link
            href="/work"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-xs font-bold uppercase tracking-wider text-[#1D1D1F] transition-all shadow-xs group"
          >
            <span>View Full Portfolio</span>
            <span className="text-[#3B82F6] group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
