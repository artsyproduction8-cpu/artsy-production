'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, logout } from '@/lib/auth';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [candidatesFilter, setCandidatesFilter] = useState<'all' | 'colorists' | 'editors'>('all');
  const [weddingPrice, setWeddingPrice] = useState<number>(8000);
  const [ugcPrice, setUgcPrice] = useState<number>(4500);
  const [productPrice, setProductPrice] = useState<number>(6000);
  const [creatorSharePct, setCreatorSharePct] = useState<number>(70);
  const [countdown, setCountdown] = useState({ h: 18, m: 42, s: 9 });

  const [approvedCandidates, setApprovedCandidates] = useState<string[]>([]);
  const [rejectedCandidates, setRejectedCandidates] = useState<string[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Record<string, string>>({});
  const [blockedAutoApproveProjects, setBlockedAutoApproveProjects] = useState<string[]>(['AP-8841']);
  const [neftBatchStatus, setNeftBatchStatus] = useState<string | null>(null);

  const toggleAutoApproveBlock = (projectId: string) => {
    setBlockedAutoApproveProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: 59, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleApprove = (name: string, ref: string) => {
    setApprovedCandidates((prev) => [...prev, ref]);
    alert(
      `DISPATCH GATEWAY: Candidate ${name} (${ref}) has been APPROVED. Official onboarding contract & private WhatsApp community link dispatched.`
    );
  };

  const handleRequestReel = (name: string) => {
    alert(
      `TRANSMISSION SENT: Automated WhatsApp notification dispatched to ${name} requesting additional uncompressed timeline export.`
    );
  };

  const handleReject = (name: string, ref: string) => {
    setRejectedCandidates((prev) => [...prev, ref]);
    alert(`DISPATCH GATEWAY: Candidate ${name} archived.`);
  };

  const handleAssign = (orderId: string, candidateName: string) => {
    setAssignedOrders((prev) => ({ ...prev, [orderId]: candidateName }));
    alert(
      `MATCH ENGINE: Order #${orderId} successfully locked and dispatched to ${candidateName}. Ingest credentials synced.`
    );
  };

  const adminName = user?.full_name || 'Studio Director';
  const adminInitials = adminName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

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
              STUDIO ADMINISTRATION &amp; CURATION
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
              className="text-xs font-semibold uppercase px-3.5 py-1.5 rounded-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors"
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
                {adminInitials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex pt-16 w-full max-w-full overflow-x-hidden">
        {/* Left Sidebar: Admin Station Control (w-72 fixed on desktop) */}
        <aside className="hidden lg:flex w-72 fixed left-0 top-16 bottom-0 overflow-y-auto bg-white border-r border-[#E5E5E7] z-40 p-6 flex-col justify-between shadow-xs">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] uppercase font-bold text-[#86868B] tracking-wider">
                Admin Station
              </div>
              <div className="text-sm font-bold text-[#1D1D1F] mt-0.5">{adminName}</div>
              <span className="inline-block mt-1 text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded">
                Executive Access
              </span>
            </div>

            <nav className="flex flex-col space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#3B82F6] px-3 pt-2">
                Operations Desk
              </div>
              <Link
                href="/admin"
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] transition-colors"
              >
                Roster Vetting Queue
              </Link>
              <Link
                href="/admin/freelancers"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Verified Freelancers
              </Link>
              <a
                href="#pricing-matrix"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Pricing &amp; Catalog SLAs
              </a>
              <a
                href="#escrow"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Financial Escrow Vault
              </a>

              <div className="text-[10px] uppercase font-bold text-[#86868B] px-3 pt-5">
                Client Pipelines
              </div>
              <Link
                href="/services"
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
              >
                Production Catalog
              </Link>
              <div
                onClick={() => alert('TELEMETRY: All proxy streaming pipelines operating normally.')}
                className="px-3 py-2 text-xs font-medium rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors cursor-pointer"
              >
                Pipeline Telemetry
              </div>
            </nav>
          </div>

          <div className="pt-4 border-t border-[#F5F5F7] space-y-3">
            <div className="bg-[#F5F5F7] rounded-xl p-3 border border-[#E5E5E7]">
              <div className="text-[11px] font-bold text-[#1D1D1F]">Supervisor Node</div>
              <div className="text-[10px] text-[#86868B] mt-0.5">TLS 1.3 Audit Logged</div>
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
            
            {/* KPI CONTROL STRIP */}
            <div className="p-6 md:p-8 pb-0 max-w-7xl w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* METRIC 01 */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] uppercase font-bold text-[#86868B]">
                      Creator Inflow
                    </span>
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full">
                      Queue Active
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-3">
                    <div className="text-4xl text-[#1D1D1F] font-extrabold">14</div>
                    <div className="text-xs text-[#3B82F6] font-semibold">+3 in 1h</div>
                  </div>
                  <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-[#86868B] text-xs">
                    <span>Pending Verification</span>
                    <span className="font-semibold text-[#1D1D1F]">4 Expedited</span>
                  </div>
                </div>

                {/* METRIC 02 */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] uppercase font-bold text-[#86868B]">
                      Dispatch Slate
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-ping"></span>
                  </div>
                  <div className="my-3 flex items-baseline gap-3">
                    <div className="text-4xl text-[#1D1D1F] font-extrabold">08</div>
                    <div className="text-xs text-[#3B82F6] font-semibold">Unassigned</div>
                  </div>
                  <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-[#86868B] text-xs">
                    <span>Value Exposure</span>
                    <span className="font-semibold text-[#1D1D1F]">₹1,42,000 INR</span>
                  </div>
                </div>

                {/* METRIC 03 */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] uppercase font-bold text-[#86868B]">
                      SLA Timer Watch
                    </span>
                    <span className="text-xs text-amber-600 font-bold">● Active</span>
                  </div>
                  <div className="my-3 flex items-baseline gap-2">
                    <div className="text-3xl font-mono text-[#1D1D1F] font-bold">
                      {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:
                      {String(countdown.s).padStart(2, '0')}
                    </div>
                    <div className="text-[11px] text-[#86868B]">Remaining</div>
                  </div>
                  <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-[#86868B] text-xs">
                    <span>24h Gateway Breach</span>
                    <span className="text-emerald-600 font-semibold">0 Risk</span>
                  </div>
                </div>

                {/* METRIC 04 */}
                <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] uppercase font-bold text-[#86868B]">
                      Match Accuracy
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] font-bold rounded-full">
                      v4.8
                    </span>
                  </div>
                  <div className="my-3 flex items-baseline gap-3">
                    <div className="text-4xl text-[#1D1D1F] font-extrabold">94%</div>
                    <div className="text-xs text-emerald-600 font-semibold">High Fit</div>
                  </div>
                  <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-[#86868B] text-xs">
                    <span>Routing Threshold</span>
                    <span className="font-semibold text-[#1D1D1F]">&gt;85% Match</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN OPERATIONAL WORKSPACE (2-COLUMN SPLIT) */}
            <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT MASTER PANEL: CANDIDATE VETTING MATRIX (6 Cols) */}
                <div className="lg:col-span-6 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col">
                  {/* SUB-HEADER BAR */}
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#F5F5F7] gap-2 mb-4">
                    <div>
                      <h2 className="text-base font-bold text-[#1D1D1F]">
                        Candidate Vetting Matrix
                      </h2>
                      <span className="text-xs text-[#86868B]">
                        14 Candidates Queued
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setCandidatesFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          candidatesFilter === 'all'
                            ? 'bg-[#1D1D1F] text-white'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E2E1]'
                        }`}
                      >
                        All (14)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCandidatesFilter('colorists')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          candidatesFilter === 'colorists'
                            ? 'bg-[#1D1D1F] text-white'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E2E1]'
                        }`}
                      >
                        Colorists (6)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCandidatesFilter('editors')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          candidatesFilter === 'editors'
                            ? 'bg-[#1D1D1F] text-white'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E2E1]'
                        }`}
                      >
                        Editors (8)
                      </button>
                    </div>
                  </div>

                  {/* CANDIDATE CARDS LIST */}
                  <div className="space-y-4 overflow-y-auto max-h-[750px] pr-1">
                    {/* APPLICANT #01 */}
                    {!rejectedCandidates.includes('C-904') && (
                      <div className="p-5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#1D1D1F] text-white font-extrabold text-base flex items-center justify-center">
                              KV
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-0.5 rounded-full font-bold">
                                  REF #C-904
                                </span>
                                <span className="text-xs text-[#86868B]">14 mins ago</span>
                              </div>
                              <div className="text-sm font-bold text-[#1D1D1F] mt-0.5">
                                Karanveer V. • New Delhi
                              </div>
                              <div className="text-xs text-[#86868B]">
                                Exp: 6.5 Years • Commercial &amp; Wedding Cinema
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            Score: 96/100
                          </span>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {['DaVinci Studio 19', 'Premiere Pro', 'Blender 3D', 'ACES Workflow'].map((tool) => (
                            <span key={tool} className="text-[11px] px-2.5 py-1 bg-white rounded-lg border border-[#E5E5E7] font-medium text-[#1D1D1F]">
                              {tool}
                            </span>
                          ))}
                        </div>

                        {/* Mini Reel Strip */}
                        <div className="grid grid-cols-3 gap-2 bg-white rounded-xl border border-[#E5E5E7] p-2">
                          <div className="bg-[#1D1D1F] rounded-lg aspect-video flex flex-col justify-between p-2 text-white text-[10px]">
                            <span>▶</span>
                            <span className="font-semibold truncate">Wedding // 4K</span>
                          </div>
                          <div className="bg-[#1D1D1F] rounded-lg aspect-video flex flex-col justify-between p-2 text-white text-[10px]">
                            <span>▶</span>
                            <span className="font-semibold truncate">Pulse Drop // Reel</span>
                          </div>
                          <div className="bg-[#1D1D1F] rounded-lg aspect-video flex flex-col justify-between p-2 text-white text-[10px]">
                            <span>▶</span>
                            <span className="font-semibold truncate">Fragrance // Comm</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {approvedCandidates.includes('C-904') ? (
                            <div className="col-span-3 p-2.5 bg-emerald-50 text-emerald-700 text-center text-xs font-bold rounded-xl border border-emerald-200">
                              Approved &amp; Contract Dispatched ✓
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove('Karanveer V.', 'C-904')}
                                className="text-xs font-semibold py-2 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                Approve &amp; WA
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestReel('Karanveer V.')}
                                className="text-xs font-semibold py-2 px-3 bg-white text-[#1D1D1F] rounded-xl border border-[#E5E5E7] hover:bg-[#F5F5F7] transition-all cursor-pointer"
                              >
                                Request Reel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject('Karanveer V.', 'C-904')}
                                className="text-xs font-semibold py-2 px-3 bg-white text-red-600 rounded-xl border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* APPLICANT #02 */}
                    {!rejectedCandidates.includes('C-905') && (
                      <div className="p-5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#1D1D1F] text-white font-extrabold text-base flex items-center justify-center">
                              AS
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-0.5 rounded-full font-bold">
                                  REF #C-905
                                </span>
                                <span className="text-xs text-[#86868B]">42 mins ago</span>
                              </div>
                              <div className="text-sm font-bold text-[#1D1D1F] mt-0.5">
                                Ananya S. • Bengaluru
                              </div>
                              <div className="text-xs text-[#86868B]">
                                Exp: 4.2 Years • Social UGC &amp; Performance Cuts
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#3B82F6] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                            Score: 88/100
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {['Premiere Pro', 'After Effects', 'CapCut Pro', 'Sound Design'].map((tool) => (
                            <span key={tool} className="text-[11px] px-2.5 py-1 bg-white rounded-lg border border-[#E5E5E7] font-medium text-[#1D1D1F]">
                              {tool}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#E5E5E7]">
                          <span className="text-xs font-mono text-[#86868B] truncate">
                            vimeo.com/ananya-edits/commercial-reel-2024
                          </span>
                          <span className="ml-auto text-xs text-[#3B82F6] font-semibold cursor-pointer">
                            Verify ↗
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {approvedCandidates.includes('C-905') ? (
                            <div className="col-span-3 p-2.5 bg-emerald-50 text-emerald-700 text-center text-xs font-bold rounded-xl border border-emerald-200">
                              Approved &amp; Contract Dispatched ✓
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove('Ananya S.', 'C-905')}
                                className="text-xs font-semibold py-2 px-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                Approve &amp; WA
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRequestReel('Ananya S.')}
                                className="text-xs font-semibold py-2 px-3 bg-white text-[#1D1D1F] rounded-xl border border-[#E5E5E7] hover:bg-[#F5F5F7] transition-all cursor-pointer"
                              >
                                Request Reel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject('Ananya S.', 'C-905')}
                                className="text-xs font-semibold py-2 px-3 bg-white text-red-600 rounded-xl border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT MASTER PANEL: MATCHING & DISPATCH (6 Cols) */}
                <div id="matching" className="lg:col-span-6 min-w-0 bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col">
                  {/* SUB-HEADER BAR */}
                  <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#F5F5F7] gap-2 mb-4">
                    <div>
                      <h2 className="text-base font-bold text-[#1D1D1F]">
                        Manual Assignment &amp; Project Dispatch
                      </h2>
                      <span className="text-xs text-[#86868B]">
                        08 Unassigned Orders • Master Plan §15.1 V1 Scope
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Manual Dispatch Active
                    </span>
                  </div>

                  {/* INCOMING PROJECT STACK */}
                  <div className="space-y-4 overflow-y-auto max-h-[750px] pr-1">
                    {/* PROJECT CARD 01 */}
                    <div className="p-5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-bold rounded-full">
                              ORDER #AP-8841
                            </span>
                            <span className="text-xs text-[#86868B]">Paid ₹8,000 INR • Standard SLA (24h Offer Window)</span>
                          </div>
                          <h3 className="text-sm font-bold text-[#1D1D1F] mt-1">
                            Udaipur Palace Royal Wedding 4K Multi-Cam
                          </h3>
                          <p className="text-xs text-[#86868B] mt-0.5">
                            Customer: Oberoi &amp; Singhania Media • 3 Cams (Sony FX6 + FX3)
                          </p>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-[#E5E5E7] text-center min-w-[90px]">
                          <div className="text-[10px] uppercase font-bold text-[#86868B]">CURATION FIT</div>
                          <div className="text-2xl font-extrabold text-[#3B82F6]">Top</div>
                        </div>
                      </div>

                      {/* CURATION RATIONALE */}
                      <div className="p-3.5 bg-white rounded-xl border border-[#E5E5E7]">
                        <div className="text-xs text-[#1D1D1F] leading-relaxed">
                          <strong className="text-[#3B82F6]">Director Assessment:</strong> Candidate Karanveer V. has verified S-Log3 color science reel, confirmed Sony multi-cam sync workflow, and currently holds 0 active project load.
                        </div>
                      </div>

                      {/* RECOMMENDED ASSIGNMENT */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-[#E5E5E7] p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white text-xs font-bold flex items-center justify-center">
                            KV
                          </div>
                          <div className="text-xs font-semibold text-[#1D1D1F]">
                            {assignedOrders['AP-8841']
                              ? `Assigned to: ${assignedOrders['AP-8841']}`
                              : 'Karanveer V. (Verified DaVinci Colorist)'}
                          </div>
                        </div>
                        <span className="text-xs text-[#86868B]">
                          {assignedOrders['AP-8841'] ? 'Offer Dispatched' : 'Pending Manual Assignment'}
                        </span>
                      </div>

                      {/* DISPATCH CONTROLS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {assignedOrders['AP-8841'] ? (
                          <div className="col-span-2 p-2.5 bg-blue-50 text-blue-700 text-center text-xs font-bold rounded-xl border border-blue-200">
                            Dispatched to {assignedOrders['AP-8841']} (24h acceptance timeout started) ✓
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAssign('AP-8841', 'Karanveer V.')}
                              className="text-xs font-semibold py-2.5 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              Dispatch Job Offer (24h Window)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAssign('AP-8841', 'Internal Studio Lead')}
                              className="text-xs font-semibold py-2.5 px-4 bg-white text-[#1D1D1F] rounded-xl border border-[#E5E5E7] hover:bg-[#F5F5F7] transition-all cursor-pointer"
                            >
                              In-House Edit Override
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SERVICE & PRICING RULE MATRIX */}
              {(() => {
                const config = { creatorSharePct, artsySharePct: 100 - creatorSharePct };
                const weddingWaterfall = calculateFinancialWaterfall(weddingPrice * 100, config);
                const ugcWaterfall = calculateFinancialWaterfall(ugcPrice * 100, config);
                const productWaterfall = calculateFinancialWaterfall(productPrice * 100, config);

                return (
                  <div id="pricing-matrix" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#F5F5F7] gap-4 mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-[#1D1D1F]">
                          Base Pricing &amp; Revenue Waterfall Rules
                        </h3>
                        <p className="text-xs text-[#86868B] mt-0.5">
                          Post GST, Gateway &amp; Cloud Infra split: {creatorSharePct}% Creator / {100 - creatorSharePct}% Artsy Studio
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-[#F5F5F7] p-3 rounded-xl border border-[#E5E5E7]">
                        <span className="text-xs font-semibold text-[#1D1D1F]">Creator Split:</span>
                        <input
                          type="range"
                          min="50"
                          max="90"
                          step="1"
                          value={creatorSharePct}
                          onChange={(e) => setCreatorSharePct(Number(e.target.value))}
                          className="accent-[#3B82F6] h-2 bg-white rounded-full cursor-pointer w-28"
                        />
                        <span className="text-xs font-extrabold text-[#3B82F6] w-10 text-right">{creatorSharePct}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* WEDDING */}
                      <div className="p-5 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1D1D1F]">Wedding Cinema</span>
                          <span className="text-sm font-extrabold text-[#3B82F6]">
                            ₹{weddingPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="5000"
                          max="15000"
                          step="500"
                          value={weddingPrice}
                          onChange={(e) => setWeddingPrice(Number(e.target.value))}
                          className="w-full accent-[#3B82F6] h-2 bg-white rounded-full cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>Min ₹5,000</span>
                          <span>Max ₹15,000</span>
                        </div>
                        <div className="pt-2 border-t border-[#E5E5E7] text-[10px] space-y-0.5">
                          <div className="flex justify-between text-[#86868B]">
                            <span>Available Split:</span>
                            <span className="font-semibold text-[#1D1D1F]">₹{Math.round(weddingWaterfall.availableForSplit / 100).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600">
                            <span>Creator ({creatorSharePct}%):</span>
                            <span className="font-bold">₹{Math.round(weddingWaterfall.creatorAmount / 100).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[#3B82F6]">
                            <span>Studio ({100 - creatorSharePct}%):</span>
                            <span className="font-semibold">₹{Math.round(weddingWaterfall.artsyAmount / 100).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* UGC / BRAND */}
                      <div className="p-5 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1D1D1F]">UGC / Brand</span>
                          <span className="text-sm font-extrabold text-[#3B82F6]">
                            ₹{ugcPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2500"
                          max="10000"
                          step="500"
                          value={ugcPrice}
                          onChange={(e) => setUgcPrice(Number(e.target.value))}
                          className="w-full accent-[#3B82F6] h-2 bg-white rounded-full cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>Min ₹2,500</span>
                          <span>Max ₹10,000</span>
                        </div>
                        <div className="pt-2 border-t border-[#E5E5E7] text-[10px] space-y-0.5">
                          <div className="flex justify-between text-[#86868B]">
                            <span>Available Split:</span>
                            <span className="font-semibold text-[#1D1D1F]">₹{Math.round(ugcWaterfall.availableForSplit / 100).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600">
                            <span>Creator ({creatorSharePct}%):</span>
                            <span className="font-bold">₹{Math.round(ugcWaterfall.creatorAmount / 100).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[#3B82F6]">
                            <span>Studio ({100 - creatorSharePct}%):</span>
                            <span className="font-semibold">₹{Math.round(ugcWaterfall.artsyAmount / 100).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* PRODUCT */}
                      <div className="p-5 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1D1D1F]">Product &amp; Commercial</span>
                          <span className="text-sm font-extrabold text-[#3B82F6]">
                            ₹{productPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="3500"
                          max="12000"
                          step="500"
                          value={productPrice}
                          onChange={(e) => setProductPrice(Number(e.target.value))}
                          className="w-full accent-[#3B82F6] h-2 bg-white rounded-full cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-[#86868B]">
                          <span>Min ₹3,500</span>
                          <span>Max ₹12,000</span>
                        </div>
                        <div className="pt-2 border-t border-[#E5E5E7] text-[10px] space-y-0.5">
                          <div className="flex justify-between text-[#86868B]">
                            <span>Available Split:</span>
                            <span className="font-semibold text-[#1D1D1F]">₹{Math.round(productWaterfall.availableForSplit / 100).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-600">
                            <span>Creator ({creatorSharePct}%):</span>
                            <span className="font-bold">₹{Math.round(productWaterfall.creatorAmount / 100).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[#3B82F6]">
                            <span>Studio ({100 - creatorSharePct}%):</span>
                            <span className="font-semibold">₹{Math.round(productWaterfall.artsyAmount / 100).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* FINANCIAL ESCROW VAULT & DOUBLE-ENTRY LEDGER */}
              <div id="escrow" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] mt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#F5F5F7] gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="text-lg font-bold text-[#1D1D1F]">
                        Financial Escrow Vault &amp; Double-Entry Ledger
                      </h3>
                    </div>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Statutory GST extraction, 2% + GST gateway reserve, cloud infra retention, and dynamic creator-platform waterfall.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      ✓ Ledger Balanced (Debits = Credits)
                    </span>
                  </div>
                </div>

                {/* Ledger Breakdown Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase">Gross Client Inflow</span>
                    <div className="text-lg font-extrabold text-[#1D1D1F] mt-1">₹1,42,000</div>
                    <span className="text-[10px] text-blue-600 font-semibold">14 Active Projects</span>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase">18% GST Reserved</span>
                    <div className="text-lg font-extrabold text-amber-700 mt-1">₹21,661</div>
                    <span className="text-[10px] text-[#86868B]">CBIC Filing Ready</span>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase">Gateway (2% + GST)</span>
                    <div className="text-lg font-extrabold text-[#1D1D1F] mt-1">₹3,351</div>
                    <span className="text-[10px] text-[#86868B]">Razorpay / Stripe</span>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase">Cloud Infra Fund</span>
                    <div className="text-lg font-extrabold text-[#1D1D1F] mt-1">₹1,610</div>
                    <span className="text-[10px] text-[#86868B]">₹115 / Active Project</span>
                  </div>
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Creator Payout Pool</span>
                    <div className="text-lg font-extrabold text-emerald-700 mt-1">₹{Math.round((115378 * creatorSharePct) / 100).toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">{creatorSharePct}% Post-Deduction</span>
                  </div>
                  <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-800 uppercase">Artsy Studio Margin</span>
                    <div className="text-lg font-extrabold text-[#3B82F6] mt-1">₹{Math.round((115378 * (100 - creatorSharePct)) / 100).toLocaleString('en-IN')}</div>
                    <span className="text-[10px] text-blue-600 font-semibold">{100 - creatorSharePct}% Net Retained</span>
                  </div>
                </div>

                {/* TWO-COLUMN OPERATIONAL CONTROLS: Change Orders & Dispute Arbitration */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-[#F5F5F7]">
                  {/* Change Orders Desk (6 cols) */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                        Active Scope Change Orders (48h SLA)
                      </h4>
                      <span className="text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-0.5 rounded-full">
                        2 In Flight
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-[#3B82F6]">CO-8841-REV</span>
                            <h5 className="text-xs font-bold text-[#1D1D1F] mt-0.5">Round 3 Retake Revisions (Project AP-8841)</h5>
                            <p className="text-[11px] text-[#86868B]">Client requested color grade alternative past included 2 passes</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#1D1D1F]">+₹1,500 INR</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E7] text-[10px]">
                          <span className="text-amber-600 font-semibold">⏳ Expires in 38h 14m</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold">
                            Pending Client Acceptance
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-[#3B82F6]">CO-102-RUSH</span>
                            <h5 className="text-xs font-bold text-[#1D1D1F] mt-0.5">Rush Turnaround 24h SLA (Project AP-102)</h5>
                            <p className="text-[11px] text-[#86868B]">Expedited queue processing authorized by fintech customer</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-[#1D1D1F]">+₹2,000 INR</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E7] text-[10px]">
                          <span className="text-emerald-600 font-semibold">✓ Paid &amp; Escrowed</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">
                            Accepted by Client
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dispute Arbitration Desk (6 cols) */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                        Dispute &amp; 3-Tier Refund Arbitration
                      </h4>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        1 Active Claim
                      </span>
                    </div>

                    <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-red-600">CLAIM #DISP-984</span>
                          <h5 className="text-xs font-bold text-[#1D1D1F] mt-0.5">Project AP-8841: Client Cancellation Request</h5>
                          <p className="text-[11px] text-[#86868B]">Client Reason: &quot;Marketing campaign pivot; no longer require wedding cut.&quot;</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-[#1D1D1F]">₹8,000 INR</span>
                          <div className="text-[10px] text-[#86868B]">Gross Paid</div>
                        </div>
                      </div>

                      {/* Evidence Trail */}
                      <div className="p-3 bg-white rounded-xl border border-[#E5E5E7] space-y-1.5 text-xs">
                        <div className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1">
                          Immutable Evidence Audit Trail:
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#86868B]">1. Footage Downloaded by Creator:</span>
                          <span className="text-emerald-600 font-bold">✓ YES (10:24 AM, IP verified)</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#86868B]">2. Daily Check-In Submitted:</span>
                          <span className="text-emerald-600 font-bold">✓ YES (On Track logged)</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#86868B]">3. Master Draft Cut Uploaded:</span>
                          <span className="text-amber-600 font-bold">⏳ IN PROGRESS (Rough Cut)</span>
                        </div>
                      </div>

                      {/* Evaluated Outcome */}
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-amber-900">Evaluated Tier: Tier 2 (STARTED)</span>
                          <p className="text-[10px] text-amber-700">50% Client Refund (₹4,000) • 50% Creator Compensation (₹4,000)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert('ARBITRATION SETTLED: Executed Tier 2 50% refund (₹4,000 to Client, ₹4,000 released to Creator Karanveer V.). Audit logged.')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          Execute Tier 2 (50%)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHASE 9: STATUTORY COMPLIANCE, BATCH NEFT PAYOUTS & WORM INVOICE VAULT */}
              <div id="payouts-statutory" className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] mt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-[#F5F5F7] gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <h3 className="text-lg font-bold text-[#1D1D1F]">
                        Statutory Compliance, Batch NEFT Payouts &amp; WORM Vault
                      </h3>
                    </div>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Section 194J-Tech TDS (2%), Corporate Banking NEFT generation, Rule 46 GST Vault (72-Month Lock), and GSTR-1 CBIC exports.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="/api/financial/gstr1-export"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] border border-[#DCDFE3] rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>📥</span>
                      <span>Export GSTR-1 JSON</span>
                    </a>
                    <a
                      href="/api/admin/payouts/batch-neft"
                      download
                      className="px-3.5 py-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>🏦</span>
                      <span>Download Batch NEFT (.csv)</span>
                    </a>
                  </div>
                </div>

                {/* Subgrid: NEFT Batch Table & Auto-Approve Support Hold Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Pending Creator Payout Queue (7 cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                        Pending Creator Payout Approvals (70% Net Share)
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Default TDS: 2.0% Section 194J-Tech
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-[#E5E5E7] rounded-xl bg-[#F5F5F7]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#E5E5E7] bg-white text-[#86868B] font-mono text-[10px]">
                            <th className="py-2.5 px-3">CREATOR</th>
                            <th className="py-2.5 px-2">GROSS (70%)</th>
                            <th className="py-2.5 px-2">TDS (2%)</th>
                            <th className="py-2.5 px-2">NET PAYOUT</th>
                            <th className="py-2.5 px-2">BANK / IFSC</th>
                            <th className="py-2.5 px-3 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          <tr className="hover:bg-white/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-[#1D1D1F]">
                              Kabir Verma
                              <div className="text-[10px] text-[#86868B] font-mono">AP-8841 (Udaipur Palace)</div>
                            </td>
                            <td className="py-2.5 px-2 font-mono">₹4,613.60</td>
                            <td className="py-2.5 px-2 font-mono text-amber-700">-₹92.27</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-emerald-700">₹4,521.33</td>
                            <td className="py-2.5 px-2 text-[10px] text-[#86868B]">
                              HDFC Bank<br />
                              <span className="font-mono">...1234 (HDFC0000128)</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[10px] font-bold">
                                Approved
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-white/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-[#1D1D1F]">
                              Aanya Sen
                              <div className="text-[10px] text-[#86868B] font-mono">AP-8842 (Brand UGC)</div>
                            </td>
                            <td className="py-2.5 px-2 font-mono">₹2,883.50</td>
                            <td className="py-2.5 px-2 font-mono text-amber-700">-₹57.67</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-emerald-700">₹2,825.83</td>
                            <td className="py-2.5 px-2 text-[10px] text-[#86868B]">
                              ICICI Bank<br />
                              <span className="font-mono">...4930 (ICIC0000009)</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-[10px] font-bold">
                                Approved
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-white/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-[#1D1D1F]">
                              Rohan Mehra
                              <div className="text-[10px] text-[#86868B] font-mono">AP-8843 (3D Watch Reel)</div>
                            </td>
                            <td className="py-2.5 px-2 font-mono">₹5,767.01</td>
                            <td className="py-2.5 px-2 font-mono text-amber-700">-₹115.34</td>
                            <td className="py-2.5 px-2 font-mono font-bold text-emerald-700">₹5,651.67</td>
                            <td className="py-2.5 px-2 text-[10px] text-[#86868B]">
                              Axis Bank<br />
                              <span className="font-mono">...9381 (UTIB0000451)</span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-[10px] font-bold">
                                In Batch
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {neftBatchStatus && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                        {neftBatchStatus}
                      </div>
                    )}
                  </div>

                  {/* Right: Auto-Approval Support Hold & WORM Vault Desk (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Auto-Approve Support Hold Matrix (Audit Issue #17) */}
                    <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                          Auto-Approve Support Hold Matrix (§6.7)
                        </h4>
                        <span className="text-[10px] text-[#86868B]">Audit Issue #17</span>
                      </div>
                      <p className="text-[11px] text-[#86868B]">
                        Prevent Day-7 auto-approval when clients email support or call outside the platform during review.
                      </p>

                      <div className="space-y-2 pt-1">
                        <div className="p-2.5 bg-white rounded-lg border border-[#E5E5E7] flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono font-bold text-[#1D1D1F]">AP-8841</span>
                            <span className="text-[10px] text-[#86868B] ml-2">Day 4 of 7</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAutoApproveBlock('AP-8841')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              blockedAutoApproveProjects.includes('AP-8841')
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {blockedAutoApproveProjects.includes('AP-8841')
                              ? '🛑 Auto-Approve BLOCKED (Support Hold)'
                              : '✓ 7-Day Auto-Approve ACTIVE'}
                          </button>
                        </div>

                        <div className="p-2.5 bg-white rounded-lg border border-[#E5E5E7] flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono font-bold text-[#1D1D1F]">AP-102</span>
                            <span className="text-[10px] text-[#86868B] ml-2">Day 2 of 7</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAutoApproveBlock('AP-102')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              blockedAutoApproveProjects.includes('AP-102')
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {blockedAutoApproveProjects.includes('AP-102')
                              ? '🛑 Auto-Approve BLOCKED (Support Hold)'
                              : '✓ 7-Day Auto-Approve ACTIVE'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Statutory WORM Invoices & Credit Notes Quick Access */}
                    <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                          Statutory WORM Invoices &amp; Credit Notes
                        </span>
                        <span className="text-[10px] text-blue-600 font-mono">72-Month WORM</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <a
                          href="/api/invoices/AP-8841"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-white hover:bg-blue-50 border border-[#E5E5E7] hover:border-blue-300 rounded-lg text-center font-semibold text-[#1D1D1F] transition-all"
                        >
                          📄 View Rule 46 Tax Invoice
                        </a>
                        <Link
                          href="/grievance"
                          className="p-2.5 bg-white hover:bg-blue-50 border border-[#E5E5E7] hover:border-blue-300 rounded-lg text-center font-semibold text-[#1D1D1F] transition-all"
                        >
                          🛡️ DPDP Grievance Portal
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}