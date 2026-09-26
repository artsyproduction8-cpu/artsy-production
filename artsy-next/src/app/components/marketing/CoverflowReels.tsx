'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ReelCard {
  title: string;
  category: string;
  aspect: '16/9' | '9/16';
  image: string;
}

const REELS: ReelCard[] = [
  {
    title: 'Wedding Highlight Cinema',
    category: 'Wedding // 4K Master',
    aspect: '16/9',
    image: '/images/reels/wedding-palace.jpg',
  },
  {
    title: 'Neon Fashion Editorial',
    category: 'Commercial // 9:16 Reel',
    aspect: '9/16',
    image: '/images/reels/neon-fashion.jpg',
  },
  {
    title: 'Automotive Cinema',
    category: 'Commercial // Automotive',
    aspect: '16/9',
    image: '/images/reels/automotive-supercar.jpg',
  },
  {
    title: 'Luxury Commercial Showcase',
    category: 'Product // Macro Studio',
    aspect: '16/9',
    image: '/images/reels/luxury-product.jpg',
  },
  {
    title: 'Music Festival Reel',
    category: 'Event // 9:16 Festival',
    aspect: '9/16',
    image: '/images/reels/dj-festival.jpg',
  },
  {
    title: 'Concert Stage Film',
    category: 'Music // Concert 4K',
    aspect: '16/9',
    image: '/images/reels/concert-rock.jpg',
  },
  {
    title: 'Creator Aesthetic Video',
    category: 'UGC // Creator Studio',
    aspect: '9/16',
    image: '/images/reels/creator-studio.jpg',
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
  const AUTOPLAY_INTERVAL = 4000;
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

  const formatNumber = (num: number) => (num < 10 ? '0' + num : '' + num);

  return (
    <section
      className="w-full py-24 sm:py-32 bg-white overflow-hidden relative"
      id="featured-reels"
    >
      {/* Section Header */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 mb-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[#1D1D1F]">
          Featured reels &amp; master cuts
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
          if ((e.target as HTMLElement).closest('#coverflow-dots') || (e.target as HTMLElement).closest('button'))
            return;
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
        <div className="coverflow-stage relative w-full h-[480px] sm:h-[530px] flex items-center justify-center overflow-hidden pointer-events-none">
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
              const rotateY = effectiveDiff * -20;
              const translateZ = 90 - absDiff * 80;
              const translateX = effectiveDiff * 200;

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = 35;
              opacity = 1;
              filter = 'brightness(1)';
              pointerEvents = 'auto';
              isCenter = true;
            } else if (absDiff <= 3.2) {
              // Flanking visible cards
              const sign = effectiveDiff > 0 ? 1 : -1;
              const normDist = absDiff;
              const translateX = sign * (180 + (normDist - 1) * 160);
              const rotateY = sign * -38;
              const translateZ = -60 * normDist;
              const scale = Math.max(0.7, 0.94 - normDist * 0.1);
              const opacityVal = Math.max(0.2, 0.85 - normDist * 0.25);
              const brightnessVal = Math.max(0.65, 0.9 - normDist * 0.12);

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = Math.round(25 - absDiff * 5);
              opacity = opacityVal;
              filter = `brightness(${brightnessVal})`;
              pointerEvents = 'auto';
            } else {
              // Hidden cards
              transform = `translate(-50%, -50%) translate3d(0, 0, -280px) scale(0.55)`;
              zIndex = 0;
              opacity = 0;
              pointerEvents = 'none';
            }

            const is169 = reel.aspect === '16/9';
            const widthClass = is169
              ? 'w-[380px] sm:w-[520px] aspect-[16/9]'
              : 'w-[240px] sm:w-[290px] aspect-[9/16]';

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
                className={`coverflow-card ${widthClass} rounded-2xl overflow-hidden bg-[#1D1D1F] cursor-pointer group ${
                  isDragging ? 'is-dragging' : ''
                } ${
                  isCenter
                    ? 'ring-2 ring-[#3B82F6] ring-offset-4 ring-offset-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
                    : 'shadow-[0_4px_24px_rgba(0,0,0,0.04)]'
                }`}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={reel.image}
                    alt={reel.title}
                    fill
                    sizes="(max-width: 768px) 380px, 520px"
                    className="object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority={idx === 3}
                  />
                  {/* Subtle clean gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                  
                  {/* Card bottom info */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <span className="text-xs font-semibold tracking-wide bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      {reel.category}
                    </span>
                    <span className="text-xs font-medium text-white/90">
                      {reel.title}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-8" id="coverflow-dots">
          {REELS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to slide ${idx + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? 'w-7 bg-[#3B82F6]'
                  : 'w-2 bg-[#E5E5E7] hover:bg-[#86868B]'
              }`}
            />
          ))}
        </div>

        {/* View All Work Link */}
        <div className="mt-6 text-center">
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3B82F6] hover:text-[#2563EB] transition-colors"
          >
            <span>View All 12+ Showreel Cuts &amp; Technical Formats →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
