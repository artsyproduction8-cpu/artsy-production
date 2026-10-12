'use client';

import { useState, useEffect } from 'react';

interface CreatorItem {
  id: string;
  display_name: string;
  phone: string;
  email: string;
  skills: string[];
  approval_status: 'approved' | 'pending' | 'rejected';
  is_suspended: boolean;
  rating: number;
  total_jobs: number;
  total_earned: number; // in paisa
  created_at: string;
}

interface CreatorDetail {
  id: string;
  display_name: string;
  phone: string;
  email: string;
  status: string;
  profile: any;
  assignments: any[];
  payouts: any[];
  revisions: any[];
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

  const filteredCreators = creators.filter((c) => {
    const matchesSearch =
      !search ||
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && c.approval_status === 'approved' && !c.is_suspended) ||
      (statusFilter === 'pending' && c.approval_status === 'pending') ||
      (statusFilter === 'rejected' && c.approval_status === 'rejected') ||
      (statusFilter === 'suspended' && c.is_suspended);

    return matchesSearch && matchesStatus;
  });

  const formatInr = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format((paisa || 0) / 100);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Creator & Talent Roster</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Real-time DB
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Vetted colorists, editors, and VFX artists. Manage approval status, active project workloads, and NEFT payouts.
          </p>
        </div>

        <button
          onClick={fetchCreators}
          className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs cursor-pointer"
        >
          Refresh Roster
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          {feedback}
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
            <option value="approved">Approved & Active</option>
            <option value="pending">Pending Vetting</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Creators Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading verified creators from database...</div>
        ) : filteredCreators.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#86868B]">No creators matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold">
                  <th className="py-3 px-4">Creator Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Skills</th>
                  <th className="py-3 px-4">Vetting Status</th>
                  <th className="py-3 px-4">Studio Rating</th>
                  <th className="py-3 px-4">Completed Jobs</th>
                  <th className="py-3 px-4">Total Earned</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {filteredCreators.map((creator) => (
                  <tr
                    key={creator.id}
                    onClick={() => openCreatorDetail(creator.id)}
                    className="hover:bg-[#F5F5F7]/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1D1D1F]">{creator.display_name}</div>
                      <div className="text-[10px] font-mono text-[#86868B]">{creator.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#1D1D1F]">{creator.email}</div>
                      <div className="text-[10px] font-mono text-[#86868B]">{creator.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {creator.skills.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-[#F5F5F7] text-[10px] rounded text-[#1D1D1F]">
                            {s}
                          </span>
                        ))}
                        {creator.skills.length > 2 && (
                          <span className="text-[10px] text-[#86868B]">+{creator.skills.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          creator.is_suspended
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : creator.approval_status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : creator.approval_status === 'rejected'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {creator.is_suspended
                          ? 'SUSPENDED'
                          : creator.approval_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1D1D1F] flex items-center gap-1">
                      <span className="text-amber-500">★</span> {creator.rating.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#1D1D1F]">
                      {creator.total_jobs} Projects
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {formatInr(creator.total_earned)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {creator.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(creator.id, 'approve')}
                              disabled={actionLoading === creator.id}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(creator.id, 'reject')}
                              disabled={actionLoading === creator.id}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {creator.approval_status === 'approved' && !creator.is_suspended && (
                          <button
                            onClick={() => handleAction(creator.id, 'suspend')}
                            disabled={actionLoading === creator.id}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                        {creator.is_suspended && (
                          <button
                            onClick={() => handleAction(creator.id, 'reactivate')}
                            disabled={actionLoading === creator.id}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-semibold cursor-pointer"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => openCreatorDetail(creator.id)}
                          className="px-2 py-1 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded text-[10px] font-semibold cursor-pointer"
                        >
                          View →
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

      {/* Creator Detail Modal / Drawer (Task 3.3) */}
      {selectedCreatorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-[#E5E5E7] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E5E5E7] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  {creatorDetail?.display_name || 'Loading Creator Profile...'}
                </h2>
                <div className="text-xs text-[#86868B] font-mono mt-0.5">
                  ID: {selectedCreatorId} • {creatorDetail?.email} • {creatorDetail?.phone || 'No phone'}
                </div>
              </div>
              <button
                onClick={() => setSelectedCreatorId(null)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
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

                {/* 1. All Assignments */}
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

                {/* 2. All Payouts with TDS Breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Payouts & TDS Breakdown ({creatorDetail.payouts.length})
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
                            <th className="py-2 px-3">TDS Amount</th>
                            <th className="py-2 px-3">Net Disbursed</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">UTR / Ref</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {creatorDetail.payouts.map((p: any) => (
                            <tr key={p.id}>
                              <td className="py-2 px-3 font-mono">{formatInr(p.gross_amount)}</td>
                              <td className="py-2 px-3">{p.tds_rate || '1.0'}%</td>
                              <td className="py-2 px-3 font-mono text-amber-700">{formatInr(p.tds_amount)}</td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-600">{formatInr(p.net_payout)}</td>
                              <td className="py-2 px-3 capitalize">{p.status}</td>
                              <td className="py-2 px-3 font-mono text-[10px] text-[#86868B]">{p.neft_utr_reference || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. Revisions */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Revisions Submitted ({creatorDetail.revisions.length})
                  </h3>
                  {creatorDetail.revisions.length === 0 ? (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B]">No revision iterations logged.</div>
                  ) : (
                    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                          <tr>
                            <th className="py-2 px-3">Round</th>
                            <th className="py-2 px-3">Client Feedback</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {creatorDetail.revisions.map((r: any) => (
                            <tr key={r.id}>
                              <td className="py-2 px-3 font-bold">Round #{r.revision_number || 1}</td>
                              <td className="py-2 px-3 max-w-xs truncate">{r.feedback_notes || '—'}</td>
                              <td className="py-2 px-3 capitalize">{r.status}</td>
                              <td className="py-2 px-3 text-[#86868B]">{new Date(r.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-4 border-t border-[#E5E5E7]">
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
    </div>
  );
}