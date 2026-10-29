'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CreatorItem {
  id: string;
  display_name: string;
  full_name?: string;
  phone: string;
  email: string;
  skills: string[];
  approval_status: 'approved' | 'pending' | 'rejected';
  is_suspended: boolean;
  rating: number;
  total_jobs: number;
  total_earned: number; // in paisa
  is_public?: boolean;
  public_display_name?: string;
  public_specialty?: string;
  creator_tier?: string;
  is_deleted?: boolean;
  status?: string;
  deleted_at?: string | null;
  created_at: string;
}

interface CreatorDetail {
  id: string;
  display_name: string;
  full_name?: string;
  phone: string;
  email: string;
  status: string;
  is_deleted?: boolean;
  deleted_at?: string | null;
  avatar_url?: string;
  studio_details?: {
    workstationRig?: string;
    monitoringSpec?: string;
    storageSpec?: string;
    audioSpec?: string;
    experience?: string;
    capacity?: string;
    philosophy?: string;
    software?: string[];
    languages?: string[];
    reels?: Array<{ type: string; url: string }>;
    bankName?: string;
    bankAccount?: string;
    ifsc?: string;
    pan?: string;
    showreelUrl?: string;
  };
  profile: any;
  assignments: any[];
  payouts: any[];
  revisions: any[];
  samples: any[];
  metrics: {
    activeWorkload: number;
    totalProjectsCompleted: number;
    rating: number;
  };
}

