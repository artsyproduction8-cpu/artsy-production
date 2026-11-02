'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import ClientSidebar from '../components/ClientSidebar';
import ClientHeader from '../components/ClientHeader';
import { createChangeOrder } from '@/lib/changeOrders/engine';
import { logRefundRequest } from '@/lib/activity/logger';
import { parseVideoEmbedUrl, formatTimecode, parseTimecodeToSeconds, VideoEmbedInfo } from '@/lib/video/embed';
import { formatPublicCreatorName } from '@/lib/masking';

interface RevisionItem {
  id: string;
  timecode: string;
  timecodeSeconds?: number;
  tag: string;
  tagBg: string;
  author: string;
  timeAgo: string;
  text: string;
  status: string;
  statusColor: string;
  isAddressed?: boolean;
}

interface LoadedProject {
  id: string;
  projectNumber: string;
  orderNumber: string;
  title: string;
  category: string;
  status: string;
  deliverableUrl: string | null;
  rawFootageUrl: string | null;
  creatorName: string;
  currentRound: number;
  includedRounds: number;
  turnaround: string;
  isApproved: boolean;
  reviewNotes: RevisionItem[];
  editingProgress?: any;
}

export default function ClientReviewPage() {
  const { user } = useAuth();
  const routeParams = useParams<{ id?: string; projectId?: string }>();
  const targetProjectId = routeParams?.id || routeParams?.projectId || null;

  const [project, setProject] = useState<LoadedProject | null>(null);
  const [loadingProject, setLoadingProject] = useState<boolean>(true);
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimecode, setCurrentTimecode] = useState('00:00:00');
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(180);
  const [activeCategory, setActiveCategory] = useState('COLOR');
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [includedRounds, setIncludedRounds] = useState(1);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [studioProfile, setStudioProfile] = useState({
    studioName: user?.full_name || '',
    legalName: '',
    gstin: '',
    ingestProvider: 'Google Drive Enterprise',
    ingestLink: '',
    brandLuts: 'Standard Rec.709 Master',
    collaborators: '',
  });
  const [studioSavedNotice, setStudioSavedNotice] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch project data
  const loadProjectData = async () => {
    try {
      setLoadingProject(true);
      let fetchUrl = targetProjectId ? `/api/client/projects/${encodeURIComponent(targetProjectId)}` : null;

      // If no specific ID, query client projects list to pick first active project
      if (!fetchUrl) {
        const listRes = await fetch('/api/client/projects');
        const listData = await listRes.json();
        if (listData.projects && listData.projects.length > 0) {
          fetchUrl = `/api/client/projects/${encodeURIComponent(listData.projects[0].id)}`;
          setHasProjects(true);
        } else {
          setHasProjects(false);
          setLoadingProject(false);
          return;
        }
      }

      const res = await fetch(fetchUrl);
      const data = await res.json();

      if (data.success && data.project) {
        const p: LoadedProject = data.project;
        setProject(p);
        setHasProjects(true);
        setIsApproved(Boolean(p.isApproved));
        setCurrentRound(p.currentRound || 1);
        setIncludedRounds(p.includedRounds || 1);
      } else {
        setHasProjects(false);
      }
    } catch (err) {
      console.warn('Failed to load project details:', err);
      setHasProjects(false);
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [targetProjectId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        if (stored) {
          setStudioProfile((prev) => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch {}
    }
  }, []);

  // Parse deliverable link into embeddable format
  const videoEmbed = useMemo(() => {
    return parseVideoEmbedUrl(project?.deliverableUrl);
  }, [project?.deliverableUrl]);

  // Track how many feedback notes have been addressed in the current video cut
  const addressedNotesCount = useMemo(() => {
    if (!project?.reviewNotes) return 0;
    return project.reviewNotes.filter(
      (n) => n.isAddressed || String(n.status || '').toLowerCase().includes('addressed') || String(n.status || '').toLowerCase().includes('resolved')
    ).length;
  }, [project?.reviewNotes]);

  // Keyboard shortcut listener: Space toggles play/pause, M focuses feedback textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!videoEmbed) return; // Prevent phantom timer when video is not submitted yet
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        } else {
          setIsPlaying((prev) => !prev);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        noteTextareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoEmbed]);

  // Timer simulation for non-native video players
  useEffect(() => {
    if (!isPlaying || !videoEmbed || videoRef.current) return;
    const interval = setInterval(() => {
      setCurrentSeconds((prev) => {
        const next = prev + 1;
        const h = String(Math.floor(next / 3600)).padStart(2, '0');
        const m = String(Math.floor((next % 3600) / 60)).padStart(2, '0');
        const s = String(Math.floor(next % 60)).padStart(2, '0');
        setCurrentTimecode(`${h}:${m}:${s}`);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, videoEmbed]);

  // Native HTML5 video time tracking
  const handleNativeTimeUpdate = () => {
    if (videoRef.current) {
      const cur = Math.floor(videoRef.current.currentTime);
      setCurrentSeconds(cur);
      const h = String(Math.floor(cur / 3600)).padStart(2, '0');
      const m = String(Math.floor((cur % 3600) / 60)).padStart(2, '0');
      const s = String(Math.floor(cur % 60)).padStart(2, '0');
      setCurrentTimecode(`${h}:${m}:${s}`);
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoEmbed) return;
    setCurrentSeconds(seconds);
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    setCurrentTimecode(`${h}:${m}:${s}`);

    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  // Handle adding a timestamped review note
  const handleAddAnnotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    if (!project) return;

    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          timecode: currentTimecode,
          timecodeSeconds: currentSeconds,
          category: activeCategory,
          text: noteText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.note) {
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            reviewNotes: [data.note, ...prev.reviewNotes],
          };
        });
        setNoteText('');
        showToast(`✓ Note saved at ${currentTimecode}! Your editor can see this timestamped note.`);
      } else {
        alert(data.error || 'Failed to save note');
      }
    } catch (err: any) {
      alert(err.message || 'Network error saving note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Handle Approving the Video Cut (I Like It!)
  const handleApproveCut = async () => {
    if (!project) return;
    if (!confirm('Are you happy with this video cut?\n\nApproving confirms your satisfaction, unlocks your final unwatermarked master file for download, and notifies your editor.')) {
      return;
    }

    setIsApproving(true);
    try {
      const res = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_cut' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsApproved(true);
        setProject((prev) => prev ? { ...prev, isApproved: true, status: 'approved' } : prev);
        showToast('🎉 Video Cut Approved! Your final master is ready for download.');
      } else {
        alert(data.error || 'Failed to approve video cut');
      }
    } catch (err: any) {
      alert(err.message || 'Network error approving video');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Requesting Revision Changes
  const handleRequestRevision = async () => {
    if (!project) return;

    if (currentRound < includedRounds) {
      if (!confirm(`Submit these revision notes to your editor for Round ${currentRound + 1}?\n\nYour editor will implement all timestamped feedback notes and deliver an updated cut.`)) {
        return;
      }
      try {
        const res = await fetch(`/api/client/projects/${encodeURIComponent(project.id)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_revision' }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const nextR = data.currentRound || currentRound + 1;
          setCurrentRound(nextR);
          setProject((prev) => prev ? { ...prev, currentRound: nextR, status: 'client_revision_requested' } : prev);
          showToast(`✓ Revision Round ${nextR} requested! Your editor has been alerted.`);
        } else {
          alert(data.error || 'Failed to request revision');
        }
      } catch (err: any) {
        alert(err.message || 'Network error requesting revision');
      }
    } else {
      setShowChangeOrderModal(true);
    }
  };

  const handleApproveChangeOrder = () => {
    if (!project) return;
    createChangeOrder({
      projectId: project.id,
      orderId: project.orderNumber,
      changeType: 'extra_revisions',
      description: `Additional Creative Revision Round ${currentRound + 1} (Beyond included ${includedRounds} rounds)`,
      originalScope: { includedRounds },
      requestedScope: { includedRounds: includedRounds + 1 },
      additionalPricePaise: 150000,
      createdBy: 'client',
    });

    setIncludedRounds((prev) => prev + 1);
    setCurrentRound((prev) => prev + 1);
    setShowChangeOrderModal(false);
    showToast(`✓ Extra revision approved: ₹1,500 added. Revision Round ${currentRound + 1} unlocked!`);
  };

  const handleSaveStudioProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('artsy_client_profile', JSON.stringify(studioProfile));
    }
    setStudioSavedNotice(true);
    setTimeout(() => {
      setStudioSavedNotice(false);
      setShowStudioModal(false);
    }, 1000);
  };

  const handleSubmitRefundDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      alert('Please describe your concern or reason.');
      return;
    }
    if (project) {
      logRefundRequest(project.id, user?.id || 'client', 800000, refundReason);
    }
    setShowRefundModal(false);
    showToast('Dispute submitted: Our studio lead will review your project within 24 hours.');
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans overflow-x-hidden">
      <ClientHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 bg-[#F5F5F7] min-h-screen">
          {toastMessage && (
            <div className="fixed top-20 right-6 z-50 bg-[#1D1D1F] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold border border-white/20 animate-fade-in flex items-center gap-2">
              <span>{toastMessage}</span>
            </div>
          )}

          {loadingProject ? (
            <div className="p-12 text-center text-xs text-[#86868B] flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Loading video review suite...</span>
            </div>
          ) : hasProjects === false || !project ? (
            <div className="p-6 md:p-8 max-w-4xl mx-auto pt-16">
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8 space-y-3 shadow-xs">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">No video drafts to review yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  When your video editor uploads a master cut for your order, it will appear here so you can watch, review, and leave exact timestamped feedback.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-semibold transition-all shadow-sm"
                >
                  Start New Project →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full max-w-full overflow-x-hidden">
              
              {/* ORDER BANNER */}
              <section className="p-4 sm:p-6 lg:p-8 pb-0 max-w-[1600px] mx-auto w-full">
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col xl:flex-row xl:items-stretch justify-between gap-6">
                    {/* Title & Details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#3B82F6] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                          {project.orderNumber}
                        </span>
                        <span className="text-xs text-[#86868B]">•</span>
                        <span className="text-xs font-semibold text-[#3B82F6]">
                          Draft v{currentRound}.0
                        </span>
                        <span className="text-xs text-[#86868B]">•</span>
                        <span className="text-xs text-[#86868B]">
                          Editor: <strong className="text-[#1D1D1F]">{project.creatorName ? formatPublicCreatorName(project.creatorName) : 'Senior Lead Editor'}</strong>
                        </span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-[-0.03em] leading-tight">
                        {project.title}
                      </h1>
                    </div>

                    {/* Quick Metrics */}
                    <div className="flex items-stretch gap-3 self-start xl:self-auto">
                      <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] min-w-[130px]">
                        <div className="text-[10px] uppercase font-bold text-[#86868B]">Turnaround SLA</div>
                        <div className="text-base font-extrabold text-[#1D1D1F] mt-1">{project.turnaround}</div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">For revision updates</div>
                      </div>
                      <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] min-w-[130px]">
                        <div className="text-[10px] uppercase font-bold text-[#86868B]">Revisions</div>
                        <div className="text-base font-extrabold text-[#3B82F6] mt-1">Round {currentRound} of {includedRounds}</div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">{currentRound <= includedRounds ? 'Free revision included' : 'Extra pass active'}</div>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS STEPPER */}
                  <div className="mt-6 pt-6 border-t border-[#F5F5F7] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#86868B]">1. Footage Upload</div>
                        <div className="text-xs font-semibold text-[#1D1D1F]">Received ✓</div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>

                    <div className="p-3.5 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#86868B]">2. Video Editing</div>
                        <div className="text-xs font-semibold text-[#1D1D1F]">
                          {videoEmbed ? 'Draft Ready ✓' : 'In Assembly'}
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>

                    <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      videoEmbed && !isApproved ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30' : 'bg-[#F5F5F7] border-[#E5E5E7]'
                    }`}>
                      <div>
                        <div className={`text-[10px] uppercase font-bold ${videoEmbed && !isApproved ? 'text-[#3B82F6]' : 'text-[#86868B]'}`}>
                          3. Client Review
                        </div>
                        <div className="text-xs font-bold text-[#1D1D1F]">
                          {isApproved ? 'Approved ✓' : videoEmbed ? 'Reviewing Draft' : 'Awaiting Cut'}
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-500' : videoEmbed ? 'bg-[#3B82F6] animate-ping' : 'bg-gray-400'}`}></span>
                    </div>

                    <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#F5F5F7] border-[#E5E5E7] text-[#86868B]'
                    }`}>
                      <div>
                        <div className="text-[10px] uppercase font-bold">4. Final 4K Download</div>
                        <div className="text-xs font-semibold">{isApproved ? 'Unlocked ✓' : 'Locks after approval'}</div>
                      </div>
                      <span>{isApproved ? '✓' : '🔒'}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* MAIN WORKSPACE */}
              <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                
                {/* TOP REVIEW ACTION BAR */}
                {videoEmbed && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎬</span>
                        <h3 className="text-sm font-extrabold text-[#1D1D1F]">
                          {isApproved ? 'Video Cut Approved & Ready!' : 'Master Cut Submitted by Editor'}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">
                          {isApproved ? 'APPROVED' : 'ACTION REQUIRED'}
                        </span>
                      </div>
                      <p className="text-xs text-[#86868B]">
                        {isApproved
                          ? 'You have approved this cut! You can download your final unwatermarked master below.'
                          : 'Watch the video preview below. If you love it, click "Approve Video Cut". If you want changes, pause at any second and type your note.'}
                      </p>
                      {!isApproved && addressedNotesCount > 0 && (
                        <div className="pt-1 flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-emerald-800 bg-white/90 border border-emerald-300 px-2.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1">
                            <span className="text-emerald-600 font-extrabold">✓</span>
                            <span>{addressedNotesCount} review {addressedNotesCount === 1 ? 'change' : 'changes'} addressed in this cut</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {videoEmbed.originalUrl && (
                        <a
                          href={videoEmbed.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-[#1D1D1F] border border-[#E5E5E7] text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Open Source Link</span>
                          <span>↗</span>
                        </a>
                      )}

                      {!isApproved ? (
                        <button
                          type="button"
                          onClick={handleApproveCut}
                          disabled={isApproving}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          <span>{isApproving ? 'Approving...' : '✓ I Like It! Approve Video Cut'}</span>
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                          <span>✓ Video Cut Approved</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* LEFT 8 COLS: UNIVERSAL VIDEO PLAYER & TIMELINE */}
                  <div className="lg:col-span-8 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      {/* Player Header Bar */}
                      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-[#F5F5F7] gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${videoEmbed ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                          <span className="text-xs font-bold text-[#1D1D1F]">
                            {videoEmbed ? 'Interactive Video Preview Player' : 'Video In Production'}
                          </span>
                          {videoEmbed && (
                            <span className="text-[10px] uppercase font-bold text-[#86868B] bg-[#F5F5F7] px-2 py-0.5 rounded">
                              {videoEmbed.type}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#86868B]">
                          {videoEmbed?.type === 'direct' ? 'Space to play/pause • Click anywhere on timeline' : 'Click to play/pause'}
                        </span>
                      </div>

                      {/* 16:9 Cinema Container */}
                      <div className="relative w-full aspect-video bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-lg group flex items-center justify-center">
                        
                        {/* 1. Direct HTML5 Video Player */}
                        {videoEmbed?.type === 'direct' && (
                          <video
                            ref={videoRef}
                            src={videoEmbed.embedUrl}
                            controls
                            className="w-full h-full object-contain bg-black"
                            onTimeUpdate={handleNativeTimeUpdate}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                          />
                        )}

                        {/* 2. YouTube Embed */}
                        {videoEmbed?.type === 'youtube' && (
                          <iframe
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        )}

                        {/* 3. Google Drive Video Preview Embed */}
                        {videoEmbed?.type === 'gdrive' && (
                          <iframe
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allow="autoplay"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        )}

                        {/* 4. Vimeo Embed */}
                        {videoEmbed?.type === 'vimeo' && (
                          <iframe
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        )}

                        {/* 5. Loom Embed */}
                        {videoEmbed?.type === 'loom' && (
                          <iframe
                            src={videoEmbed.embedUrl}
                            title={project.title}
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        )}

                        {/* 6. Cloud Storage / Folder Fallback */}
                        {videoEmbed?.type === 'cloud' && (
                          <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
                              📁
                            </div>
                            <div className="space-y-1 max-w-md">
                              <h3 className="text-base font-bold">Cloud Deliverable Linked</h3>
                              <p className="text-xs text-white/70 leading-relaxed">
                                Your editor has shared a cloud storage master folder for this cut. Click below to view the files in full resolution, then return here to leave exact timestamped notes.
                              </p>
                            </div>
                            <a
                              href={videoEmbed.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
                            >
                              <span>Open Cloud Deliverable</span>
                              <span>↗</span>
                            </a>
                          </div>
                        )}

                        {/* 7. Empty State (Creator has not submitted yet) */}
                        {!videoEmbed && (
                          <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl animate-pulse">
                              ✂️
                            </div>
                            <div className="space-y-1 max-w-md">
                              <h3 className="text-base font-bold">Post-Production In Progress</h3>
                              <p className="text-xs text-white/70 leading-relaxed">
                                Your editor <strong className="text-white">{project.creatorName ? formatPublicCreatorName(project.creatorName) : 'Senior Lead Editor'}</strong> is actively assembling and color grading your timeline. As soon as the first cut is submitted, it will play directly here for your review.
                              </p>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
                              Estimated Turnaround: {project.turnaround}
                            </span>
                          </div>
                        )}

                        {/* Watermark Overlay for In-Progress Cuts */}
                        {videoEmbed && !isApproved && (
                          <div className="absolute bottom-4 right-4 bg-black/80 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-md tracking-wider border border-amber-400/40 backdrop-blur-xs pointer-events-none shadow-md z-20">
                            DRAFT PREVIEW — ARTSY
                          </div>
                        )}

                        {/* Approved Badge Overlay */}
                        {isApproved && (
                          <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider shadow-lg z-20">
                            APPROVED ✓
                          </div>
                        )}
                      </div>

                      {/* TIMELINE & SCRUBBER MODULE */}
                      {videoEmbed ? (
                        <div className="mt-5 bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7] space-y-3">
                          {/* Interactive Playbar */}
                          <div
                            className="relative w-full h-3 bg-[#E5E5E7] rounded-full cursor-pointer overflow-hidden group"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                              const targetSecs = Math.floor(ratio * 180); // 3-min scale
                              handleSeek(targetSecs);
                            }}
                            title="Click to scrub timeline"
                          >
                            <div
                              className="h-full bg-[#3B82F6] rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(5, (currentSeconds / 180) * 100))}%` }}
                            />
                          </div>

                          {/* Controller Row */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            {/* Left: Quick Scrub Buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSeek(Math.max(0, currentSeconds - 5))}
                                className="px-2.5 py-1.5 bg-white text-[#1D1D1F] border border-[#E5E5E7] rounded-lg text-xs font-bold hover:bg-[#F5F5F7] cursor-pointer"
                                title="Rewind 5 seconds"
                              >
                                -5s
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSeek(currentSeconds + 5)}
                                className="px-2.5 py-1.5 bg-white text-[#1D1D1F] border border-[#E5E5E7] rounded-lg text-xs font-bold hover:bg-[#F5F5F7] cursor-pointer"
                                title="Forward 5 seconds"
                              >
                                +5s
                              </button>
                            </div>

                            {/* Timecode Display */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold text-[#86868B]">Current Timecode:</span>
                              <div className="px-3 py-1 bg-white rounded-lg border border-[#E5E5E7] font-mono text-xs font-extrabold text-[#3B82F6]">
                                {currentTimecode}
                              </div>
                            </div>

                            {/* Capture Current Time Button */}
                            <button
                              type="button"
                              onClick={() => {
                                showToast(`Captured timecode: ${currentTimecode}`);
                                noteTextareaRef.current?.focus();
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              📍 Tag at {currentTimecode}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 p-4 bg-[#F5F5F7] rounded-xl border border-dashed border-[#E5E5E7] text-center space-y-1">
                          <div className="text-xs font-bold text-[#1D1D1F]">
                            Interactive Timeline Scrubbing &amp; Frame Tagging
                          </div>
                          <p className="text-[11px] text-[#86868B]">
                            This playback bar and frame note tagger will unlock immediately once your editor posts your draft cut.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Hotkeys Bar */}
                    <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#86868B]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1D1D1F]">Tip:</span>
                        <span>Pause the video at any time, select a category, and type your feedback note.</span>
                      </div>
                      <div className="font-mono text-[11px] text-[#86868B]">
                        {project.reviewNotes.length} Notes Logged
                      </div>
                    </div>
                  </div>

                  {/* RIGHT 4 COLS: NOTES & FEEDBACK */}
                  <div className="lg:col-span-4 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F7]">
                        <div>
                          <h2 className="text-base font-bold text-[#1D1D1F]">Notes &amp; Feedback</h2>
                          <p className="text-[11px] text-[#86868B]">
                            {addressedNotesCount > 0
                              ? `${addressedNotesCount} of ${project.reviewNotes.length} notes addressed in new cut`
                              : 'Specific notes for your editor'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {addressedNotesCount > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                              ✓ {addressedNotesCount} Addressed
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold rounded-full">
                            {project.reviewNotes.length} {project.reviewNotes.length === 1 ? 'Note' : 'Notes'}
                          </span>
                        </div>
                      </div>

                      {/* REVISION LIST */}
                      <div className="mt-4 space-y-3 overflow-y-auto max-h-[380px] pr-1">
                        {project.reviewNotes.length === 0 ? (
                          <div className="text-center py-8 text-xs text-[#86868B] bg-[#F5F5F7] rounded-xl border border-dashed border-[#E5E5E7] p-4">
                            No notes added yet. Pause the video at any time to leave a timestamped note for your editor.
                          </div>
                        ) : (
                          project.reviewNotes.map((rev) => {
                            const isNoteAddressed = rev.isAddressed || String(rev.status || '').toLowerCase().includes('addressed') || String(rev.status || '').toLowerCase().includes('resolved');
                            return (
                              <div
                                key={rev.id}
                                className={`p-4 rounded-xl border transition-colors space-y-2 ${
                                  isNoteAddressed
                                    ? 'bg-emerald-50/40 border-emerald-200/90 hover:border-emerald-300'
                                    : 'bg-[#F5F5F7] border-[#E5E5E7] hover:border-[#3B82F6]/40'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E5E7]/70">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-mono font-bold text-white px-2 py-0.5 rounded-md bg-[#1D1D1F]">
                                      ⏱ {rev.timecode}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                      {rev.tag}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-[#1D1D1F] leading-relaxed font-medium">
                                  &ldquo;{rev.text}&rdquo;
                                </p>
                                <div className="pt-1.5 flex items-center justify-between text-xs">
                                  {isNoteAddressed ? (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>✓ Addressed in New Cut</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                      <span>Queued for editor</span>
                                    </span>
                                  )}
                                  {typeof rev.timecodeSeconds === 'number' && (
                                    <button
                                      type="button"
                                      onClick={() => handleSeek(rev.timecodeSeconds || 0)}
                                      className="text-[11px] font-bold text-[#3B82F6] hover:underline cursor-pointer"
                                    >
                                      Jump to this time →
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* NEW ANNOTATION FORM */}
                    <form
                      onSubmit={handleAddAnnotation}
                      className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1D1D1F]">Add Note at This Moment</span>
                        <span className="text-xs font-mono font-bold text-[#3B82F6] bg-white px-2 py-0.5 rounded-md border border-[#E5E5E7]">
                          ⏱ {currentTimecode}
                        </span>
                      </div>

                      {/* Category Matrix */}
                      <div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { key: 'COLOR', label: '🎨 Color' },
                            { key: 'AUDIO', label: '🔊 Audio' },
                            { key: 'PACING', label: '⏱ Pacing' },
                            { key: 'TITLES', label: '✏️ Titles' },
                          ].map((cat) => (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => setActiveCategory(cat.key)}
                              className={`py-1.5 text-center text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                activeCategory === cat.key
                                  ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                                  : 'bg-white text-[#1D1D1F] border-[#E5E5E7] hover:bg-[#F5F5F7]'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Feedback Input */}
                      <div className="space-y-2">
                        <textarea
                          ref={noteTextareaRef}
                          required
                          rows={3}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="e.g., Make this transition smoother, lower background music volume, or brighten this scene..."
                          className="w-full bg-white rounded-lg border border-[#E5E5E7] p-2.5 text-xs text-[#1D1D1F] focus:border-[#3B82F6] outline-none resize-none"
                        ></textarea>
                        <button
                          type="submit"
                          disabled={isSubmittingNote}
                          className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          {isSubmittingNote ? 'Saving Note...' : `Save Note at ${currentTimecode}`}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* BOTTOM SUITE: ASSET & DELIVERABLES */}
                <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#1D1D1F]">
                        Project Deliverables &amp; Files
                      </h3>
                      <p className="text-xs text-[#86868B] mt-0.5">
                        Download draft preview files or view linked project assets.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Cloud Storage Active
                    </span>
                  </div>

                  {/* 4-Tile Bento Asset Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Asset 1: Master Video Cut */}
                    <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md">
                            MASTER DELIVERABLE
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">
                            {isApproved ? 'FINAL 4K' : 'DRAFT'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                          {project.title}
                        </h4>
                        <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                          {project.deliverableUrl
                            ? 'High-resolution cut uploaded by editor for client review.'
                            : 'Editor is preparing the master export cut.'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-600">
                          {project.deliverableUrl ? 'Ready' : 'Pending'}
                        </span>
                        {project.deliverableUrl ? (
                          <a
                            href={project.deliverableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                          >
                            Open Link ↗
                          </a>
                        ) : (
                          <span className="text-xs text-[#86868B]">In progress</span>
                        )}
                      </div>
                    </div>

                    {/* Asset 2: Raw Footage */}
                    <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#1D1D1F] text-white rounded-md">
                            RAW FOOTAGE
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">SECURE VAULT</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                          Camera Raw Vault
                        </h4>
                        <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                          Original camera files provided during order booking.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#86868B]">Cloud Storage</span>
                        {project.rawFootageUrl ? (
                          <a
                            href={project.rawFootageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                          >
                            View Files ↗
                          </a>
                        ) : (
                          <span className="text-xs text-[#86868B]">Linked</span>
                        )}
                      </div>
                    </div>

                    {/* Asset 3: Audio & Music */}
                    <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                            AUDIO
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">SYNCED</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                          Music &amp; Sound Mix
                        </h4>
                        <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                          Dialogue leveling, background music balance, and SFX conform.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-600">Active</span>
                        <span className="text-xs text-[#86868B]">In Timeline</span>
                      </div>
                    </div>

                    {/* Asset 4: Color Look */}
                    <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                            COLOR LOOK
                          </span>
                          <span className="text-[11px] text-[#86868B] font-mono">REC.709</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                          Cinematic Color Grade
                        </h4>
                        <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                          Camera color science, skin tone conform, and stylized finish.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#86868B]">Studio Grade</span>
                        <span className="text-xs text-emerald-600 font-semibold">Conformed</span>
                      </div>
                    </div>
                  </div>

                  {/* CALL-TO-ACTION APPROVAL GATE */}
                  <div className="bg-[#1D1D1F] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider">
                          APPROVAL &amp; FINAL DELIVERY
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        {isApproved ? 'Video Approved! Ready for Final Use' : 'Ready to approve this video?'}
                      </h3>
                      <p className="text-xs text-[#86868B] max-w-2xl leading-relaxed">
                        {isApproved
                          ? 'This cut has been confirmed. Your editor and studio team have received milestone sign-off.'
                          : 'Approving this video confirms your satisfaction. If you need any tweaks or edits first, use the timeline notes form above, then click "Request Changes" to alert your editor.'}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                      {!isApproved ? (
                        <>
                          <button
                            type="button"
                            onClick={handleRequestRevision}
                            className="text-xs font-semibold px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-center cursor-pointer"
                          >
                            {currentRound < includedRounds
                              ? `Request Changes (Round ${currentRound + 1})`
                              : 'Request Extra Changes (+₹1,500)'}
                          </button>
                          <button
                            type="button"
                            onClick={handleApproveCut}
                            disabled={isApproving}
                            className="text-xs font-semibold px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <span>{isApproving ? 'Approving...' : '✓ I Like It! Approve Video Cut'}</span>
                          </button>
                        </>
                      ) : (
                        project.deliverableUrl && (
                          <a
                            href={project.deliverableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <span>Open Final Master Link</span>
                            <span>↗</span>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Refund Policy Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                  SATISFACTION GUARANTEE
                </span>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] mt-0.5">
                  Refund &amp; Cancellation Policy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#86868B]">
              <p>Under Artsy Production&apos;s 3-Tier Policy, you are entitled to full review oversight. If the draft cut does not meet the confirmed project brief, our studio supervisor will personally arbitrate.</p>
            </div>

            <form onSubmit={handleSubmitRefundDispute} className="space-y-3">
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Describe why this edit did not meet your requirements..."
                className="w-full bg-[#F5F5F7] p-3 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer"
                >
                  Submit Dispute to Studio Lead
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ORDER MODAL */}
      {showChangeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-4">
            <h3 className="text-lg font-extrabold text-[#1D1D1F]">
              Unlock Extra Revision Pass
            </h3>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Your free included revision round has been completed. You can easily add an extra full revision pass with your editor for ₹1,500.
            </p>

            <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Extra Pass:</span>
                <span>Revision Round {currentRound + 1}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Turnaround Time:</span>
                <span>Within 48 Hours</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#1D1D1F] pt-2 border-t border-[#E5E5E7]">
                <span>Amount:</span>
                <span className="font-mono text-[#3B82F6]">₹1,500</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleApproveChangeOrder}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                Add Revision Round (₹1,500)
              </button>
              <button
                type="button"
                onClick={() => setShowChangeOrderModal(false)}
                className="px-4 bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDIO ONBOARDING & PREFERENCES MODAL */}
      {showStudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 border border-[#E5E5E7] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#F5F5F7] pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#3B82F6] tracking-wider">
                  Client Station Preferences
                </span>
                <h3 className="text-xl font-extrabold text-[#1D1D1F] mt-1 tracking-tight">
                  Studio Workspace &amp; Ingest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStudioModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {studioSavedNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>✓</span>
                <span>Studio preferences saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveStudioProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Studio / Brand Moniker
                </label>
                <input
                  type="text"
                  required
                  value={studioProfile.studioName}
                  onChange={(e) => setStudioProfile({ ...studioProfile, studioName: e.target.value })}
                  className="w-full bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all font-semibold"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
                >
                  Save Studio Preferences
                </button>
                <button
                  type="button"
                  onClick={() => setShowStudioModal(false)}
                  className="px-5 bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
