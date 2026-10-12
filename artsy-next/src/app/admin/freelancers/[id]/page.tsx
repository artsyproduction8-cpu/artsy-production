'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

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
  const { user } = useAuth();

  const [freelancer, setFreelancer] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Public Profile Settings state
  const [isPublic, setIsPublic] = useState(false);
  const [publicDisplayName, setPublicDisplayName] = useState('');
  const [publicSpecialty, setPublicSpecialty] = useState('');
  const [publicBio, setPublicBio] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState(3);
  const [creatorTier, setCreatorTier] = useState<'rising_talent' | 'standard' | 'senior'>('rising_talent');
  const [isAcceptingWork, setIsAcceptingWork] = useState(true);
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);

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

            // Calculate auto-suggested public display name (e.g. "FirstName L.")
            const nameParts = (data.full_name || data.displayName || found.displayName || '').trim().split(' ');
            const suggestedName = nameParts.length > 1
              ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
              : nameParts[0] || 'Creator';

            // Auto-calculate creator_tier
            const completed = data.total_projects_completed ?? found.completed_projects_count ?? 0;
            const autoTier = completed > 50 ? 'senior' : completed >= 10 ? 'standard' : 'rising_talent';

            setIsPublic(Boolean(data.is_public));
            setPublicDisplayName(data.public_display_name || suggestedName);
            setPublicSpecialty(data.public_specialty || (found.skills?.[0] ? `${found.skills[0]} Specialist` : 'Cinematography & Color'));
            setPublicBio(data.public_bio || data.bio || found.bio || '');
            setYearsOfExperience(data.years_of_experience ?? 3);
            setCreatorTier(data.creator_tier || autoTier);
            setIsAcceptingWork(data.is_accepting_work !== false);
          } else {
            // Mock defaults
            const nameParts = found.displayName.trim().split(' ');
            const suggestedName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` : nameParts[0];
            const autoTier = (found.completed_projects_count || 0) > 50 ? 'senior' : (found.completed_projects_count || 0) >= 10 ? 'standard' : 'rising_talent';
            setIsPublic(found.approval_status === 'approved');
            setPublicDisplayName(suggestedName);
            setPublicSpecialty(found.skills[0] || 'Cinematic Editing');
            setPublicBio(found.bio);
            setYearsOfExperience(4);
            setCreatorTier(autoTier);
            setIsAcceptingWork(true);
          }
        } catch {
          // fallback
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

  const handleSavePublicProfile = async () => {
    if (!freelancer) return;
    if (freelancer.approval_status !== 'approved' && isPublic) {
      alert('Creator must have approval_status = "approved" to be made public.');
      return;
    }

    try {
      setSavingPublicProfile(true);
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: freelancer.id,
          action: 'update_public_profile',
          is_public: isPublic,
          public_display_name: publicDisplayName,
          public_specialty: publicSpecialty,
          public_bio: publicBio,
          years_of_experience: yearsOfExperience,
          creator_tier: creatorTier,
          is_accepting_work: isAcceptingWork,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice('Public profile settings saved successfully.');
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        alert(data.error || 'Failed to save public profile settings');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving public profile');
    } finally {
      setSavingPublicProfile(false);
    }
  };

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


  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
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

        {/* Public Profile Settings Card (Task 7) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E7] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-base font-bold text-[#1D1D1F]">Public Profile Settings</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#86868B] uppercase">
                  /creators discovery
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-1">
                Configure discovery visibility, pseudonym display name, tier, and client request availability.
              </p>
            </div>

            <button
              onClick={handleSavePublicProfile}
              disabled={savingPublicProfile}
              className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {savingPublicProfile ? 'Saving...' : 'Save Public Settings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Toggles Row */}
            <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1D1D1F] block">Public Discovery Status</span>
                <span className="text-[11px] text-[#86868B]">
                  {freelancer.approval_status !== 'approved'
                    ? 'Requires "approved" roster status to enable'
                    : isPublic
                    ? 'Listed on /creators directory'
                    : 'Hidden from public directory'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  disabled={freelancer.approval_status !== 'approved'}
                  checked={isPublic}
                  onChange={(e) => {
                    if (freelancer.approval_status !== 'approved') {
                      alert('Creator must have approval_status = "approved" before making profile public.');
                      return;
                    }
                    setIsPublic(e.target.value === 'true' || e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="p-4 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1D1D1F] block">Accepting Work</span>
                <span className="text-[11px] text-[#86868B]">
                  {isAcceptingWork ? 'Available for client booking requests' : 'Fully Booked / Paused'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAcceptingWork}
                  onChange={(e) => setIsAcceptingWork(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D1D1F]"></div>
              </label>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1D1D1F] flex items-center justify-between">
                <span>Public Display Name (First Name + Last Initial)</span>
                <span className="text-[10px] text-[#86868B] font-normal">PII Protected</span>
              </label>
              <input
                type="text"
                value={publicDisplayName}
                onChange={(e) => setPublicDisplayName(e.target.value)}
                placeholder="e.g. Aarav S."
                className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
              />
            </div>

            {/* Specialty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1D1D1F]">
                Public Specialty / Headline
              </label>
              <input
                type="text"
                value={publicSpecialty}
                onChange={(e) => setPublicSpecialty(e.target.value)}
                placeholder="e.g. Wedding Cinema & 4K Color Grading"
                className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1D1D1F]">
                Years of Experience
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
              />
            </div>

            {/* Tier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1D1D1F] flex items-center justify-between">
                <span>Creator Tier</span>
                <span className="text-[10px] text-[#86868B] font-normal">
                  Auto-calculated ({freelancer.completed_projects_count || 0} projects)
                </span>
              </label>
              <select
                value={creatorTier}
                onChange={(e) => setCreatorTier(e.target.value as any)}
                className="w-full bg-[#F5F5F7] px-3.5 py-2.5 text-xs font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
              >
                <option value="rising_talent">Rising Talent (&lt; 10 completed projects)</option>
                <option value="standard">Standard (10 - 50 completed projects)</option>
                <option value="senior">Senior (&gt; 50 completed projects)</option>
              </select>
            </div>
          </div>

          {/* Public Bio */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-[#1D1D1F]">
              Public Bio (Client-Facing)
            </label>
            <textarea
              rows={3}
              value={publicBio}
              onChange={(e) => setPublicBio(e.target.value)}
              placeholder="Narrative bio highlighting creative style, pacing, and client deliverables..."
              className="w-full bg-[#F5F5F7] p-3 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
            />
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
      </div>
  );
}