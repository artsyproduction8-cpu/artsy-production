'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, hasAcceptedAgreement, recordAgreementAcceptance, type ArtsyUser } from '@/lib/auth';
import { INITIAL_OPEN_JOBS } from '@/lib/matching/engine';
import {
  logFootageDownload,
  logCheckin,
  logDraftSubmission,
  getProjectActivityLog,
  type ActivityLogEntry,
} from '@/lib/activity/logger';

export default function FreelancerWorkView() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [user, setUser] = useState<ArtsyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<'on_track' | 'missed' | 'escalated' | 'blocked'>('on_track');
  const [checkInMessage, setCheckInMessage] = useState('');
  const [deliverableUploaded, setDeliverableUploaded] = useState(false);
  const [footageDownloaded, setFootageDownloaded] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [ndaChecked, setNdaChecked] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    const fetchWorkData = async () => {
      try {
        // 1. Identify user (Supabase or local session)
        let currentUser: any = null;
        try {
          const { data: { user: sbUser } } = await supabase.auth.getUser();
          currentUser = sbUser;
        } catch {
          // Ignore Supabase connection error in mock mode
        }

        if (!currentUser) {
          currentUser = getCurrentUser();
        }

        if (!currentUser) {
          router.push('/auth/login');
          return;
        }
        setUser(currentUser);

        // 2. Fetch Project (Supabase or fallback to matching mock job)
        let foundProject: any = null;
        try {
          const { data: projectData, error: projectError } = await supabase
            .from('projects')
            .select(`
              *,
              orders:orders_id(
                *,
                services(*),
                clients:client_id(full_name, email)
              )
            `)
            .eq('id', projectId)
            .single();

          if (!projectError && projectData) {
            foundProject = projectData;
            setProject(projectData);
            setOrder(projectData.orders);
            setService(projectData.orders?.services);
          }
        } catch {
          // fallback to mock
        }

        if (!foundProject) {
          // Search mock jobs or create a realistic project wrapper
          const mockJob = INITIAL_OPEN_JOBS.find(j => j.id === projectId) || INITIAL_OPEN_JOBS[0];
          const mockProj = {
            id: projectId || mockJob.id,
            status: 'in_progress',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            raw_footage_url: 'https://vault.artsyproduction.in/b2/raw-footage-secure',
            assigned_creator_id: currentUser.id,
            payoutAmount: mockJob.payoutAmount,
            title: mockJob.title,
            scopeSummary: mockJob.scopeSummary,
            cameraAnglesCount: mockJob.cameraAnglesCount,
          };
          setProject(mockProj);
          setOrder({
            id: `ord_${projectId}`,
            total_amount: mockJob.id === 'job-artsy-101' ? 8000 : 5000,
            clients: { full_name: 'Verified Commercial Client', email: 'client@brand.com' },
          });
          setService({
            name: mockJob.title,
            description: mockJob.scopeSummary,
          });
        }

        // 3. Load activity log
        setActivityLogs(getProjectActivityLog(projectId));
      } catch (err: any) {
        console.error('Error fetching work data:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkData();
  }, [projectId, router]);

  const handleFootageAccess = () => {
    if (!hasAcceptedAgreement(user)) {
      setShowAgreementModal(true);
      return;
    }
    // Log immutable activity event (Tier 2 Refund Trigger)
    logFootageDownload(projectId, user?.id || 'creator', { fileCount: 12, totalSizeMb: 48500 });
    setFootageDownloaded(true);
    setActivityLogs(getProjectActivityLog(projectId));
    window.open(project?.raw_footage_url || 'https://drive.google.com', '_blank');
  };

  const handleSignAgreement = () => {
    recordAgreementAcceptance('both', '1.0');
    setShowAgreementModal(false);
    // Continue with footage download
    logFootageDownload(projectId, user?.id || 'creator', { fileCount: 12, totalSizeMb: 48500 });
    setFootageDownloaded(true);
    setActivityLogs(getProjectActivityLog(projectId));
    window.open(project?.raw_footage_url || 'https://drive.google.com', '_blank');
  };

  const handleDailyCheckIn = async (status: 'on_track' | 'missed' | 'escalated' | 'blocked', message: string) => {
    try {
      // 1. Log immutable audit trail entry
      logCheckin(projectId, user?.id || 'creator', { status, notes: message });
      setActivityLogs(getProjectActivityLog(projectId));

      // 2. Update Supabase if available
      try {
        await supabase
          .from('assignments')
          .update({
            checkin_status: status,
            last_checkin_at: new Date().toISOString(),
          })
          .eq('project_id', projectId)
          .eq('creator_id', user?.id);
      } catch {
        // ignore in mock mode
      }

      setCheckInStatus(status);
      setCheckInMessage(message);

      if (status === 'missed' || status === 'escalated' || status === 'blocked') {
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
    if (!hasAcceptedAgreement(user)) {
      setShowAgreementModal(true);
      return;
    }

    try {
      // 1. Log draft submission (Tier 3 Refund Trigger: 0% refund lock)
      logDraftSubmission(projectId, user?.id || 'creator', {
        version: 1,
        draftUrl: 'https://stream.artsyprod.studio/v/draft-cut-v1',
        notes: 'Initial master draft cut uploaded for QA and client preview.',
      });
      setActivityLogs(getProjectActivityLog(projectId));

      // 2. Update Supabase if available
      try {
        await supabase
          .from('projects')
          .update({
            status: 'submitted',
            actual_delivery: new Date().toISOString(),
          })
          .eq('id', projectId);
      } catch {
        // mock
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-medium text-[#86868B]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] px-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-[#E5E5E7] shadow-sm text-center">
          <h2 className="text-lg font-bold text-[#1D1D1F] mb-2">Workspace Access Error</h2>
          <p className="text-xs text-[#86868B] mb-6">{error}</p>
          <Link
            href="/freelancer"
            className="inline-block px-6 py-2.5 bg-[#1D1D1F] text-white text-xs font-semibold rounded-xl hover:bg-black transition-all"
          >
            Return to Creator Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!project || !user) {
    return null;
  }

  const payoutAmount = project.payoutAmount || 4533;
  const tdsAmount = Math.round(payoutAmount * 0.02); // 2% under Section 194J-Tech
  const netPayout = payoutAmount - tdsAmount;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E7] sticky top-0 z-20">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link href="/freelancer" className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] inline-flex items-center gap-1 mb-1">
                ← Back to Creator Dashboard
              </Link>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1D1D1F]">
                Active Project #{project.id}
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5">
                {service?.name || 'Commercial Video Editing'} • Client: {order?.clients?.full_name || 'Verified Client'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200">
                {project.status?.replace('_', ' ').toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                Project Payout: ₹{payoutAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Creator Agreement Gating Warning (if unsigned) */}
        {!hasAcceptedAgreement(user) && (
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
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap shadow-sm transition-all"
            >
              Sign Pact (1-Click)
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Scope & Actions (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Project Overview Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#1D1D1F]">Editorial Brief &amp; Specs</h2>
                  <p className="text-xs text-[#86868B] mt-1">{service?.description || project.scopeSummary}</p>
                </div>
                <span className="text-xs font-mono font-bold bg-[#F5F5F7] px-2.5 py-1 rounded-lg border border-[#E5E5E7]">
                  {project.cameraAnglesCount || 2} Angles
                </span>
              </div>

              {/* Raw Footage Secure Link */}
              <div className="mt-6 pt-6 border-t border-[#E5E5E7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#F5F5F7]/70 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E5E7] flex items-center justify-center text-lg shadow-sm">
                    📁
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#1D1D1F]">Encrypted Raw Footage Vault</h3>
                    <p className="text-[11px] text-[#86868B]">
                      {footageDownloaded ? '✓ Access logged on immutable platform audit trail' : 'Clicking will record footage download on immutable refund ledger'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleFootageAccess}
                  className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  Access Folder ↗
                </button>
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
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all text-center"
                >
                  ✓ On Track
                </button>
                <button
                  onClick={() => handleDailyCheckIn('missed', 'Delayed start due to rendering queue.')}
                  className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all text-center"
                >
                  ⏳ Delayed Start
                </button>
                <button
                  onClick={() => handleDailyCheckIn('blocked', 'Need clarification from client on audio stem.')}
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold rounded-xl border border-red-200 transition-all text-center"
                >
                  🚫 Blocked
                </button>
                <button
                  onClick={() => handleDailyCheckIn('escalated', 'Technical drive access or corrupt clip.')}
                  className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 transition-all text-center"
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
                Upload your 4K ProRes / MP4 export to your assigned Drive folder, then click submit to trigger Artsy QA review.
              </p>
              {deliverableUploaded ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-emerald-700 font-bold text-sm">✓ Deliverable Submitted to QA Pipeline</span>
                  <p className="text-xs text-emerald-600 mt-1">
                    Client review will open once internal quality checklist passes. Substantial progress logged.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleDeliverableSubmit}
                  className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Submit Draft Cut for QA Review</span>
                  <span>↗</span>
                </button>
              )}
            </div>

            {/* Immutable Activity Audit Trail */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm">
              <h2 className="text-base font-bold text-[#1D1D1F] mb-1">Project Activity Trail</h2>
              <p className="text-xs text-[#86868B] mb-4">
                Cryptographically verifiable, append-only log used for dispute arbitration and refund evidence.
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
                <div className="flex justify-between items-center pb-2 border-b border-[#E5E5E7]">
                  <span className="text-[#86868B]">Project Fee</span>
                  <span className="font-bold text-[#1D1D1F]">₹{payoutAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[#86868B]">
                  <span>Statutory Withholding</span>
                  <span className="text-amber-600">-₹{tdsAmount}</span>
                </div>
                <div className="pt-3 border-t border-[#1D1D1F] flex justify-between items-center">
                  <span className="font-extrabold text-[#1D1D1F]">Net NEFT Settlement</span>
                  <span className="font-extrabold text-emerald-600 text-sm">₹{netPayout.toLocaleString('en-IN')}</span>
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
                  <span className="font-bold text-[#1D1D1F]">5 Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#86868B]">Client Review SLA</span>
                  <span className="font-bold text-[#1D1D1F]">8 Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#86868B]">Change Order Expiry</span>
                  <span className="font-bold text-[#1D1D1F]">48 Hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                className="flex-1 py-3 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Sign &amp; Continue
              </button>
              <button
                onClick={() => setShowAgreementModal(false)}
                className="px-4 py-3 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl"
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