'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface FreelancerProject {
  projectId: string;
  projectTitle: string;
  category: 'Wedding' | 'Brand' | 'Corporate' | 'Personal';
  format: string;
  clientName: string;
  completionDate: string;
  clientGross: number; // in INR
  creatorFee: number; // in INR
  tdsDeducted: number; // 1% Section 194C
  netDisbursed: number; // in INR
  payoutStatus: 'Disbursed via Direct NEFT' | 'Secured in Production Vault' | 'Processing Transfer';
  payoutRef: string;
  clientRating: number;
  feedbackQuote: string;
}

interface ComprehensiveFreelancer {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  location: string;
  joinedDate: string;
  approval_status: 'approved' | 'pending' | 'rejected';
  rating: number;
  on_time_delivery_rate: number;
  skills: string[];
  software: string[];
  panNumber: string;
  bankDetails: {
    bankName: string;
    ifsc: string;
    accountNumber: string;
    status: string;
  };
  // Financial breakdown
  lifetimeGrossEarned: number;
  section194cTdsDeducted: number;
  netNeftDisbursed: number;
  pendingVaultBalance: number;
  // Work track record
  completedProjectsCount: number;
  activeProjectsCount: number;
  totalRevisionsHandled: number;
  avgTurnaroundDays: string;
  // Detailed Project History
  projects: FreelancerProject[];
}

