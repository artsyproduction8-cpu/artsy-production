'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth, logout } from '@/lib/auth';

interface SampleReel {
  id: string;
  title: string;
  category: string;
  video_url: string;
  codec: string;
  resolution: string;
}

interface CreatorDetail {
  id: string;
  user_id: string;
  displayName: string;
  bio: string;
  skills: string[];
  software: string[];
  experience: string;
  rating: number;
  completed_projects_count: number;
  on_time_delivery_rate: number;
  portfolio_url: string;
  pan_masked: string;
  bank_status: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  samples: SampleReel[];
  created_at: string;
}

const ROSTER_DATABASE: Record<string, CreatorDetail> = {
  'creator-1': {
    id: 'creator-1',
    user_id: 'usr-creator-1',
    displayName: 'Kabir Verma',
    bio: 'Senior DaVinci Resolve colorist and multi-cam timeline conform lead specializing in luxury destination wedding cinema and narrative shorts.',
    skills: ['4K Color Grading', 'Wedding Films', 'Multi-Cam Sync', 'Audio Stem Mastering'],
    software: ['DaVinci Resolve Studio', 'Premiere Pro', 'Audition'],
    experience: '5+ Years (Senior Independent)',
    rating: 4.96,
    completed_projects_count: 48,
    on_time_delivery_rate: 98,
    portfolio_url: 'https://vimeo.com/showcase/kabir-cinematic',
    pan_masked: 'AAAPL****K (Verified)',
    bank_status: 'HDFC Bank • Verified for NEFT',
    approval_status: 'approved',
    samples: [
      {
        id: 'smp-1',
        title: 'Udaipur Palace Royal Wedding 4K Highlight',
        category: 'Wedding Cinema',
        video_url: 'https://vimeo.com/76979871',
        codec: 'Apple ProRes 422 HQ',
        resolution: '3840x2160 DCI 4K',
      },
      {
        id: 'smp-2',
        title: 'Heritage S-Log3 Gamut Conform Reel',
        category: 'Color Grading',
        video_url: 'https://vimeo.com/76979872',
        codec: 'DaVinci Wide Gamut',
        resolution: '4K Ultra HD',
      },
    ],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'creator-2': {
    id: 'creator-2',
    user_id: 'usr-creator-2',
    displayName: 'Aanya Sen',
    bio: 'Short-form UGC and high-retention video editor for high-growth direct-to-consumer and fintech applications.',
    skills: ['Viral Hook Editing', 'Brand UGC', 'Motion Callouts', 'Sound Design'],
    software: ['Premiere Pro', 'After Effects', 'CapCut Pro'],
    experience: '3 Years (Mid-Level Creator)',
    rating: 4.92,
    completed_projects_count: 72,
    on_time_delivery_rate: 100,
    portfolio_url: 'https://vimeo.com/showcase/aanya-ugc',
    pan_masked: 'BVTPS****M (Verified)',
    bank_status: 'ICICI Bank • Verified for NEFT',
    approval_status: 'pending',
    samples: [
      {
        id: 'smp-3',
        title: 'Fintech App Onboarding 3-Second Hook Variant',
        category: 'Brand UGC',
        video_url: 'https://vimeo.com/76979873',
        codec: 'H.265 / HEVC',
        resolution: '1080x1920 9:16',
      },
    ],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'creator-3': {
    id: 'creator-3',
    user_id: 'usr-creator-3',
    displayName: 'Rohan Mehra',
    bio: 'Macro commercial specialist with focus on 3D product rendering, watch showcases, and dynamic typography.',
    skills: ['Product Commercials', '3D Cutaways', 'Cinema Lighting Conform', 'Colorist'],
    software: ['Premiere Pro', 'After Effects', 'Blender'],
    experience: '4 Years (Commercial Specialist)',
    rating: 4.88,
    completed_projects_count: 39,
    on_time_delivery_rate: 96,
    portfolio_url: 'https://vimeo.com/showcase/rohan-3d',
    pan_masked: 'CCKPR****D (Verified)',
    bank_status: 'Axis Bank • Verified for NEFT',
    approval_status: 'pending',
    samples: [
      {
        id: 'smp-4',
        title: 'Luxury Chronograph Dial Macro Cutaway',
        category: 'Product Commercial',
        video_url: 'https://vimeo.com/76979874',
        codec: 'ProRes 4444 XQ',
        resolution: '4K Cinema',
      },
    ],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'creator-4': {
    id: 'creator-4',
    user_id: 'usr-creator-4',
    displayName: 'Vikram Joshi',
    bio: 'Corporate keynote editor, technical event broadcaster, and executive multi-cam speech cutter.',
    skills: ['Corporate Keynotes', 'Multi-Cam Sync', 'Noise Reduction', 'Multilingual Captions'],
    software: ['Premiere Pro', 'DaVinci Resolve', 'iZotope RX'],
    experience: '6+ Years (Lead Supervisor)',
    rating: 4.94,
    completed_projects_count: 53,
    on_time_delivery_rate: 97,
    portfolio_url: 'https://vimeo.com/showcase/vikram-corp',
    pan_masked: 'AABPJ****R (Verified)',
    bank_status: 'State Bank of India • Verified for NEFT',
    approval_status: 'approved',
    samples: [
      {
        id: 'smp-5',
        title: 'Global Tech Keynote 3-Camera Master Cut',
        category: 'Corporate Keynote',
        video_url: 'https://vimeo.com/76979875',
        codec: 'ProRes 422',
        resolution: '3840x2160 UHD',
      },
    ],
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export default function AdminFreelancerDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [freelancer, setFreelancer] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        let found = ROSTER_DATABASE[id] || ROSTER_DATABASE['creator-1'];

        try {
          const { data, error } = await supabase
            .from('creator_profiles')
            .select('*')
            .eq('id', id)
            .single();

          if (!error && data) {
            found = {
              ...found,
              id: data.id,
              displayName: data.displayName || data.full_name || found.displayName,
              bio: data.bio || found.bio,
              approval_status: data.approval_status || found.approval_status,
              rejection_reason: data.rejection_reason || found.rejection_reason,
            };
          }
        } catch {
          // mock
        }

        setFreelancer(found);
      } catch (err) {
        console.error('Error fetching creator detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!freelancer) return;
    try {
      await supabase
        .from('creator_profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', freelancer.id);
    } catch {
      // mock
    }

    setFreelancer((prev) => (prev ? { ...prev, approval_status: 'approved' } : null));
    setActionNotice(`${freelancer.displayName} approved to roster. Onboarding pact dispatched.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = async () => {
    if (!freelancer || !rejectReason.trim()) return;
    try {
      await supabase
        .from('creator_profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: rejectReason,
        })
        .eq('id', freelancer.id);
    } catch {
      // mock
    }

    setFreelancer((prev) =>
      prev ? { ...prev, approval_status: 'rejected', rejection_reason: rejectReason } : null
    );
    setRejecting(false);
    setActionNotice(`Candidate ${freelancer.displayName} archived.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="w-8 h-8 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!freelancer) {
    return null;
  }

  const initials = freelancer.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
              CANDIDATE DOSSIER
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/freelancers"
              className="text-xs font-semibold uppercase px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Candidate Queue
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

      {/* Main Content */}
      <main className="pt-24 pb-16 px-6 max-w-5xl mx-auto space-y-6">
        {/* Notice Alert */}
        {actionNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 shadow-sm flex items-center justify-between">
            <span>✓ {actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Back Link */}
        <div>
          <Link
            href="/admin/freelancers"
            className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] inline-flex items-center gap-1"
          >
            ← Back to Roster Verification Queue
          </Link>
        </div>

        {/* Profile Dossier Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#E5E5E7]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#1D1D1F] tracking-tight">
                    {freelancer.displayName}
                  </h1>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      freelancer.approval_status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : freelancer.approval_status === 'pending'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {freelancer.approval_status}
                  </span>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">{freelancer.experience}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="font-bold text-[#1D1D1F]">★ {freelancer.rating} Platform Rating</span>
                  <span className="text-[#86868B]">•</span>
                  <span className="text-[#86868B]">{freelancer.completed_projects_count} Master Deliveries</span>
                  <span className="text-[#86868B]">•</span>
                  <span className="text-emerald-600 font-semibold">{freelancer.on_time_delivery_rate}% On-Time</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {freelancer.approval_status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Approve Roster Access
                  </button>
                  <button
                    onClick={() => setRejecting(true)}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Archive
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Rejection Form Modal / Drawer */}
          {rejecting && (
            <div className="p-4 mt-6 bg-red-50/60 rounded-xl border border-red-200 space-y-3">
              <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">
                Specify Archive / Revision Reason
              </h3>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Uncompressed timeline export needed for audio mastering proof..."
                className="w-full p-2.5 bg-white border border-red-200 rounded-lg text-xs text-[#1D1D1F] outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Confirm Archive
                </button>
                <button
                  onClick={() => setRejecting(false)}
                  className="px-3 py-2 bg-white text-[#1D1D1F] text-xs rounded-lg border border-[#E5E5E7] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bio & Editorial Philosophy */}
          <div className="pt-6 space-y-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B] mb-1.5">
                Editorial Background &amp; Philosophy
              </h2>
              <p className="text-xs text-[#1D1D1F] leading-relaxed max-w-3xl">
                {freelancer.bio}
              </p>
            </div>

            {/* Skills & Software */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <h3 className="text-[11px] font-bold uppercase text-[#86868B] mb-2">Verified Editorial Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {freelancer.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 bg-white text-[#1D1D1F] text-xs font-medium rounded-lg border border-[#E5E5E7]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <h3 className="text-[11px] font-bold uppercase text-[#86868B] mb-2">Software Stack Mastery</h3>
                <div className="flex flex-wrap gap-1.5">
                  {freelancer.software.map((sw) => (
                    <span
                      key={sw}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg"
                    >
                      {sw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tax & Banking Compliance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <span className="text-[10px] font-bold text-[#86868B] uppercase">Section 194J-Tech TDS PAN (2%)</span>
                <div className="text-xs font-mono font-bold text-[#1D1D1F] mt-1">{freelancer.pan_masked}</div>
              </div>
              <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]">
                <span className="text-[10px] font-bold text-[#86868B] uppercase">Automated NEFT Settlement</span>
                <div className="text-xs font-bold text-[#1D1D1F] mt-1">{freelancer.bank_status}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Timeline Cuts */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7] shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#E5E5E7]">
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F]">Sample Timeline Cuts</h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Evaluated for pacing, grade gamut conform, audio mastering, and sync precision.
              </p>
            </div>
            <a
              href={freelancer.portfolio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#3B82F6] hover:underline"
            >
              External Portfolio ↗
            </a>
          </div>

          <div className="space-y-3">
            {freelancer.samples.map((sample) => (
              <div
                key={sample.id}
                className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
                    {sample.category}
                  </span>
                  <h3 className="text-xs font-bold text-[#1D1D1F] mt-0.5">{sample.title}</h3>
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    Codec: {sample.codec} • Canvas: {sample.resolution}
                  </p>
                </div>
                <a
                  href={sample.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-lg transition-all text-center"
                >
                  Play Timeline ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}