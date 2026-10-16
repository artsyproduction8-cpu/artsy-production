'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { extractYouTubeId, youtubeThumbnail } from '@/lib/youtube';

interface SubmissionItem {
  id: string;
  creator_id: string;
  youtube_url: string;
  youtube_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'converted' | 'withdrawn';
  rejection_reason: string | null;
  converted_sample_id: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  creator: {
    name: string;
    email?: string;
    phone?: string;
  };
}

export default function AdminSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'converted' | 'rejected' | 'withdrawn' | 'all'>('pending');

  // Modals state
  const [convertModalItem, setConvertModalItem] = useState<SubmissionItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<SubmissionItem | null>(null);

  // Convert form state
  const [artsyYoutubeUrl, setArtsyYoutubeUrl] = useState('');
  const [convertTitle, setConvertTitle] = useState('');
  const [convertCategory, setConvertCategory] = useState('Commercial');
  const [convertDescription, setConvertDescription] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Reject form state
  const [rejectReason, setRejectReason] = useState('Reel does not meet Artsy studio technical or aesthetic QA guidelines.');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const artsyPreviewId = extractYouTubeId(artsyYoutubeUrl);
  const artsyPreviewThumb = artsyPreviewId ? youtubeThumbnail(artsyPreviewId) : null;

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/submissions?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const openConvertModal = (item: SubmissionItem) => {
    setConvertModalItem(item);
    setConvertTitle(item.title);
    setConvertDescription(item.description || '');
    setArtsyYoutubeUrl('');
    setConvertCategory('Commercial');
    setConvertError(null);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertModalItem) return;

    if (!artsyYoutubeUrl.trim()) {
      setConvertError('Please provide Artsy’s YouTube channel URL.');
      return;
    }

    if (!artsyPreviewId) {
      setConvertError('Invalid Artsy YouTube URL.');
      return;
    }

    try {
      setConvertLoading(true);
      setConvertError(null);

      // 1. Create portfolio sample
      const portRes = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: artsyYoutubeUrl.trim(),
          title: convertTitle.trim(),
          category: convertCategory,
          creator_id: convertModalItem.creator_id,
          description: convertDescription.trim() || null,
        }),
      });

      const portData = await portRes.json();
      if (!portRes.ok || !portData.sample?.id) {
        setConvertError(portData.error || 'Failed to add video to official portfolio.');
        return;
      }

      const sampleId = portData.sample.id;

      // 2. Mark submission as converted
      const convRes = await fetch(`/api/admin/submissions/${convertModalItem.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_sample_id: sampleId,
        }),
      });

      const convData = await convRes.json();
      if (!convRes.ok) {
        setConvertError(convData.error || 'Failed to mark submission as converted.');
        return;
      }

      setNotice(`Video successfully published to Artsy catalog and assigned to ${convertModalItem.creator.name}!`);
      setConvertModalItem(null);
      fetchSubmissions();
    } catch (err: any) {
      setConvertError(err.message || 'An unexpected error occurred during conversion.');
    } finally {
      setConvertLoading(false);
    }
  };

  const openRejectModal = (item: SubmissionItem) => {
    setRejectModalItem(item);
    setRejectReason('Lighting, sound, or color grading do not meet Artsy studio technical requirements.');
    setRejectError(null);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setRejectError('Please provide a specific rejection reason (min 5 characters).');
      return;
    }

    try {
      setRejectLoading(true);
      setRejectError(null);

      const res = await fetch(`/api/admin/submissions/${rejectModalItem.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRejectError(data.error || 'Failed to reject submission.');
        return;
      }

      setNotice('Submission rejected. Feedback recorded and submission is now frozen.');
      setRejectModalItem(null);
      fetchSubmissions();
    } catch (err: any) {
      setRejectError(err.message || 'An error occurred during rejection.');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E7] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Dashboard
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs text-[#1D1D1F] font-medium">Curation Queue</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Creator Work Submissions
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Review work submitted by creators from their own channels, curate, and re-upload to Artsy Official.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E5E5E7] shadow-2xs">
              {(['pending', 'converted', 'rejected', 'withdrawn', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-[#1D1D1F] text-white shadow-xs'
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
              <button onClick={() => setNotice(null)} className="font-bold ml-4">✕</button>
            </div>
          )}

          {/* Submissions List */}
          <div className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-[#E5E5E7] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    statusFilter === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'
                  }`}
                />
                <h2 className="text-sm font-bold text-[#1D1D1F] capitalize">
                  {statusFilter} Submissions ({submissions.length})
                </h2>
              </div>
              <button
                onClick={fetchSubmissions}
                className="text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-16 text-center text-xs text-[#86868B]">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-3 text-xl">
                  📹
                </div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">No submissions found</h3>
                <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                  No submissions currently match the &ldquo;{statusFilter}&rdquo; status filter.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5E7]">
                {submissions.map((sub) => {
                  const thumb = youtubeThumbnail(sub.youtube_id);

                  return (
                    <div
                      key={sub.id}
                      className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:bg-[#F9F9FB] transition-colors"
                    >
                      <div className="flex items-start gap-5">
                        {/* Thumbnail */}
                        <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-black/10 shrink-0 border border-[#E5E5E7]">
                          <img
                            src={thumb}
                            alt={sub.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <a
                            href={sub.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/30 hover:bg-black/50 transition-colors flex items-center justify-center text-white"
                          >
                            <div className="w-8 h-8 rounded-full bg-white/90 text-[#1D1D1F] flex items-center justify-center pl-0.5 text-xs shadow-md">
                              ▶
                            </div>
                          </a>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {sub.status === 'pending' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                🟡 Pending Review
                              </span>
                            )}
                            {sub.status === 'converted' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                ✅ Converted → In Portfolio
                              </span>
                            )}
                            {sub.status === 'rejected' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                                ❌ Rejected
                              </span>
                            )}
                            {sub.status === 'withdrawn' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                ⚪ Withdrawn by Creator
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-[#1D1D1F]">{sub.title}</h3>

                          {sub.description && (
                            <p className="text-xs text-[#86868B] max-w-2xl line-clamp-2">
                              {sub.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#86868B] pt-1">
                            <span>
                              Creator: <strong className="text-[#1D1D1F]">{sub.creator.name}</strong>
                            </span>
                            <span>•</span>
                            <span>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <a
                              href={sub.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium inline-flex items-center gap-0.5"
                            >
                              <span>Watch on Creator YouTube</span>
                              <span>↗</span>
                            </a>
                          </div>

                          {sub.rejection_reason && (
                            <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                              <strong>Rejection reason:</strong> {sub.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="shrink-0 w-full lg:w-auto flex items-center justify-end gap-3">
                        {sub.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openConvertModal(sub)}
                              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-2xs cursor-pointer"
                            >
                              Convert → Add to Portfolio
                            </button>
                            <button
                              onClick={() => openRejectModal(sub)}
                              className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-[#E5E5E7] text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {sub.status === 'converted' && (
                          <Link
                            href="/admin/portfolio"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5E7]"
                          >
                            View in Portfolio Catalog →
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* Convert Modal */}
      {convertModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E5E5E7] space-y-6 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Publish to Artsy Official
              </span>
              <h2 className="text-lg font-bold text-[#1D1D1F] mt-1.5">
                Convert & Publish to Portfolio
              </h2>
              <p className="text-xs text-[#86868B] mt-1">
                You are converting <strong>{convertModalItem.creator.name}</strong>&apos;s submission into a live portfolio sample. Paste the video link uploaded to Artsy&apos;s YouTube channel.
              </p>
            </div>

            {convertError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {convertError}
              </div>
            )}

            <form onSubmit={handleConvertSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">
                  Artsy Channel YouTube URL *
                </label>
                <input
                  type="text"
                  value={artsyYoutubeUrl}
                  onChange={(e) => setArtsyYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... (Artsy's Official URL)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-mono text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                  required
                />
              </div>

              {artsyPreviewThumb && (
                <div className="p-3.5 rounded-xl bg-[#F9F9FB] border border-[#E5E5E7] flex items-center gap-4">
                  <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-[#E5E5E7]">
                    <img src={artsyPreviewThumb} alt="Artsy Thumbnail" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-600">ID: {artsyPreviewId}</span>
                    <p className="text-xs text-[#86868B] mt-0.5">Artsy video verified and ready for catalog.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">
                  Catalog Title *
                </label>
                <input
                  type="text"
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">
                  Category *
                </label>
                <select
                  value={convertCategory}
                  onChange={(e) => setConvertCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Wedding Cinema">Wedding Cinema</option>
                  <option value="Music Video">Music Video</option>
                  <option value="Documentary">Documentary</option>
                  <option value="Social & Ads">Social & Ads</option>
                  <option value="Narrative Film">Narrative Film</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">
                  Description / Editorial Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={convertDescription}
                  onChange={(e) => setConvertDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setConvertModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={convertLoading}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {convertLoading ? 'Publishing...' : 'Publish to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F]">Reject Submission</h2>
              <p className="text-xs text-[#86868B] mt-1">
                Provide feedback to <strong>{rejectModalItem.creator.name}</strong>. Rejection is final and the submission will be frozen.
              </p>
            </div>

            {rejectError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">
                  Rejection Reason (Min 5 chars) *
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