const FREELANCERS_DATA: ComprehensiveFreelancer[] = [
  {
    id: 'creator-1',
    displayName: 'Kabir Verma',
    email: 'kabir.verma.resolve@gmail.com',
    phone: '+91 98201 44819',
    role: 'Senior Lead Colorist & Multi-Cam Conform Lead',
    bio: 'Senior DaVinci Resolve Studio colorist and multi-cam timeline conform specialist with over 6 years in luxury destination weddings and cinema trailers.',
    location: 'Bengaluru, Karnataka',
    joinedDate: '12 Jan 2025',
    approval_status: 'approved',
    rating: 4.96,
    on_time_delivery_rate: 98,
    skills: ['4K Rec.709 Color Grading', 'Multi-Cam Waveform Sync', 'Film LUT Curves', 'Dialogue Stem Mastering'],
    software: ['DaVinci Resolve Studio 19', 'Premiere Pro', 'iZotope RX 10', 'Audition'],
    panNumber: 'ABCDE1234F (Verified §194C)',
    bankDetails: {
      bankName: 'HDFC Bank Ltd.',
      ifsc: 'HDFC0001824',
      accountNumber: '•••• •••• 9102',
      status: 'Verified Direct NEFT Enabled',
    },
    lifetimeGrossEarned: 348000,
    section194cTdsDeducted: 3480,
    netNeftDisbursed: 344520,
    pendingVaultBalance: 24000,
    completedProjectsCount: 48,
    activeProjectsCount: 3,
    totalRevisionsHandled: 11,
    avgTurnaroundDays: '4.8 Days',
    projects: [
      {
        projectId: 'PRJ-WED-2026-104',
        projectTitle: 'Arjun & Mira — Royal Palace Udaipur Highlight',
        category: 'Wedding',
        format: 'Highlight + Teaser + Reel',
        clientName: 'Arjun Singhal & Mira Kapoor',
        completionDate: '28 Sep 2026',
        clientGross: 10000,
        creatorFee: 7000,
        tdsDeducted: 70,
        netDisbursed: 6930,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-HDFC-9912048',
        clientRating: 5.0,
        feedbackQuote: 'The color palette match with Udaipur sunset was breathtaking. Flawless dialogue pacing!',
      },
      {
        projectId: 'PRJ-WED-2026-092',
        projectTitle: 'Dev & Natasha — Goa Sunset Beach Narrative',
        category: 'Wedding',
        format: 'Cinematic Story (10–15 min)',
        clientName: 'Dev Oberoi',
        completionDate: '19 Sep 2026',
        clientGross: 8000,
        creatorFee: 5600,
        tdsDeducted: 56,
        netDisbursed: 5544,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-HDFC-8819201',
        clientRating: 4.9,
        feedbackQuote: 'Great speech audio cleanup from the beach breeze. Highly professional editor.',
      },
      {
        projectId: 'PRJ-WED-2026-081',
        projectTitle: 'Siddharth & Ananya — Traditional South Indian Wedding',
        category: 'Wedding',
        format: 'Master Package + Teaser',
        clientName: 'Ananya Ramanathan',
        completionDate: '08 Sep 2026',
        clientGross: 12000,
        creatorFee: 8640,
        tdsDeducted: 86.4,
        netDisbursed: 8553.6,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-HDFC-7734190',
        clientRating: 5.0,
        feedbackQuote: 'Captured every single ritual with exact musical rhythm. Master deliverable export was top-tier.',
      },
      {
        projectId: 'PRJ-WED-2026-118',
        projectTitle: 'Rhea & Aditya — Jaipur Fort Celebration Highlight',
        category: 'Wedding',
        format: 'Highlight + Teaser',
        clientName: 'Rhea Mehra',
        completionDate: 'In Production (QC Phase)',
        clientGross: 7000,
        creatorFee: 4900,
        tdsDeducted: 49,
        netDisbursed: 4851,
        payoutStatus: 'Secured in Production Vault',
        payoutRef: 'VAULT-HOLD-118',
        clientRating: 5.0,
        feedbackQuote: 'Timeline rough cut approved, waiting for final audio stem mastering signoff.',
      },
    ],
  },
  {
    id: 'creator-2',
    displayName: 'Aanya Sen',
    email: 'aanya.cuts.creative@gmail.com',
    phone: '+91 99104 22391',
    role: 'Growth & DTC Video Editor (Performance Specialist)',
    bio: 'Specialist in 9:16 high-velocity vertical reels, hook pacing, dynamic kinetic typography, and motion sound design for direct-to-consumer consumer brands.',
    location: 'Mumbai, Maharashtra',
    joinedDate: '24 Feb 2025',
    approval_status: 'approved',
    rating: 4.92,
    on_time_delivery_rate: 100,
    skills: ['High-Retention Hooks', 'Kinetic Typography', 'Sound Foley FX', 'Color Grading for Mobile'],
    software: ['Premiere Pro', 'After Effects', 'CapCut Pro Desktop', 'Photoshop'],
    panNumber: 'BKUPS9821L (Verified §194C)',
    bankDetails: {
      bankName: 'ICICI Bank',
      ifsc: 'ICIC0000104',
      accountNumber: '•••• •••• 3418',
      status: 'Verified Direct NEFT Enabled',
    },
    lifetimeGrossEarned: 286500,
    section194cTdsDeducted: 2865,
    netNeftDisbursed: 283635,
    pendingVaultBalance: 16000,
    completedProjectsCount: 72,
    activeProjectsCount: 4,
    totalRevisionsHandled: 8,
    avgTurnaroundDays: '2.4 Days',
    projects: [
      {
        projectId: 'PRJ-BRD-2026-077',
        projectTitle: 'Glow Botanics — D2C Serum Launch Hook Suite',
        category: 'Brand',
        format: 'Product Video + 3 Variant Reels',
        clientName: 'Glow Botanics India Pvt Ltd',
        completionDate: '26 Sep 2026',
        clientGross: 6000,
        creatorFee: 4200,
        tdsDeducted: 42,
        netDisbursed: 4158,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-ICIC-4491028',
        clientRating: 5.0,
        feedbackQuote: 'Our CTR went up 34% with Aanya’s kinetic hooks. Truly top-class viral editing.',
      },
      {
        projectId: 'PRJ-BRD-2026-059',
        projectTitle: 'Stride Footwear — Urban Sneaker Drop Promo',
        category: 'Brand',
        format: 'Fashion / Apparel Video',
        clientName: 'Stride Streetwear Labs',
        completionDate: '15 Sep 2026',
        clientGross: 5000,
        creatorFee: 3500,
        tdsDeducted: 35,
        netDisbursed: 3465,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-ICIC-3382910',
        clientRating: 4.8,
        feedbackQuote: 'Great speed ramps on the sole textures and beat drop sync.',
      },
      {
        projectId: 'PRJ-BRD-2026-088',
        projectTitle: 'Kura Matcha — Organic Ceremonial Tea Reel',
        category: 'Brand',
        format: 'Ad Film (Commercial Cut)',
        clientName: 'Kura Wellness',
        completionDate: 'In Production (Color Pass)',
        clientGross: 10000,
        creatorFee: 7200,
        tdsDeducted: 72,
        netDisbursed: 7128,
        payoutStatus: 'Secured in Production Vault',
        payoutRef: 'VAULT-HOLD-088',
        clientRating: 5.0,
        feedbackQuote: 'Locked timeline in Production Vault; color conformance under review.',
      },
    ],
  },
  {
    id: 'creator-3',
    displayName: 'Vikram Joshi',
    email: 'vikram.cineworks@gmail.com',
    phone: '+91 97118 90312',
    role: 'Executive Corporate Keynote & Summit Director',
    bio: 'Specialist in multi-camera conference broadcasts, corporate summits, EBU R128 audio normalization, lower thirds, and executive storytelling.',
    location: 'New Delhi, NCR',
    joinedDate: '05 Nov 2024',
    approval_status: 'approved',
    rating: 4.94,
    on_time_delivery_rate: 97,
    skills: ['Broadcast Audio EBU R128', 'Slide Conforming', 'Executive Color Tone', 'Multilingual Captions'],
    software: ['Premiere Pro', 'DaVinci Resolve', 'iZotope RX', 'After Effects'],
    panNumber: 'CYTPJ4412K (Verified §194C)',
    bankDetails: {
      bankName: 'Axis Bank Ltd.',
      ifsc: 'UTIB0000412',
      accountNumber: '•••• •••• 7721',
      status: 'Verified Direct NEFT Enabled',
    },
    lifetimeGrossEarned: 412000,
    section194cTdsDeducted: 4120,
    netNeftDisbursed: 407880,
    pendingVaultBalance: 32000,
    completedProjectsCount: 53,
    activeProjectsCount: 2,
    totalRevisionsHandled: 14,
    avgTurnaroundDays: '5.1 Days',
    projects: [
      {
        projectId: 'PRJ-CRP-2026-062',
        projectTitle: 'FinTech Horizons 2026 — Annual Summit Keynote Cut',
        category: 'Corporate',
        format: 'Corporate Film (Full Keynote)',
        clientName: 'NexGen FinTech Alliance',
        completionDate: '22 Sep 2026',
        clientGross: 15000,
        creatorFee: 10800,
        tdsDeducted: 108,
        netDisbursed: 10692,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-AXIS-9938102',
        clientRating: 5.0,
        feedbackQuote: 'EBU audio normalization was immaculate across 6 keynote speakers. Highly recommended.',
      },
      {
        projectId: 'PRJ-CRP-2026-048',
        projectTitle: 'CloudScale Global — Executive Leadership Interview Series',
        category: 'Corporate',
        format: 'Testimonial Video (4 Episodes)',
        clientName: 'CloudScale Technologies',
        completionDate: '10 Sep 2026',
        clientGross: 18000,
        creatorFee: 12600,
        tdsDeducted: 126,
        netDisbursed: 12474,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-AXIS-8819203',
        clientRating: 4.9,
        feedbackQuote: 'Subtle b-roll cuts and clean corporate branding. Delivered ahead of schedule.',
      },
    ],
  },
  {
    id: 'creator-4',
    displayName: 'Rohan Mehra',
    email: 'rohan.mehra.3d@gmail.com',
    phone: '+91 98112 55670',
    role: 'Macro Commercial & 3D Lighting Specialist',
    bio: 'Luxury product commercial editor with focus on macro lighting conform, product rotations, and dynamic sound design.',
    location: 'Pune, Maharashtra',
    joinedDate: '18 Mar 2025',
    approval_status: 'pending',
    rating: 4.88,
    on_time_delivery_rate: 96,
    skills: ['Product Commercials', 'Macro Lighting Sync', '3D Motion Callouts', 'Color Grade'],
    software: ['Premiere Pro', 'After Effects', 'Blender', 'DaVinci Resolve'],
    panNumber: 'DFPMK1102Q (Under Verification)',
    bankDetails: {
      bankName: 'State Bank of India',
      ifsc: 'SBIN0004128',
      accountNumber: '•••• •••• 5591',
      status: 'NEFT Setup Pending Vetting',
    },
    lifetimeGrossEarned: 142000,
    section194cTdsDeducted: 1420,
    netNeftDisbursed: 140580,
    pendingVaultBalance: 12000,
    completedProjectsCount: 39,
    activeProjectsCount: 1,
    totalRevisionsHandled: 9,
    avgTurnaroundDays: '3.6 Days',
    projects: [
      {
        projectId: 'PRJ-BRD-2026-031',
        projectTitle: 'Chronos Swiss Watches — Heritage Chronograph Macro Cut',
        category: 'Brand',
        format: 'Product Video (Max 2 min)',
        clientName: 'Chronos Timepieces India',
        completionDate: '12 Sep 2026',
        clientGross: 6000,
        creatorFee: 4200,
        tdsDeducted: 42,
        netDisbursed: 4158,
        payoutStatus: 'Disbursed via Direct NEFT',
        payoutRef: 'NEFT-SBIN-1192847',
        clientRating: 4.9,
        feedbackQuote: 'Macro detail speed ramps were phenomenal. Perfectly showcased the sapphire dial.',
      },
    ],
  },
];

