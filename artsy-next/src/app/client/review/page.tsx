'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import ClientSidebar from '../components/ClientSidebar';
import ClientHeader from '../components/ClientHeader';
import { createChangeOrder } from '@/lib/changeOrders/engine';
import { logRefundRequest, logRevisionRequest, logFinalApproval } from '@/lib/activity/logger';

interface RevisionItem {
  id: string;
  timecode: string;
  tag: string;
  tagBg: string;
  author: string;
  timeAgo: string;
  text: string;
  status: string;
  statusColor: string;
}

export default function ClientReviewPage() {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimecode, setCurrentTimecode] = useState('00:00:00');
  const [activeCategory, setActiveCategory] = useState('COLOR');
  const [noteText, setNoteText] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [includedRounds, setIncludedRounds] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);
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

  useEffect(() => {
    async function checkProjects() {
      try {
        const res = await fetch('/api/client/projects');
        const data = await res.json();
        setHasProjects(Boolean(data.projects && data.projects.length > 0));
      } catch {
        setHasProjects(false);
      }
    }
    checkProjects();
  }, []);

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
  const [refundReason, setRefundReason] = useState('');
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

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
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        noteTextareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Timecode increments while playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTimecode((prev) => {
        const parts = prev.split(':').map(Number);
        let [h, m, s] = parts;
        s += 1;
        if (s >= 60) {
          s = 0;
          m += 1;
        }
        if (m >= 60) {
          m = 0;
          h += 1;
        }
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const [revisions, setRevisions] = useState<RevisionItem[]>([]);

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newRev: RevisionItem = {
      id: String(Date.now()),
      timecode: currentTimecode,
      tag: activeCategory,
      tagBg: activeCategory === 'COLOR' ? 'bg-[#3B82F6]' : activeCategory === 'AUDIO' ? 'bg-[#1D1D1F]' : 'bg-emerald-600',
      author: user?.full_name ? `${user.full_name} (YOU)` : 'CLIENT (YOU)',
      timeAgo: 'Just now',
      text: noteText,
      status: 'Queued for editor',
      statusColor: 'text-[#3B82F6]'
    };

    setRevisions((prev) => [newRev, ...prev]);
    setNoteText('');
    alert(`Note saved at ${currentTimecode}! Your editor can see this timestamped note.`);
  };

  const handleApproveCut = () => {
    setIsApproved(true);
    // Master Plan v2.1 Rule: Retention triggers strictly upon project approval
    logFinalApproval('AP-8841', user?.id || 'client');
    fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: user?.phone || '',
        eventType: 'MILESTONE_COMPLETED',
        projectId: 'AP-8841',
      }),
    }).catch(() => {});
    alert(
      'VIDEO APPROVED!\n• Your final unwatermarked 4K video is ready.\n• You can download your finished videos from the Final Downloads page.\n• Stored files will be kept for 30 days.'
    );
  };

  const handleRequestRevision = () => {
    if (currentRound < includedRounds) {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      logRevisionRequest('AP-8841', user?.id || 'client', nextRound, 'Client requested retake revisions');
      fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user?.phone || '',
          message: `🎬 Artsy Revision Alert: Client requested Revision Round ${nextRound} on Project #AP-8841.`,
          projectId: 'AP-8841',
        }),
      }).catch(() => {});
      alert(`Revision Round ${nextRound} requested! Your editor has been notified and will share an updated video within 48 hours.`);
    } else {
      setShowChangeOrderModal(true);
    }
  };

  const handleApproveChangeOrder = () => {
    createChangeOrder({
      projectId: 'AP-8841',
      orderId: 'ORD-8841',
      changeType: 'extra_revisions',
      description: 'Additional Creative Revision Round 3 (Beyond included 2 rounds)',
      originalScope: { includedRounds: 2 },
      requestedScope: { includedRounds: 3 },
      additionalPricePaise: 150000,
      createdBy: 'client'
    });

    setIncludedRounds((prev) => prev + 1);
    setCurrentRound((prev) => prev + 1);
    setShowChangeOrderModal(false);
    alert('Extra revision approved: ₹1,500 added. Revision Round 3 unlocked!');
  };

  const handleSubmitRefundDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      alert('Please describe your concern or reason.');
      return;
    }
    logRefundRequest('AP-8841', user?.id || 'client', 800000, refundReason);
    setShowRefundModal(false);
    alert('Request submitted: Our support team will review your project and get back to you within 24 hours.');
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      {/* Unified Client Production Header */}
      <ClientHeader />

      {/* Main Layout Container */}
      <div className="flex w-full max-w-full overflow-x-hidden">
        {/* Left Sidebar: Unified Client Station Sidebar */}
        <ClientSidebar />

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 bg-[#F5F5F7] min-h-screen">
          {hasProjects === false ? (
            <div className="p-6 md:p-8 max-w-4xl mx-auto pt-16">
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8 space-y-3">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="text-lg font-semibold text-[#1D1D1F]">No video drafts to review yet</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                  When your video editor uploads a draft for you, it will appear here so you can watch it, pause, and leave exact notes.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-sm"
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#86868B]">Order #AP-8841</span>
                      <span className="text-xs text-[#86868B]">•</span>
                      <span className="text-xs font-semibold text-[#3B82F6]">Draft v1.2</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-[-0.03em] leading-tight">
                      Udaipur Palace Royal Wedding Highlight (4K DCI)
                    </h1>
                  </div>

                  {/* Quick Metrics */}
                  <div className="flex items-stretch gap-3 self-start xl:self-auto">
                    <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] min-w-[130px]">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Turnaround</div>
                      <div className="text-xl font-extrabold text-[#1D1D1F] mt-1">48 Hours</div>
                      <div className="text-[10px] text-[#86868B] mt-0.5">For revision updates</div>
                    </div>
                    <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] min-w-[130px]">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Revisions</div>
                      <div className="text-xl font-extrabold text-[#3B82F6] mt-1">Round {currentRound} of {includedRounds}</div>
                      <div className="text-[10px] text-[#86868B] mt-0.5">{currentRound <= includedRounds ? 'Free revision included' : 'Extra revision requested'}</div>
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
                      <div className="text-xs font-semibold text-[#1D1D1F]">In Progress ✓</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>

                  <div className="p-3.5 bg-[#3B82F6]/10 rounded-xl border border-[#3B82F6]/30 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#3B82F6]">3. Client Review</div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Reviewing Draft</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-ping"></span>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#F5F5F7] border-[#E5E5E7] text-[#86868B]'}`}>
                    <div>
                      <div className="text-[10px] uppercase font-bold">4. Final 4K Download</div>
                      <div className="text-xs font-semibold">{isApproved ? 'Ready' : 'Locks after approval'}</div>
                    </div>
                    <span>{isApproved ? '✓' : '🔒'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* MAIN WORKSPACE */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT 8 COLS: VIDEO PLAYER & CONTROLS */}
                <div className="lg:col-span-8 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div>
                    {/* Player Header Bar */}
                    <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-[#F5F5F7]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-[#1D1D1F]">Video Preview Player</span>
                      </div>
                      <span className="text-xs text-[#86868B]">Press Space to play/pause</span>
                    </div>

                    {/* 16:9 Cinema Container */}
                    <div className="relative w-full aspect-video bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-lg group flex items-center justify-center">
                      {/* Ambient Background */}
                      <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center relative">
                        {/* Center Watermark Layer */}
                        {!isApproved && (
                          <div className="bg-black/70 text-white/90 text-sm md:text-base uppercase font-bold px-6 py-2 rounded-full border border-white/20 tracking-wider select-none z-10 backdrop-blur-xs">
                            ARTSY DRAFT PREVIEW // AP-8841
                          </div>
                        )}
                        {isApproved && (
                          <div className="bg-[#3B82F6] text-white text-sm md:text-base uppercase font-bold px-6 py-2 rounded-full tracking-wider select-none z-10 shadow-lg animate-bounce">
                            VIDEO APPROVED ✓
                          </div>
                        )}
                      </div>

                      {/* Draft Protection Watermarks */}
                      {!isApproved && (
                        <>
                          {/* Top-right: Date */}
                          <div className="absolute top-4 right-4 bg-black/80 text-white/90 text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-mono border border-white/15 backdrop-blur-xs z-20 pointer-events-none">
                            {new Date().toISOString().replace('T', ' ').substring(0, 19)}
                          </div>

                          {/* Bottom-left: Assigned Editor */}
                          <div className="absolute bottom-4 left-4 bg-black/80 text-white/90 text-[10px] sm:text-xs px-2.5 py-1 rounded-md font-mono border border-white/15 backdrop-blur-xs z-20 pointer-events-none">
                            Editor: Aarav S.
                          </div>

                          {/* Bottom-right: Watermark badge */}
                          <div className="absolute bottom-4 right-4 bg-black/90 text-amber-300 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-md tracking-wider border border-amber-400/40 backdrop-blur-xs z-20 pointer-events-none shadow-md">
                            DRAFT — Artsy Production
                          </div>
                        </>
                      )}

                      {/* Frame Hover Indicator */}
                      <div className="absolute top-4 left-4 bg-black/80 text-white text-xs px-3 py-1 rounded-full font-mono flex items-center gap-2 backdrop-blur-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>{currentTimecode}</span>
                      </div>

                      {/* Corner Guides */}
                      <div className="absolute inset-6 border border-white/10 rounded-xl pointer-events-none flex flex-col justify-between">
                        <div className="flex justify-between text-[10px] text-white/40 p-2 font-mono">
                          <span>Preview Guide</span>
                          <span>16:9 Screen</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-white/40 p-2 font-mono">
                          <span>4K Draft</span>
                          <span>Stereo Audio</span>
                        </div>
                      </div>
                    </div>

                    {/* TIMELINE & SCRUBBER MODULE */}
                    <div className="mt-5 bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7] space-y-3">
                      {/* Simulated Waveform Bars */}
                      <div className="relative h-8 w-full bg-white rounded-lg border border-[#E5E5E7] flex items-end gap-[2px] p-1 overflow-hidden">
                        {Array.from({ length: 60 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-t-sm transition-all ${
                              i === 18 || i === 36
                                ? 'bg-[#3B82F6] h-6'
                                : i === 25 || i === 48
                                ? 'bg-[#1D1D1F] h-5'
                                : i % 2 === 0
                                ? 'bg-[#E5E5E7] h-3'
                                : 'bg-[#DCDFE3] h-4'
                            }`}
                          ></div>
                        ))}

                        {/* Playhead Line */}
                        <div className="absolute top-0 bottom-0 left-[60%] w-[2px] bg-[#3B82F6] z-20">
                          <div className="w-2 h-2 rounded-full bg-[#3B82F6] -ml-[3px] -top-0.5 absolute"></div>
                        </div>

                        {/* Comment Markers */}
                        <div
                          className="absolute bottom-1 left-[27%] cursor-pointer z-10"
                          title="Jump to note at 01:14:02"
                          onClick={() => setCurrentTimecode('01:14:02')}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#3B82F6] flex items-center justify-center text-[8px] text-white font-bold">
                            1
                          </div>
                        </div>
                        <div
                          className="absolute bottom-1 left-[55%] cursor-pointer z-10"
                          title="Jump to note at 02:30:10"
                          onClick={() => setCurrentTimecode('02:30:10')}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#1D1D1F] flex items-center justify-center text-[8px] text-white font-bold">
                            2
                          </div>
                        </div>
                      </div>

                      {/* Interactive Playbar */}
                      <div
                        className="relative w-full h-2 bg-[#E5E5E7] rounded-full cursor-pointer overflow-hidden"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const ratio = (e.clientX - rect.left) / rect.width;
                          const seconds = Math.floor(ratio * 272);
                          const m = String(Math.floor(seconds / 60)).padStart(2, '0');
                          const s = String(seconds % 60).padStart(2, '0');
                          setCurrentTimecode(`02:${m}:${s}`);
                        }}
                      >
                        <div className="h-full bg-[#3B82F6] rounded-full w-[60%]"></div>
                      </div>

                      {/* Controller Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        {/* Left: Play, Step */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center hover:bg-black transition-all cursor-pointer text-xs font-bold"
                          >
                            {isPlaying ? '❚❚' : '▶'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentTimecode('01:14:02')}
                            className="w-9 h-9 rounded-xl bg-white text-[#1D1D1F] border border-[#E5E5E7] flex items-center justify-center hover:bg-[#F5F5F7] transition-all cursor-pointer text-xs"
                            title="Jump to note 1"
                          >
                            ⏮
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentTimecode('02:30:10')}
                            className="w-9 h-9 rounded-xl bg-white text-[#1D1D1F] border border-[#E5E5E7] flex items-center justify-center hover:bg-[#F5F5F7] transition-all cursor-pointer text-xs"
                            title="Jump to note 2"
                          >
                            ⏭
                          </button>
                        </div>

                        {/* Timecode Display */}
                        <div className="px-3.5 py-1.5 bg-white rounded-lg border border-[#E5E5E7] font-mono text-xs font-bold text-[#1D1D1F]">
                          <span id="active-timecode-display" className="text-[#3B82F6]">{currentTimecode}</span> / 04:32:00
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-2">
                          <select className="text-xs bg-white rounded-lg border border-[#E5E5E7] px-2.5 py-1.5 font-semibold cursor-pointer outline-none">
                            <option>High Quality (4K)</option>
                            <option>Standard (1080p)</option>
                          </select>
                          <span className="px-2.5 py-1.5 bg-white rounded-lg border border-[#E5E5E7] text-xs font-semibold">
                            1.0x
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hotkeys */}
                  <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex flex-wrap items-center justify-between gap-2 text-xs text-[#86868B]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1D1D1F]">Shortcuts:</span>
                      <span className="px-2 py-0.5 bg-[#F5F5F7] rounded-md border border-[#E5E5E7]">Space: Play/Pause</span>
                      <span className="px-2 py-0.5 bg-[#F5F5F7] rounded-md border border-[#E5E5E7]">M: Type Note</span>
                    </div>
                    <div>Color Tone Applied</div>
                  </div>
                </div>

                {/* RIGHT 4 COLS: NOTES & FEEDBACK */}
                <div className="lg:col-span-4 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F7]">
                      <h2 className="text-base font-bold text-[#1D1D1F]">Notes &amp; Feedback</h2>
                      <span className="px-2.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold rounded-full">
                        {revisions.length} {revisions.length === 1 ? 'Note' : 'Notes'}
                      </span>
                    </div>

                    {/* REVISION LIST */}
                    <div className="mt-4 space-y-3 overflow-y-auto max-h-[400px] pr-1">
                      {revisions.length === 0 ? (
                        <div className="text-center py-8 text-xs text-[#86868B] bg-[#F5F5F7] rounded-xl border border-dashed border-[#E5E5E7] p-4">
                          No notes added yet. Pause the video at any time to leave a note for your editor.
                        </div>
                      ) : (
                        revisions.map((rev) => (
                          <div
                            key={rev.id}
                            className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] hover:border-[#3B82F6]/40 transition-colors"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E5E7]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-mono font-bold text-white px-2 py-0.5 rounded-md bg-[#1D1D1F]">
                                  @ {rev.timecode}
                                </span>
                                <span className="text-[11px] font-semibold px-2 py-0.5 bg-white rounded-md border border-[#E5E5E7] text-[#1D1D1F]">
                                  {rev.tag}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#86868B]">
                                {rev.author} • {rev.timeAgo}
                              </span>
                            </div>
                            <p className="text-xs text-[#1D1D1F] leading-relaxed">&ldquo;{rev.text}&rdquo;</p>
                            <div className="mt-3 pt-2 border-t border-[#E5E5E7] flex items-center justify-between">
                              <span className={`text-[11px] font-semibold ${rev.statusColor}`}>
                                {rev.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => setCurrentTimecode(rev.timecode)}
                                className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                              >
                                Jump to this time →
                              </button>
                            </div>
                          </div>
                        ))
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
                        {currentTimecode}
                      </span>
                    </div>

                    {/* Category Matrix */}
                    <div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { key: 'COLOR', label: '🎨 Color' },
                          { key: 'AUDIO', label: '🔊 Audio' },
                          { key: 'PACING', label: '⏱ Pacing' },
                          { key: 'TYPO', label: '✏️ Titles' },
                        ].map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setActiveCategory(cat.key)}
                            className={`py-1.5 text-center text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
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
                        placeholder="Write your note for this timestamp... (e.g., Brighten this scene, lower music volume)"
                        className="w-full bg-white rounded-lg border border-[#E5E5E7] p-2.5 text-xs text-[#1D1D1F] focus:border-[#3B82F6] outline-none resize-none"
                      ></textarea>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        Save Note at {currentTimecode}
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
                  {/* Asset 1 */}
                  <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md">
                          DRAFT PREVIEW
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">1.42 GB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        Draft Video v1.2
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        Watermarked video draft to review scenes and pacing with your team.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600">Ready</span>
                      <button
                        type="button"
                        onClick={() => alert('Downloading Draft Video v1.2 (.mp4)...')}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                      >
                        Download ↓
                      </button>
                    </div>
                  </div>

                  {/* Asset 2 */}
                  <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#1D1D1F] text-white rounded-md">
                          RAW FOOTAGE
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">840 GB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        Camera Raw Files
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        Original high-resolution camera footage backed up in secure cloud storage.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#86868B]">Cloud Storage</span>
                      <button
                        type="button"
                        onClick={() => alert('Connecting to secure cloud storage...')}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                      >
                        View Files ↗
                      </button>
                    </div>
                  </div>

                  {/* Asset 3 */}
                  <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                          AUDIO
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">4.8 GB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        Music &amp; Audio Tracks
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        Separate audio files for background music, dialogue, and sound effects.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600">Synced</span>
                      <button
                        type="button"
                        onClick={() => alert('Downloading audio tracks pack...')}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                      >
                        Download ↓
                      </button>
                    </div>
                  </div>

                  {/* Asset 4 */}
                  <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                          COLOR LOOK
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">12 MB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        Color Grading Preset
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        Color look and warm tone presets applied to this video edit.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#86868B]">Custom Look</span>
                      <button
                        type="button"
                        onClick={() => alert('Downloading color preset...')}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                      >
                        Download ↓
                      </button>
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
                      Ready to approve this video?
                    </h3>
                    <p className="text-xs text-[#86868B] max-w-2xl leading-relaxed">
                      Approving this video will finish your project and generate your final, unwatermarked 4K video for download. If you need tweaks first, click Request Changes to notify your editor.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleRequestRevision}
                      className="text-xs font-semibold px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-center cursor-pointer"
                    >
                      {currentRound < includedRounds ? `Request Changes (Round ${currentRound + 1})` : 'Request Extra Changes (+₹1,500)'}
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveCut}
                      className="text-xs font-semibold px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>Approve Video &amp; Get 4K Download</span>
                      <span>✓</span>
                    </button>
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

            {/* 3-Tier Policy */}
            <div className="space-y-3">
              <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                  <span>Before editing starts</span>
                  <span className="text-emerald-600 font-mono">100% Full Refund</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">Before footage is downloaded or work has begun.</p>
              </div>

              <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                  <span>During early editing</span>
                  <span className="text-amber-600 font-mono">50% Partial Refund</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">Footage has been downloaded and initial cuts assembled.</p>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                  <span>After draft is shared (Current Stage)</span>
                  <span className="text-blue-600 font-mono">Support Review</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">Draft v1.2 has been delivered. If unsatisfied, our team will review and resolve within 24 hours.</p>
              </div>
            </div>

            {/* Refund Dispute Form */}
            <form onSubmit={handleSubmitRefundDispute} className="space-y-3 pt-3 border-t border-[#E5E5E7]">
              <label className="block text-xs font-bold text-[#1D1D1F]">
                Tell us what went wrong:
              </label>
              <textarea
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Explain any creative or delivery concerns..."
                className="w-full text-xs p-3 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-[#1D1D1F] outline-none focus:bg-white focus:border-[#3B82F6]"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#1D1D1F] hover:bg-red-600 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Submit for Support Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Revisions Modal */}
      {showChangeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                  ADDITIONAL ROUND
                </span>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] mt-0.5">
                  Request Extra Revision
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangeOrderModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#86868B] leading-relaxed">
              Your free included revision round has been completed. You can easily add an extra full revision pass with your editor for ₹1,500.
            </p>

            <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Extra Pass:</span>
                <span>Revision Round 3</span>
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
                <p className="text-xs text-[#86868B] mt-0.5">
                  Configure default cloud storage, billing identity, and creative LUT kit.
                </p>
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
                  placeholder="e.g. S. Kapoor Studios"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                    Legal Entity Name
                  </label>
                  <input
                    type="text"
                    value={studioProfile.legalName}
                    onChange={(e) => setStudioProfile({ ...studioProfile, legalName: e.target.value })}
                    className="w-full bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    placeholder="Registered Company Name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                    GSTIN (Tax Invoices)
                  </label>
                  <input
                    type="text"
                    value={studioProfile.gstin}
                    onChange={(e) => setStudioProfile({ ...studioProfile, gstin: e.target.value })}
                    className="w-full bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] font-mono rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                    placeholder="07AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Default Cloud Raw Ingest Link
                </label>
                <input
                  type="url"
                  value={studioProfile.ingestLink}
                  onChange={(e) => setStudioProfile({ ...studioProfile, ingestLink: e.target.value })}
                  className="w-full bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                  placeholder="https://drive.google.com/... or Backblaze / Dropbox"
                />
                <span className="text-[10px] text-[#86868B]">
                  Preferred ingest pipe: Google Drive, Backblaze B2, Frame.io, or Dropbox
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Brand Color &amp; LUT Guidelines
                </label>
                <textarea
                  rows={2}
                  value={studioProfile.brandLuts}
                  onChange={(e) => setStudioProfile({ ...studioProfile, brandLuts: e.target.value })}
                  className="w-full bg-[#F5F5F7] p-3 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all resize-none"
                  placeholder="e.g. Kodak 2383 emulation, warm golden skin tones, avoid over-saturated greens"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Reviewer Collaborator Emails
                </label>
                <input
                  type="text"
                  value={studioProfile.collaborators}
                  onChange={(e) => setStudioProfile({ ...studioProfile, collaborators: e.target.value })}
                  className="w-full bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                  placeholder="director@studio.in, producer@studio.in"
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
