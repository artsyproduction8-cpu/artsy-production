'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, logout, hasAcceptedAgreement, recordAgreementAcceptance } from '@/lib/auth';

export default function FreelancerDashboard() {
  const { user, role } = useAuth();
  const [currentCadence, setCurrentCadence] = useState<number>(3);
  const [progressPercent, setProgressPercent] = useState<number>(65);
  const [dailyNotes, setDailyNotes] = useState<string>(
    'Assembly synced, working on Kodak 2383 emulation grade pass. 3 shots require tracking re-render.'
  );
  const [acceptedJobs, setAcceptedJobs] = useState<string[]>([]);
  const [declinedJobs, setDeclinedJobs] = useState<string[]>([]);
  const [pulseSubmitted, setPulseSubmitted] = useState<boolean>(false);
  const [showAgreementModal, setShowAgreementModal] = useState<boolean>(false);
  const [ndaChecked, setNdaChecked] = useState<boolean>(false);
  const [pendingJobToAccept, setPendingJobToAccept] = useState<string | null>(null);

  const handleAcceptJob = (jobId: string) => {
    if (!hasAcceptedAgreement(user)) {
      setPendingJobToAccept(jobId);
      setShowAgreementModal(true);
      return;
    }
    setAcceptedJobs((prev) => [...prev, jobId]);
    alert(`DISPATCH SYSTEM: Job #${jobId} confirmed. Scoped Backblaze B2 ingest vault credentials dispatched.`);
  };

  const handleSignAgreement = () => {
    if (!ndaChecked) {
      alert('Please check the box to confirm acceptance of the Master Creator Agreement & Non-Disclosure Pact.');
      return;
    }
    recordAgreementAcceptance('both', '1.0');
    setShowAgreementModal(false);
    if (pendingJobToAccept) {
      setAcceptedJobs((prev) => [...prev, pendingJobToAccept]);
      alert(`AGREEMENT EXECUTED: Job #${pendingJobToAccept} confirmed. Scoped Backblaze B2 ingest vault credentials dispatched.`);
      setPendingJobToAccept(null);
    } else {
      alert('Master Agreement & NDA recorded. Your creator station is fully unlocked.');
    }
  };

  const handleDeclineJob = (jobId: string) => {
    setDeclinedJobs((prev) => [...prev, jobId]);
  };

  const handleSubmitPulse = () => {
    setPulseSubmitted(true);
    setTimeout(() => setPulseSubmitted(false), 3000);
  };

  const creatorName = user?.full_name || 'Aarav Sen';
  const creatorInitials = creatorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AS';

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
              CREATOR STATION ACTIVE
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
              href="/services"
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Services Specs
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
                {creatorInitials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex pt-16 w-full max-w-full overflow-x-hidden">
        {/* Left Sidebar: Creator Station Control (w-72 fixed on desktop) */}
        <aside className="hidden lg:flex w-72 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-[#E5E5E7] z-40 p-6 flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] uppercase font-bold text-[#86868B] tracking-wider">
                Creator Workspace
              </div>
              <div className="text-sm font-bold text-[#1D1D1F] mt-0.5">{creatorName}</div>
              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Senior Cutter • Vetted
              </span>
            </div>

            <nav className="flex flex-col space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#3B82F6] px-3 pt-2">
                Production Slate
              </div>
              <Link
                href="/freelancer"
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] transition-colors"
              >
                Active Job Slate
              </Link>
              <Link
                href="/freelancer/work/AP-8841"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Project Workroom #8841
              </Link>
              <Link
                href="/freelancer/payouts"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Escrow Ledger &amp; Payouts
              </Link>

              <div className="text-[10px] uppercase font-bold text-[#86868B] px-3 pt-5">
                Profile &amp; Gear
              </div>
              <Link
                href="/freelancer/onboarding"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Software &amp; Gear Profile
              </Link>
            </nav>
          </div>

          <div className="pt-4 border-t border-[#F5F5F7] space-y-3">
            <div className="bg-[#F5F5F7] rounded-xl p-3 border border-[#E5E5E7]">
              <div className="text-[10px] uppercase font-bold text-[#86868B]">Legal Agreement</div>
              {hasAcceptedAgreement(user) ? (
                <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-600">
                  <span>✓</span> Signed (NDA &amp; MSA v1.0)
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAgreementModal(true)}
                  className="mt-1 text-xs font-bold text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>⚠️</span> Sign Required NDA
                </button>
              )}
            </div>
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
            

            <div className="p-6 md:p-8 space-y-8 max-w-7xl">

              {/* Agreement Pending Banner */}
              {!hasAcceptedAgreement(user) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h3 className="text-sm font-bold text-amber-900">
                        Action Required: Creator Master Services Agreement &amp; NDA
                      </h3>
                      <p className="text-xs text-amber-700 mt-0.5">
                        You must execute the Artsy Creator Agreement before accepting jobs or downloading client raw footage proxies.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAgreementModal(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    Review &amp; Sign Agreement
                  </button>
                </div>
              )}
              
              {/* 1. CREATOR STATUS HEADER */}
              <section className="w-full bg-white rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Left Identity Column */}
                  <div className="lg:col-span-4 bg-[#1D1D1F] p-6 sm:p-8 text-white flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase tracking-widest text-[#3B82F6] font-bold">
                          ROSTER IDENTITY
                        </span>
                      </div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Aarav Sen
                      </h1>
                      <p className="text-xs tracking-wider text-[#86868B] mt-1 font-medium">
                        Kinetik Studio • Mumbai
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/10 space-y-1">
                      <div className="text-[10px] uppercase text-[#86868B] font-semibold">ROSTER SPECIALIZATION</div>
                      <div className="text-xs uppercase text-white font-bold bg-white/10 px-3 py-1 rounded-lg inline-block">
                        Senior Colorist &amp; Assembly
                      </div>
                    </div>
                  </div>

                  {/* Right Stats Grid */}
                  <div className="lg:col-span-8 p-6 sm:p-8 bg-white flex flex-col justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-2xl p-5 bg-[#F5F5F7] border border-[#E5E5E7]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase text-[#86868B] font-semibold">
                            TOTAL EARNINGS
                          </span>
                          <span className="text-emerald-600 text-xs font-bold">Disbursed</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-[#1D1D1F] leading-none">₹48,500</div>
                        <div className="text-xs text-[#86868B] mt-2">Direct NEFT Settlements</div>
                      </div>

                      <div className="rounded-2xl p-5 bg-[#F5F5F7] border border-[#E5E5E7]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase text-[#86868B] font-semibold">
                            ACTIVE LOAD
                          </span>
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-[#3B82F6] leading-none">02</div>
                        <div className="text-xs text-[#86868B] mt-2">Projects In Flight</div>
                      </div>

                      <div className="rounded-2xl p-5 bg-[#F5F5F7] border border-[#E5E5E7]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase text-[#86868B] font-semibold">HEALTH SCORE</span>
                          <span className="text-emerald-600 text-xs font-bold">Optimal</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 leading-none">99.4</div>
                        <div className="text-xs text-[#86868B] mt-2">0 Flagged Milestones</div>
                      </div>
                    </div>

                    {/* Bottom Control Notice Bar */}
                    <div className="mt-6 pt-4 border-t border-[#F5F5F7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#86868B]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-medium text-[#1D1D1F]">
                          Automated Slate Allocation: Enabled
                        </span>
                      </div>
                      <div className="text-[11px]">
                        TDS Citizen Registry: <span className="font-mono text-[#1D1D1F] font-bold">AAAPL8821K</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. ACTIVE WORK & DAILY CHECK-IN PROTOCOL */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-[-0.03em]">
                    Active Pipeline &amp; Progress Protocol
                  </h2>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Live Active Project Detail */}
                  <div className="xl:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-[#F5F5F7] pb-3">
                        <span className="text-xs font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
                          Current Commitment
                        </span>
                        <span className="text-xs font-bold text-amber-600">Buffer: 48h Left</span>
                      </div>
                      <div className="mt-4">
                        <div className="text-[11px] uppercase text-[#86868B] font-semibold">
                          Project Code // Brief
                        </div>
                        <h3 className="text-base font-bold text-[#1D1D1F] mt-1 leading-snug">
                          Job #AP-8910 // DTC 60s Brand Cut
                        </h3>
                        <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                          Grading Arri LogC3 plates, clean skin pass, dual aspect ratio export (16:9 &amp; 9:16). Complete conforming required.
                        </p>
                      </div>

                      {/* Workspace Asset Ingest specs */}
                      <div className="mt-5 rounded-xl p-4 bg-[#F5F5F7] border border-[#E5E5E7] space-y-2">
                        <div className="text-xs font-bold text-[#1D1D1F] flex justify-between">
                          <span>Ingest Vault Status</span>
                          <span className="text-[#3B82F6]">Ready (124 GB)</span>
                        </div>
                        <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                          <div className="bg-[#3B82F6] h-full w-full rounded-full"></div>
                        </div>
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>DaVinci Project Archive</span>
                          <span>Studio Master Archive</span>
                        </div>
                      </div>
                    </div>

                    {/* Secure Drive Ingest Link Button */}
                    <div className="mt-6 pt-4 border-t border-[#F5F5F7] space-y-2">
                      <a
                        href="https://drive.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-3 px-4 bg-[#1D1D1F] hover:bg-black text-white rounded-xl transition-all"
                      >
                        <span>Open Scoped Drive Folder (Expires in 5 Days)</span>
                        <span>↗</span>
                      </a>
                      <p className="text-[11px] text-center text-[#86868B]">
                        Scoped drive access active for project duration.
                      </p>
                    </div>
                  </div>

                  {/* Interactive Daily Pulse Check-In Panel */}
                  <div className="xl:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F5F5F7] pb-3 gap-2">
                        <span className="text-sm font-bold text-[#1D1D1F]">
                          Daily Milestone Check-In Panel
                        </span>
                        <span className="text-xs font-semibold bg-[#F5F5F7] text-[#86868B] px-2.5 py-0.5 rounded-full border border-[#E5E5E7]">
                          Window Closes: 23:59 IST
                        </span>
                      </div>

                      {/* Status Stage Selectors */}
                      <div className="mt-5">
                        <label className="text-xs font-semibold text-[#1D1D1F] block mb-2">
                          CURRENT CADENCE STAGE
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 1, label: 'STARTED' },
                            { id: 2, label: 'ROUGH CUT SYNC' },
                            { id: 3, label: 'COLOR PASS' }
                          ].map((stage) => (
                            <button
                              key={stage.id}
                              type="button"
                              onClick={() => setCurrentCadence(stage.id)}
                              className={`text-xs font-semibold p-2.5 rounded-xl border transition-all cursor-pointer ${
                                currentCadence === stage.id
                                  ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]'
                                  : 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7] hover:bg-white'
                              }`}
                            >
                              {stage.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Progress Slider Meter */}
                      <div className="mt-5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-[#1D1D1F]">
                            MILESTONE COMPLETION PERCENTAGE
                          </label>
                          <span className="text-sm font-extrabold text-[#3B82F6]">
                            {progressPercent}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progressPercent}
                          onChange={(e) => setProgressPercent(Number(e.target.value))}
                          className="w-full h-2 bg-[#F5F5F7] rounded-full accent-[#3B82F6] cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>0% Ingest</span>
                          <span>50% First Pass</span>
                          <span>100% Export Master</span>
                        </div>
                      </div>

                      {/* Notes Field */}
                      <div className="mt-5">
                        <label className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
                          DISPATCH PROGRESS MEMO / TECHNICAL BLOCKERS
                        </label>
                        <textarea
                          rows={2}
                          value={dailyNotes}
                          onChange={(e) => setDailyNotes(e.target.value)}
                          placeholder="State current conform status, node tree structure, or dependencies..."
                          className="w-full bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] p-3 text-xs text-[#1D1D1F] focus:outline-none focus:bg-white focus:border-[#3B82F6] transition-all resize-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#F5F5F7] flex items-center justify-between">
                      {pulseSubmitted && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          ✓ Progress logged to studio ledger.
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleSubmitPulse}
                        className="ml-auto w-full sm:w-auto text-xs font-semibold py-2.5 px-5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Submit Daily Pulse
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. ANONYMIZED JOB DISPATCH SLATE */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-[-0.03em]">
                    Available Job Dispatch Slate (Anonymized)
                  </h2>
                  <span className="text-xs font-semibold text-[#86868B]">
                    {2 - acceptedJobs.length - declinedJobs.length} Offers Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Job Card 01 */}
                  {!declinedJobs.includes('AP-9042') && (
                    <div className="bg-white rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between">
                      <div>
                        {/* Header Block */}
                        <div className="bg-[#1D1D1F] text-white p-5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#3B82F6] font-bold tracking-wider block uppercase">
                              CLIENT IDENTITY BLINDED
                            </span>
                            <h3 className="text-sm font-bold tracking-tight mt-0.5 text-white">
                              Job #AP-9042 // 3–5 Min Luxury Wedding Highlight
                            </h3>
                          </div>
                          <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                            URGENT
                          </span>
                        </div>

                        {/* Body Specs */}
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-3 rounded-xl p-3 bg-[#F5F5F7] border border-[#E5E5E7]">
                            <div>
                              <div className="text-[10px] uppercase text-[#86868B] font-semibold">
                                INTERNAL DEADLINE
                              </div>
                              <div className="text-xs font-bold text-amber-600">4 Days Buffer</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-[#86868B] font-semibold">
                                CLIENT SLA DEADLINE
                              </div>
                              <div className="text-xs font-bold text-[#1D1D1F]">8 Days Total</div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="text-[11px] uppercase text-[#86868B] font-semibold">
                              Deliverable Blueprint
                            </div>
                            <ul className="space-y-1 text-xs text-[#1D1D1F]">
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Source Codec:</strong> 4K DCI Master (Sony FX6 S-Cinetone)</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Deliverable:</strong> DaVinci Resolve Project Archive (.dra) + Masters</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Coverage:</strong> 3 Camera Angles (Gimbal, Tele, Aerial Drone)</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Sound:</strong> Licensed Instrumental Stem Pack included</span>
                              </li>
                            </ul>
                          </div>

                          {/* Creator Project Payout Box */}
                          <div className="rounded-xl p-4 bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-between text-[#1D1D1F]">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-[#86868B]">PROJECT PAYOUT</div>
                              <div className="text-2xl font-extrabold text-[#1D1D1F] mt-0.5">₹4,533</div>
                            </div>
                            <div className="text-right text-[11px]">
                              <div className="text-[#86868B]">Direct NEFT Transfer</div>
                              <div className="text-emerald-600 font-bold">Net Settlement: ₹4,488</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {acceptedJobs.includes('AP-9042') ? (
                          <div className="col-span-2 p-3 bg-emerald-50 text-emerald-700 text-center text-xs font-bold rounded-xl border border-emerald-200">
                            Claimed ✓ Ingest Assets Active
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAcceptJob('AP-9042')}
                              className="w-full text-xs font-semibold py-3 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              Accept &amp; Access Drive
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineJob('AP-9042')}
                              className="w-full text-xs font-semibold py-3 px-4 bg-[#F5F5F7] hover:bg-[#E5E2E1] text-[#1D1D1F] rounded-xl border border-[#E5E5E7] transition-all cursor-pointer"
                            >
                              Decline Slate
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Job Card 02 */}
                  {!declinedJobs.includes('AP-9048') && (
                    <div className="bg-white rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between">
                      <div>
                        {/* Header Block */}
                        <div className="bg-[#1D1D1F] text-white p-5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#3B82F6] font-bold tracking-wider block uppercase">
                              CLIENT IDENTITY BLINDED
                            </span>
                            <h3 className="text-sm font-bold tracking-tight mt-0.5 text-white">
                              Job #AP-9048 // 30s UGC Hooks (x3 Variations)
                            </h3>
                          </div>
                          <span className="px-2.5 py-0.5 bg-[#3B82F6]/20 text-[#3B82F6] text-[10px] font-bold rounded-full">
                            FAST-TRACK
                          </span>
                        </div>

                        {/* Body Specs */}
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-2 gap-3 rounded-xl p-3 bg-[#F5F5F7] border border-[#E5E5E7]">
                            <div>
                              <div className="text-[10px] uppercase text-[#86868B] font-semibold">
                                INTERNAL DEADLINE
                              </div>
                              <div className="text-xs font-bold text-[#3B82F6]">2 Days Buffer</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-[#86868B] font-semibold">
                                CLIENT SLA DEADLINE
                              </div>
                              <div className="text-xs font-bold text-[#1D1D1F]">5 Days Total</div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="text-[11px] uppercase text-[#86868B] font-semibold">
                              Deliverable Blueprint
                            </div>
                            <ul className="space-y-1 text-xs text-[#1D1D1F]">
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Source Codec:</strong> 4K H.265 / High-Bitrate 60fps Vertical (9:16)</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Deliverable:</strong> Premiere Pro / FCP XML + 3 Clean Masters</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Coverage:</strong> Talking Head + B-Roll Overlays + Sound FX</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block"></span>
                                <span><strong>Typography:</strong> Dynamic kinetic subtitles baked in (Clean Style)</span>
                              </li>
                            </ul>
                          </div>

                          {/* Creator Project Payout Box */}
                          <div className="rounded-xl p-4 bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-between text-[#1D1D1F]">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-[#86868B]">PROJECT PAYOUT</div>
                              <div className="text-2xl font-extrabold text-[#1D1D1F] mt-0.5">₹3,380</div>
                            </div>
                            <div className="text-right text-[11px]">
                              <div className="text-[#86868B]">Direct NEFT Transfer</div>
                              <div className="text-emerald-600 font-bold">Net Settlement: ₹3,346</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {acceptedJobs.includes('AP-9048') ? (
                          <div className="col-span-2 p-3 bg-emerald-50 text-emerald-700 text-center text-xs font-bold rounded-xl border border-emerald-200">
                            Claimed ✓ Ingest Assets Active
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAcceptJob('AP-9048')}
                              className="w-full text-xs font-semibold py-3 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              Accept &amp; Access Drive
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeclineJob('AP-9048')}
                              className="w-full text-xs font-semibold py-3 px-4 bg-[#F5F5F7] hover:bg-[#E5E2E1] text-[#1D1D1F] rounded-xl border border-[#E5E5E7] transition-all cursor-pointer"
                            >
                              Decline Slate
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 4. ESCROW LEDGER & PAYOUTS CALLOUT */}
              <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#86868B] font-bold">
                    SETTLEMENT ACCOUNTING
                  </div>
                  <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-[-0.03em] mt-0.5">
                    Escrow Ledger &amp; Payouts
                  </h2>
                  <p className="text-xs text-[#86868B] mt-1">
                    Track your project milestones, released funds, and scheduled direct NEFT transfers.
                  </p>
                </div>
                <Link
                  href="/freelancer/payouts"
                  className="px-5 py-3 bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-2"
                >
                  <span>Open Full Ledger</span>
                  <span>→</span>
                </Link>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Legal Agreement & NDA Signing Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-[#E5E5E7] shadow-2xl p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-[#3B82F6] uppercase">
                  LEGAL COMPLIANCE GATEWAY
                </span>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] mt-0.5">
                  Master Services Agreement &amp; NDA (v1.0)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto text-xs text-[#86868B] space-y-3 p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] leading-relaxed">
              <p>
                <strong className="text-[#1D1D1F]">1. Non-Disclosure &amp; Footage Confidentiality:</strong> All raw media proxies, camera rushes, color grade look-up tables (LUTs), audio stems, and project files accessed through Artsy Production ingest drives are confidential client property. Any unauthorized download mirror, public showcase, or circulation before official public release is strictly prohibited.
              </p>
              <p>
                <strong className="text-[#1D1D1F]">2. Independent Contractor &amp; IP Assignment:</strong> Editors operate as vetted independent creative contractors. All final approved cut deliverables and timeline project archives are assigned in full to Artsy Production for release to the designated client.
              </p>
              <p>
                <strong className="text-[#1D1D1F]">3. Timely Direct Payouts:</strong> Payouts are credited directly to your verified bank account via direct NEFT upon client milestone completion and signoff, subject to applicable statutory withholding.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <input
                type="checkbox"
                checked={ndaChecked}
                onChange={(e) => setNdaChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#3B82F6] cursor-pointer shrink-0"
              />
              <span className="text-xs text-[#1D1D1F] font-medium leading-normal">
                I have read and agree to the <strong>Master Services Agreement, IP Assignment, and Non-Disclosure Terms (v1.0)</strong> on behalf of my studio.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSignAgreement}
                disabled={!ndaChecked}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                Sign Agreement &amp; Unlock Slates
              </button>
              <button
                type="button"
                onClick={() => setShowAgreementModal(false)}
                className="px-4 bg-[#F5F5F7] hover:bg-[#E5E2E1] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] cursor-pointer transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}