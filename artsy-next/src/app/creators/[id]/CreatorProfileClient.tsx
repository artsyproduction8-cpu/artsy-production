'use client';

import { useState } from 'react';
import Link from 'next/link';
import LiteYouTubeEmbed from '@/components/LiteYouTubeEmbed';
import { extractYouTubeId } from '@/lib/youtube';

export interface PortfolioSample {
  id: string;
  title: string;
  description?: string;
  category: string;
  video_url: string;
  thumbnail_url: string;
  youtube_id?: string;
  display_order?: number;
}

interface CreatorProfileClientProps {
  creatorId: string;
  creatorName: string;
  isAcceptingWork: boolean;
  samples: PortfolioSample[];
}

export default function CreatorProfileClient({
  creatorId,
  creatorName,
  isAcceptingWork,
  samples,
}: CreatorProfileClientProps) {
  const [showAllWorks, setShowAllWorks] = useState(false);
  const [activeVideo, setActiveVideo] = useState<PortfolioSample | null>(null);

  if (!samples || samples.length === 0) {
    return null;
  }

  const displayedSamples = showAllWorks ? samples : samples.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight">
            Selected Works
          </h2>
          <p className="text-xs text-[#86868B] mt-0.5">
            Official Artsy catalog films and commercial cuts created by {creatorName}.
          </p>
        </div>

        {samples.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAllWorks(!showAllWorks)}
            className="self-start sm:self-auto text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors cursor-pointer"
          >
            {showAllWorks ? 'Show Less ↑' : `View All (${samples.length}) →`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedSamples.map((sample) => {
          const ytid = sample.youtube_id || extractYouTubeId(sample.video_url) || '';

          return (
            <div
              key={sample.id}
              className="bg-white rounded-3xl overflow-hidden border border-[#E5E5E7] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {ytid ? (
                  <LiteYouTubeEmbed
                    id={ytid}
                    title={sample.title}
                    thumbnailUrl={sample.thumbnail_url}
                  />
                ) : (
                  <div
                    className="relative aspect-video bg-black cursor-pointer group"
                    onClick={() => setActiveVideo(sample)}
                  >
                    <img
                      src={sample.thumbnail_url}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center font-bold">
                        ▶
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-5 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#1D1D1F] text-white inline-block">
                    {sample.category}
                  </span>
                  <h3 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                    {sample.title}
                  </h3>
                  {sample.description && (
                    <p className="text-xs text-[#86868B] line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Lightbox Modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="bg-[#1D1D1F] text-white rounded-3xl overflow-hidden max-w-4xl w-full border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-[#3B82F6]">
                  {`${activeVideo.category} // ${creatorName}`}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Video Player Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {activeVideo.video_url.includes('iframe') || activeVideo.video_url.includes('embed') ? (
                <iframe
                  src={activeVideo.video_url}
                  className="w-full h-full border-0"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-tr from-[#0F0F11] to-[#1F1F24]">
                  <img
                    src={activeVideo.thumbnail_url}
                    alt={activeVideo.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute top-4 right-4 text-[10px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
                  </div>
                  <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    Creator: {creatorName}
                  </div>
                  <div className="absolute bottom-4 right-4 text-[10px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    DRAFT — Artsy Production
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2">▶</div>
                      <div className="text-xs font-bold text-white tracking-wider">
                        STUDIO CINEMA PREVIEW PLAYER
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 bg-[#161618]">
              <p className="text-xs text-white/70 leading-relaxed max-w-xl">
                {activeVideo.description ||
                  'Frame-accurate editorial render approved by Artsy Studio Administration.'}
              </p>
              {isAcceptingWork && (
                <Link
                  href={`/book?preferredCreator=${creatorId}&creatorName=${encodeURIComponent(creatorName)}`}
                  onClick={() => setActiveVideo(null)}
                  className="shrink-0 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Request {creatorName} →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
