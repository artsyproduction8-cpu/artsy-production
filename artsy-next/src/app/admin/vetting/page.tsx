'use client';

import { useState } from 'react';
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
}

const INITIAL_CANDIDATES: Candidate[] = [
  {
    ref: 'ART-RC-8841',
    name: 'Karanveer V.',
    location: 'New Delhi',
    exp: '5.5 Years • Commercial & Wedding Cinema',
    score: 96,
    type: 'colorist',
    software: ['DaVinci Studio 19', 'Premiere Pro', 'Blender 3D', 'ACES Workflow'],
    sampleReels: [
      { title: 'Wedding / 4K', type: 'Wedding Cinema' },
      { title: 'Hypercar / Reel', type: 'Commercial' },
      { title: 'Frequency/Color', type: 'ACES Conform' },
    ],
  },
  {
    ref: 'ART-RC-9012',
    name: 'Ananya S.',
    location: 'Bengaluru',
    exp: '4.2 Years • Short UGC & Performance Cuts',
    score: 88,
    type: 'editor',
    software: ['Premiere Pro', 'After Effects', 'CapCut Pro', 'Sound Design'],
    sampleReels: [
      { title: 'DTC Viral Hook', type: 'Social 9:16' },
      { title: 'Fintech Reel', type: 'Kinetic Cuts' },
    ],
    reelUrl: 'vimeo.com/ananya-edits/commercial-reel-2026',
  },
  {
    ref: 'ART-RC-9154',
    name: 'Rohan Mehra',
    location: 'Mumbai',
    exp: '4.0 Years • 3D Product & Commercials',
    score: 92,
    type: 'colorist',
    software: ['Premiere Pro', 'After Effects', 'Blender 3D', 'Resolve'],
    sampleReels: [
      { title: 'Horology Macro', type: 'Product 4K' },
      { title: 'Studio Showcase', type: 'Lighting Grade' },
    ],
  },
  {
    ref: 'ART-RC-9208',
    name: 'Vikram Joshi',
    location: 'Pune',
    exp: '6.0 Years • Corporate Multi-Cam Keynotes',
    score: 94,
    type: 'editor',
    software: ['Premiere Pro', 'DaVinci Resolve', 'iZotope RX', 'Multi-Cam'],
    sampleReels: [
      { title: 'Keynote Summit', type: '3-Cam Multi' },
      { title: 'Keynote Speech', type: 'Audio Cleaned' },
    ],
  },
];

export default function AdminVettingPage() {
  const [filter, setFilter] = useState<'all' | 'colorists' | 'editors'>('all');
  const [approvedCandidates, setApprovedCandidates] = useState<string[]>([]);
  const [rejectedCandidates, setRejectedCandidates] = useState<string[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = (name: string, ref: string) => {
    setApprovedCandidates((prev) => [...prev, ref]);
    showToast(`✓ DISPATCH GATEWAY: Candidate ${name} (${ref}) has been APPROVED. Contract & WhatsApp community link dispatched.`);
  };

  const handleRequestReel = (name: string) => {
    showToast(`✉️ TRANSMISSION SENT: Automated WhatsApp notification dispatched to ${name} requesting timeline XML export.`);
  };

  const handleReject = (name: string, ref: string) => {
    setRejectedCandidates((prev) => [...prev, ref]);
    showToast(`Candidate ${name} archived.`);
  };

  const handleAssign = (orderId: string, candidateName: string) => {
    setAssignedOrders((prev) => ({ ...prev, [orderId]: candidateName }));
    showToast(`🎯 MATCH ENGINE: Order #${orderId} successfully locked and dispatched to ${candidateName}. Ingest credentials synced.`);
  };

  const filteredCandidates = INITIAL_CANDIDATES.filter((c) => {
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
            All (14)
          </button>
          <button
            onClick={() => setFilter('colorists')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'colorists'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Colorists (6)
          </button>
          <button
            onClick={() => setFilter('editors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'editors'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Editors (8)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Candidate List (2 cols) */}
        <div className="xl:col-span-2 space-y-4">
          {filteredCandidates.map((candidate) => {
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
          })}
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

            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-blue-600">ORDER #AP-8841</span>
                <span className="font-bold text-[#1D1D1F]">₹8,000 INR</span>
              </div>
              <div className="text-xs font-bold text-[#1D1D1F]">
                Udaipur Palace Royal Wedding 4K Multi-Cam
              </div>
              <div className="text-[11px] text-[#86868B]">
                Customer: Oberoi &amp; Singhania Media • 3 Cams (Sony FX6 / FX3)
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-snug">
                <strong>Director Assessment:</strong> Candidate Karanveer V. has verified S-Log3 color science and holds 0 active project load.
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => handleAssign('AP-8841', 'Karanveer V.')}
                  className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-colors shadow-xs"
                >
                  {assignedOrders['AP-8841']
                    ? `✓ Dispatched to ${assignedOrders['AP-8841']}`
                    : 'Dispatch Job Offer (24h Window)'}
                </button>
                <button
                  onClick={() => showToast('In-house edit override activated for Order #AP-8841.')}
                  className="w-full py-2 rounded-xl bg-white border border-[#E5E5E7] text-[#1D1D1F] hover:bg-slate-50 text-xs font-bold transition-colors"
                >
                  In-House Edit Override
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-xs">
            <h3 className="text-sm font-bold text-[#1D1D1F] mb-2">Automated Dispatch Gateways</h3>
            <div className="space-y-2 text-xs text-[#86868B]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F5F5F7]">
                <span>WhatsApp Template SLA</span>
                <span className="font-bold text-emerald-600">Active (OpenWA)</span>
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
