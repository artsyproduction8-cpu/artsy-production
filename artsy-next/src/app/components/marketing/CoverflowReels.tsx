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
  // 1. Wedding Cinema (16:9)
  {
    title: 'Chandni & Harihar — Grand Reception Film',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Chandni__Harihar_s_Reception_Film___Shreyas_Iyer_Steals_the_Dance_Floor_preview.mp4'),
  },
  // 2. Cinematic Reel (9:16)
  {
    title: 'Anoop & Ansa — Viral Wedding Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/ANOOP___ANSA_REEL_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/ANOOP___ANSA_REEL_low_preview.mp4'),
  },
  // 3. Wedding Cinema (16:9)
  {
    title: 'Akash & Mayuri — Mumbai Wedding Highlights',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Akash__Mayuri_Wedding_Film___Cinematic_Highlights__Mumbai_Wedding_Videographer_preview.mp4'),
  },
  // 4. Cinematic Reel (9:16)
  {
    title: 'Akash — Groom Entry & Celebration Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Akash_Reel_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Akash_Reel_Low_preview.mp4'),
  },
  // 5. Pre-Wedding Film (16:9)
  {
    title: 'Anoop & Ansa — Cinematic Pre-Wedding Film',
    category: 'Pre-Wedding Films',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/ANOOP___ANSA_pre_wedding_Low_Res_preview.mp4'),
  },
  // 6. Cinematic Reel (9:16)
  {
    title: 'Akshay & Gauri — Romantic Wedding Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Akshay___Gauri_Reel__2__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Akshay___Gauri_Reel__2__Low_preview.mp4'),
  },
  // 7. Wedding Cinema (16:9)
  {
    title: 'Juhi & Swapnil — Grand North Indian Wedding',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Juhi__Swapnils_Grand_North_Indian_Wedding_Film___Cinematic_Highlights_preview.mp4'),
  },
  // 8. Cinematic Reel (9:16)
  {
    title: 'Anroop & Jeemol — Wedding Highlights Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Anroop___Jeemol_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Anroop___Jeemol_Reel_low_preview.mp4'),
  },
  // 9. Pre-Wedding Film (16:9)
  {
    title: 'Akshay & Partner — Romantic Pre-Wedding Journey',
    category: 'Pre-Wedding Films',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Pre_wedding/Akshay_Pre_wedding_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/Akshay_Pre_wedding_Low_preview.mp4'),
  },
  // 10. Cinematic Reel (9:16)
  {
    title: 'George & Sumi — Church Wedding Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/George___Sumi_Reel_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/George___Sumi_Reel_Low_preview.mp4'),
  },
  // 11. Wedding Cinema (16:9)
  {
    title: 'Rujuta & Abhyuday — Joy, Dance & Romance',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Rujuta__Abhyudays_North_Indian_Wedding_Film___Joy__Dance__Romance_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Rujuta__Abhyudays_North_Indian_Wedding_Film___Joy__Dance__Romance_preview.mp4'),
  },
  // 12. Cinematic Reel (9:16)
  {
    title: 'Kuhu — Haldi Celebration Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Kuhu_Haldi_Reel_low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Kuhu_Haldi_Reel_low_preview.mp4'),
  },
  // 13. Pre-Wedding Film (16:9)
  {
    title: 'Matan & Lihi — Destination Pre-Wedding Story',
    category: 'Pre-Wedding Films',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Pre_wedding/Matan___Lihi_cine_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/Matan___Lihi_cine_Low_preview.mp4'),
  },
  // 14. Cinematic Reel (9:16)
  {
    title: 'Monish & Jisha — Cinematic Couple Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Monish___Jisha_Reel__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Monish___Jisha_Reel__Low_preview.mp4'),
  },
  // 15. Wedding Cinema (16:9)
  {
    title: 'Rajat & Nimisha — South Indian Wedding Highlights',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Rajat__Nimishas_South_Indian_Wedding_Film___Cinematic_Highlights_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Rajat__Nimishas_South_Indian_Wedding_Film___Cinematic_Highlights_preview.mp4'),
  },
  // 16. Cinematic Reel (9:16)
  {
    title: 'Sanket & Rutuja — Sangeet Night Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Sanket___Rutuja_-_Sangeet_Reel_Low__preview.mp4'),
  },
  // 17. Pre-Wedding Film (16:9)
  {
    title: 'Robin & Partner — Timeless Pre-Wedding Film',
    category: 'Pre-Wedding Films',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Pre_wedding/Robin_Pre_wedding_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Pre_wedding/Robin_Pre_wedding_Low_preview.mp4'),
  },
  // 18. Cinematic Reel (9:16)
  {
    title: 'Shweta — Bridal Solo Highlights Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Shweta_Reel_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Shweta_Reel_Low_preview.mp4'),
  },
  // 19. Wedding Cinema (16:9)
  {
    title: 'Hufriya & Danesh — 16 Years of Love Reception',
    category: 'Wedding Cinema',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Wedding/Hufriya__Danesh_Reception_Film___16_Years_of_Love_Finally_Sealed_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Wedding/Hufriya__Danesh_Reception_Film___16_Years_of_Love_Finally_Sealed_preview.mp4'),
  },
  // 20. Cinematic Reel (9:16)
  {
    title: 'Sumit & Sonal — Wedding Celebration Reel',
    category: 'Cinematic Reels',
    aspect: '9/16',
    image: getStreamUrl('thumbnails/Reel_/Sumit___Sonal_Reel__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Reel_/Sumit___Sonal_Reel__Low_preview.mp4'),
  },
  // 21. Teasers & Trailers (16:9)
  {
    title: 'Akshay & Jagruti — Wedding Teaser',
    category: 'Teasers & Trailers',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Akshay___Jagruti__Wedding_Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Akshay___Jagruti__Wedding_Teaser_Low_preview.mp4'),
  },
  // 22. Teasers & Trailers (16:9)
  {
    title: 'Jai & Aishwarya — Wedding Teaser',
    category: 'Teasers & Trailers',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Jai___Aishwarya__Teaser__Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Jai___Aishwarya__Teaser__Low_preview.mp4'),
  },
  // 23. Teasers & Trailers (16:9)
  {
    title: 'Khushboo & Tejas — Wedding Teaser',
    category: 'Teasers & Trailers',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Khushboo___Tejas_Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Khushboo___Tejas_Teaser_Low_preview.mp4'),
  },
  // 24. Teasers & Trailers (16:9)
  {
    title: 'Matan & Lihi — Cinematic Trailer',
    category: 'Teasers & Trailers',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Matan___Lihi_Trailer_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Matan___Lihi_Trailer_Low_preview.mp4'),
  },
  // 25. Teasers & Trailers (16:9)
  {
    title: 'Mayuri & Swapnil — Wedding Teaser',
    category: 'Teasers & Trailers',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Mayuri___Swapni_Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Mayuri___Swapni_Teaser_Low_preview.mp4'),
  },
  // 26. Teasers & Trailers (16:9)
  {
    title: 'Sanket & Rutuja — Wedding Teaser',
    category: 'Teasers & Trailers',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Sanket___Rutuja__Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Sanket___Rutuja__Teaser_Low_preview.mp4'),
  },
  // 27. Teasers & Trailers (16:9)
  {
    title: 'Shree & Shivani — Wedding Teaser',
    category: 'Teasers & Trailers',
    aspect: '16/9',
    image: getStreamUrl('thumbnails/Teaser/Shree___Shivani_Teaser_Low_thumb.jpg'),
    videoUrl: getStreamUrl('previews/Teaser/Shree___Shivani_Teaser_Low_preview.mp4'),
  },
];

