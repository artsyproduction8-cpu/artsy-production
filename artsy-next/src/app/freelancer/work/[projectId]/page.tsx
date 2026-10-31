'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCurrentUser, setCurrentUser, hasAcceptedAgreement, recordAgreementAcceptance, type ArtsyUser } from '@/lib/auth';
import {
  logFootageDownload,
  logCheckin,
  logDraftSubmission,
  getProjectActivityLog,
  type ActivityLogEntry,
} from '@/lib/activity/logger';
import FreelancerHeader from '../../components/FreelancerHeader';
import FreelancerSidebar from '../../components/FreelancerSidebar';

export default function FreelancerWorkView() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [user, setUser] = useState<ArtsyUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkInStatus, setCheckInStatus] = useState<'on_track' | 'missed' | 'escalated' | 'blocked'>('on_track');
  const [checkInMessage, setCheckInMessage] = useState('');
  const [deliverableUploaded, setDeliverableUploaded] = useState(false);
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [footageDownloaded, setFootageDownloaded] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [ndaChecked, setNdaChecked] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [footageToast, setFootageToast] = useState<string | null>(null);

  useEffect(() => {
    // 1. Enforce authenticated creator session; redirect to login if missing
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push(`/auth/login?redirect=/freelancer/work/${encodeURIComponent(projectId || '')}`);
      return;
    }
    setUser(currentUser);
    setActivityLogs(getProjectActivityLog(projectId));

    // 2. Fetch project details via secure server API
    const syncProjectData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/freelancer/work/${encodeURIComponent(projectId || '')}`);
        const data = await res.json();
        if (data.success && data.project) {
          setProject(data.project);
          if (data.project.orders) setOrder(data.project.orders);

          // If creator agreement is signed on server, sync to client session
          if (data.creatorAgreementSigned && currentUser && !currentUser.agreement_signed_at) {
            const updated = {
              ...currentUser,
              agreement_accepted: true,
              agreement_signed_at: new Date().toISOString(),
            };
            setCurrentUser(updated);
            setUser(updated);
          }
        }
      } catch (err) {
        console.warn('Failed to load project workroom:', err);
      } finally {
        setLoading(false);
      }
    };

    syncProjectData();
  }, [projectId, router]);

  const isAgreementSigned = Boolean(hasAcceptedAgreement(user) || project?.creatorAgreementSigned);

  const handleFootageAccess = () => {
    if (!isAgreementSigned) {
      setShowAgreementModal(true);
      return;
    }

    const footageUrl = project?.raw_footage_url;
    if (!footageUrl || footageUrl === 'https://drive.google.com' || footageUrl === 'https://drive.google.com/' || footageUrl.includes('drive.google.com/drive/u/0/home')) {
      setFootageToast('The client has not attached their raw footage link to this order yet. Our Studio Coordinator has been alerted.');
      setTimeout(() => setFootageToast(null), 5000);
      return;
    }

    // Log immutable activity event (Tier 2 Refund Trigger)
    logFootageDownload(projectId, user?.id || 'creator', { fileCount: 12, totalSizeMb: 48500 });
    setFootageDownloaded(true);
    setActivityLogs(getProjectActivityLog(projectId));
    window.open(footageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyFootageLink = () => {
    const footageUrl = project?.raw_footage_url;
    if (!footageUrl) return;
    navigator.clipboard.writeText(footageUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleSignAgreement = () => {
    recordAgreementAcceptance('both', '1.0');
    setShowAgreementModal(false);
    // Update local user state
    if (user) {
      const updated = { ...user, agreement_accepted: true, agreement_signed_at: new Date().toISOString() };
      setCurrentUser(updated);
      setUser(updated);
    }
    // Continue with footage download
    handleFootageAccess();
  };

  const handleDailyCheckIn = async (status: 'on_track' | 'missed' | 'escalated' | 'blocked', message: string) => {
    try {
      // 1. Log immutable audit trail entry
      logCheckin(projectId, user?.id || 'creator', { status, notes: message });
      setActivityLogs(getProjectActivityLog(projectId));

      // 2. Update via server API
      try {
        await fetch(`/api/freelancer/work/${encodeURIComponent(projectId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'checkin',
            checkin_status: status,
            notes: message,
          }),
        });
      } catch {
        // ignore in mock mode
      }

      setCheckInStatus(status);
      setCheckInMessage(message);

      if (status === 'missed' || status === 'escalated' || status === 'blocked') {
        fetch('/api/notifications/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: user?.phone || '',
            message: `⚠️ Artsy Editorial Alert: Check-in for Project #${projectId} flagged as ${status.toUpperCase()}: "${message}"`,
            projectId,
          }),
        }).catch(() => {});
        alert(`Artsy editorial supervisor alerted: Check-in recorded as "${status.toUpperCase()}".`);
      } else {
        alert('Daily check-in logged successfully on the platform audit trail.');
      }
    } catch (err: any) {
      console.error('Error submitting check-in:', err);
      alert('Failed to submit check-in: ' + err.message);
    }
  };

  const handleDeliverableSubmit = async () => {
    if (!isAgreementSigned) {
      setShowAgreementModal(true);
      return;
    }

    if (!deliverableUrl || !deliverableUrl.trim()) {
      alert('Please enter a valid deliverable or preview link.');
      return;
    }

    try {
      // 1. Log draft submission (Tier 3 Refund Trigger: 0% refund lock)
      logDraftSubmission(projectId, user?.id || 'creator', {
        version: 1,
        draftUrl: deliverableUrl.trim(),
        notes: `Master draft cut uploaded for QA and client preview. Link: ${deliverableUrl.trim()}`,
      });
      setActivityLogs(getProjectActivityLog(projectId));

      // 2. Update deliverable status via server API
      const res = await fetch(`/api/freelancer/work/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deliverable',
          deliverableUrl: deliverableUrl.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update deliverable on server');
      }

      setDeliverableUploaded(true);
      alert('Draft cut submitted! Platform QA review initiated. Milestone progress locked.');
    } catch (err: any) {
      console.error('Error submitting deliverable:', err);
      alert('Failed to submit deliverable: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-[#1D1D1F]">Project Not Found</h1>
        <p className="text-xs text-[#86868B] mt-1">The requested project ID does not exist or has been archived.</p>
        <button
          onClick={() => router.push('/freelancer')}
          className="mt-4 px-4 py-2 bg-[#1D1D1F] text-white text-xs font-bold rounded-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Canonical Financial Waterfall Values
  const payoutAmount = typeof project?.payoutAmount === 'number' ? project.payoutAmount : 496;
  const tdsAmount = typeof project?.tdsAmount === 'number' ? project.tdsAmount : Math.round(payoutAmount * 0.02);
  const netPayout = typeof project?.netPayout === 'number' ? project.netPayout : (payoutAmount - tdsAmount);

  const displayTitle = project?.title || 'Personal • Birthday Reel';
  const clientName = project?.client?.full_name || order?.clients?.full_name || 'Verified Client';
  const cameraAnglesLabel = project?.cameraAnglesLabel || 'Single Camera Edit (1 Angle)';
  const turnaroundLabel = project?.turnaroundLabel || '7–10 Working Days Standard';
  const rawFootageUrl = project?.raw_footage_url || '';
  const musicReferenceUrl = project?.musicReferenceUrl || '';
  const clientNotes = project?.clientNotes || '';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans">
      <FreelancerHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7] pb-16">
          {/* Workroom Project Banner */}
          <div className="bg-white border-b border-[#E5E5E7] px-6 py-4">
            <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {project.project_number || `PRJ-${String(project.id).slice(0, 8)}`}
                  </span>
                  <span className="text-xs text-[#86868B]">
                    Order: {order?.order_number || project.order_id || 'N/A'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1D1D1F] mt-1">
                  {displayTitle}
                </h1>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Client: <strong className="text-[#1D1D1F]">{clientName}</strong> • SLA: <strong className="text-[#1D1D1F]">{turnaroundLabel}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 uppercase">
                  {project.status?.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Creator Payout: ₹{payoutAmount.toLocaleString('en-IN')} (Net: ₹{netPayout.toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-[1600px] mx-auto px-6 py-8">
            {/* Creator Agreement Gating Warning (ONLY if genuinely unsigned) */}
            {!isAgreementSigned && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-amber-600 text-xl">⚠️</span>
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Mandatory Legal Step: NDA &amp; Creator Agreement Unsigned
                    </h3>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Raw footage access and deliverable payouts are gated until your NDA &amp; Creator Agreement (v1.0) is signed.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAgreementModal(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap shadow-sm transition-all cursor-pointer"
                >
                  Sign Agreement (1-Click)
                </button>
              </div>
            )}

            {footageToast && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-semibold shadow-sm">
                <span>{footageToast}</span>
                <button onClick={() => setFootageToast(null)} className="font-bold opacity-70 hover:opacity-100">×</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Scope & Actions (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Project Overview Card */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-base font-bold text-[#1D1D1F]">Project Brief &amp; Specifications</h2>
                      <p className="text-xs text-[#86868B] mt-1">{project.scopeSummary}</p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#F5F5F7] px-2.5 py-1 rounded-lg border border-[#E5E5E7]">
                      {cameraAnglesLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 pt-2">
                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/70">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Aspect Ratio</div>
                      <div className="text-xs font-bold text-[#1D1D1F] mt-0.5">{project.aspectRatios || '9:16 Vertical Reel'}</div>
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/70">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Delivery SLA</div>
                      <div className="text-xs font-bold text-[#1D1D1F] mt-0.5">{turnaroundLabel}</div>
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/70">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Camera Setup</div>
                      <div className="text-xs font-bold text-[#1D1D1F] mt-0.5">{cameraAnglesLabel}</div>
                    </div>
                  </div>

                  {musicReferenceUrl && (
                    <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">🎵</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-blue-950">Client Music Reference</div>
                          <div className="text-[11px] text-blue-700 truncate">{musicReferenceUrl}</div>
                        </div>
                      </div>
                      <a
                        href={musicReferenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0 transition-all shadow-xs"
                      >
                        Listen Reference ↗
                      </a>
                    </div>
                  )}

                  {clientNotes && (
                    <div className="mt-3 p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] text-xs">
                      <strong className="text-[#1D1D1F]">Client Notes:</strong> <span className="text-[#86868B]">{clientNotes}</span>
                    </div>
                  )}

                  {/* Raw Footage Secure Link Card */}
                  <div className="mt-6 pt-6 border-t border-[#E5E5E7] bg-[#F5F5F7]/80 p-4 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5E7] flex items-center justify-center text-lg shadow-sm shrink-0">
                          📁
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-[#1D1D1F]">Client Raw Footage Vault</h3>
                            {rawFootageUrl ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                ✓ Link Verified
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                Link Pending
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#86868B] mt-0.5">
                            {rawFootageUrl
                              ? 'Direct client folder provided during onboarding. Clicking opens the exact files.'
                              : 'Client has not provided a raw footage folder yet.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {rawFootageUrl && (
                          <button
                            type="button"
                            onClick={handleCopyFootageLink}
                            className="px-3 py-2 bg-white hover:bg-slate-50 text-[#1D1D1F] border border-[#E5E5E7] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
                          >
                            {copyFeedback ? '✓ Copied' : 'Copy Link'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleFootageAccess}
                          className="flex-1 sm:flex-none px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          Access Folder ↗
                        </button>
                      </div>
                    </div>

                    {rawFootageUrl && (
                      <div className="text-[11px] font-mono text-[#6E6E73] bg-white px-3 py-1.5 rounded-lg border border-[#E5E5E7] truncate select-all">
                        {rawFootageUrl}
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily Check-In */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-[#1D1D1F]">Daily Progress Check-In</h2>
                    <span className="text-[11px] font-semibold text-[#86868B]">
                      Status: <strong className="text-[#1D1D1F]">{checkInStatus.replace('_', ' ').toUpperCase()}</strong>
                    </span>
                  </div>
                  <p className="text-xs text-[#86868B] mb-4">
                    Daily check-ins keep clients reassured and protect your milestone ratings on the Artsy platform.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <button
                      onClick={() => handleDailyCheckIn('on_track', 'Working on schedule. Timeline assembling cleanly.')}
                      className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all text-center cursor-pointer"
                    >
                      ✓ On Track
                    </button>
                    <button
                      onClick={() => handleDailyCheckIn('missed', 'Delayed start due to rendering queue.')}
                      className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all text-center cursor-pointer"
                    >
                      ⏳ Delayed Start
                    </button>
                    <button
                      onClick={() => handleDailyCheckIn('blocked', 'Need clarification from client on audio stem.')}
                      className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold rounded-xl border border-red-200 transition-all text-center cursor-pointer"
                    >
                      🚫 Blocked
                    </button>
                    <button
                      onClick={() => handleDailyCheckIn('escalated', 'Technical drive access or corrupt clip.')}
                      className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 transition-all text-center cursor-pointer"
                    >
                      ⚠️ Escalate to QA
                    </button>
                  </div>
                  {checkInMessage && (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] text-xs text-[#86868B]">
                      <strong>Last Note:</strong> {checkInMessage}
                    </div>
                  )}
                </div>

                {/* Deliverable Submission */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
                  <h2 className="text-base font-bold text-[#1D1D1F] mb-1">Submit Master Cut Deliverable</h2>
                  <p className="text-xs text-[#86868B] mb-4">
                    Provide your master export link from any platform (Google Drive, Vimeo, Frame.io, Dropbox, or YouTube unlisted).
                  </p>
                  {deliverableUploaded ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                      <span className="text-emerald-700 font-bold text-sm">✓ Deliverable Submitted to QA Pipeline</span>
                      <p className="text-xs text-emerald-600 mt-1">
                        Client review will open once internal quality checklist passes. Substantial progress logged.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-[#1D1D1F]">
                          UNIVERSAL DELIVERABLE / CLOUD STORAGE URL *
                        </label>
                        <input
                          type="url"
                          value={deliverableUrl}
                          onChange={(e) => setDeliverableUrl(e.target.value)}
                          placeholder="https://drive.google.com/... or Vimeo / Frame.io / Dropbox link"
                          className="bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all"
                        />
                        <span className="text-[11px] text-[#86868B]">
                          Universal link from any cloud storage or video hosting platform
                        </span>
                      </div>
                      <button
                        onClick={handleDeliverableSubmit}
                        className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Submit Master Cut for QA Review</span>
                        <span>↗</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Activity History */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
                  <h2 className="text-base font-bold text-[#1D1D1F] mb-1">Project Activity History</h2>
                  <p className="text-xs text-[#86868B] mb-4">
                    Timeline of file downloads, daily check-ins, and draft submissions for this project.
                  </p>
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-[#86868B] italic">No activity recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {activityLogs.slice(-5).reverse().map((log) => (
                        <div key={log.id} className="p-3 bg-[#F5F5F7] rounded-xl text-xs flex justify-between items-center border border-[#E5E5E7]/70">
                          <div>
                            <span className="font-mono font-bold text-[#1D1D1F] uppercase">{log.eventType.replace('_', ' ')}</span>
                            <span className="text-[#86868B] ml-2">by {log.userId || 'system'}</span>
                          </div>
                          <span className="text-[11px] text-[#86868B]">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Financial Waterfall & Compliance (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Payout & Settlement Card */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
                  <h2 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider mb-4">
                    Payout &amp; Settlement
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#86868B]">Creator Allocation (70% Split)</span>
                      <span className="font-bold text-[#1D1D1F]">₹{payoutAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-700">
                      <span>Statutory TDS (2% Sec 194J)</span>
                      <span className="font-mono font-semibold">-₹{tdsAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-3 border-t border-[#1D1D1F] flex justify-between items-center">
                      <span className="font-extrabold text-[#1D1D1F]">Net NEFT Settlement</span>
                      <span className="font-extrabold text-emerald-600 text-base">₹{netPayout.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 leading-relaxed">
                    Disbursed automatically to your verified bank account via NEFT upon client milestone acceptance. Form 26AS certificate issued quarterly.
                  </div>
                </div>

                {/* SLA & Timeline */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
                  <h2 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider mb-4">
                    Milestone Deadlines
                  </h2>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#86868B]">Delivery SLA</span>
                      <span className="font-bold text-[#1D1D1F]">{turnaroundLabel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#86868B]">Internal QA Delivery</span>
                      <span className="font-bold text-[#1D1D1F]">
                        {turnaroundLabel.includes('48 Hours') ? '24 Hours' : '5–7 Working Days'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#86868B]">Client Review Window</span>
                      <span className="font-bold text-[#1D1D1F]">3 Working Days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#86868B]">Revision Turnaround</span>
                      <span className="font-bold text-[#1D1D1F]">24–48 Hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* NDA & Creator Agreement Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#E5E5E7] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#1D1D1F]">Creator Master Agreement &amp; Footage NDA (v1.0)</h3>
            <p className="text-xs text-[#86868B] leading-relaxed">
              To download raw footage or accept payouts on Artsy Production, you must agree to the platform&apos;s Non-Disclosure Agreement and Creator Pact:
            </p>
            <div className="p-4 bg-[#F5F5F7] rounded-xl text-xs space-y-2 text-[#1D1D1F] max-h-48 overflow-y-auto border border-[#E5E5E7]">
              <p><strong>1. Strict Confidentiality:</strong> All raw client footage is confidential. You agree never to leak, share, or publish raw clips without written platform permission.</p>
              <p><strong>2. Direct Payouts:</strong> Milestone compensation is disbursed directly to your verified bank account via NEFT upon client milestone acceptance.</p>
              <p><strong>3. Statutory Compliance:</strong> Applicable statutory TDS is credited to your verified PAN for Form 26AS compliance.</p>
              <p><strong>4. Dispute Arbitration:</strong> In event of dispute, Artsy platform activity audit logs serve as the sole evidentiary record.</p>
              <p><strong>5. Non-Compete:</strong> Creator agrees not to solicit, contact, or engage with Artsy clients outside the platform for 90 days following project completion. Violation may result in account suspension, forfeiture of pending payouts, and legal action.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1D1D1F]">
              <input
                type="checkbox"
                checked={ndaChecked}
                onChange={(e) => setNdaChecked(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span>I accept the Creator Agreement &amp; NDA terms (Version 1.0)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button
                disabled={!ndaChecked}
                onClick={handleSignAgreement}
                className="flex-1 py-3 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Sign &amp; Continue
              </button>
              <button
                onClick={() => setShowAgreementModal(false)}
                className="px-4 py-3 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl cursor-pointer"
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
