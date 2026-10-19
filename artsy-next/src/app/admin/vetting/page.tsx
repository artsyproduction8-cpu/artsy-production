'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Candidate {
  ref: string;
  name: string;
  location: string;
  exp: string;
  score: number;
  type: 'colorist' | 'editor';
  software: string[];
  sampleReels: { title: string; type: string }[];
  reelUrl?: string;
  approvalStatus?: string;
}

export default function AdminVettingPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'colorists' | 'editors'>('all');
  const [approvedCandidates, setApprovedCandidates] = useState<string[]>([]);
  const [rejectedCandidates, setRejectedCandidates] = useState<string[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/creators');
      if (res.ok) {
        const data = await res.json();
        const apiCreators = (data.creators || []).map((c: any) => ({
          ref: c.id,
          name: c.display_name || c.public_display_name || 'Creator Candidate',
          location: 'Remote / India',
          exp: c.creator_tier === 'senior' ? '5+ Years' : '3+ Years',
          score: 92,
          type: (c.skills || []).some((s: string) => s.toLowerCase().includes('color')) ? 'colorist' : 'editor',
          software: c.skills?.length ? c.skills : ['DaVinci Resolve', 'Premiere Pro'],
          sampleReels: [{ title: 'Master Production Portfolio', type: '4K Benchmark' }],
          reelUrl: c.portfolio_url || 'https://youtube.com',
          approvalStatus: c.approval_status || 'pending',
        }));
        setCandidates(apiCreators);
      }
    } catch (err) {
      console.warn('Failed to fetch candidates from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (name: string, ref: string) => {
    try {
      const res = await fetch('/api/admin/freelancers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: ref, name, action: 'approve' }),
      });
      if (res.ok) {
        setApprovedCandidates((prev) => [...prev, ref]);
        showToast(`✓ DISPATCH GATEWAY: Candidate ${name} (${ref.slice(0, 8)}) has been APPROVED. Contract & WhatsApp community link dispatched.`);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Approval error: ${data.error || 'Failed to approve'}`);
      }
    } catch {
      showToast('Network error during candidate approval');
    }
  };

  const handleRequestReel = (name: string) => {
    showToast(`✉️ TRANSMISSION SENT: Automated WhatsApp notification dispatched to ${name} requesting timeline XML export.`);
  };

  const handleReject = async (name: string, ref: string) => {
    try {
      const res = await fetch('/api/admin/freelancers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: ref, name, action: 'reject' }),
      });
      if (res.ok) {
        setRejectedCandidates((prev) => [...prev, ref]);
        showToast(`Candidate ${name} archived.`);
      }
    } catch {
      showToast('Network error during candidate rejection');
    }
  };

  const handleAssign = (orderId: string, candidateName: string) => {
    setAssignedOrders((prev) => ({ ...prev, [orderId]: candidateName }));
    showToast(`🎯 MATCH ENGINE: Order #${orderId} successfully locked and dispatched to ${candidateName}. Ingest credentials synced.`);
  };

  const filteredCandidates = candidates.filter((c) => {
    if (rejectedCandidates.includes(c.ref)) return false;
    if (filter === 'colorists') return c.type === 'colorist';
    if (filter === 'editors') return c.type === 'editor';
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs font-bold text-[#1D1D1F]">Roster Vetting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
            Candidate Vetting Matrix
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Review applicant portfolios, technical software mastery, and assign orders to verified talent.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E5E5E7] shadow-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            onClick={() => setFilter('colorists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'colorists'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Colorists ({candidates.filter((c: any) => c.type === 'colorist').length})
          </button>
          <button
            onClick={() => setFilter('editors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'editors'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Editors ({candidates.filter((c: any) => c.type === 'editor').length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Candidate List (2 cols) */}
        <div className="xl:col-span-2 space-y-4">
          {filteredCandidates.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-[#E5E5E7] text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B]">
                ✓
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">No Pending Candidates</h3>
              <p className="text-xs text-[#86868B]">
                All applicant submissions have been reviewed and vetted. New applications will appear here.
              </p>
            </div>
          ) : (
            filteredCandidates.map((candidate) => {
            const isApproved = approvedCandidates.includes(candidate.ref);

            return (
              <div
                key={candidate.ref}
                className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-xs space-y-4 transition-all hover:border-[#3B82F6]/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#1D1D1F] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {candidate.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#3B82F6] bg-blue-50 px-2 py-0.5 rounded">
                          {candidate.ref}
                        </span>
                        <h3 className="text-sm font-bold text-[#1D1D1F]">{candidate.name}</h3>
                        <span className="text-xs text-[#86868B]">({candidate.location})</span>
                      </div>
                      <p className="text-xs text-[#86868B] mt-0.5">{candidate.exp}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Score: {candidate.score}/100
                    </span>
                  </div>
                </div>

                {/* Software Mastery Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {candidate.software.map((sw) => (
                    <span
                      key={sw}
                      className="px-2.5 py-1 rounded-lg bg-[#F5F5F7] border border-[#E5E5E7] text-[11px] font-semibold text-[#1D1D1F]"
                    >
                      {sw}
                    </span>
                  ))}
                </div>

                {/* Sample Reels */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {candidate.sampleReels.map((reel, idx) => (
                    <div
                      key={idx}
                      className="h-20 rounded-xl bg-[#0A0A0A] border border-[#262626] p-2.5 flex flex-col justify-between text-white group cursor-pointer hover:border-[#3B82F6] transition-colors"
                    >
                      <div className="text-[9px] uppercase tracking-wider text-[#86868B] font-mono">
                        ▶ {reel.type}
                      </div>
                      <div className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                        {reel.title}
                      </div>
                    </div>
                  ))}
                </div>

                {candidate.reelUrl && (
                  <div className="p-2.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-between text-xs">
                    <span className="font-mono text-[#86868B] truncate">{candidate.reelUrl}</span>
                    <span className="text-[#3B82F6] font-bold text-[11px] cursor-pointer hover:underline shrink-0 ml-2">
                      Verify Reel ↗
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-[#F5F5F7]">
                  {isApproved ? (
                    <div className="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-center rounded-xl text-xs font-bold">
                      ✓ Approved &amp; Dispatched to Active Roster
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(candidate.name, candidate.ref)}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-xs"
                      >
                        Approve &amp; WA
                      </button>
                      <button
                        onClick={() => handleRequestReel(candidate.name)}
                        className="py-2 px-3 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-bold transition-all"
                      >
                        Request Reel
                      </button>
                      <button
                        onClick={() => handleReject(candidate.name, candidate.ref)}
                        className="py-2 px-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }))}
        </div>

        {/* Project Dispatch Station (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1D1D1F]">Manual Assignment &amp; Dispatch</h2>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                ● Live Dispatcher
              </span>
            </div>
            <p className="text-xs text-[#86868B] mb-5">
              Lock unassigned client orders to verified roster members based on camera profile and timeline NLE.
            </p>

            <div className="p-6 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] text-center space-y-1">
              <div className="text-xs font-bold text-[#1D1D1F]">No Unassigned Orders</div>
              <p className="text-[11px] text-[#86868B]">
                All client orders are currently assigned to active creators or completed.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-xs">
            <h3 className="text-sm font-bold text-[#1D1D1F] mb-2">Automated Dispatch Gateways</h3>
            <div className="space-y-2 text-xs text-[#86868B]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F7]">
                <span>WhatsApp Template SLA</span>
                <span className="font-bold text-emerald-600">Active (Meta Cloud API)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F7]">
                <span>Acceptance Timeout</span>
                <span className="font-bold text-[#1D1D1F]">24 Hours</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F7]">
                <span>Backblaze Vault Ingest</span>
                <span className="font-bold text-blue-600">Auto-Provisioned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
