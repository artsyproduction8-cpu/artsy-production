'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import FreelancerHeader from '../components/FreelancerHeader';
import FreelancerSidebar from '../components/FreelancerSidebar';
import { extractYouTubeId, youtubeThumbnail } from '@/lib/youtube';

interface CreatorSubmission {
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
}

export default function FreelancerPortfolioPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const previewId = extractYouTubeId(youtubeUrl);
  const previewThumbnail = previewId ? youtubeThumbnail(previewId) : null;

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/freelancer/submissions');
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!youtubeUrl.trim()) {
      setErrorMsg('Please enter a YouTube video URL.');
      return;
    }

    if (!previewId) {
      setErrorMsg('Invalid YouTube URL. Please provide a standard watch, share, or shorts link.');
      return;
    }

    if (!title.trim() || title.trim().length < 2) {
      setErrorMsg('Please provide a title with at least 2 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/freelancer/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: youtubeUrl.trim(),
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit work.');
        return;
      }

      setSuccessMsg('Work submitted successfully! Our curation team will review it shortly.');
      setYoutubeUrl('');
      setTitle('');
      setDescription('');
      fetchSubmissions();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw this submission? You can submit it again later.')) {
      return;
    }

    try {
      setWithdrawingId(id);
      setErrorMsg(null);
      const res = await fetch(`/api/freelancer/submissions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Failed to withdraw submission.');
        return;
      }

      setSuccessMsg('Submission withdrawn successfully.');
      fetchSubmissions();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while withdrawing submission.');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans">
      <FreelancerHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E7] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/freelancer" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Dashboard
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs text-[#1D1D1F] font-medium">My Work</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Creator Portfolio Submissions
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Submit your best edits and reels for inclusion in the Artsy official portfolio.
              </p>
            </div>

            {user?.id && (
              <Link
                href={`/creators/${user.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F9F9FB] transition-all shadow-2xs shrink-0"
              >
                <span>View Public Profile</span>
                <span>↗</span>
              </Link>
            )}
          </div>

          {/* How It Works Notice */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 text-blue-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-2 text-sm text-blue-950">
              <span>ⓘ How portfolio curation works:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 ml-1">
              <li>Upload your project reel or cut to your <strong>own YouTube channel</strong> (Public or Unlisted).</li>
              <li>Paste the link below and provide a concise title and description.</li>
              <li>Our team reviews it. Once approved, it will appear directly on your public creator profile.</li>
            </ol>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="font-bold ml-4">✕</button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="font-bold ml-4">✕</button>
            </div>
          )}

          {/* Submit Form Card */}
          <div className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F]">Submit Your Work</h2>
              <p className="text-xs text-[#86868B] mt-1">
                Please double-check your video link and title before submitting for review.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  YouTube Video Link *
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all font-mono"
                  required
                />
              </div>

              {/* Live Preview */}
              {previewThumbnail && (
                <div className="p-4 rounded-xl bg-[#F9F9FB] border border-[#E5E5E7] flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-44 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-[#E5E5E7]">
                    <img
                      src={previewThumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-white/90 text-[#1D1D1F] flex items-center justify-center pl-0.5 text-xs shadow-md">
                        ▶
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      YouTube Video ID: {previewId}
                    </span>
                    <p className="text-xs text-[#86868B] pt-1">
                      Link verified. Embed thumbnail preview loaded.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cinematic Wedding Highlight Reel — Udaipur Palace"
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Description & Editorial Role (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail your exact contribution (e.g., Color Grade, Sound Design, Offline Edit) and any technical context (e.g. Log format, 4K multi-cam)."
                  maxLength={1000}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {submitting ? 'Verifying & Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>

          {/* Submissions List Card */}
          <div className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-[#E5E5E7] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1D1D1F]">
                  My Submissions ({submissions.length})
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Track the curation and publishing status of your submitted projects.
                </p>
              </div>
              <button
                onClick={fetchSubmissions}
                className="text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div className="p-16 text-center text-xs text-[#86868B]">Loading your submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-3 text-xl">
                  📁
                </div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">No submissions yet</h3>
                <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                  Submit a YouTube video above to have it considered for Artsy&apos;s curated catalog.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5E7]">
                {submissions.map((sub) => {
                  const thumb = youtubeThumbnail(sub.youtube_id);

                  return (
                    <div
                      key={sub.id}
                      className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-[#F9F9FB] transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-black/10 shrink-0 border border-[#E5E5E7]">
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

                        {/* Submission Metadata */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {sub.status === 'pending' && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                🟡 Pending review
                              </span>
                            )}
                            {sub.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                🔵 Approved — being prepared for publishing
                              </span>
                            )}
                            {sub.status === 'converted' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ✅ Live on your profile
                              </span>
                            )}
                            {sub.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                ❌ Not accepted
                              </span>
                            )}
                            {sub.status === 'withdrawn' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                ⚪ Withdrawn (by you)
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-[#1D1D1F] pt-0.5">{sub.title}</h3>

                          {sub.description && (
                            <p className="text-xs text-[#86868B] max-w-xl line-clamp-2">
                              {sub.description}
                            </p>
                          )}

                          <div className="text-[11px] text-[#86868B] pt-1">
                            Submitted: {new Date(sub.submitted_at).toLocaleDateString()}
                          </div>

                          {sub.rejection_reason && (
                            <div className="mt-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                              <strong>Reason:</strong> &ldquo;{sub.rejection_reason}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 w-full md:w-auto flex items-center justify-end gap-3">
                        {sub.status === 'pending' && (
                          <button
                            type="button"
                            disabled={withdrawingId === sub.id}
                            onClick={() => handleWithdraw(sub.id)}
                            className="w-full md:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E5E5E7] text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {withdrawingId === sub.id ? 'Withdrawing...' : 'Withdraw'}
                          </button>
                        )}

                        {sub.status === 'converted' && user?.id && (
                          <Link
                            href={`/creators/${user.id}`}
                            target="_blank"
                            className="w-full md:w-auto inline-flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-2xs"
                          >
                            <span>View on Profile</span>
                            <span>↗</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-4 bg-[#F9F9FB] border-t border-[#E5E5E7] text-center text-xs text-[#86868B]">
              ⓘ Submissions cannot be edited after sending. If a submission is rejected, you can submit a new video from scratch.
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  );
}