export default function AdminFreelancersPage() {
  const { user } = useAuth();
  const [freelancers, setFreelancers] = useState<ComprehensiveFreelancer[]>(FREELANCERS_DATA);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'top_earners'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCreatorId, setExpandedCreatorId] = useState<string | null>('creator-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = (id: string, name: string) => {
    setFreelancers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, approval_status: 'approved' } : f))
    );
    showToast(`✓ Candidate ${name} verified and approved for live project dispatch.`);
  };

  // Metrics calculations
  const totalGrossDisbursed = freelancers.reduce((sum, f) => sum + f.lifetimeGrossEarned, 0);
  const totalNetNeftDisbursed = freelancers.reduce((sum, f) => sum + f.netNeftDisbursed, 0);
  const totalTdsRemitted = freelancers.reduce((sum, f) => sum + f.section194cTdsDeducted, 0);
  const totalPendingVault = freelancers.reduce((sum, f) => sum + f.pendingVaultBalance, 0);
  const totalCompletedProjects = freelancers.reduce((sum, f) => sum + f.completedProjectsCount, 0);

  // Filtered roster
  const filteredFreelancers = freelancers.filter((f) => {
    if (filter === 'approved') return f.approval_status === 'approved';
    if (filter === 'pending') return f.approval_status === 'pending';
    if (filter === 'top_earners') return f.lifetimeGrossEarned >= 300000;
    return true;
  }).filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.displayName.toLowerCase().includes(q) ||
      f.role.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q) ||
      f.skills.some((s) => s.toLowerCase().includes(q)) ||
      f.software.some((sw) => sw.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-2xl border border-white/10 flex items-center gap-3 animate-fade-in max-w-md">
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs font-bold text-[#1D1D1F]">Creator Operations</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-2">
            Verified Freelancer Roster &amp; Payout Ledgers
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1 max-w-3xl leading-relaxed">
            Detailed performance profiles, verified PAN Section 194C TDS withholding, Direct NEFT
            disbursement ledgers, and comprehensive historical project logs with Artsy.
          </p>
        </div>

        {/* Global Action / Secondary Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/clients"
            className="px-4 py-2.5 rounded-xl border border-[#E5E5E7] hover:border-[#1D1D1F] text-[#1D1D1F] text-xs font-semibold transition-all bg-white"
          >
            View Client Accounts &amp; Spend →
          </Link>
        </div>
      </div>

      {/* High-Level Statutory & Volume KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Gross Earned */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Total Freelancer Gross Earned
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] mt-1">
            ₹{totalGrossDisbursed.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Across {totalCompletedProjects} completed formats
          </span>
        </div>

        {/* KPI 2: Net Direct NEFT Disbursed */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Net Direct NEFT Disbursed
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            ₹{totalNetNeftDisbursed.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#86868B] mt-1 block">
            Directly wired to bank accounts
          </span>
        </div>

        {/* KPI 3: Section 194C TDS Withheld */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Section 194C TDS Remitted (1%)
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
            ₹{totalTdsRemitted.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#86868B] mt-1 block">
            Government tax credit compliant
          </span>
        </div>

        {/* KPI 4: Pending Vault Balance */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Pending in Production Vault
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#0071E3] mt-1">
            ₹{totalPendingVault.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#86868B] mt-1 block">
            Awaiting client QC milestone signoff
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Clean Segmented Filter Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            All Creators ({freelancers.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Approved Roster ({freelancers.filter((f) => f.approval_status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-[#0071E3] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Pending Vetting ({freelancers.filter((f) => f.approval_status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('top_earners')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'top_earners'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            ★ Top Earners (&gt;₹3L)
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, role, software, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-white rounded-xl border border-[#E5E5E7] text-xs focus:outline-hidden focus:border-[#0071E3]"
          />
        </div>
      </div>

      {/* Freelancers List with In-Depth Financial & Project History */}
      <div className="space-y-6">
        {filteredFreelancers.map((freelancer) => {
          const isExpanded = expandedCreatorId === freelancer.id;
          const initials = freelancer.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={freelancer.id}
              className={`rounded-3xl border transition-all ${
                isExpanded
                  ? 'border-[#0071E3] bg-white shadow-md'
                  : 'border-[#E5E5E7] bg-white hover:border-[#86868B]/40 shadow-xs'
              }`}
            >
              {/* Main Card Overview */}
              <div className="p-6 sm:p-7 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                      {initials}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-extrabold text-[#1D1D1F]">
                          {freelancer.displayName}
                        </h2>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            freelancer.approval_status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {freelancer.approval_status === 'approved' ? '✓ Approved Creator' : 'Pending Verification'}
                        </span>
                        <span className="text-[11px] font-medium text-[#86868B]">
                          ID: <code className="font-mono text-[10px] text-[#1D1D1F]">{freelancer.id}</code>
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#0071E3]">{freelancer.role}</p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#86868B] pt-0.5">
                        <span>📍 {freelancer.location}</span>
                        <span>•</span>
                        <span>✉ {freelancer.email}</span>
                        <span>•</span>
                        <span>📞 {freelancer.phone}</span>
                        <span>•</span>
                        <span>Joined: {freelancer.joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Key Performance Badges */}
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/60 text-center min-w-[76px]">
                      <span className="text-[10px] font-bold uppercase text-[#86868B] block">Rating</span>
                      <div className="text-sm font-black text-[#1D1D1F] mt-0.5">★ {freelancer.rating}</div>
                    </div>

                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/60 text-center min-w-[76px]">
                      <span className="text-[10px] font-bold uppercase text-[#86868B] block">Delivered</span>
                      <div className="text-sm font-black text-[#1D1D1F] mt-0.5">
                        {freelancer.completedProjectsCount} Formats
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center min-w-[76px]">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">On-Time</span>
                      <div className="text-sm font-black text-emerald-700 mt-0.5">
                        {freelancer.on_time_delivery_rate}%
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#1D1D1F] leading-relaxed max-w-4xl bg-[#F5F5F7]/40 p-3 rounded-xl border border-[#E5E5E7]/40">
                  {freelancer.bio}
                </p>

                {/* Financial Ledger Summary Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F5F5F7]/80 border border-[#E5E5E7]">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#86868B] block">
                      Lifetime Gross Earned
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#1D1D1F] block mt-0.5">
                      ₹{freelancer.lifetimeGrossEarned.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-rose-600 block">
                      Section 194C TDS (1%)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-rose-600 block mt-0.5">
                      - ₹{freelancer.section194cTdsDeducted.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      Net Direct NEFT Disbursed
                    </span>
                    <span className="text-sm sm:text-base font-black text-emerald-700 block mt-0.5">
                      ₹{freelancer.netNeftDisbursed.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#0071E3] block">
                      Vault Milestone Hold
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#0071E3] block mt-0.5">
                      ₹{freelancer.pendingVaultBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Skills, Software, and Statutory Credentials */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mr-1">
                      Skills:
                    </span>
                    {freelancer.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#F5F5F7] text-[#1D1D1F] text-[11px] font-medium rounded-lg border border-[#E5E5E7]"
                      >
                        {skill}
                      </span>
                    ))}
                    {freelancer.software.map((sw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg"
                      >
                        {sw}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#86868B]">
                      PAN: <span className="font-bold text-[#1D1D1F]">{freelancer.panNumber}</span>
                    </span>
                    <span className="text-[11px] text-[#86868B]">•</span>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold">
                      {freelancer.bankDetails.bankName} ({freelancer.bankDetails.ifsc})
                    </span>
                  </div>
                </div>

                {/* Toggle Drawer Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F7]">
                  <button
                    type="button"
                    onClick={() => setExpandedCreatorId(isExpanded ? null : freelancer.id)}
                    className="px-4 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>
                      {isExpanded
                        ? '▲ Hide Detailed Work & Earnings History'
                        : `▼ View Detailed Work & Earnings History (${freelancer.projects.length} Logged Projects)`}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/freelancers/${freelancer.id}`}
                      className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>Deep Dossier &amp; Samples</span>
                      <span>↗</span>
                    </Link>
                    {freelancer.approval_status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(freelancer.id, freelancer.displayName)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Approve Candidate
                      </button>
                    )}
                    <a
                      href={`mailto:${freelancer.email}`}
                      className="px-3 py-2 rounded-xl border border-[#E5E5E7] hover:border-[#1D1D1F] text-[#1D1D1F] text-xs font-semibold transition-all"
                    >
                      Contact Creator
                    </a>
                  </div>
                </div>
              </div>

              {/* EXPANDABLE IN-DEPTH WORK & EARNINGS HISTORY TABLE */}
              {isExpanded && (
                <div className="bg-[#FAF9F6]/60 border-t border-[#E5E5E7] p-6 sm:p-7 space-y-4 rounded-b-3xl">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1D1D1F]">
                        Complete Project History &amp; Statutory Payout Records
                      </h3>
                      <p className="text-[11px] text-[#86868B] mt-0.5">
                        Track every production format edited by {freelancer.displayName}, including
                        client deliverables, 1% TDS Section 194C deduction, Direct NEFT transfer IDs,
                        and client satisfaction reviews.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white border border-[#E5E5E7] text-[#1D1D1F]">
                      Avg Turnaround: {freelancer.avgTurnaroundDays}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[#E5E5E7] rounded-2xl bg-white overflow-hidden">
                      <thead className="bg-[#F5F5F7] text-[#86868B] font-bold uppercase text-[10px] border-b border-[#E5E5E7]">
                        <tr>
                          <th className="py-3 px-4">Project &amp; Format</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Client</th>
                          <th className="py-3 px-3">Delivered On</th>
                          <th className="py-3 px-3 text-right">Client Gross</th>
                          <th className="py-3 px-3 text-right">Creator Fee</th>
                          <th className="py-3 px-3 text-right">TDS (1%)</th>
                          <th className="py-3 px-3 text-right">Net Payout</th>
                          <th className="py-3 px-4">Payout Status / NEFT Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F7]">
                        {freelancer.projects.map((proj) => (
                          <tr key={proj.projectId} className="hover:bg-[#F5F5F7]/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                              <div className="font-bold">{proj.projectTitle}</div>
                              <span className="text-[11px] text-[#86868B] font-normal block mt-0.5">
                                Format: {proj.format} • <span className="font-mono text-[10px]">{proj.projectId}</span>
                              </span>
                              {proj.feedbackQuote && (
                                <p className="text-[10px] text-[#86868B] italic mt-1 bg-amber-50/60 p-1.5 rounded border border-amber-100/60 max-w-sm">
                                  &ldquo;{proj.feedbackQuote}&rdquo; — ★ {proj.clientRating}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F5F7] text-[#1D1D1F]">
                                {proj.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-[#1D1D1F] font-medium">{proj.clientName}</td>
                            <td className="py-3.5 px-3 text-[#86868B] whitespace-nowrap">{proj.completionDate}</td>
                            <td className="py-3.5 px-3 text-right font-mono font-medium text-[#86868B]">
                              ₹{proj.clientGross.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-[#1D1D1F]">
                              ₹{proj.creatorFee.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-rose-600">
                              - ₹{proj.tdsDeducted.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-700">
                              ₹{proj.netDisbursed.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  proj.payoutStatus.includes('Disbursed')
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-blue-50 text-blue-800'
                                }`}
                              >
                                {proj.payoutStatus}
                              </span>
                              <span className="block font-mono text-[10px] text-[#86868B] mt-0.5">
                                {proj.payoutRef}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}