/**
 * Crystal-Clear Looping Video Player:
 * - Instant playback on mount without waiting or seek latency.
 * - 100% full color vibrancy with ZERO grey wraps, dimming filters, or dark overlays.
 * - Forced GPU hardware clipping with WebKit mask and rounded borders so active front card
 *   maintains silky smooth rounded edges identical to background cards.
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);
    const video = videoRef.current;
    if (!video) return;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsReady(true))
        .catch(() => {});
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onCanPlay={() => setIsReady(true)}
      onPlaying={() => setIsReady(true)}
      onError={() => setIsReady(false)}
      className={`absolute inset-0 object-cover w-full h-full pointer-events-none rounded-2xl sm:rounded-3xl transition-opacity duration-300 ease-out ${
        isReady ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        borderRadius: 'inherit',
        WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        maskImage: 'radial-gradient(white, black)',
      }}
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
        className="relative w-full max-w-[1360px] mx-auto px-2 sm:px-6 py-2 select-none cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* 3D Stage Viewport */}
        <div className="coverflow-stage relative w-full h-[470px] sm:h-[540px] flex items-center justify-center overflow-hidden pointer-events-none">
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
              const translateX = effectiveDiff * (is169 ? 240 : 180);

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = 40;
              opacity = 1;
              pointerEvents = 'auto';
              isCenter = true;
            } else if (absDiff <= 3.2) {
              // Flanking visible cards: 3 cards on left + 3 cards on right (7 cards visible total to fill horizontal space)
              const sign = effectiveDiff > 0 ? 1 : -1;
              const normDist = absDiff;

              let spacing = 0;
              if (normDist <= 1.2) {
                spacing = is169 ? (270 * normDist) : (220 * normDist);
              } else if (normDist <= 2.2) {
                spacing = is169 ? (270 + (normDist - 1) * 190) : (220 + (normDist - 1) * 160);
              } else {
                spacing = is169 ? (270 + 190 + (normDist - 2) * 170) : (220 + 160 + (normDist - 2) * 140);
              }

              const translateX = sign * spacing;
              const rotateY = sign * -(13 + normDist * 2.5);
              const translateZ = -45 * normDist;
              const scale = Math.max(0.62, 0.94 - normDist * 0.10);
              const opacityVal = Math.max(0.38, 1.05 - normDist * 0.22);

              transform = `translate(-50%, -50%) translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale}) rotateY(${rotateY}deg)`;
              zIndex = Math.round(30 - absDiff * 6);
              opacity = opacityVal;
              pointerEvents = 'auto';
            } else {
              // Culled distant cards
              transform = `translate(-50%, -50%) translate3d(0, 0, -320px) scale(0.5)`;
              zIndex = 0;
              opacity = 0;
              pointerEvents = 'none';
            }

            const widthClass = is169
              ? 'w-[320px] sm:w-[460px] md:w-[500px] aspect-video'
              : 'w-[200px] sm:w-[250px] md:w-[270px] aspect-[9/16]';

            const cardImage = item.image;
            const cardVideo = item.videoUrl;

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
                  borderRadius: '1.5rem',
                  WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                  maskImage: 'radial-gradient(white, black)',
                }}
                className={`coverflow-card ${widthClass} rounded-2xl sm:rounded-3xl overflow-hidden bg-[#18181B] cursor-pointer group transition-[border,box-shadow] duration-300 ${
                  isDragging ? 'is-dragging' : ''
                } ${
                  isCenter
                    ? 'border border-white/25 shadow-[0_24px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/5'
                    : 'border border-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.08)]'
                }`}
              >
                <div
                  className="relative w-full h-full bg-[#18181B] rounded-2xl sm:rounded-3xl overflow-hidden"
                  style={{
                    borderRadius: 'inherit',
                    WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                    maskImage: 'radial-gradient(white, black)',
                  }}
                >
                  {/* Base Layer: Instant Sharp Rec.709 Poster frame (guarantees ZERO black frames) */}
                  <img
                    src={cardImage}
                    alt=""
                    className="absolute inset-0 object-cover w-full h-full pointer-events-none select-none transition-opacity duration-300 rounded-2xl sm:rounded-3xl"
                    style={{ borderRadius: 'inherit' }}
                    loading="eager"
                    decoding="async"
                  />

                  {/* Active Video Stream: Only mounted for centered active card and immediate neighbors */}
                  {absDiff < 1.4 && (
                    <LoopingHighlightVideo
                      src={cardVideo}
                      poster={cardImage}
                      priority={isCenter}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
