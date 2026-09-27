'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth, logout } from '@/lib/auth';
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
  const { user, role } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimecode, setCurrentTimecode] = useState('02:44:18');
  const [activeCategory, setActiveCategory] = useState('COLOR');
  const [noteText, setNoteText] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [includedRounds, setIncludedRounds] = useState(1);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [studioProfile, setStudioProfile] = useState({
    studioName: 'S. Kapoor Studios',
    legalName: 'S. Kapoor Studios Private Limited',
    gstin: '07AAAAA0000A1Z5',
    ingestProvider: 'Google Drive Enterprise',
    ingestLink: 'https://drive.google.com/drive/folders/artsy-raw-ingest-8841',
    brandLuts: 'Kodak 2383 Film Print Emulation, Warm Sangeet Tones',
    collaborators: 'director@kapoorstudios.in, producer@kapoorstudios.in',
  });
  const [studioSavedNotice, setStudioSavedNotice] = useState(false);

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
  const [refundRequested, setRefundRequested] = useState(false);
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

  const [revisions, setRevisions] = useState<RevisionItem[]>([
    {
      id: '1',
      timecode: '01:14:02',
      tag: 'COLOR',
      tagBg: 'bg-[#3B82F6]',
      author: 'DIRECTOR',
      timeAgo: '3h ago',
      text: 'Ease the speed ramp into the sangeet entry and warm up skin tones. Midtones look slightly green under the palace lamps.',
      status: 'IN PROGRESS BY COLORIST',
      statusColor: 'text-[#3B82F6]'
    },
    {
      id: '2',
      timecode: '02:30:10',
      tag: 'AUDIO',
      tagBg: 'bg-[#1D1D1F]',
      author: 'PRODUCER',
      timeAgo: '1h ago',
      text: 'Swap background foley to license track variant B. Sitar crescendo clashes with the officiant vows.',
      status: 'PENDING REVIEW',
      statusColor: 'text-[#86868B]'
    }
  ]);

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
      status: 'QUEUED FOR REVISION PASS',
      statusColor: 'text-[#3B82F6]'
    };

    setRevisions((prev) => [newRev, ...prev]);
    setNoteText('');
    alert(`TIMECODE ANNOTATION LOGGED @ ${currentTimecode}. Persisted to Master Cut EDL.`);
  };

  const handleApproveCut = () => {
    setIsApproved(true);
    // Master Plan v2.1 Rule: Retention triggers strictly upon project approval
    logFinalApproval('AP-8841', user?.id || 'client');
    alert(
      'FINAL ACCEPTANCE GATE UNLOCKED:\n• Master 4K DCI cloud archive is decrypting.\n• Raw footage 15-day retention countdown started.\n• Master delivery 30-day retention countdown started.\n• Unwatermarked deliverables dispatched to Backblaze B2 vault.'
    );
  };

  const handleRequestRevision = () => {
    if (currentRound < includedRounds) {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      logRevisionRequest('AP-8841', user?.id || 'client', nextRound, 'Client requested retake revisions');
      alert(`REVISION PASS ROUND ${nextRound} INITIATED: Notified assigned colorist & editor. 48h turnaround timer started.`);
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
    alert('CHANGE ORDER APPROVED: ₹1,500 added to escrow. Revision Round 3 unlocked for editorial slate.');
  };

  const handleSubmitRefundDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      alert('Please describe the reason for your refund dispute.');
      return;
    }
    logRefundRequest('AP-8841', user?.id || 'client', 800000, refundReason);
    setRefundRequested(true);
    setShowRefundModal(false);
    alert('REFUND DISPUTE FILED: Studio Administration will review activity logs, footage import timestamps, and creative drafts within 24 hours.');
  };

  const clientName = user?.full_name || 'Sneha Patel';
  const clientInitials = clientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SP';

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      {/* Sleek Dark Tech Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0A] border-b border-[#262626]">
        <div className="h-16 w-full px-6 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex flex-col select-none group">
              <span className="font-extrabold text-[15px] leading-tight tracking-[0.18em] text-white group-hover:text-blue-400 transition-colors uppercase">
                ARTSY
              </span>
              <span className="font-mono text-[7.5px] leading-none tracking-[0.24em] text-[#86868B] uppercase">
                PLACE FOR PERSPECTIVE
              </span>
            </Link>
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#86868B] border-l border-[#262626] pl-6 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FRAME-ACCURATE REVIEW SUITE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Public Site
            </Link>
            <Link
              href="/book"
              className="text-xs font-semibold uppercase px-3.5 py-1.5 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
            >
              Book Cut
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs font-semibold uppercase px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
            <div className="pl-2 border-l border-white/10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs">
                {clientInitials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex pt-16 w-full max-w-full overflow-x-hidden">
        {/* Left Sidebar: Client Station Control (w-72 fixed on desktop) */}
        <aside className="hidden lg:flex w-72 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-[#E5E5E7] z-40 p-6 flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <div>
              <div className="text-sm font-bold text-[#1D1D1F]">{clientName}</div>
              <span className="inline-block mt-1 text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded">
                Verified Producer
              </span>
            </div>

            <nav className="flex flex-col space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#3B82F6] px-3 pt-2">
                Active Projects
              </div>
              <Link
                href="/client/review"
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] transition-colors"
              >
                Timestamped Review
              </Link>
              <Link
                href="/book"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Book New Project
              </Link>
              <Link
                href="/services"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Explore Creative Catalog
              </Link>

              <div className="text-[10px] uppercase font-bold text-[#86868B] px-3 pt-5">
                Vault &amp; Billing
              </div>
              <div
                onClick={() => alert(`ARCHIVES: 1 Completed Master Project on file for ${clientName}.`)}
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
              >
                Completed Masters
              </div>
              <div
                onClick={() => alert('TAX INVOICES: Escrow release records and GST receipts are current.')}
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
              >
                Tax Invoices &amp; Escrow
              </div>

              <div className="text-[10px] uppercase font-bold text-[#86868B] px-3 pt-5">
                Studio Setup
              </div>
              <button
                type="button"
                onClick={() => setShowStudioModal(true)}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Studio &amp; Ingest</span>
                <span className="text-[9px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-1.5 py-0.5 rounded">Setup</span>
              </button>
            </nav>
          </div>

          <div className="pt-4 border-t border-[#F5F5F7]">
            <button
              type="button"
              onClick={() => logout()}
              className="w-full text-center py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 bg-[#F5F5F7] min-h-screen">
          <div className="flex flex-col w-full max-w-full overflow-x-hidden">
            
            {/* ORDER BANNER / METADATA PLATE */}
            <section className="p-6 md:p-8 pb-0 max-w-7xl w-full">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col xl:flex-row xl:items-stretch justify-between gap-6">
                  {/* Title & Details */}
                  <div className="space-y-3 flex-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-[-0.03em] leading-tight">
                      Udaipur Palace Royal Wedding Highlight (4K DCI)
                    </h1>
                    <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                      Source Material: RED Monstro 8K VV + Sony FX9 Multi-cam Ingest // Deliverable: Master 4K DCI + Social 9:16 Cuts
                    </p>
                  </div>

                  {/* Quick Metrics Slate */}
                  <div className="flex items-stretch gap-3 self-start xl:self-auto">
                    <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] min-w-[130px]">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">SLA Retention</div>
                      <div className="text-xl font-extrabold text-[#1D1D1F] mt-1">48h 00m</div>
                      <div className="text-[10px] text-[#86868B] mt-0.5">Masters: 30D</div>
                    </div>
                    <div className="bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5E7] min-w-[130px]">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Revision Count</div>
                      <div className="text-xl font-extrabold text-[#3B82F6] mt-1">Round {currentRound}/{includedRounds}</div>
                      <div className="text-[10px] text-[#86868B] mt-0.5">{currentRound <= includedRounds ? 'Complimentary Pass' : 'Change Order Active'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRefundModal(true)}
                      className="bg-[#F5F5F7] hover:bg-slate-200 p-4 rounded-xl border border-[#E5E5E7] min-w-[140px] text-left transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Escrow &amp; Refund</div>
                      <div className="text-xs font-bold text-[#1D1D1F] mt-1">
                        {refundRequested ? 'Dispute Under Review' : 'Tier 3 Active'}
                      </div>
                      <div className="text-[10px] text-[#3B82F6] mt-0.5">Inspect Policy →</div>
                    </button>
                  </div>
                </div>

                {/* PIPELINE STEPPER */}
                <div className="mt-6 pt-6 border-t border-[#F5F5F7] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Raw Upload</div>
                      <div className="text-xs font-semibold text-[#1D1D1F]">Completed ✓</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>

                  <div className="p-3.5 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Ingest &amp; Sync</div>
                      <div className="text-xs font-semibold text-[#1D1D1F]">Completed ✓</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>

                  <div className="p-3.5 bg-[#3B82F6]/10 rounded-xl border border-[#3B82F6]/30 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#3B82F6]">Client Review</div>
                      <div className="text-xs font-bold text-[#1D1D1F]">Active Gate</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-ping"></span>
                  </div>

                  <div className={`p-3.5 rounded-xl border flex items-center justify-between ${isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-[#F5F5F7] border-[#E5E5E7] text-[#86868B]'}`}>
                    <div>
                      <div className="text-[10px] uppercase font-bold">Master Export</div>
                      <div className="text-xs font-semibold">{isApproved ? 'Unlocked' : 'Locked'}</div>
                    </div>
                    <span>{isApproved ? '✓' : '🔒'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* MAIN WORKSPACE */}
            <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT 8 COLS: CINEMATIC PLAYER & SCRUBBER MATRIX */}
                <div className="lg:col-span-8 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div>
                    {/* Player Header Bar */}
                    <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-[#F5F5F7]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-xs font-bold text-[#1D1D1F]">Stream Monitor (4K Cloud Cache)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-[#86868B]">
                        <span>48.2 Mbps</span>
                        <span>•</span>
                        <span>24.00 FPS</span>
                        <span>•</span>
                        <span>Rec.709-A</span>
                      </div>
                    </div>

                    {/* 16:9 Cinema Container */}
                    <div className="relative w-full aspect-video bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-lg group flex items-center justify-center">
                      {/* Subtle Ambient Background */}
                      <div className="w-full h-full bg-gradient-to-tr from-[#111111] via-[#1a1a1a] to-[#0d0d0d] flex items-center justify-center relative">
                        {/* Center Watermark Layer */}
                        {!isApproved && (
                          <div className="bg-black/70 text-white/90 text-sm md:text-base uppercase font-bold px-6 py-2 rounded-full border border-white/20 tracking-wider select-none z-10 backdrop-blur-xs">
                            ARTSY STUDIO REVIEW // DRAFT AP-8841
                          </div>
                        )}
                        {isApproved && (
                          <div className="bg-[#3B82F6] text-white text-sm md:text-base uppercase font-bold px-6 py-2 rounded-full tracking-wider select-none z-10 shadow-lg animate-bounce">
                            MASTER CUT APPROVED // UNWATERMARKED
                          </div>
                        )}
                      </div>

                      {/* Frame Hover Indicator */}
                      <div className="absolute top-4 left-4 bg-black/80 text-white text-xs px-3 py-1 rounded-full font-mono flex items-center gap-2 backdrop-blur-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>{currentTimecode}:14</span>
                      </div>

                      {/* Corner Guides */}
                      <div className="absolute inset-6 border border-white/10 rounded-xl pointer-events-none flex flex-col justify-between">
                        <div className="flex justify-between text-[10px] text-white/40 p-2 font-mono">
                          <span>90% TITLE SAFE</span>
                          <span>16:9 DCI</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-white/40 p-2 font-mono">
                          <span>STUDIO 4K PROXY</span>
                          <span>CH 1/2 STEREO</span>
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
                          title="Comment at 01:14:02"
                          onClick={() => setCurrentTimecode('01:14:02')}
                        >
                          <div className="w-3 h-3 rounded-full bg-[#3B82F6] flex items-center justify-center text-[8px] text-white font-bold">
                            1
                          </div>
                        </div>
                        <div
                          className="absolute bottom-1 left-[55%] cursor-pointer z-10"
                          title="Comment at 02:30:10"
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
                            title="Jump to Rev 1"
                          >
                            ⏮
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentTimecode('02:30:10')}
                            className="w-9 h-9 rounded-xl bg-white text-[#1D1D1F] border border-[#E5E5E7] flex items-center justify-center hover:bg-[#F5F5F7] transition-all cursor-pointer text-xs"
                            title="Jump to Rev 2"
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
                            <option>4K Studio Proxy</option>
                            <option>1080p Lightweight</option>
                            <option>4K Master H.265</option>
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
                      <span className="font-semibold text-[#1D1D1F]">Hotkeys:</span>
                      <span className="px-2 py-0.5 bg-[#F5F5F7] rounded-md border border-[#E5E5E7]">Space: Play/Pause</span>
                      <span className="px-2 py-0.5 bg-[#F5F5F7] rounded-md border border-[#E5E5E7]">M: Add Note</span>
                      <span className="px-2 py-0.5 bg-[#F5F5F7] rounded-md border border-[#E5E5E7]">J-K-L: Shuttle</span>
                    </div>
                    <div>DaVinci Rec.709 LUT Applied</div>
                  </div>
                </div>

                {/* RIGHT 4 COLS: REVISION FEED & ANNOTATION TOOLSET */}
                <div className="lg:col-span-4 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F7]">
                      <h2 className="text-base font-bold text-[#1D1D1F]">Revision Feed</h2>
                      <span className="px-2.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold rounded-full">
                        {revisions.length} Logged
                      </span>
                    </div>

                    {/* REVISION LIST */}
                    <div className="mt-4 space-y-3 overflow-y-auto max-h-[400px] pr-1">
                      {revisions.map((rev) => (
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
                              Jump to Frame →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* NEW ANNOTATION FORM */}
                  <form
                    onSubmit={handleAddAnnotation}
                    className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1D1D1F]">Add Frame Note</span>
                      <span className="text-xs font-mono font-bold text-[#3B82F6] bg-white px-2 py-0.5 rounded-md border border-[#E5E5E7]">
                        {currentTimecode}
                      </span>
                    </div>

                    {/* Category Matrix */}
                    <div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['COLOR', 'AUDIO', 'PACING', 'TYPO'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`py-1.5 text-center text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                              activeCategory === cat
                                ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                                : 'bg-white text-[#1D1D1F] border-[#E5E5E7] hover:bg-[#F5F5F7]'
                            }`}
                          >
                            {cat}
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
                        placeholder="Type frame-accurate feedback here... (Press M to jump here)"
                        className="w-full bg-white rounded-lg border border-[#E5E5E7] p-2.5 text-xs text-[#1D1D1F] focus:border-[#3B82F6] outline-none resize-none"
                      ></textarea>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm"
                      >
                        Submit Frame Annotation
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* BOTTOM SUITE: ASSET & DELIVERABLES VAULT */}
              <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#F5F5F7] gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1D1D1F]">
                      Project Deliverables &amp; Master Assets
                    </h3>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      High-speed cloud distribution via CDN edge • Encrypted archive mirror
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Secure Cloud Storage Active (1.4 TB)
                  </span>
                </div>

                {/* 4-Tile Bento Asset Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Asset 1 */}
                  <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-md">
                          PREVIEW FILE
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">1.42 GB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        Draft v1.2 Cut (Watermarked)
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        H.265 Proxy 4K MP4 with frame counters and director audio scratch track.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600">Ready</span>
                      <button
                        type="button"
                        onClick={() => alert('DISPATCH: Downloading Draft v1.2 Proxy Cut (.mp4)...')}
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
                          RAW REPOSITORY
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">840 GB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        B2 Raw Storage Archive
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        Direct authenticated tunnel to camera original R3D and FX9 MXF footage.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#86868B]">Backblaze B2</span>
                      <button
                        type="button"
                        onClick={() => alert('AUTHENTICATED: Generating presigned Backblaze B2 download tunnel...')}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                      >
                        Access Vault ↗
                      </button>
                    </div>
                  </div>

                  {/* Asset 3 */}
                  <div className="bg-[#F5F5F7] p-5 rounded-xl border border-[#E5E5E7] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                          AUDIO STEMS
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">4.8 GB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        5.1 &amp; Stereo Stems (.WAV)
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        Uncompressed 24-bit/48kHz dialogue, foley, SFX, and orchestral music stems.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600">Synced</span>
                      <button
                        type="button"
                        onClick={() => alert('DISPATCH: Initializing stem pack download...')}
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
                          COLOR PROFILE
                        </span>
                        <span className="text-[11px] text-[#86868B] font-mono">12 MB</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        3D LUT Cube Package
                      </h4>
                      <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                        Official show LUT: Udaipur Daylight Warm, Night Palace Gold &amp; Rec.709 conversion.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#86868B]">v2.0 Master</span>
                      <button
                        type="button"
                        onClick={() => alert('DISPATCH: Downloading official 3D LUT Cube Package...')}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer"
                      >
                        Download ↓
                      </button>
                    </div>
                  </div>
                </div>

                {/* CRITICAL CALL-TO-ACTION MASTER GATE */}
                <div className="bg-[#1D1D1F] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#3B82F6] uppercase tracking-wider">
                        FINAL ACCEPTANCE GATE
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      Ready to sign off on this master cut?
                    </h3>
                    <p className="text-xs text-[#86868B] max-w-2xl leading-relaxed">
                      Approving this cut will lock current frame revisions, complete the project milestone, and dispatch
                      the watermark-free Master 4K DCI Archival ZIP to your production drive.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleRequestRevision}
                      className="text-xs font-semibold px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-center cursor-pointer"
                    >
                      {currentRound < includedRounds ? `Request Retake Round ${currentRound + 1}` : 'Request Extra Retake (+₹1,500)'}
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveCut}
                      className="text-xs font-semibold px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>Approve Cut &amp; Unlock 4K Master</span>
                      <span>✓</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* 3-Tier Refund Policy & Escrow Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                  ESCROW &amp; SETTLEMENT TRANSPARENCY
                </span>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] mt-0.5">
                  Artsy 3-Tier Refund Policy
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

            {/* 3-Tier Matrix */}
            <div className="space-y-3">
              <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                  <span>Tier 1: Work Not Started</span>
                  <span className="text-emerald-600 font-mono">100% Refund</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">No footage downloaded, no timeline created.</p>
              </div>

              <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                  <span>Tier 2: Work Started</span>
                  <span className="text-amber-600 font-mono">50% Refund</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">Footage proxies downloaded OR assembly timeline initialized.</p>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center text-xs font-bold text-[#1D1D1F]">
                  <span>Tier 3: Substantial Progress (CURRENT)</span>
                  <span className="text-red-500 font-mono">0% Auto / Admin Review</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">Draft v1.2 submitted, 840 GB footage ingested &amp; color graded.</p>
              </div>
            </div>

            {/* Refund Dispute Form */}
            <form onSubmit={handleSubmitRefundDispute} className="space-y-3 pt-3 border-t border-[#E5E5E7]">
              <label className="block text-xs font-bold text-[#1D1D1F]">
                Request Quality / SLA Review:
              </label>
              <textarea
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Detail any creative or timeline misalignment for studio admin audit..."
                className="w-full text-xs p-3 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-[#1D1D1F] outline-none focus:bg-white focus:border-[#3B82F6]"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#1D1D1F] hover:bg-red-600 text-white text-xs font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Submit Dispute for Review
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

      {/* Change Order Extra Revisions Modal */}
      {showChangeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-md w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                  SCOPE CHANGE ORDER
                </span>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] mt-0.5">
                  Additional Creative Revision
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
              Your included 1 complimentary revision round has been completed. To maintain top creative focus and editor compensation, an additional full retake pass is available under a standard Change Order (10% of total project value).
            </p>

            <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Scope Extension:</span>
                <span>Revision Round 3</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#1D1D1F]">
                <span>Turnaround SLA:</span>
                <span>48 Hours</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#1D1D1F] pt-2 border-t border-[#E5E5E7]">
                <span>Additional Escrow:</span>
                <span className="font-mono text-[#3B82F6]">₹1,500</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleApproveChangeOrder}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                Authorize Change Order (₹1,500)
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
