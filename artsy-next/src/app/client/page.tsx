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

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        displayName: user.full_name || '',
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
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                FRAME REVIEW SPOTLIGHT
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1.5">
                {projects.filter((p) => p.status === 'review_ready' || p.status === 'in_review').length} Drafts Pending
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7]/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] uppercase font-bold text-[#86868B] block tracking-wider">
                MASTERS READY IN VAULT
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1.5">
                {projects.filter((p) => p.status === 'completed' || p.status === 'approved').length} Archives
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
                  Start your first cinematic edit — book a cut and we&apos;ll match you with an editor.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-sm"
                >
                  Book New Project →
                </Link>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[#F5F5F7] rounded-2xl p-5 sm:p-6 border border-[#E5E5E7] hover:border-[#3B82F6]/40 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#3B82F6] bg-white px-2 py-0.5 rounded border border-[#E5E5E7]">
                          #{project.id?.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-300 px-2 py-0.5 rounded-full uppercase">
                          {project.status?.replace('_', ' ') || 'ACTIVE'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1D1D1F]">
                        {project.title}
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
              ))
            )}
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
                  Review Spotlight
                </h2>
              </div>

              {projects.length > 0 && (
                <Link
                  href="/client/review"
                  className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
                >
                  Launch Full Review Suite (Timeline &amp; Canvas) →
                </Link>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[#E5E5E7] rounded-2xl bg-[#F5F5F7]/40 p-6 space-y-2">
                <div className="text-3xl">🎞️</div>
                <h3 className="text-sm font-bold text-[#1D1D1F]">No cuts pending review</h3>
                <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                  When your senior editor submits a rough cut or fine cut, interactive timestamp annotations and signoff gates will activate here.
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
                        DRAFT v1.0 • PROXY 4K
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
                      FINAL ACCEPTANCE GATE
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      Ready to sign off on this cut?
                    </h4>
                    <p className="text-[11px] text-[#86868B] leading-relaxed mt-1">
                      Approving releases the Production Vault payout to the creator and decrypts your unwatermarked 4K DCI master package.
                    </p>
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
            )}
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

              {projects.length > 0 && (
                <Link
                  href="/client/masters"
                  className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
                >
                  Access Full Master Vault →
                </Link>
              )}
            </div>

            <div className="text-center py-12 border-2 border-dashed border-[#E5E5E7] rounded-2xl bg-[#F5F5F7]/40 p-6 space-y-2">
              <div className="text-3xl">📦</div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Vault is empty</h3>
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Your uncompressed 4K master archives, social cutdowns, and isolated audio stems will appear here once cuts are approved.
              </p>
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

              {projects.length > 0 && (
                <Link
                  href="/client/invoices"
                  className="text-xs font-bold text-[#3B82F6] hover:underline self-start sm:self-auto"
                >
                  View Full Invoices Ledger →
                </Link>
              )}
            </div>

            <div className="text-center py-12 border-2 border-dashed border-[#E5E5E7] rounded-2xl bg-[#F5F5F7]/40 p-6 space-y-2">
              <div className="text-3xl">🧾</div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">No tax invoices generated yet</h3>
              <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                Statutory 18% GST invoices and production escrow ledger receipts will appear here automatically upon order placement.
              </p>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
