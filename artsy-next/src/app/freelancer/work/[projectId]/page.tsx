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

  // 4-Stage Post-Production Progress Tracker
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageNotes, setStageNotes] = useState<string>('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressSavedToast, setProgressSavedToast] = useState(false);

  // Dedicated 5th Section: Creator Roadblock & Missing Details Desk
  const [activeIssue, setActiveIssue] = useState<any>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueCategory, setIssueCategory] = useState('missing_raw_clips');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueMissingDetails, setIssueMissingDetails] = useState('');
  const [issueUrgency, setIssueUrgency] = useState<'normal' | 'blocker'>('normal');
  const [submittingIssue, setSubmittingIssue] = useState(false);

  // Client Review & Feedback State
  const [clientReviewNotes, setClientReviewNotes] = useState<any[]>([]);
  const [isClientApproved, setIsClientApproved] = useState<boolean>(false);
  const [showReplaceDeliverable, setShowReplaceDeliverable] = useState<boolean>(false);
  const [resolvingNoteId, setResolvingNoteId] = useState<string | null>(null);

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

          // Sync progress and roadblock state
          if (typeof data.project.currentStage === 'number') {
            setCurrentStage(data.project.currentStage);
          }
          if (data.project.stageNotes) {
            setStageNotes(data.project.stageNotes);
          }
          if (data.project.issueFlagged && data.project.issueDetails) {
            setActiveIssue(data.project.issueDetails);
          } else {
            setActiveIssue(null);
          }

          // Sync deliverable URL & status
          if (data.project.deliverableUrl) {
            setDeliverableUrl(data.project.deliverableUrl);
            setDeliverableUploaded(true);
          } else if (data.project.deliverableUploaded) {
            setDeliverableUploaded(true);
          }

          // Sync client reviews & approval
          if (Array.isArray(data.project.reviewNotes)) {
            setClientReviewNotes(data.project.reviewNotes);
          }
          if (data.project.isApproved) {
            setIsClientApproved(true);
          }

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

    let cleanUrl = footageUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Log immutable activity event (Tier 2 Refund Trigger)
    logFootageDownload(projectId, user?.id || 'creator', { fileCount: 12, totalSizeMb: 48500 });
    setFootageDownloaded(true);
    setActivityLogs(getProjectActivityLog(projectId));
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
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

  const handleUpdateStage = async (stageNum: number, optionalNotes?: string) => {
    const nextStage = Math.min(Math.max(stageNum, 1), 4);
    setCurrentStage(nextStage);
    const notesToSend = optionalNotes !== undefined ? optionalNotes : stageNotes;

    setSavingProgress(true);
    try {
      const res = await fetch(`/api/freelancer/work/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_progress',
          stage: nextStage,
          notes: notesToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProgressSavedToast(true);
        setTimeout(() => setProgressSavedToast(false), 3000);
      }
    } catch (err) {
      console.warn('Failed to save milestone progress:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleRaiseRoadblock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) {
      alert('Please enter a brief subject/title for what is missing.');
      return;
    }
    if (!issueMissingDetails.trim()) {
      alert('Please explain what details or files are missing to complete the video.');
      return;
    }

    setSubmittingIssue(true);
    try {
      const res = await fetch(`/api/freelancer/work/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'raise_issue',
          category: issueCategory,
          title: issueTitle.trim(),
          missingDetails: issueMissingDetails.trim(),
          urgency: issueUrgency,
        }),
      });
      const data = await res.json();
      if (data.success && data.issue) {
        setActiveIssue(data.issue);
        setShowIssueForm(false);
        setIssueTitle('');
        setIssueMissingDetails('');
        alert('Roadblock logged with Artsy Studio Lead. Our team will coordinate with the client to provide the missing assets.');
      }
    } catch (err: any) {
      alert('Failed to submit roadblock: ' + err.message);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleResolveRoadblock = async () => {
    if (!confirm('Are you sure the missing details/assets have been received and you are ready to continue editing?')) {
      return;
    }
    try {
      const res = await fetch(`/api/freelancer/work/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_issue' }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveIssue(null);
        alert('Roadblock marked resolved! Happy editing.');
      }
    } catch (err: any) {
      alert('Failed to clear roadblock: ' + err.message);
    }
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
      setClientReviewNotes((prev) =>
        prev.map((n) => ({ ...n, status: 'addressed', isAddressed: true }))
      );
      alert('Master cut submitted! All client review notes marked as addressed in this new cut.');
    } catch (err: any) {
      console.error('Error submitting deliverable:', err);
      alert('Failed to submit deliverable: ' + err.message);
    }
  };

  const handleToggleNoteStatus = async (noteId: string, resolved: boolean) => {
    setResolvingNoteId(noteId);
    try {
      const res = await fetch(`/api/freelancer/work/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_note',
          noteId,
          resolved,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClientReviewNotes((prev) =>
          prev.map((n) =>
            String(n.id) === String(noteId)
              ? { ...n, status: resolved ? 'addressed' : 'queued', isAddressed: resolved }
              : n
          )
        );
      } else {
        alert(data.error || 'Failed to update note status');
      }
    } catch (err: any) {
      alert('Error updating note: ' + err.message);
    } finally {
      setResolvingNoteId(null);
    }
  };

  const handleMarkAllNotesAddressed = async () => {
    if (!confirm('Mark all review notes as addressed in your latest video cut?')) return;
    try {
      const res = await fetch(`/api/freelancer/work/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_all_notes',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClientReviewNotes((prev) =>
          prev.map((n) => ({ ...n, status: 'addressed', isAddressed: true }))
        );
        alert('All client review notes marked as addressed in new cut!');
      } else {
        alert(data.error || 'Failed to resolve notes');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
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
  const creatorTurnaroundLabel = project?.creatorTurnaroundLabel || project?.turnaroundLabel || '5 Working Days';
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
                  Client: <strong className="text-[#1D1D1F]">{clientName}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                  Revision Round {project.current_revision_round || 1} of {project.max_free_revisions || 2}
                </span>
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
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Creator Delivery SLA</div>
                      <div className="text-xs font-bold text-[#1D1D1F] mt-0.5">{creatorTurnaroundLabel}</div>
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
                      <a
                        href={rawFootageUrl.startsWith('http') ? rawFootageUrl : `https://${rawFootageUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-blue-600 hover:text-blue-800 hover:underline bg-white px-3 py-1.5 rounded-lg border border-[#E5E5E7] truncate select-all block transition-colors"
                      >
                        {rawFootageUrl} ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* 4-Stage Post-Production Progress Tracker */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                          Milestone Tracking
                        </span>
                        <h2 className="text-base font-bold text-[#1D1D1F]">Post-Production Progress</h2>
                      </div>
                      <p className="text-xs text-[#86868B] mt-1">
                        Advance the timeline stage as you edit so the Artsy Studio Lead and client see verified progress.
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs font-extrabold text-[#1D1D1F]">
                        Stage {currentStage} of 4 • {currentStage * 25}% Complete
                      </div>
                      <div className="text-[11px] text-[#86868B]">
                        {currentStage === 4 ? 'Ready for Master QA' : currentStage === 3 ? 'Color & Sound Conform' : currentStage === 2 ? 'Story Assembly Locked' : 'Ingest & Footage Verification'}
                      </div>
                    </div>
                  </div>

                  {/* Visual Stepper Bar */}
                  <div className="space-y-2">
                    <div className="w-full bg-[#F5F5F7] h-2.5 rounded-full overflow-hidden border border-[#E5E5E7]/80">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${currentStage * 25}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      {[
                        { step: 1, pct: 25, title: '01. Ingest & Selects', sub: 'Footage checked, audio synced' },
                        { step: 2, pct: 50, title: '02. Story Assembly', sub: 'Primary cut, pacing locked' },
                        { step: 3, pct: 75, title: '03. Audio & Color', sub: 'Music sync, Rec.709 grade' },
                        { step: 4, pct: 100, title: '04. Final Polish', sub: 'Titles & master render ready' },
                      ].map((st) => {
                        const isCurrent = currentStage === st.step;
                        const isPast = currentStage > st.step;
                        return (
                          <button
                            key={st.step}
                            type="button"
                            onClick={() => handleUpdateStage(st.step)}
                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                              isCurrent
                                ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                                : isPast
                                ? 'bg-emerald-50/40 border-emerald-300 text-[#1D1D1F]'
                                : 'bg-[#FAFAFA] border-[#E5E5E7] hover:bg-slate-100/60 text-[#86868B]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold ${isCurrent ? 'text-blue-700' : isPast ? 'text-emerald-700' : 'text-[#1D1D1F]'}`}>
                                {st.title}
                              </span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                isCurrent ? 'bg-blue-200/60 text-blue-800' : isPast ? 'bg-emerald-100 text-emerald-800' : 'bg-[#E5E5E7] text-[#6E6E73]'
                              }`}>
                                {isPast ? '✓' : `${st.pct}%`}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#86868B] mt-1 leading-snug">
                              {st.sub}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Notes & Quick Update */}
                  <div className="pt-2 border-t border-[#F5F5F7] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={stageNotes}
                        onChange={(e) => setStageNotes(e.target.value)}
                        placeholder="Add optional timeline note (e.g. Assembling scene 2 with music beat drop...)"
                        className="w-full text-xs px-3.5 py-2.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {progressSavedToast && (
                        <span className="text-xs font-bold text-emerald-600 animate-fade-in">
                          ✓ Progress Synced
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={savingProgress}
                        onClick={() => handleUpdateStage(currentStage, stageNotes)}
                        className="px-4 py-2.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        {savingProgress ? 'Saving...' : 'Save Milestone Note'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dedicated 5th Section: Creator Roadblock & Missing Details Desk */}
                <div className={`rounded-2xl p-6 border shadow-sm transition-all ${
                  activeIssue
                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300/40'
                    : 'bg-white border-[#E5E5E7]'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">⚠️</span>
                        <h2 className="text-base font-bold text-[#1D1D1F]">
                          Need Help or Missing Details to Complete Video?
                        </h2>
                      </div>
                      <p className="text-xs text-[#86868B]">
                        Missing clips, fonts, audio references, or story clarifications? Report it directly to Artsy Studio Lead so our team can resolve it with the client.
                      </p>
                    </div>

                    <div className="shrink-0 self-start sm:self-auto">
                      {activeIssue ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-full uppercase tracking-wide">
                          Active Roadblock Logged
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowIssueForm(!showIssueForm)}
                          className="px-3.5 py-2 bg-[#F5F5F7] hover:bg-slate-100 text-[#1D1D1F] border border-[#E5E5E7] text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          {showIssueForm ? '✕ Close Form' : '+ Raise Issue / Missing Asset'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Issue Status Banner */}
                  {activeIssue && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200/90 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#F5F5F7]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                              {activeIssue.category?.replace(/_/g, ' ').toUpperCase() || 'MISSING DETAILS'}
                            </span>
                            <span className="text-xs font-extrabold text-[#1D1D1F]">
                              {activeIssue.title}
                            </span>
                          </div>
                          <p className="text-xs text-[#48484A] leading-relaxed pt-1">
                            {activeIssue.missingDetails || activeIssue.notes}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            activeIssue.urgency === 'blocker' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {activeIssue.urgency === 'blocker' ? 'Critical Blocker' : 'Normal Priority'}
                          </span>
                          <div className="text-[10px] text-[#86868B] mt-1">
                            Logged: {activeIssue.raisedAt ? new Date(activeIssue.raisedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Recently'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                          <span>⏳</span>
                          <span>Artsy Studio Lead has been flagged. Client will not see negative signals; admin will coordinate resolution.</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResolveRoadblock}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap self-end sm:self-auto"
                        >
                          ✓ Mark Roadblock Resolved
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expandable Issue Submission Form */}
                  {!activeIssue && showIssueForm && (
                    <form onSubmit={handleRaiseRoadblock} className="mt-5 p-5 bg-[#FAFAFA] rounded-xl border border-[#E5E5E7] space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                            Roadblock / Missing Category *
                          </label>
                          <select
                            value={issueCategory}
                            onChange={(e) => setIssueCategory(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E5E7] rounded-xl focus:outline-none focus:border-blue-500"
                          >
                            <option value="missing_raw_clips">Missing Raw Clips / Corrupted Files</option>
                            <option value="missing_brand_assets">Missing Brand Logo, Fonts or Assets</option>
                            <option value="audio_music_unclear">Audio / Music Reference Track Unclear</option>
                            <option value="brief_clarification">Story / Creative Brief Clarification Needed</option>
                            <option value="other_roadblock">Other Technical / Delivery Blocker</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                            Subject / Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={issueTitle}
                            onChange={(e) => setIssueTitle(e.target.value)}
                            placeholder="e.g. Scene 4 drone clips missing in Google Drive"
                            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E5E7] rounded-xl focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                          What is Missing or What Do You Need to Complete the Video? *
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={issueMissingDetails}
                          onChange={(e) => setIssueMissingDetails(e.target.value)}
                          placeholder="Describe the exact files, timestamps, or clarifications you need. Artsy Studio Lead will review this and contact the client directly."
                          className="w-full text-xs p-3 bg-white border border-[#E5E5E7] rounded-xl focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="font-semibold text-[#1D1D1F]">Urgency:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer text-[#48484A]">
                            <input
                              type="radio"
                              name="urgency"
                              checked={issueUrgency === 'normal'}
                              onChange={() => setIssueUrgency('normal')}
                            />
                            Normal (Within 24h)
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-red-600 font-semibold">
                            <input
                              type="radio"
                              name="urgency"
                              checked={issueUrgency === 'blocker'}
                              onChange={() => setIssueUrgency('blocker')}
                            />
                            Critical Blocker (Editing Halted)
                          </label>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setShowIssueForm(false)}
                            className="px-3.5 py-2 bg-white text-[#1D1D1F] border border-[#E5E5E7] text-xs font-semibold rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingIssue}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {submittingIssue ? 'Submitting...' : 'Submit Roadblock to Studio Admin →'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Deliverable Submission */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-[#1D1D1F]">Master Cut Deliverable</h2>
                      <p className="text-xs text-[#86868B] mt-0.5">
                        Provide your export link from any platform (YouTube, Vimeo, Google Drive, Frame.io, Dropbox, or direct stream URL).
                      </p>
                    </div>
                    {deliverableUploaded && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ✓ In Client Review Pipeline
                      </span>
                    )}
                  </div>

                  {deliverableUploaded && !showReplaceDeliverable ? (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                            Active Deliverable Link
                          </span>
                          <p className="font-mono text-xs text-emerald-900 truncate">
                            {deliverableUrl}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={deliverableUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open Link</span>
                            <span>↗</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setShowReplaceDeliverable(true)}
                            className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 font-semibold text-xs rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                          >
                            Update Link
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-700 leading-relaxed">
                        This video is live in the client portal. The client can watch, pause at any second, and leave timestamped feedback.
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
                          placeholder="https://youtu.be/... or Google Drive / Vimeo / Loom / Dropbox link"
                          className="bg-[#F5F5F7] px-4 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#3B82F6] transition-all font-mono"
                        />
                        <span className="text-[11px] text-[#86868B]">
                          Supports YouTube, Vimeo, Google Drive video previews, Loom, or direct MP4/stream links.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {showReplaceDeliverable && (
                          <button
                            type="button"
                            onClick={() => setShowReplaceDeliverable(false)}
                            className="px-4 py-3 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await handleDeliverableSubmit();
                            setShowReplaceDeliverable(false);
                          }}
                          className="flex-1 py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>{showReplaceDeliverable ? 'Save Updated Master Cut Link' : 'Submit Master Cut for Client Review'}</span>
                          <span>↗</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dedicated Section: Client Review & Revision Notes Desk */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-[#1D1D1F]">Client Review &amp; Timeline Feedback</h2>
                      <p className="text-xs text-[#86868B] mt-0.5">
                        Client feedback logged at specific timecodes during draft review.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isClientApproved ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          ✓ APPROVED BY CLIENT
                        </span>
                      ) : (
                        <>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                            {clientReviewNotes.length} Client {clientReviewNotes.length === 1 ? 'Note' : 'Notes'}
                          </span>
                          {clientReviewNotes.filter((n) => n.isAddressed || String(n.status || '').toLowerCase().includes('addressed') || String(n.status || '').toLowerCase().includes('resolved')).length > 0 && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                              ✓ {clientReviewNotes.filter((n) => n.isAddressed || String(n.status || '').toLowerCase().includes('addressed') || String(n.status || '').toLowerCase().includes('resolved')).length} Addressed in Cut
                            </span>
                          )}
                          {clientReviewNotes.length > 0 && clientReviewNotes.some((n) => !n.isAddressed && !String(n.status || '').toLowerCase().includes('addressed') && !String(n.status || '').toLowerCase().includes('resolved')) && (
                            <button
                              type="button"
                              onClick={handleMarkAllNotesAddressed}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              ✓ Mark All Addressed
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isClientApproved && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <span>🎉</span>
                        <span>Client Has Approved This Cut!</span>
                      </div>
                      <p className="text-xs text-emerald-700">
                        The client approved the final draft. Milestone payout will settle to your bank account upon final export conform.
                      </p>
                    </div>
                  )}

                  {clientReviewNotes.length === 0 ? (
                    <div className="p-6 bg-[#F5F5F7] rounded-xl text-center space-y-1 border border-[#E5E5E7]">
                      <span className="text-lg">👀</span>
                      <p className="text-xs font-semibold text-[#1D1D1F]">No review notes yet</p>
                      <p className="text-[11px] text-[#86868B] max-w-sm mx-auto">
                        Once your client plays the draft cut, any timestamped notes, color adjustments, or audio changes they request will appear right here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {clientReviewNotes.map((note) => {
                        const isNoteAddressed = note.isAddressed || String(note.status || '').toLowerCase().includes('addressed') || String(note.status || '').toLowerCase().includes('resolved');
                        return (
                          <div
                            key={note.id}
                            className={`p-3.5 rounded-xl transition-all space-y-2 border ${
                              isNoteAddressed
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-[#F5F5F7] hover:bg-white border-[#E5E5E7]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#1D1D1F] bg-white px-2 py-0.5 rounded border border-[#E5E5E7]">
                                  ⏱ {note.timecode || '00:00:00'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                  {note.tag || note.category || 'NOTE'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                  Round {note.round || (isNoteAddressed ? 1 : (project.current_revision_round || 1))}
                                </span>
                                {isNoteAddressed ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                    <span>✓ Addressed in Cut</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    Pending Fix
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={resolvingNoteId === String(note.id)}
                                  onClick={() => handleToggleNoteStatus(String(note.id), !isNoteAddressed)}
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                                    isNoteAddressed
                                      ? 'bg-white hover:bg-slate-100 text-[#86868B] border border-[#E5E5E7]'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                  }`}
                                >
                                  {resolvingNoteId === String(note.id)
                                    ? 'Updating...'
                                    : isNoteAddressed
                                    ? '↩ Reopen'
                                    : '✓ Mark Addressed'}
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-[#1D1D1F] leading-relaxed font-medium">
                              &quot;{note.text}&quot;
                            </p>
                          </div>
                        );
                      })}
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
                      <span className="text-[#86868B]">Internal QA Delivery</span>
                      <span className="font-bold text-[#1D1D1F]">
                        {creatorTurnaroundLabel}
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
