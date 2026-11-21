'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export interface ModalVideoItem {
  title: string;
  category?: string;
  videoUrl: string;
  poster?: string;
  aspect?: '16/9' | '9/16';
  description?: string;
}

interface StudioVideoModalProps {
  video: ModalVideoItem | null;
  onClose: () => void;
  startTime?: number;
}

export default function StudioVideoModal({
  video,
  onClose,
  startTime = 0,
}: StudioVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVertical, setIsVertical] = useState(video?.aspect === '9/16');
  const [isMuted, setIsMuted] = useState(false);
  const [isMutedByPolicy, setIsMutedByPolicy] = useState(false);

  // Sync aspect when video changes
  useEffect(() => {
    if (video) {
      const isReel = (video.category || '').toLowerCase().includes('reel') || video.aspect === '9/16';
      setIsVertical(isReel);
    }
  }, [video]);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Autoplay attempt with fallback
  useEffect(() => {
    if (!video) return;
    const vid = videoRef.current;
    if (!vid) return;

    // Set start time if specified
    if (startTime > 0) {
      vid.currentTime = startTime;
    }

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
  }, [video, startTime]);

  if (!video) return null;

  const toggleSound = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const newMuted = !vid.muted;
    vid.muted = newMuted;
    setIsMuted(newMuted);
    setIsMutedByPolicy(false);
  };

  const bookingCategory = (video.category || '').toLowerCase().includes('wedding')
    ? 'wedding'
    : 'brand';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className={`relative w-full ${
          isVertical ? 'max-w-md sm:max-w-sm' : 'max-w-4xl lg:max-w-5xl'
        } bg-[#141414] border border-[#262626] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 truncate max-w-[85%]">
            {video.category && (
              <span className="px-2 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] font-mono text-[9px] font-bold uppercase tracking-wider shrink-0">
                {video.category}
              </span>
            )}
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {video.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-base font-bold ml-2 shrink-0"
            aria-label="Close video player"
          >
            ✕
          </button>
        </div>

        {/* Video Player Surface */}
        <div
          className={`relative w-full bg-black overflow-hidden flex items-center justify-center group ${
            isVertical ? 'aspect-[9/16] max-h-[75vh] mx-auto' : 'aspect-video'
          }`}
        >
          {/* Unmute Prompt Button if muted by browser policy */}
          {isMutedByPolicy && (
            <button
              type="button"
              onClick={toggleSound}
              className="absolute bottom-14 left-6 z-20 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-[#3B82F6] text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all flex items-center gap-2 shadow-xl cursor-pointer"
            >
              <span>🔊</span>
              <span>Click to Unmute Audio</span>
            </button>
          )}

          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.poster}
            controls
            autoPlay
            playsInline
            preload="auto"
            className="w-full h-full object-contain"
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              if (vid.videoHeight > vid.videoWidth) {
                setIsVertical(true);
              }
              if (startTime > 0 && vid.currentTime < startTime) {
                vid.currentTime = startTime;
              }
            }}
          />
        </div>

        {/* Modal Footer with Order Call-to-Action */}
        <div className="p-3.5 sm:p-4 bg-[#18181B] border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs text-white/90 truncate max-w-[65%]">
            <span className="font-semibold block truncate">{video.title}</span>
            {video.description && (
              <span className="text-[11px] text-[#86868B] block truncate mt-0.5">
                {video.description}
              </span>
            )}
          </div>
          <Link
            href={`/book?category=${encodeURIComponent(bookingCategory)}`}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm shrink-0"
          >
            Order Edit →
          </Link>
        </div>
      </div>
    </div>
  );
}
