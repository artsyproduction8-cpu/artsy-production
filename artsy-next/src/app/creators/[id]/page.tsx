'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

interface PortfolioSample {
  id: string;
  title: string;
  description?: string;
  category: string;
  video_url: string;
  thumbnail_url: string;
  display_order: number;
}

interface CreatorDetail {
  id: string;
  public_display_name: string;
  public_specialty: string;
  public_bio: string;
  years_of_experience: number;
  avg_rating: number | string;
  total_projects_completed: number;
  is_accepting_work: boolean;
  creator_tier: 'rising_talent' | 'standard' | 'senior';
  onTimeDeliveryRate: number;
  samples: PortfolioSample[];
}

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [activeVideo, setActiveVideo] = useState<PortfolioSample | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCreator = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/creators/${id}`);
        if (res.status === 404) {
          setIsNotFound(true);
          return;
        }
        const data = await res.json();
        if (data.success && data.creator) {
          setCreator(data.creator);
        } else {
          setIsNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load creator profile:', err);
        setIsNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [id]);

  if (isNotFound) {
    notFound();
  }

  if (loading || !creator) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-3 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#86868B]">Loading creator profile &amp; verified portfolio...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (creator.public_display_name || 'Artsy Creator')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const isRisingTalent =
    creator.creator_tier === 'rising_talent' || creator.total_projects_completed < 10;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#86868B] mb-8">
          <Link href="/creators" className="hover:text-[#1D1D1F] transition-colors">
            Creators
          </Link>
          <span>/</span>
          <span className="text-[#1D1D1F] font-bold">{creator.public_display_name}</span>
        </nav>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-7 sm:p-10 border border-[#E5E5E7] shadow-xs mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#F5F5F7]">
            <div className="flex items-start sm:items-center gap-5">
              {/* Large Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#1D1D1F] to-[#3B82F6] text-white flex items-center justify-center font-extrabold text-3xl shadow-sm shrink-0">
                {initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    {creator.public_display_name}
                  </h1>

                  {/* Tier Badges */}
                  {isRisingTalent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
                      ★ Rising Talent
                    </span>
                  )}
                  {!isRisingTalent && creator.creator_tier === 'senior' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-purple-50 text-purple-800 border border-purple-200">
                      Senior Lead
                    </span>
                  )}

                  {/* Availability Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      creator.is_accepting_work
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        creator.is_accepting_work ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                    {creator.is_accepting_work ? 'Available for Assignment' : 'Fully Booked'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#3B82F6]">
                  {creator.public_specialty} • {creator.years_of_experience} Years Experience
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-[#86868B]">
                  <span>🛡️ Artsy Verified Roster</span>
                  <span>•</span>
                  <span>Non-Compete Bound</span>
                  <span>•</span>
                  <span>Frame-Accurate QA</span>
                </div>
              </div>
            </div>

            {/* Request CTA Button (Only shown if is_accepting_work = true) */}
            {creator.is_accepting_work && (
              <div className="w-full md:w-auto">
                <Link
                  href={`/book?preferredCreator=${creator.id}&creatorName=${encodeURIComponent(creator.public_display_name)}`}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <span>Request This Creator</span>
                  <span>→</span>
                </Link>
                <div className="text-[10px] text-[#86868B] text-center md:text-right mt-1.5">
                  Subject to availability confirmation by Artsy QA
                </div>
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 pt-8 text-center">
            <div className="bg-[#F5F5F7] rounded-2xl p-4">
              <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Total Projects Completed
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] mt-1">
                {creator.total_projects_completed} cuts
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-2xl p-4">
              <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Average Client Rating
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] mt-1 flex items-center justify-center gap-1">
                <span className="text-amber-500 text-lg">★</span>
                <span>{Number(creator.avg_rating || 4.9).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#F5F5F7] rounded-2xl p-4">
              <div className="text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                On-Time Delivery SLA
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {creator.onTimeDeliveryRate}%
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-8 pt-8 border-t border-[#F5F5F7]">
            <h2 className="text-xs uppercase font-bold tracking-wider text-[#86868B] mb-2">
              Creative Philosophy &amp; Specialization
            </h2>
            <p className="text-xs sm:text-sm text-[#424245] leading-relaxed max-w-4xl">
              {creator.public_bio ||
                'Passionate video editor and conformist with deep experience in cinematic pacing, color science, and dynamic timeline delivery.'}
            </p>
          </div>
        </div>

        {/* Portfolio Showcase Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-tight">
                Approved Portfolio Showcase
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Individually vetted creative cuts demonstrating timeline mastery and color grading.
              </p>
            </div>
            <span className="text-xs font-bold text-[#86868B]">
              {creator.samples.length} Approved Samples
            </span>
          </div>

          {creator.samples.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E5E7] shadow-xs">
              <div className="text-2xl mb-2">🎬</div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Portfolio samples undergoing QA</h3>
              <p className="text-xs text-[#86868B] mt-1">
                Sample reels are currently in review with our Creative Director.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creator.samples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => setActiveVideo(sample)}
                  className="bg-white rounded-3xl overflow-hidden border border-[#E5E5E7] shadow-xs hover:shadow-md hover:border-[#DCDFE3] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-[#0A0A0A] overflow-hidden">
                    <img
                      src={sample.thumbnail_url}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                    {/* Category Tag */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs border border-white/10">
                        {sample.category}
                      </span>
                    </div>

                    {/* Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-[#3B82F6] text-[#1D1D1F] group-hover:text-white flex items-center justify-center shadow-md transition-all group-hover:scale-110">
                        <span className="text-sm font-bold ml-0.5">▶</span>
                      </div>
                    </div>

                    {/* Watermark Notice */}
                    <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/50 tracking-wider">
                      ARTSY PREVIEW
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-sm font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors leading-snug">
                      {sample.title}
                    </h3>
                    {sample.description && (
                      <p className="text-xs text-[#86868B] mt-1.5 line-clamp-2 leading-relaxed">
                        {sample.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    {activeVideo.category} // {creator.public_display_name}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {activeVideo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Video Player Container with Leakage Protection Watermark */}
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
                    {/* Watermark Overlays */}
                    <div className="absolute top-4 right-4 text-[10px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
                    </div>
                    <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/70 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                      Creator: {creator.public_display_name}
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
                {creator.is_accepting_work && (
                  <Link
                    href={`/book?preferredCreator=${creator.id}&creatorName=${encodeURIComponent(creator.public_display_name)}`}
                    onClick={() => setActiveVideo(null)}
                    className="shrink-0 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Request {creator.public_display_name} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
