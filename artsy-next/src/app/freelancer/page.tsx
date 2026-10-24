'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, logout, hasAcceptedAgreement, recordAgreementAcceptance, setCurrentUser, PRESET_USERS } from '@/lib/auth';
import FreelancerHeader from './components/FreelancerHeader';
import FreelancerSidebar from './components/FreelancerSidebar';

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artsy_creator_profile');
        if (stored) setProfileData(JSON.parse(stored));
      } catch {}
    }
  }, []);

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

  const isApproved = user?.role === 'freelancer' && user?.onboarding_status === 'approved';
  const isPending = user?.role === 'freelancer' && (user?.onboarding_status === 'pending' || user?.onboarding_status === 'pending_review');
  const isIncomplete = !isApproved && !isPending;
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!hasAcceptedAgreement(user)) {
      setPendingJobToAccept(jobId);
      setShowAgreementModal(true);
      return;
    }
    setAcceptedJobs((prev) => [...prev, jobId]);

    try {
      const res = await fetch('/api/freelancer/jobs/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: jobId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept job');
      }
      showToast('Job accepted. Check your workroom.', 'success');
    } catch (err: any) {
      setAcceptedJobs((prev) => prev.filter((id) => id !== jobId));
      showToast(err.message || 'Failed to accept job. Reverting.', 'error');
    }
  };

  const handleSignAgreement = () => {
    if (!ndaChecked) {
      alert('Please check the box to confirm acceptance of the Master Creator Agreement & Non-Disclosure Pact.');
      return;
    }
    recordAgreementAcceptance('both', '1.0');
    setShowAgreementModal(false);
    if (pendingJobToAccept) {
      handleAcceptJob(pendingJobToAccept);
      setPendingJobToAccept(null);
    } else {
      showToast('Master Agreement & NDA recorded. Your creator station is fully unlocked.', 'success');
    }
  };

  const handleDeclineJob = (jobId: string) => {
    setDeclinedJobs((prev) => [...prev, jobId]);
  };

  const handleSubmitPulse = () => {
    setPulseSubmitted(true);
    setTimeout(() => setPulseSubmitted(false), 3000);
  };

  const creatorName = user?.full_name || 'Creator Partner';
  const creatorInitials = creatorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CP';

  if (isIncomplete) {
    return (
      <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
        <header className="fixed top-0 left-0 w-full z-50 bg-[#0A0A0A] border-b border-[#262626]">
          <div className="h-16 w-full px-6 md:px-8 flex items-center justify-between">
            <Link href="/" className="flex flex-col select-none group">
              <span className="font-extrabold text-[15px] leading-tight tracking-[0.18em] text-white group-hover:text-blue-400 transition-colors uppercase">
                ARTSY
              </span>
              <span className="font-mono text-[7.5px] leading-none tracking-[0.24em] text-[#86868B] uppercase">
                CREATOR ONBOARDING REQUIRED
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs font-semibold uppercase px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto pt-36 pb-16 px-6">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E5E7] shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl font-bold">
              🎬
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                STEP 1 OF 3: CREATOR PROFILE
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                Complete Creator Onboarding
              </h1>
              <p className="text-sm text-[#86868B] max-w-lg mx-auto leading-relaxed">
                Before accessing active client cuts and earning payouts, please submit your showreel, editing software, and banking details for Studio Director verification.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/freelancer/onboarding"
                className="px-6 py-3.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Start Creator Onboarding →
              </Link>
              {process.env.NODE_ENV !== 'production' && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentUser(PRESET_USERS.freelancer);
                  }}
                  className="px-6 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-xl border border-blue-200 transition-all cursor-pointer"
                >
                  Access Vetted Station (Demo) →
                </button>
              )}
              <button
                type="button"
                onClick={() => logout()}
                className="px-6 py-3.5 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] transition-all"
              >
                Sign In With Another Account
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
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
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                APPLICATION UNDER REVIEW
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs font-semibold uppercase px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto pt-32 pb-20 px-6">
          <div className="space-y-6">
            {/* Top Review Banner */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E5E7] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-[#F5F5F7]">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                    <span>STAGE 2 OF 3: STUDIO DIRECTOR MANUAL CURATION</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                    Candidate Profile &amp; Reel Vetting In Progress
                  </h1>
                  <p className="text-sm text-[#86868B] max-w-2xl leading-relaxed">
                    Welcome, <strong className="text-[#1D1D1F]">{creatorName}</strong>. Your creator portfolio, software proficiency, and categorical sample cuts have been dispatched to our Studio Director. Artsy operates an invite-only vetted roster to maintain boutique cinematic standards for commercial and wedding clients.
                  </p>
                </div>

                <div className="bg-[#F5F5F7] p-5 rounded-2xl border border-[#E5E5E7] shrink-0 text-right md:min-w-[190px]">
                  <div className="text-[10px] uppercase font-bold text-[#86868B]">ESTIMATED REVIEW TIME</div>
                  <div className="text-2xl font-extrabold text-[#1D1D1F] mt-1">~24 Hours</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">Curation Queue Active</div>
                </div>
              </div>

              {/* 3-Stage Progress Pipeline */}
              <div className="pt-8">
                <div className="text-xs uppercase font-bold text-[#86868B] mb-4 tracking-wider">
                  Vetting Lifecycle
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                      <span>01. Application Ingest</span>
                      <span>✓ Completed</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 leading-snug">
                      Reels, NLE tools, NDA &amp; PAN/banking credentials saved.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl flex flex-col gap-1.5 relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        02. Editorial Review
                      </span>
                      <span className="text-[10px] uppercase bg-amber-200/80 px-2 py-0.5 rounded font-extrabold text-amber-800">Active</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Studio Director evaluates pacing, audio ducking &amp; color conform.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl flex flex-col gap-1.5 opacity-75">
                    <div className="flex items-center justify-between text-xs font-bold text-[#86868B]">
                      <span>03. Roster Dispatch</span>
                      <span>🔒 Locked</span>
                    </div>
                    <p className="text-[11px] text-[#86868B] leading-snug">
                      Automated Resend Email + WhatsApp activation link dispatched.
                    </p>
                  </div>
                </div>
              </div>

              {/* Candidate Info Slate */}
              <div className="mt-8 p-5 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs">
                    {creatorInitials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1D1F]">{creatorName}</div>
                    <div className="text-[11px] text-[#86868B]">Tracking: ART-2026-VET-8841</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/freelancer/onboarding"
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#E5E5E7] transition-all"
                  >
                    Edit Submitted Portfolio
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-200 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <FreelancerHeader />

      {/* Main Layout Container */}
      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          <div className="flex flex-col w-full max-w-full overflow-x-hidden">
            

            <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
              {toastMessage && (
                <div
                  className={`p-4 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-between ${
                    toastMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                >
                  <span>{toastMessage.text}</span>
                  <button
                    type="button"
                    onClick={() => setToastMessage(null)}
                    className="ml-3 font-bold opacity-70 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              )}

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
                        You must execute the Creator Agreement before accepting jobs or downloading client raw footage proxies.
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
                          CREATOR PROFILE
                        </span>
                      </div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        {creatorName}
                      </h1>
                      <p className="text-xs tracking-wider text-[#86868B] mt-1 font-medium">
                        Creator Network
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/10 space-y-1">
                      <div className="text-[10px] uppercase text-[#86868B] font-semibold tracking-wider">VERIFIED CREATIVE ROLE</div>
                      <div className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg inline-block">
                        {(user as any)?.public_specialty || (user as any)?.creator_profile?.public_specialty || (user as any)?.studio_details?.specialty || 'Commercial & Narrative Film Editor'}
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
                          <span className="text-emerald-600 text-xs font-bold">Paid Out</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-[#1D1D1F] leading-none">₹0</div>
                        <div className="text-xs text-[#86868B] mt-2">0 Completed Orders</div>
                      </div>

                      <div className="rounded-2xl p-5 bg-[#F5F5F7] border border-[#E5E5E7]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase text-[#86868B] font-semibold">
                            ACTIVE PROJECTS
                          </span>
                          <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-[#1D1D1F] leading-none">00</div>
                        <div className="text-xs text-[#86868B] mt-2">None In Progress</div>
                      </div>

                      <div className="rounded-2xl p-5 bg-[#F5F5F7] border border-[#E5E5E7]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase text-[#86868B] font-semibold">PERFORMANCE RATING</span>
                          <span className="text-emerald-600 text-xs font-bold">New Partner</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 leading-none">100%</div>
                        <div className="text-xs text-[#86868B] mt-2">On-Time Delivery Target</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. ACTIVE WORK & DAILY CHECK-IN PROTOCOL */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-[-0.03em]">
                    Active Projects &amp; Daily Updates
                  </h2>
                </div>

                <div className="bg-white rounded-2xl border border-dashed border-[#E5E5E7] p-12 text-center space-y-3 shadow-xs">
                  <div className="text-3xl">🎬</div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">No active project assigned yet</h3>
                  <p className="text-xs text-[#86868B] max-w-md mx-auto leading-relaxed">
                    When a client order is matched with your skills, our Studio Director will assign it to your queue. You will receive real-time alerts via WhatsApp and email with footage ingest links and turnaround milestones.
                  </p>
                </div>
              </section>

              {/* 3. ANONYMIZED JOB DISPATCH SLATE */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold text-[#1D1D1F] tracking-[-0.03em]">
                    Available Projects
                  </h2>
                  <span className="text-xs font-semibold text-[#86868B]">
                    0 Available Projects
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-dashed border-[#E5E5E7] p-12 text-center space-y-3 shadow-xs">
                  <div className="text-3xl">📥</div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">No open project broadcasts right now</h3>
                  <p className="text-xs text-[#86868B] max-w-md mx-auto leading-relaxed">
                    New incoming projects matching your editing suite and color specialties will broadcast here in real-time as soon as clients place orders.
                  </p>
                </div>
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
                  CREATOR AGREEMENT
                </span>
                <h3 className="text-lg font-extrabold text-[#1D1D1F] mt-0.5">
                  Creator Agreement &amp; Non-Disclosure
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
                <strong className="text-[#1D1D1F]">1. Client Privacy &amp; Footage Protection:</strong> All project files, raw videos, and assets are private and confidential. You agree not to share, leak, or post any client files without permission.
              </p>
              <p>
                <strong className="text-[#1D1D1F]">2. Creator Work Delivery:</strong> Completed and approved video edits are delivered to Artsy Production for final delivery to the client.
              </p>
              <p>
                <strong className="text-[#1D1D1F]">3. Guaranteed Payouts:</strong> Earnings are transferred directly to your bank account upon project completion and client signoff.
              </p>
              <p>
                <strong className="text-[#1D1D1F]">4. Non-Compete:</strong> You agree not to privately solicit or contact Artsy clients directly outside our platform.
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
                I have read and agree to the <strong>Creator Agreement and Non-Disclosure Terms</strong>.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSignAgreement}
                disabled={!ndaChecked}
                className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                Sign Agreement &amp; Continue
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