export default function AdminFreelancersPage() {
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [creatorDetail, setCreatorDetail] = useState<CreatorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Add Creator Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newSkills, setNewSkills] = useState('Wedding Cinema, Color Grading');
  const [newBio, setNewBio] = useState('');
  const [newExperience, setNewExperience] = useState(4);
  const [newTier, setNewTier] = useState<'rising_talent' | 'standard' | 'senior'>('standard');
  const [newIsPublic, setNewIsPublic] = useState(true);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/creators');
      const data = await res.json();
      if (data.success) {
        setCreators(data.creators || []);
      }
    } catch (err) {
      console.error('Failed to fetch creators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const openCreatorDetail = async (id: string) => {
    setSelectedCreatorId(id);
    setDetailLoading(true);
    setCreatorDetail(null);
    try {
      const res = await fetch(`/api/admin/creators?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setCreatorDetail(data.creator);
      }
    } catch (err) {
      console.error('Failed to load creator detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason?: string) => {
    setActionLoading(id);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Creator ${action} action executed successfully.`);
        fetchCreators();
        if (selectedCreatorId === id) {
          openCreatorDetail(id);
        }
      } else {
        setFeedback(`Error: ${data.error || 'Failed to update creator'}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      alert('Full Name and Email are required.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          full_name: newFullName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          public_specialty: newSpecialty.trim() || 'Video Editor',
          skills: newSkills.split(',').map((s) => s.trim()).filter(Boolean),
          bio: newBio.trim(),
          public_bio: newBio.trim(),
          years_of_experience: Number(newExperience) || 3,
          creator_tier: newTier,
          is_public: newIsPublic,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(`✓ New creator "${newFullName}" successfully registered and added to roster!`);
        setShowAddModal(false);
        // Reset form
        setNewFullName('');
        setNewEmail('');
        setNewPhone('');
        setNewSpecialty('');
        setNewBio('');
        fetchCreators();
      } else {
        alert(data.error || 'Failed to create creator.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating creator.');
    } finally {
      setCreating(false);
    }
  };

  const filteredCreators = creators.filter((c) => {
    const matchesSearch =
      !search ||
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && c.approval_status === 'approved' && !c.is_suspended && !c.is_deleted) ||
      (statusFilter === 'pending' && c.approval_status === 'pending' && !c.is_deleted) ||
      (statusFilter === 'rejected' && c.approval_status === 'rejected' && !c.is_deleted) ||
      (statusFilter === 'suspended' && c.is_suspended && !c.is_deleted) ||
      (statusFilter === 'deleted' && (c.is_deleted || c.status === 'deleted'));

    return matchesSearch && matchesStatus;
  });

  const formatInr = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format((paisa || 0) / 100);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Creator &amp; Talent Roster</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Live Database
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Manage real creator profiles, edit bios &amp; specialties, control public /creators listing, or add new team members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>+</span> Add New Creator
          </button>
          <button
            onClick={fetchCreators}
            className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs cursor-pointer"
          >
            Refresh Roster
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-blue-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by creator name, email, phone, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-[#F5F5F7] border border-transparent rounded-xl px-3 py-2 pl-9 focus:bg-white focus:border-[#3B82F6] focus:outline-none transition-all"
            />
            <svg className="w-4 h-4 text-[#86868B] absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
          <span>Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-2 py-1 text-xs font-medium text-[#1D1D1F] focus:outline-none"
          >
            <option value="all">All Creators</option>
            <option value="approved">Approved &amp; Active</option>
            <option value="pending">Pending Vetting</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted / Archived</option>
          </select>
        </div>
      </div>

      {/* Creators Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading verified creators from database...</div>
        ) : filteredCreators.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] text-2xl flex items-center justify-center mx-auto mb-3">
              🎬
            </div>
            <h3 className="text-sm font-bold text-[#1D1D1F]">No Creator Applications Found</h3>
            <p className="text-xs text-[#86868B] max-w-sm mx-auto">
              When editors apply through the onboarding application or are invited by the studio, their submissions and verified creative disciplines will appear here for vetting.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>+ Provision Creator</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold text-[11px]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Creator / Legal Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Contact</th>
                  <th className="py-3.5 px-4">Skills</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Public Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Rating</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Completed</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Earned</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {filteredCreators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="hover:bg-[#F5F5F7]/70 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1D1D1F] whitespace-nowrap">
                        {creator.full_name ? (creator.display_name && creator.display_name !== creator.full_name ? `${creator.full_name} (${creator.display_name})` : creator.full_name) : creator.display_name}
                      </div>
                      {creator.public_specialty && (
                        <div className="text-[11px] font-semibold text-[#3B82F6] whitespace-nowrap">{creator.public_specialty}</div>
                      )}
                      <div className="text-[10px] font-mono text-[#86868B]">{creator.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-[#1D1D1F]">{creator.email}</div>
                      <div className="text-[10px] font-mono text-[#86868B]">{creator.phone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {creator.skills.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-[#F5F5F7] text-[10px] rounded text-[#1D1D1F] whitespace-nowrap">
                            {s}
                          </span>
                        ))}
                        {creator.skills.length > 2 && (
                          <span className="text-[10px] text-[#86868B] whitespace-nowrap">+{creator.skills.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            creator.is_deleted || creator.status === 'deleted'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : creator.is_suspended
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : creator.approval_status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : creator.approval_status === 'rejected'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {creator.is_deleted || creator.status === 'deleted' ? 'DELETED PROFILE' : creator.is_suspended ? 'SUSPENDED' : creator.approval_status.toUpperCase()}
                        </span>
                        {creator.is_public && creator.approval_status === 'approved' && !creator.is_suspended && !creator.is_deleted && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                            LIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-[#1D1D1F]">
                      <span className="text-amber-500">★</span> {creator.rating.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-medium text-[#1D1D1F]">
                      {creator.total_jobs} Jobs
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-600">
                      {formatInr(creator.total_earned)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/freelancers/${creator.id}`}
                          className="px-2.5 py-1 bg-[#1D1D1F] hover:bg-black text-white rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Edit Profile ↗
                        </Link>
                        <button
                          onClick={() => openCreatorDetail(creator.id)}
                          className="px-2 py-1 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded text-[10px] font-semibold cursor-pointer"
                        >
                          View Workload
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creator Detail Drawer / Modal */}
      {selectedCreatorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-[#E5E5E7] max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5E5E7] pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-[#1D1D1F]">
                    {creatorDetail?.display_name || 'Loading Creator Profile...'}
                  </h2>
                  {creatorDetail && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        creatorDetail.is_deleted || creatorDetail.status === 'deleted'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : creatorDetail.profile?.is_suspended || creatorDetail.status === 'suspended'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : creatorDetail.profile?.approval_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {creatorDetail.is_deleted || creatorDetail.status === 'deleted'
                        ? 'Profile Deleted / Archived'
                        : creatorDetail.profile?.is_suspended || creatorDetail.status === 'suspended'
                        ? 'Suspended'
                        : creatorDetail.profile?.approval_status || 'Pending'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#86868B] font-mono mt-0.5">
                  ID: {selectedCreatorId} • {creatorDetail?.email} • {creatorDetail?.phone || 'No phone'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {creatorDetail && creatorDetail.profile?.approval_status === 'pending' && (
                  <button
                    onClick={() => handleAction(creatorDetail.id, 'approve')}
                    disabled={actionLoading === creatorDetail.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    ✓ Approve Creator
                  </button>
                )}
                {creatorDetail && creatorDetail.profile?.approval_status === 'pending' && (
                  <button
                    onClick={() => handleAction(creatorDetail.id, 'reject', 'Portfolio standards not met')}
                    disabled={actionLoading === creatorDetail.id}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl border border-red-200 cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
                {creatorDetail && creatorDetail.profile?.approval_status === 'approved' && !(creatorDetail.profile?.is_suspended || creatorDetail.status === 'suspended') && (
                  <button
                    onClick={() => handleAction(creatorDetail.id, 'suspend', 'Admin review suspension')}
                    disabled={actionLoading === creatorDetail.id}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-xl border border-amber-200 cursor-pointer disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}
                {creatorDetail && (creatorDetail.profile?.is_suspended || creatorDetail.status === 'suspended') && (
                  <button
                    onClick={() => handleAction(creatorDetail.id, 'reactivate')}
                    disabled={actionLoading === creatorDetail.id}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 cursor-pointer disabled:opacity-50"
                  >
                    Reactivate
                  </button>
                )}
                <Link
                  href={`/admin/freelancers/${selectedCreatorId}`}
                  className="px-3 py-1.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl"
                >
                  Edit Full Profile ↗
                </Link>
                <button
                  onClick={() => setSelectedCreatorId(null)}
                  className="text-[#86868B] hover:text-[#1D1D1F] text-xl font-bold cursor-pointer px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-xs text-[#86868B]">
                Fetching creator assignments, payouts, revisions, and metrics...
              </div>
            ) : creatorDetail ? (
              <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#F5F5F7] rounded-xl text-center">
                    <div className="text-lg font-bold text-[#1D1D1F]">{creatorDetail.metrics.activeWorkload}</div>
                    <div className="text-[10px] text-[#86868B]">Current Workload Projects</div>
                  </div>
                  <div className="p-3 bg-[#F5F5F7] rounded-xl text-center">
                    <div className="text-lg font-bold text-emerald-600">{creatorDetail.metrics.totalProjectsCompleted}</div>
                    <div className="text-[10px] text-[#86868B]">Completed Lifetime Projects</div>
                  </div>
                  <div className="p-3 bg-[#F5F5F7] rounded-xl text-center">
                    <div className="text-lg font-bold text-amber-500">★ {creatorDetail.metrics.rating}</div>
                    <div className="text-[10px] text-[#86868B]">Client Signoff Rating</div>
                  </div>
                </div>

                {/* Creative Profile, Hardware Rig & Compliance Card */}
                <div className="p-5 bg-[#F9F9FA] rounded-2xl border border-[#E5E5E7] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                        Creative Profile &amp; Hardware Rig
                      </h3>
                    </div>
                    {creatorDetail.profile?.tracking_id && (
                      <span className="font-mono text-[10px] text-[#86868B] bg-white px-2.5 py-0.5 rounded border border-[#E5E5E7]">
                        Track: {creatorDetail.profile.tracking_id}
                      </span>
                    )}
                  </div>

                  {/* Philosophy / Bio */}
                  {(creatorDetail.studio_details?.philosophy || creatorDetail.profile?.bio) && (
                    <div className="text-xs text-[#1D1D1F] bg-white p-3 rounded-xl border border-[#E5E5E7]/70 leading-relaxed">
                      <span className="font-bold text-[#86868B] block text-[10px] uppercase mb-1">Editing Philosophy / Bio</span>
                      {creatorDetail.studio_details?.philosophy || creatorDetail.profile?.bio}
                    </div>
                  )}

                  {/* Software & Languages Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-[#E5E5E7]/70 space-y-1.5">
                      <span className="font-bold text-[#86868B] block text-[10px] uppercase">Software Toolchain</span>
                      <div className="flex flex-wrap gap-1.5">
                        {((creatorDetail.studio_details?.software || creatorDetail.profile?.software || ['DaVinci Resolve Studio', 'Adobe Premiere Pro']) as string[]).map((sw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#F5F5F7] text-[#1D1D1F] rounded-md text-[11px] font-semibold border border-[#E5E5E7]/50">
                            {sw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E5E5E7]/70 space-y-1.5">
                      <span className="font-bold text-[#86868B] block text-[10px] uppercase">Languages &amp; Subtitles</span>
                      <div className="flex flex-wrap gap-1.5">
                        {((creatorDetail.profile?.languages || creatorDetail.studio_details?.languages || ['Hindi', 'English']) as string[]).map((lang, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#F5F5F7] text-[#1D1D1F] rounded-md text-[11px] font-semibold border border-[#E5E5E7]/50">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Hardware Rig Specs */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E5E5E7]/70 space-y-2">
                    <span className="font-bold text-[#86868B] block text-[10px] uppercase">Workstation Specs &amp; Hardware Rig</span>
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs font-mono text-[#1D1D1F] whitespace-pre-line leading-relaxed">
                      {creatorDetail.profile?.hardware_config || creatorDetail.studio_details?.workstationRig || 'No hardware configuration declared.'}
                    </div>
                  </div>

                  {/* 3 Portfolio Samples */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#E5E5E7]/70 space-y-2">
                    <span className="font-bold text-[#86868B] block text-[10px] uppercase">Portfolio Sample Cuts (Ingest Proof)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { label: 'Sample 01', url: creatorDetail.profile?.sample_url_1 },
                        { label: 'Sample 02', url: creatorDetail.profile?.sample_url_2 },
                        { label: 'Sample 03', url: creatorDetail.profile?.sample_url_3 },
                      ].map((s, idx) => (
                        s.url ? (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-white hover:border-[#3B82F6] transition-all flex flex-col justify-between truncate"
                          >
                            <span className="text-[9px] uppercase tracking-wider text-blue-400 font-bold">▶ {s.label}</span>
                            <span className="text-[10px] text-[#86868B] truncate mt-1">{s.url.replace(/^https?:\/\/(www\.)?/, '')} ↗</span>
                          </a>
                        ) : (
                          <div key={idx} className="p-2 bg-[#F5F5F7] rounded-lg text-[10px] text-[#86868B] text-center">
                            {s.label}: N/A
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Capacity & Masked Banking Compliance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-[#E5E5E7]/70 space-y-1">
                      <span className="font-bold text-[#86868B] block text-[10px] uppercase">Experience &amp; Capacity</span>
                      <div className="text-xs text-[#1D1D1F] space-y-1">
                        <div><strong className="text-[#86868B]">Experience:</strong> {creatorDetail.studio_details?.experience || (creatorDetail.profile?.years_of_experience ? `${creatorDetail.profile.years_of_experience} Years` : 'Mid-Level Professional')}</div>
                        <div><strong className="text-[#86868B]">Weekly Capacity:</strong> {creatorDetail.studio_details?.capacity || '20 - 30 Hours / Week'}</div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E5E5E7]/70 space-y-1">
                      <span className="font-bold text-[#86868B] block text-[10px] uppercase">Compliance &amp; Banking Details</span>
                      <div className="text-xs font-mono text-[#1D1D1F] space-y-0.5">
                        <div><span className="text-[#86868B]">Beneficiary:</span> {creatorDetail.profile?.bank_account_name || creatorDetail.full_name || creatorDetail.display_name || 'Not provided'}</div>
                        <div><span className="text-[#86868B]">Account:</span> <span className="font-semibold select-all">{creatorDetail.profile?.bank_account_number || creatorDetail.studio_details?.bankAccount || 'Not provided'}</span></div>
                        <div><span className="text-[#86868B]">IFSC / Bank:</span> <span className="font-semibold select-all">{creatorDetail.profile?.bank_ifsc_code || creatorDetail.studio_details?.ifsc || 'Not provided'}</span></div>
                        <div><span className="text-[#86868B]">PAN:</span> <span className="font-semibold select-all">{creatorDetail.profile?.pan_number || creatorDetail.studio_details?.pan || 'Not provided'}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* NDA Digital Signature & External Reel */}
                  <div className="p-3 bg-white rounded-xl border border-[#E5E5E7]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[#86868B] uppercase block">NDA &amp; Service Agreement:</span>
                      {creatorDetail.profile?.agreement_signed_at ? (
                        <span className="font-semibold text-emerald-600">
                          ✓ Digitally Signed on {new Date(creatorDetail.profile.agreement_signed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Pending Digital Execution</span>
                      )}
                    </div>
                    {(creatorDetail.profile?.portfolio_url || creatorDetail.studio_details?.showreelUrl) && (
                      <a
                        href={creatorDetail.profile?.portfolio_url || creatorDetail.studio_details?.showreelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl shrink-0"
                      >
                        Watch Master Reel ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Assignments */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Assignments ({creatorDetail.assignments.length})
                  </h3>
                  {creatorDetail.assignments.length === 0 ? (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B]">No assignments logged.</div>
                  ) : (
                    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                          <tr>
                            <th className="py-2 px-3">Project / Order ID</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Assigned Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {creatorDetail.assignments.map((a: any) => (
                            <tr key={a.id}>
                              <td className="py-2 px-3 font-mono text-[#3B82F6]">{a.project_id || a.id.slice(0, 8)}</td>
                              <td className="py-2 px-3 capitalize">{a.status}</td>
                              <td className="py-2 px-3 text-[#86868B]">{new Date(a.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Payouts */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Payouts &amp; Settlements ({creatorDetail.payouts.length})
                  </h3>
                  {creatorDetail.payouts.length === 0 ? (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B]">No payout records found.</div>
                  ) : (
                    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                          <tr>
                            <th className="py-2 px-3">Gross Fee</th>
                            <th className="py-2 px-3">TDS Rate</th>
                            <th className="py-2 px-3">Net Disbursed</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {creatorDetail.payouts.map((p: any) => (
                            <tr key={p.id}>
                              <td className="py-2 px-3 font-mono">{formatInr(p.gross_amount)}</td>
                              <td className="py-2 px-3">{p.tds_rate || '1.0'}%</td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-600">{formatInr(p.net_payout)}</td>
                              <td className="py-2 px-3 capitalize">{p.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-between items-center pt-4 border-t border-[#E5E5E7]">
              <Link
                href={`/admin/freelancers/${selectedCreatorId}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Go to Full Editor Screen →
              </Link>
              <button
                onClick={() => setSelectedCreatorId(null)}
                className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Creator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E5E5E7] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E5E5E7] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1D1D1F]">Register New Creator Member</h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Create a real database profile for your team member, editor, or colorist.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCreator} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1F]">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#F5F5F7] px-3 py-2 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1F]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-[#F5F5F7] px-3 py-2 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1F]">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-[#F5F5F7] px-3 py-2 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1F]">Specialty / Headline</label>
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="e.g. Wedding Cinema &amp; Colorist"
                    className="w-full bg-[#F5F5F7] px-3 py-2 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1F]">Skills (Comma separated)</label>
                <input
                  type="text"
                  value={newSkills}
                  onChange={(e) => setNewSkills(e.target.value)}
                  placeholder="Wedding Films, 4K Color Grading, Sound Design"
                  className="w-full bg-[#F5F5F7] px-3 py-2 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1F]">Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={newExperience}
                    onChange={(e) => setNewExperience(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] px-3 py-2 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D1D1F]">Creator Tier</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] px-3 py-2 text-xs font-bold text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                  >
                    <option value="rising_talent">Rising Talent (&lt; 10 completed)</option>
                    <option value="standard">Standard (10 - 50 completed)</option>
                    <option value="senior">Senior (&gt; 50 completed)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1D1D1F]">Short Bio / Overview</label>
                <textarea
                  rows={2}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Creative overview, software tools, narrative pacing style..."
                  className="w-full bg-[#F5F5F7] p-2.5 text-xs text-[#1D1D1F] rounded-xl border border-[#E5E5E7] outline-none focus:bg-white focus:border-[#1D1D1F]"
                />
              </div>

              <div className="p-3 bg-[#F5F5F7] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1D1D1F] block">Show on /creators Directory</span>
                  <span className="text-[11px] text-[#86868B]">Make publicly discoverable immediately</span>
                </div>
                <input
                  type="checkbox"
                  checked={newIsPublic}
                  onChange={(e) => setNewIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#1D1D1F] hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Registering...' : 'Register &amp; Add Creator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}