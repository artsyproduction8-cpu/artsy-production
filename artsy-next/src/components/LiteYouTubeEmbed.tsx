'use client';

import { useState } from 'react';

interface LiteYouTubeEmbedProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  className?: string;
}

export default function LiteYouTubeEmbed({
  id,
  title,
  thumbnailUrl,
  className = '',
}: LiteYouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumb = thumbnailUrl || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className={`relative aspect-video bg-black overflow-hidden rounded-2xl ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsPlaying(true)}
      className={`relative aspect-video bg-black rounded-2xl overflow-hidden cursor-pointer group shadow-xs ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Play ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPlaying(true);
        }
      }}
    >
      <img
        src={thumb}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 group-hover:bg-black/40 transition-colors" />

      {/* Centered Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:bg-red-600 group-hover:scale-110 transition-all">
          <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
