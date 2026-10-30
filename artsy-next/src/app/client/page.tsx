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
    displayName: user?.full_name || '',
    ingestProvider: 'Google Drive Enterprise',
    ingestLink: '',
    brandLuts: 'Standard Rec.709 Master',
  });

  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/client/projects');
        const data = await res.json();
        setProjects(data.projects || []);
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  const [activeTimecode, setActiveTimecode] = useState('00:00:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [approvedNotice, setApprovedNotice] = useState(false);
  const [retakeNotice, setRetakeNotice] = useState(false);
  const [paymentSuccessNotice, setPaymentSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment_success') === 'true') {
        const orderId = params.get('orderId') || '';
        setPaymentSuccessNotice(orderId ? `Order #${orderId}` : 'Your project');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const clientName = user.display_name || user.full_name || (user as any).studio_details?.studioName || 'Client';
      setProfile((prev) => ({
        ...prev,
        displayName: clientName,
      }));
    }
  }, [user]);

  const handleApproveCut = () => {
    setApprovedNotice(true);
    // Dispatch automated WhatsApp notification in background
    fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user?.phone || '',
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
        phone: user?.phone || '',
        message: '🎬 Artsy Retake Notice: Client requested revision adjustments on Draft v1.2 Cut (Project #AP-8841).',
        projectId: 'AP-8841',
      }),
    }).catch(() => {});

    setTimeout(() => setRetakeNotice(false), 5000);
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans overflow-x-hidden">
      <ClientHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        {/* Desktop Sidebar */}
        <ClientSidebar />

        {/* Main Content Dashboard */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8">

          {/* Payment Success Celebratory Alert Banner */}
          {paymentSuccessNotice && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1D1D1F]">
                    Payment Confirmed &amp; Project Initialized!
                  </h3>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    {paymentSuccessNotice} has been captured and bound to your account. Your footage is in the queue and your active project appears below.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentSuccessNotice(null)}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F] p-1.5 cursor-pointer font-bold"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Banner: Welcome */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                Welcome, {profile.displayName}
              </h1>
              <p className="text-xs sm:text-sm text-[#86868B]">
                Track your active video edits, review draft cuts, and download completed videos.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/book"
                className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>+ Start New Project</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Feedback Notices */}
          {approvedNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">✓</span>
                <span>Video approved! Your unwatermarked final 4K video is ready in Final Downloads.</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-600 font-bold">COMPLETED</span>
            </div>
          )}
          {retakeNotice && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold">✓</span>
                <span>Changes requested. Your editor has been notified and will deliver your revised cut within 48 hours.</span>
              </div>
              <span className="font-mono text-[10px] text-amber-600 font-bold">IN PROGRESS</span>
            </div>
          )}

          {/* KPI Bento Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                ACTIVE PROJECTS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] mt-1.5">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                DRAFTS TO REVIEW
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1.5">
                {projects.filter((p) => p.status === 'review_ready' || p.status === 'in_review').length} Pending
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                COMPLETED VIDEOS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1.5">
                {projects.filter((p) => p.status === 'completed' || p.status === 'approved').length} Delivered
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* MODULE 1: ACTIVE PROJECTS                                        */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F5F5F7]">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  Active Projects
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Track ongoing edits, assigned editors, and expected delivery dates
                </p>
              </div>
              <Link
                href="/client/projects"
                className="text-xs font-bold text-[#3B82F6] hover:underline"
              >
                View All Projects ({projects.length}) →
              </Link>
            </div>

            {loadingProjects ? (
              <div className="text-center py-12 text-xs text-[#86868B]">
                Loading active projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="text-lg font-semibold mb-2">No active projects yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Start your first video project — upload your footage and our team will get to work.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-sm"
                >
                  Start New Project →
                </Link>
              </div>
            ) : (
              projects.map((project) => {
                const ord = project.orders || {};
                const snap = ord.requirements_snapshot || {};
                let displayTitle = project.title || 'Cinematic Edit';
                const rawSub = snap.subCategory || snap.serviceId;
                if (rawSub) {
                  const cleanSub = String(rawSub).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  const rawCat = snap.category || ord.service_key || '';
                  const cleanCat = rawCat ? String(rawCat).replace(/\b\w/g, (c: string) => c.toUpperCase()) : '';
                  displayTitle = cleanCat ? `${cleanCat} • ${cleanSub}` : cleanSub;
                }
                const orderBadge = ord.order_number || `#${project.id?.slice(0, 8)}`;

                return (
                  <div
                    key={project.id}
                    className="bg-[#F5F5F7] rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] hover:border-[#3B82F6]/40 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#3B82F6] bg-white px-2 py-0.5 rounded border border-[#E5E5E7]">
                            {orderBadge}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-300 px-2 py-0.5 rounded-full uppercase">
                            {project.status?.replace('_', ' ') || 'ACTIVE'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#1D1D1F]">
                          {displayTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                          href={`/client/projects`}
                          className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                        >
                          Project Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* ================================================================ */}
          {/* MODULE 2: TIMESTAMPE REVIEW STATION (INTERACTIVE SPOTLIGHT)       */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  Review Spotlight
                </h2>
              </div>

              {projects.length > 0 && (
                <Link
                  href="/client/review"
                  className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
                >
                  Open Full Video Review →
                </Link>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#E5E5E7] rounded-2xl bg-[#F5F5F7]/40 p-6 space-y-2">
                <div className="text-3xl">🎞️</div>
                <h3 className="text-sm font-bold text-[#1D1D1F]">No drafts pending review</h3>
                <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                  When your lead editor finishes a cut, you can watch it here and add notes at exact seconds.
                </p>
              </div>
            ) : (
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
                        PREVIEW DRAFT v1.0
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
                        <span>Time @ {activeTimecode}</span>
                        <span className="text-[#86868B]">00:00:00</span>
                      </div>
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden relative">
                        <div className="bg-[#3B82F6] h-full w-[0%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Quick Actions */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#1D1D1F] text-white rounded-xl p-5 space-y-3">
                    <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                      APPROVAL &amp; SIGN OFF
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      Happy with this video?
                    </h4>
                    <p className="text-[11px] text-[#86868B] leading-relaxed mt-1">
                      Approving unlocks your unwatermarked 4K video download and completes the edit milestone.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRequestRetake}
                        className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all text-center cursor-pointer"
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveCut}
                        className="flex-1 py-2.5 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg transition-all text-center cursor-pointer shadow-sm"
                      >
                        Approve Video ✓
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ================================================================ */}
          {/* MODULE 3: FINAL DOWNLOADS                                        */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  Final Downloads
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Clean 4K masters, social media cuts, and audio tracks
                </p>
              </div>

              {projects.length > 0 && (
                <Link
                  href="/client/masters"
                  className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
                >
                  View All Downloads →
                </Link>
              )}
            </div>

            <div className="text-center py-12 border-2 border-dashed border-[#E5E5E7] rounded-2xl bg-[#F5F5F7]/40 p-6 space-y-2">
              <div className="text-3xl">📦</div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">No completed videos yet</h3>
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Once you approve a draft, your final clean videos and social cuts will appear here for download.
              </p>
            </div>
          </section>

          {/* ================================================================ */}
          {/* MODULE 4: INVOICES & RECEIPTS                                    */}
          {/* ================================================================ */}
          <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">
                  Invoices &amp; Receipts
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Official GST tax invoices and payment receipts
                </p>
              </div>

              {projects.length > 0 && (
                <Link
                  href="/client/invoices"
                  className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
                >
                  View All Invoices →
                </Link>
              )}
            </div>

            <div className="text-center py-12 border-2 border-dashed border-[#E5E5E7] rounded-2xl bg-[#F5F5F7]/40 p-6 space-y-2">
              <div className="text-3xl">🧾</div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">No invoices yet</h3>
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Official GST invoices and payment receipts will appear here automatically when you book a project.
              </p>
            </div>
          </section>
          </div>
        </main>
      </div>
    </div>
  );
}
