'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ClientHeader from './components/ClientHeader';
import ClientSidebar from './components/ClientSidebar';
import { useAuth } from '@/lib/auth';
import { parseVideoEmbedUrl } from '@/lib/video/embed';
import { formatPublicCreatorName } from '@/lib/masking';

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

  const router = useRouter();

  const handleApproveCut = async (projectId?: string) => {
    const targetId = projectId || (projects.length > 0 ? projects[0].id : null);
    if (!targetId) return;

    try {
      const res = await fetch(`/api/client/projects/${encodeURIComponent(targetId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_cut' }),
      });

      if (res.ok) {
        setApprovedNotice(true);
        // Refresh projects list to show updated status
        const listRes = await fetch('/api/client/projects');
        const listData = await listRes.json();
        if (listData.projects) setProjects(listData.projects);
      }
    } catch (err) {
      console.warn('Failed to approve cut:', err);
    }

    setTimeout(() => setApprovedNotice(false), 5000);
  };

  const handleRequestRetake = (projectId?: string) => {
    const targetId = projectId || (projects.length > 0 ? projects[0].id : null);
    if (targetId) {
      router.push(`/client/projects/${encodeURIComponent(targetId)}`);
    } else {
      router.push('/client/review');
    }
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
                {projects.filter((p) => p.status === 'review_ready' || p.status === 'in_review' || p.status === 'client_review').length} Pending
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
                          {(project as any).isCreatorDeclined && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full uppercase">
                              Editor Unavailable — Choose Replacement
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-[#1D1D1F]">
                          {displayTitle}
                        </h3>

                        {/* Positive 4-Stage Progress Meter */}
                        {((project as any).editingProgress) && (
                          <div className="pt-2 space-y-1.5 max-w-md">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-[#1D1D1F]">
                                Stage {(project as any).editingProgress.stage || 1} of 4: {(project as any).editingProgress.stageName || 'Ingest & Selects'}
                              </span>
                              <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-[#E5E5E7]">
                                {(project as any).editingProgress.percentage || 25}% Complete
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1 w-full">
                              {[1, 2, 3, 4].map((s) => {
                                const isFilled = ((project as any).editingProgress.stage || 1) >= s;
                                return (
                                  <div
                                    key={s}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                      isFilled ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-[#E5E5E7]'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                          href={`/client/projects/${project.id}`}
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
            ) : (() => {
              const activeProject = projects.find((p) => p.isReviewReady || p.deliverableUrl) || projects[0];
              const ord = activeProject?.orders || {};
              const snap = ord.requirements_snapshot || {};
              let displayTitle = activeProject?.title || 'Cinematic Edit';
              const rawSub = snap.subCategory || snap.serviceId;
              if (rawSub) {
                const cleanSub = String(rawSub).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                const rawCat = snap.category || ord.service_key || '';
                const cleanCat = rawCat ? String(rawCat).replace(/\b\w/g, (c: string) => c.toUpperCase()) : '';
                displayTitle = cleanCat ? `${cleanCat} • ${cleanSub}` : cleanSub;
              }
              const orderBadge = ord.order_number || `#${activeProject?.id?.slice(0, 8)}`;
              const editorName = activeProject?.creatorName ? formatPublicCreatorName(activeProject.creatorName) : 'Assigned Senior Editor';
              const embed = parseVideoEmbedUrl(activeProject?.deliverableUrl);
              const isProjectApproved = activeProject?.status === 'approved' || activeProject?.status === 'completed';

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Embedded 16:9 Video Canvas or Dynamic Status Card */}
                  <div className="lg:col-span-7 bg-[#0A0A0A] rounded-2xl overflow-hidden border border-[#262626] relative group shadow-md flex items-center justify-center">
                    <div className="relative aspect-video w-full">
                      {embed?.type === 'direct' && (
                        <video
                          src={embed.embedUrl}
                          controls
                          className="w-full h-full object-contain bg-black"
                        />
                      )}
                      {embed?.type === 'youtube' && (
                        <iframe
                          src={embed.embedUrl}
                          title={displayTitle}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      )}
                      {embed?.type === 'gdrive' && (
                        <iframe
                          src={embed.embedUrl}
                          title={displayTitle}
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      )}
                      {embed?.type === 'vimeo' && (
                        <iframe
                          src={embed.embedUrl}
                          title={displayTitle}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      )}
                      {embed?.type === 'loom' && (
                        <iframe
                          src={embed.embedUrl}
                          title={displayTitle}
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      )}
                      {embed?.type === 'cloud' && (
                        <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                            📁
                          </div>
                          <div className="space-y-1 max-w-sm">
                            <h4 className="text-sm font-bold text-white">Cloud Master Folder Ready</h4>
                            <p className="text-xs text-white/70">
                              Your editor has provided the export folder. Click below to inspect raw renders.
                            </p>
                          </div>
                          <a
                            href={embed.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                          >
                            <span>Open Cloud Folder</span>
                            <span>↗</span>
                          </a>
                        </div>
                      )}
                      {!embed && (
                        <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl animate-pulse">
                            ✂️
                          </div>
                          <div className="space-y-1 max-w-sm">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold block">
                              STAGE {activeProject?.editingProgress?.stage || 1} OF 4 • {activeProject?.editingProgress?.stageName || 'ASSEMBLY'}
                            </span>
                            <h4 className="text-sm font-bold text-white">Post-Production In Progress</h4>
                            <p className="text-xs text-white/70 leading-relaxed">
                              Your editor <strong className="text-white">{editorName}</strong> is assembling your timeline. Once submitted, the draft cut will stream here for review.
                            </p>
                          </div>
                          <Link
                            href={`/client/projects/${activeProject?.id}`}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span>View Workroom</span>
                            <span>→</span>
                          </Link>
                        </div>
                      )}

                      {/* Watermark Overlay for In-Progress Cuts */}
                      {embed && !isProjectApproved && (
                        <div className="absolute bottom-3 right-3 bg-black/80 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider border border-amber-400/40 backdrop-blur-xs pointer-events-none shadow-md z-20">
                          DRAFT PREVIEW — ARTSY
                        </div>
                      )}

                      {/* Approved Badge Overlay */}
                      {isProjectApproved && (
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider shadow-lg z-20">
                          APPROVED ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Quick Actions & Live Milestone Info */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-[#1D1D1F] text-white rounded-2xl p-6 space-y-4 shadow-sm border border-[#262626]">
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-[#3B82F6] font-bold">
                            {orderBadge}
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            {displayTitle}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          isProjectApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : embed
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isProjectApproved ? 'APPROVED ✓' : embed ? 'REVIEW READY' : 'IN ASSEMBLY'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[#86868B]">
                          <span>Assigned Editor:</span>
                          <span className="text-white font-medium">{editorName}</span>
                        </div>
                        <div className="flex items-center justify-between text-[#86868B]">
                          <span>Production Phase:</span>
                          <span className="text-white font-medium">
                            Stage {activeProject?.editingProgress?.stage || 1} of 4: {activeProject?.editingProgress?.stageName || 'Story Assembly'}
                          </span>
                        </div>
                      </div>

                      {embed ? (
                        <div className="space-y-3 pt-2">
                          <p className="text-[11px] text-[#86868B] leading-relaxed">
                            {isProjectApproved
                              ? 'You have approved this cut! The 4K unwatermarked master file is unlocked in Final Downloads.'
                              : 'Watch the draft cut above. If you love it, approve the cut to unlock master files. If you need any tweaks, pause and leave timestamped notes.'}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <Link
                              href={`/client/projects/${activeProject?.id}`}
                              className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all text-center cursor-pointer inline-flex items-center justify-center gap-1"
                            >
                              <span>Review &amp; Notes</span>
                              <span>↗</span>
                            </Link>

                            {!isProjectApproved ? (
                              <button
                                type="button"
                                onClick={() => handleApproveCut(activeProject?.id)}
                                className="flex-1 py-2.5 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-all text-center cursor-pointer shadow-sm"
                              >
                                Approve Video ✓
                              </button>
                            ) : (
                              <div className="flex-1 py-2.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-xl text-center">
                                Approved ✓
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          <p className="text-[11px] text-[#86868B] leading-relaxed">
                            Your editor is actively cutting footage and matching music pacing. You will receive an instant notification on WhatsApp, Email, and here as soon as the review cut is ready.
                          </p>
                          <Link
                            href={`/client/projects/${activeProject?.id}`}
                            className="block w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl text-center transition-colors"
                          >
                            Open Project Review Workroom →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
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
