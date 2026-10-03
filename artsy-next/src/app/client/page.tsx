'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ClientHeader from './components/ClientHeader';
import ClientSidebar from './components/ClientSidebar';
import { useAuth } from '@/lib/auth';

interface StudioProfile {
  displayName: string;
  ingestProvider: string;
  ingestLink: string;
  brandLuts: string;
}

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudioProfile>({
    displayName: 'Sneha Patel Films',
    ingestProvider: 'Google Drive Enterprise',
    ingestLink: 'https://drive.google.com/drive/folders/artsy-raw-ingest-8841',
    brandLuts: 'Kodak 2383 Film Print Emulation',
  });

  const [activeTimecode, setActiveTimecode] = useState('01:14:02');
  const [isPlaying, setIsPlaying] = useState(false);
  const [approvedNotice, setApprovedNotice] = useState(false);
  const [retakeNotice, setRetakeNotice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile((prev) => ({ ...prev, ...parsed }));
        } else if (user) {
          setProfile((prev) => ({
            ...prev,
            displayName: user.full_name || prev.displayName,
          }));
        }
      } catch {}
    }
  }, [user]);

  const handleApproveCut = () => {
    setApprovedNotice(true);
    // Dispatch automated WhatsApp notification in background
    fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user?.phone || '+919876543210',
        eventType: 'MILESTONE_COMPLETED',
        projectId: 'AP-8841',
      }),
    }).catch(() => {});

    setTimeout(() => setApprovedNotice(false), 5000);
  };

  const handleRequestRetake = () => {
    setRetakeNotice(true);
    fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user?.phone || '+919876543210',
        message: '🎬 Artsy Retake Notice: Client requested revision adjustments on Draft v1.2 Cut (Project #AP-8841).',
        projectId: 'AP-8841',
      }),
    }).catch(() => {});

    setTimeout(() => setRetakeNotice(false), 5000);
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />

      <div className="flex pt-28 lg:pt-16 w-full max-w-full overflow-x-hidden">
        {/* Desktop Sidebar */}
        <ClientSidebar />

        {/* Main Content Dashboard */}
        <main className="flex-1 w-full lg:pl-72 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

          {/* Top Banner: Welcome & Active Studio Context */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                Welcome, {profile.displayName}
              </h1>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/book"
                className="px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>+ Book New Cut</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Feedback Notices */}
          {approvedNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">✓</span>
                <span>Cut approved! Production Vault clearance authorized and 4K Master unwatermarked archive decrypting.</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-600">DISPATCHED</span>
            </div>
          )}
          {retakeNotice && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">⚠️</span>
                <span>Retake pass initiated. Editorial team notified via dispatch queue; 48h turnaround clock ticking.</span>
              </div>
              <span className="font-mono text-[10px] text-amber-600">QUEUED</span>
            </div>
          )}

          {/* Executive KPI Bento Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                ACTIVE IN PRODUCTION
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] mt-1.5">
                2 Projects
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                FRAME REVIEW SPOTLIGHT
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1.5">
                1 Draft Pending
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                MASTERS READY IN VAULT
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1.5">
                3 Archives
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* MODULE 1: ACTIVE PRODUCTION PIPELINE ("MY PROJECTS")             */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F5F5F7]">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  Active Production Pipeline
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Real-time SLA status, assigned senior creators, and editorial milestones
                </p>
              </div>
              <Link
                href="/client/projects"
                className="text-xs font-bold text-[#3B82F6] hover:underline"
              >
                View All Projects (4) →
              </Link>
            </div>

            {/* Project Card 1 */}
            <div className="bg-[#F5F5F7] rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] hover:border-[#3B82F6]/40 transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#3B82F6] bg-white px-2 py-0.5 rounded border border-[#E5E5E7]">
                      #AP-8841
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-full">
                      IN CLIENT REVIEW
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Udaipur Palace Royal Wedding — Master Highlight Cinema
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    href="/client/review"
                    className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    Open Review Suite →
                  </Link>
                </div>
              </div>

              {/* 4-Step Visual Timeline */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#86868B]">
                  <span className="text-emerald-600">✓ RAW INGEST</span>
                  <span className="text-emerald-600">✓ CREATOR ASSIGNED</span>
                  <span className="text-emerald-600">✓ 48H ASSEMBLY</span>
                  <span className="text-[#3B82F6] underline decoration-2">● FRAME REVIEW (ACTIVE)</span>
                </div>
                <div className="w-full bg-[#E5E5E7] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-3/4"></div>
                  <div className="bg-[#3B82F6] h-full w-1/4 animate-pulse"></div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E5E7] flex items-center justify-end text-xs text-[#86868B]">
                <div className="font-mono text-emerald-600 font-semibold">
                  Initial Assembly Delivered in 41 hrs (Guaranteed &lt; 48h)
                </div>
              </div>
            </div>

            {/* Project Card 2 */}
            <div className="bg-[#F5F5F7] rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] hover:border-[#3B82F6]/40 transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#3B82F6] bg-white px-2 py-0.5 rounded border border-[#E5E5E7]">
                      #AP-9042
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-300 px-2 py-0.5 rounded-full">
                      IN ASSEMBLY (COLOR PASS)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Verve FW26 Streetwear Editorial — 9:16 Social Cutdown
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => alert('Project #AP-9042 is currently in Color Grading Pass with Karanveer V. First rough cut ETA: Tomorrow, 6:00 PM.')}
                    className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-bold rounded-xl transition-all"
                  >
                    View Status Details
                  </button>
                </div>
              </div>

              {/* 4-Step Visual Timeline */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#86868B]">
                  <span className="text-emerald-600">✓ RAW INGEST</span>
                  <span className="text-emerald-600">✓ CREATOR ASSIGNED</span>
                  <span className="text-[#3B82F6] underline decoration-2">● 48H ASSEMBLY (IN PROGRESS)</span>
                  <span className="text-[#A1A1A6]">○ FRAME REVIEW</span>
                </div>
                <div className="w-full bg-[#E5E5E7] h-2 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full w-1/2"></div>
                  <div className="bg-[#3B82F6] h-full w-1/4 animate-pulse"></div>
                  <div className="bg-transparent h-full w-1/4"></div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E5E7] flex items-center justify-end text-xs text-[#86868B]">
                <div className="font-mono text-[#1D1D1F] font-semibold">
                  ETA: Tomorrow, 6:00 PM IST (32h remaining)
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* MODULE 2: TIMESTAMPE REVIEW STATION (INTERACTIVE SPOTLIGHT)       */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-[#3B82F6] uppercase bg-[#3B82F6]/10 px-2 py-0.5 rounded">
                    QUICK REVIEW STATION
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#1D1D1F] mt-1">
                  Review Spotlight: #AP-8841
                </h2>
              </div>

              <Link
                href="/client/review"
                className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
              >
                Launch Full Review Suite (Timeline &amp; Canvas) →
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Embedded 16:9 Video Canvas */}
              <div className="lg:col-span-7 bg-[#0A0A0A] rounded-2xl overflow-hidden border border-[#262626] relative group shadow-md">
                <div className="relative aspect-video w-full">
                  <Image
                    src="/images/reels/wedding-palace.jpg"
                    alt="Review Cut Spotlight"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Canvas Bar */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/90 z-10">
                    <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-bold">
                      DRAFT v1.2 • PROXY 4K
                    </span>
                    <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 font-bold text-emerald-400">
                      24.000 FPS • REC.709
                    </span>
                  </div>

                  {/* Center Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-xl hover:scale-110 transition-all cursor-pointer shadow-lg"
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                  </div>

                  {/* Bottom Timecode Scrubber Bar */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                      <span>TC @ {activeTimecode}</span>
                      <span className="text-[#86868B]">04:30:00</span>
                    </div>
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden relative">
                      <div className="bg-[#3B82F6] h-full w-[28%]"></div>
                      <div className="absolute left-[28%] top-0 bottom-0 w-1.5 bg-white shadow-sm"></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#141416] border-t border-[#262626] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white font-mono">
                      COLOR PROFILE
                    </span>
                    <span className="text-[#A1A1A6] text-[11px]">
                      Udaipur Daylight Warm &amp; Night Palace Grade
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#3B82F6] font-bold">
                    Round 1 of 2 Included
                  </span>
                </div>
              </div>

              {/* Right Column: Timecode Comments & Quick Actions */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D1D1F]">
                      Timeline Notes &amp; Frame Marker
                    </span>
                    <span className="text-xs font-mono font-bold text-[#3B82F6]">
                      3 Markers Logged
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div
                      onClick={() => setActiveTimecode('01:14:02')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        activeTimecode === '01:14:02'
                          ? 'bg-white border-[#3B82F6] shadow-2xs'
                          : 'bg-white/60 border-[#E5E5E7] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="font-mono font-bold text-[#3B82F6]">@ 01:14:02</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                          COLOR PASS
                        </span>
                      </div>
                      <p className="text-xs text-[#1D1D1F] mt-1 leading-snug">
                        &ldquo;Lift shadow tones on the bridal jewelry entrance shot by +0.5 stop.&rdquo;
                      </p>
                    </div>

                    <div
                      onClick={() => setActiveTimecode('02:45:10')}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        activeTimecode === '02:45:10'
                          ? 'bg-white border-[#3B82F6] shadow-2xs'
                          : 'bg-white/60 border-[#E5E5E7] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="font-mono font-bold text-[#3B82F6]">@ 02:45:10</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">
                          AUDIO MIX
                        </span>
                      </div>
                      <p className="text-xs text-[#1D1D1F] mt-1 leading-snug">
                        &ldquo;Dampen ambient sangeet crowd roar by -3dB under the acoustic vows.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Final Acceptance Gate Box */}
                <div className="bg-[#1D1D1F] text-white rounded-xl p-5 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                      FINAL ACCEPTANCE GATE
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      Ready to sign off on this cut?
                    </h4>
                    <p className="text-[11px] text-[#86868B] leading-relaxed mt-1">
                      Approving releases the Production Vault payout to the creator and decrypts your unwatermarked 4K DCI master package.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRequestRetake}
                      className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all text-center cursor-pointer"
                    >
                      Request Retake
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveCut}
                      className="flex-1 py-2.5 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg transition-all text-center cursor-pointer shadow-sm"
                    >
                      Approve Cut ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* MODULE 3: COMPLETED MASTERS & CLOUD VAULT ("COMPLETED MASTERS")  */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  Completed Deliverables &amp; Master Vault
                </h2>
              </div>

              <Link
                href="/client/masters"
                className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
              >
                Access Full Master Vault →
              </Link>
            </div>

            {/* 4-Tile Master Package Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Asset 1 */}
              <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md font-mono">
                      4K DCI MASTER
                    </span>
                    <span className="text-[11px] text-[#86868B] font-mono">8.4 GB</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                    Udaipur Wedding Master Cut
                  </h4>
                  <div className="text-[11px] font-mono text-[#86868B] truncate mt-1 bg-white/70 px-2 py-0.5 rounded border border-[#E5E5E7] w-full" title="Udaipur_Wedding_4K_ProRes422HQ.zip">
                    Udaipur_Wedding_4K_ProRes422HQ.zip
                  </div>
                  <p className="text-xs text-[#86868B] mt-2 leading-relaxed">
                    Uncompressed 10-bit master archival cut without watermarks.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600">Ready</span>
                  <button
                    type="button"
                    onClick={() => alert('DISPATCH: Initializing high-speed CDN download of 4K DCI ProRes Master...')}
                    className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                  >
                    Download Master ↓
                  </button>
                </div>
              </div>

              {/* Asset 2 */}
              <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-mono">
                      9:16 SOCIAL CUTS
                    </span>
                    <span className="text-[11px] text-[#86868B] font-mono">1.4 GB</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                    Social Cutdowns &amp; Reels
                  </h4>
                  <div className="text-[11px] font-mono text-[#86868B] truncate mt-1 bg-white/70 px-2 py-0.5 rounded border border-[#E5E5E7] w-full" title="Social_Cutdowns_Reels_Shorts.mp4">
                    Social_Cutdowns_Reels_Shorts.mp4
                  </div>
                  <p className="text-xs text-[#86868B] mt-2 leading-relaxed">
                    Vertical 9:16 &amp; square 1:1 format versions with burnt-in subtitles.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600">Ready</span>
                  <button
                    type="button"
                    onClick={() => alert('DISPATCH: Downloading Social Media Cutdown Package (.mp4)...')}
                    className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                  >
                    Download Cuts ↓
                  </button>
                </div>
              </div>

              {/* Asset 3 */}
              <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-mono">
                      AUDIO STEMS
                    </span>
                    <span className="text-[11px] text-[#86868B] font-mono">4.8 GB</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                    Surround 5.1 &amp; Stereo Stems
                  </h4>
                  <div className="text-[11px] font-mono text-[#86868B] truncate mt-1 bg-white/70 px-2 py-0.5 rounded border border-[#E5E5E7] w-full" title="Surround_5.1_Stereo_Stems.wav">
                    Surround_5.1_Stereo_Stems.wav
                  </div>
                  <p className="text-xs text-[#86868B] mt-2 leading-relaxed">
                    Isolated dialogue, music, and foley sound tracks (24-bit/48kHz).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600">Synced</span>
                  <button
                    type="button"
                    onClick={() => alert('DISPATCH: Initializing isolated stem pack download (.wav)...')}
                    className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                  >
                    Download Stems ↓
                  </button>
                </div>
              </div>

              {/* Asset 4 */}
              <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-mono">
                      COLOR LUT PACK
                    </span>
                    <span className="text-[11px] text-[#86868B] font-mono">12 MB</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                    Artsy Show 3D LUT Pack
                  </h4>
                  <div className="text-[11px] font-mono text-[#86868B] truncate mt-1 bg-white/70 px-2 py-0.5 rounded border border-[#E5E5E7] w-full" title="Artsy_Show_LUT_Cube_v2.cube">
                    Artsy_Show_LUT_Cube_v2.cube
                  </div>
                  <p className="text-xs text-[#86868B] mt-2 leading-relaxed">
                    Show grade LUTs: Udaipur Warm, Night Palace Gold &amp; Rec.709.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#86868B]">v2.0 Master</span>
                  <button
                    type="button"
                    onClick={() => alert('DISPATCH: Downloading official 3D LUT Cube Package (.cube)...')}
                    className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                  >
                    Download LUTs ↓
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* MODULE 4: GST TAX INVOICES & FINANCIAL LEDGER ("TAX INVOICES")    */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  GST Tax Invoices &amp; Production Vault Ledger
                </h2>
              </div>

              <Link
                href="/client/invoices"
                className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
              >
                View Full Invoices Ledger →
              </Link>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[#86868B] font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Invoice # / Date</th>
                    <th className="py-3 px-3">Project Title</th>
                    <th className="py-3 px-3">Base Price</th>
                    <th className="py-3 px-3">GST (18%)</th>
                    <th className="py-3 px-3">Total Deposited</th>
                    <th className="py-3 px-3">Vault Status</th>
                    <th className="py-3 px-3 text-right">Tax Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F7]">
                  <tr className="hover:bg-[#F5F5F7]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-[#1D1D1F]">ART-INV-2026-004</div>
                      <div className="text-[11px] text-[#86868B]">Sep 24, 2026</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#1D1D1F]">Udaipur Palace Royal Wedding Cinema</div>
                      <div className="text-[10px] font-mono text-[#3B82F6]">Order: #AP-8841</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono">₹6,780</td>
                    <td className="py-3.5 px-3 font-mono text-amber-600">₹1,220</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#1D1D1F]">₹8,000</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        Secured In Vault
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href="/api/invoices/AP-8841"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#3B82F6]"
                        >
                          View ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => alert('Downloading official GST Tax Invoice PDF for ART-INV-2026-004...')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
                        >
                          PDF ↓
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-[#F5F5F7]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-[#1D1D1F]">ART-INV-2026-001</div>
                      <div className="text-[11px] text-[#86868B]">Aug 14, 2026</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#1D1D1F]">Autumn Brand Commercial &amp; DTC UGC</div>
                      <div className="text-[10px] font-mono text-[#3B82F6]">Order: #AP-8835</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono">₹3,814</td>
                    <td className="py-3.5 px-3 font-mono text-amber-600">₹686</td>
                    <td className="py-3.5 px-3 font-mono font-bold text-[#1D1D1F]">₹4,500</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Disbursed
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href="/api/invoices/AP-8835"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#3B82F6]"
                        >
                          View ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => alert('Downloading official GST Tax Invoice PDF for ART-INV-2026-001...')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
                        >
                          PDF ↓
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
