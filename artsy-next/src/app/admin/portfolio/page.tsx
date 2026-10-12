'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface PortfolioSample {
  id: string;
  creator_id: string;
  creatorName: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
}

export default function AdminPortfolioPage() {
  const { user } = useAuth();
  const [samples, setSamples] = useState<PortfolioSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [activeVideoModal, setActiveVideoModal] = useState<PortfolioSample | null>(null);
  const [rejectingSampleId, setRejectingSampleId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Lighting and grade do not meet Artsy Cinema QA criteria.');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/portfolio?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSamples(data.samples || []);
      }
    } catch (err) {
      console.error('Error fetching samples:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'approve',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice('Sample reel approved and now visible on creator profile!');
        fetchSamples();
      } else {
        alert(data.error || 'Failed to approve sample');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing approval');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'reject',
          rejection_reason: rejectReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice('Sample reel rejected with feedback provided to creator.');
        setRejectingSampleId(null);
        fetchSamples();
      } else {
        alert(data.error || 'Failed to reject sample');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing rejection');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E7] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs text-[#1D1D1F] font-medium">Portfolio Curation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Portfolio Sample Approvals
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Review and QA candidate reels uploaded by creators before they are published to public profiles.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5E7]">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === filter
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E5E5E7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                statusFilter === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'
              }`}
            />
            <h2 className="text-sm font-bold text-[#1D1D1F] capitalize">
              {statusFilter} Reels ({samples.length})
            </h2>
          </div>
          <button
            onClick={fetchSamples}
            className="text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
          >
            ↻ Reload
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-[#86868B]">Loading portfolio reels...</div>
        ) : samples.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-4 text-xl">
              🎞️
            </div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">No samples found</h3>
            <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
              No samples match the selected &ldquo;{statusFilter}&rdquo; filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E7]">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-[#F9F9FB] transition-colors"
              >
                {/* Left: Preview thumbnail + title */}
                <div className="flex items-start gap-4">
                  {/* Thumbnail / Video trigger */}
                  <div
                    onClick={() => setActiveVideoModal(sample)}
                    className="relative w-36 h-20 rounded-xl overflow-hidden bg-black/10 shrink-0 cursor-pointer group border border-[#E5E5E7]"
                  >
                    <img
                      src={sample.thumbnail_url}
                      alt={sample.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white/90 text-[#1D1D1F] flex items-center justify-center pl-0.5 text-xs shadow-md">
                        ▶
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#1D1D1F] text-white">
                        {sample.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          sample.approval_status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : sample.approval_status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sample.approval_status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#1D1D1F] mt-1">{sample.title}</h3>
                    {sample.description && (
                      <p className="text-xs text-[#86868B] max-w-xl line-clamp-2">
                        {sample.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-[#86868B] pt-1">
                      <span>
                        Creator: <strong className="text-[#1D1D1F]">{sample.creatorName}</strong>
                      </span>
                      <span>•</span>
                      <span>Submitted: {new Date(sample.created_at).toLocaleDateString()}</span>
                    </div>

                    {sample.rejection_reason && (
                      <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                        <strong>Rejection feedback:</strong> {sample.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0 w-full lg:w-auto">
                  <button
                    onClick={() => setActiveVideoModal(sample)}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5E7] transition-all"
                  >
                    Watch Preview
                  </button>

                  {sample.approval_status === 'pending' && (
                    <>
                      <button
                        disabled={actionLoading === sample.id}
                        onClick={() => handleApprove(sample.id)}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
                      >
                        {actionLoading === sample.id ? 'Processing...' : 'Approve Reel'}
                      </button>

                      <button
                        disabled={actionLoading === sample.id}
                        onClick={() => setRejectingSampleId(sample.id)}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-white border border-[#E5E5E7] text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {sample.approval_status === 'rejected' && (
                    <button
                      disabled={actionLoading === sample.id}
                      onClick={() => handleApprove(sample.id)}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 hover:bg-emerald-50 transition-all"
                    >
                      Re-Approve
                    </button>
                  )}

                  {sample.approval_status === 'approved' && (
                    <button
                      disabled={actionLoading === sample.id}
                      onClick={() => setRejectingSampleId(sample.id)}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1D1D1F] rounded-2xl max-w-3xl w-full overflow-hidden border border-white/10 shadow-2xl space-y-4 p-6 animate-in fade-in">
            <div className="flex items-center justify-between text-white border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  {activeVideoModal.category}
                </span>
                <h3 className="text-base font-bold">{activeVideoModal.title}</h3>
                <span className="text-xs text-[#86868B]">
                  Editor: {activeVideoModal.creatorName}
                </span>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <iframe
                src={activeVideoModal.video_url}
                className="w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#86868B] font-mono truncate max-w-md">
                {activeVideoModal.video_url}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white"
                >
                  Close
                </button>
                {activeVideoModal.approval_status === 'pending' && (
                  <button
                    onClick={() => {
                      handleApprove(activeVideoModal.id);
                      setActiveVideoModal(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all"
                  >
                    Approve Reel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingSampleId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in fade-in">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">Reject Sample Reel</h3>
              <p className="text-xs text-[#86868B] mt-1">
                Provide feedback to the creator outlining why this sample was rejected.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1D1D1F] block">Rejection Feedback</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl p-3 text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#1D1D1F]"
                placeholder="e.g. Color grade lacks dynamic range / pacing is irregular"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingSampleId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === rejectingSampleId}
                onClick={() => handleReject(rejectingSampleId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
