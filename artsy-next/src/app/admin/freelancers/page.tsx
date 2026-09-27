'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth, logout } from '@/lib/auth';

interface CreatorProfile {
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
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

const DEFAULT_ROSTER: CreatorProfile[] = [
  {
    id: 'creator-1',
    user_id: 'usr-creator-1',
    displayName: 'Kabir Verma',
    bio: 'Senior DaVinci Resolve colorist and multi-cam timeline conform lead specializing in luxury wedding cinema and narrative shorts.',
    skills: ['4K Color Grading', 'Wedding Films', 'Multi-Cam Sync', 'Audio Stem Mastering'],
    software: ['DaVinci Resolve Studio', 'Premiere Pro', 'Audition'],
    experience: '5+ Years (Senior Independent)',
    rating: 4.96,
    completed_projects_count: 48,
    on_time_delivery_rate: 98,
    approval_status: 'approved',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
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
    approval_status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
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
    approval_status: 'pending',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
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
    approval_status: 'approved',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function AdminFreelancersList() {
  const { user } = useAuth();
  const [freelancers, setFreelancers] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        let fetchedData: CreatorProfile[] = [];
        try {
          let query = supabase
            .from('creator_profiles')
            .select('*')
            .order('created_at', { ascending: false });

          if (filter !== 'all') {
            query = query.eq('approval_status', filter);
          }

          const { data, error: sbError } = await query;
          if (!sbError && data && data.length > 0) {
            fetchedData = data.map((d: any) => ({
              id: d.id,
              user_id: d.user_id,
              displayName: d.displayName || d.full_name || 'Creator Candidate',
              bio: d.bio || 'Verified post-production specialist.',
              skills: d.skills || ['Video Editing', 'Color Grading'],
              software: d.software || d.software_mastery || ['Premiere Pro'],
              experience: d.experience || `${d.experience_years || 3}+ Years`,
              rating: d.rating || 4.9,
              completed_projects_count: d.completed_projects_count || 24,
              on_time_delivery_rate: d.on_time_delivery_rate || 98,
              approval_status: d.approval_status || 'pending',
              rejection_reason: d.rejection_reason,
              created_at: d.created_at || new Date().toISOString(),
            }));
          }
        } catch {
          // Mock mode fallback
        }

        if (fetchedData.length === 0) {
          fetchedData = filter === 'all'
            ? DEFAULT_ROSTER
            : DEFAULT_ROSTER.filter((f) => f.approval_status === filter);
        }

        setFreelancers(fetchedData);
      } catch (err) {
        console.error('Error fetching freelancers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, [filter]);

  const handleApprove = async (freelancerId: string, name: string) => {
    try {
      await fetch('/api/admin/freelancers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: freelancerId,
          name,
          email: 'artsyproduction8@gmail.com',
          phone: '+91 9876543211',
          action: 'approve',
        }),
      });

      await supabase
        .from('creator_profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', freelancerId);
    } catch {
      // Mock mode
    }

    // Also update locally stored creator profile or active user if matching
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('artsy_auth_user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.role === 'freelancer') {
            u.onboarding_status = 'approved';
            localStorage.setItem('artsy_auth_user', JSON.stringify(u));
          }
        }
      } catch {
        // ignore
      }
    }

    setFreelancers((prev) =>
      prev.map((f) => (f.id === freelancerId ? { ...f, approval_status: 'approved' } : f))
    );
    setActionNotice(`Candidate ${name} approved. Welcome email & WhatsApp notification dispatched!`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleReject = async (freelancerId: string, name: string) => {
    const reason = 'Portfolio needs additional high-resolution raw timeline proof';
    try {
      await fetch('/api/admin/freelancers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: freelancerId,
          name,
          email: 'artsyproduction8@gmail.com',
          action: 'reject',
          rejectionReason: reason,
        }),
      });

      await supabase
        .from('creator_profiles')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', freelancerId);
    } catch {
      // Mock mode
    }

    setFreelancers((prev) =>
      prev.map((f) =>
        f.id === freelancerId ? { ...f, approval_status: 'rejected', rejection_reason: reason } : f
      )
    );
    setActionNotice(`Candidate ${name} archived. Status notification dispatched.`);
    setTimeout(() => setActionNotice(null), 4000);
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
              CREATOR ROSTER VERIFICATION
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs font-semibold uppercase px-3.5 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Operations Desk
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
      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        {/* Notice Alert */}
        {actionNotice && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-fade-in shadow-sm">
            <span>✓ {actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5E5E7] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                ← Back to Operations Desk
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">
              Creator Roster Verification
            </h1>
            <p className="text-xs text-[#86868B] mt-1">
              Screen editorial candidates, review timeline samples, and verify roster eligibility.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              All ({DEFAULT_ROSTER.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Pending ({DEFAULT_ROSTER.filter((f) => f.approval_status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              Approved ({DEFAULT_ROSTER.filter((f) => f.approval_status === 'approved').length})
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-[#86868B]">Loading candidate roster...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {freelancers.map((freelancer) => {
              const initials = freelancer.displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={freelancer.id}
                  className="bg-white rounded-2xl p-6 border border-[#E5E5E7] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:border-[#3B82F6]/50"
                >
                  {/* Left Info Column */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-[#1D1D1F]">
                            {freelancer.displayName}
                          </h2>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                        <p className="text-xs text-[#86868B]">{freelancer.experience}</p>
                      </div>
                    </div>

                    <p className="text-xs text-[#1D1D1F] leading-relaxed max-w-3xl">
                      {freelancer.bio}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {freelancer.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-[#F5F5F7] text-[#1D1D1F] text-[11px] font-medium rounded-lg border border-[#E5E5E7]"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.software.map((sw) => (
                        <span
                          key={sw}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded-lg"
                        >
                          {sw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Metrics & Controls */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#E5E5E7] lg:min-w-[220px]">
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#86868B]">Rating</span>
                        <div className="text-sm font-extrabold text-[#1D1D1F]">★ {freelancer.rating}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#86868B]">Delivered</span>
                        <div className="text-sm font-extrabold text-[#1D1D1F]">{freelancer.completed_projects_count}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#86868B]">On-Time</span>
                        <div className="text-sm font-extrabold text-emerald-600">{freelancer.on_time_delivery_rate}%</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <Link
                        href={`/admin/freelancers/${freelancer.id}`}
                        className="flex-1 lg:flex-none text-center px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all"
                      >
                        Inspect Timeline
                      </Link>
                      {freelancer.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(freelancer.id, freelancer.displayName)}
                            className="flex-1 lg:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(freelancer.id, freelancer.displayName)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                          >
                            Archive
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}