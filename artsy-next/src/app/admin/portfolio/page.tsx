'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { extractYouTubeId, youtubeThumbnail } from '@/lib/youtube';

interface PortfolioSample {
  id: string;
  creator_id: string | null;
  creatorName: string;
  title: string;
  description: string | null;
  category: string;
  video_url: string;
  thumbnail_url: string;
  youtube_id: string;
  display_order: number;
  is_visible: boolean;
  approval_status: string;
  created_at: string;
}

interface CreatorOption {
  id: string;
  display_name: string;
}

export default function AdminPortfolioPage() {
  const { user } = useAuth();
  const [samples, setSamples] = useState<PortfolioSample[]>([]);
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'company' | 'all' | 'add'>('all');

  // Add Form state
  const [addYoutubeUrl, setAddYoutubeUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState('Commercial');
  const [addCreatorId, setAddCreatorId] = useState<string>(''); // empty string = Company
  const [addDescription, setAddDescription] = useState('');
  const [addingLoading, setAddingLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Modal state
  const [editingSample, setEditingSample] = useState<PortfolioSample | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Commercial');
  const [editDescription, setEditDescription] = useState('');
  const [editCreatorId, setEditCreatorId] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);

  // Video Preview Modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);

  const addPreviewId = extractYouTubeId(addYoutubeUrl);
  const addPreviewThumb = addPreviewId ? youtubeThumbnail(addPreviewId) : null;

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSamples = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch('/api/admin/portfolio', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSamples(data.samples || []);
      } else {
        const errorMsg = data.error || `HTTP ${res.status}: Failed to load portfolio samples`;
        setFetchError(errorMsg);
        console.error('[Admin Portfolio Fetch Error]', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error fetching portfolio samples';
      setFetchError(errorMsg);
      console.error('Error fetching samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const res = await fetch('/api/admin/creators');
      const data = await res.json();
      if (res.ok && data.success) {
        setCreators(data.creators || []);
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
    }
  };

  useEffect(() => {
    fetchSamples();
    fetchCreators();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addYoutubeUrl.trim()) {
      setAddError('YouTube video URL is required.');
      return;
    }

    if (!addPreviewId) {
      setAddError('Invalid YouTube video URL.');
      return;
    }

    if (!addTitle.trim() || addTitle.trim().length < 2) {
      setAddError('Title must be at least 2 characters long.');
      return;
    }

    try {
      setAddingLoading(true);
      const res = await fetch('/api/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: addYoutubeUrl.trim(),
          title: addTitle.trim(),
          category: addCategory,
          creator_id: addCreatorId || null,
          description: addDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add video to portfolio.');
        return;
      }

      setNotice(`Video "${addTitle}" added successfully to official catalog!`);
      setAddYoutubeUrl('');
      setAddTitle('');
      setAddDescription('');
      setAddCreatorId('');
      setActiveTab('all');
      fetchSamples();
    } catch (err: any) {
      setAddError(err.message || 'An error occurred adding the video.');
    } finally {
      setAddingLoading(false);
    }
  };

  const handleToggleVisibility = async (sample: PortfolioSample) => {
    try {
      const newVisibility = !sample.is_visible;
      const res = await fetch(`/api/admin/portfolio/${sample.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: newVisibility }),
      });

      if (res.ok) {
        setNotice(`Visibility updated for "${sample.title}" (${newVisibility ? 'Visible' : 'Hidden'}).`);
        fetchSamples();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update visibility.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating visibility.');
    }
  };

  const handleDelete = async (sample: PortfolioSample) => {
    if (!confirm(`Are you sure you want to permanently delete "${sample.title}" from the portfolio?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/portfolio/${sample.id}`, {
        method: 'DELETE',
      });

      if (res.ok || res.status === 204) {
        setNotice(`Video "${sample.title}" deleted from portfolio.`);
        fetchSamples();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete video.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting video.');
    }
  };

  const openEditModal = (sample: PortfolioSample) => {
    setEditingSample(sample);
    setEditTitle(sample.title);
    setEditCategory(sample.category);
    setEditDescription(sample.description || '');
    setEditCreatorId(sample.creator_id || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSample) return;

    try {
      setEditLoading(true);
      const res = await fetch(`/api/admin/portfolio/${editingSample.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim() || null,
          creator_id: editCreatorId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update sample.');
        return;
      }

      setNotice('Portfolio sample updated successfully.');
      setEditingSample(null);
      fetchSamples();
    } catch (err: any) {
      alert(err.message || 'Error saving edits.');
    } finally {
      setEditLoading(false);
    }
  };

  // Group samples
  const companySamples = samples.filter((s) => s.creator_id === null);

  const groupedByCreator: Record<string, { creatorName: string; items: PortfolioSample[] }> = {};
  samples.forEach((sample) => {
    const key = sample.creator_id || 'company';
    const name = sample.creator_id ? sample.creatorName : 'Company (Artsy Official)';
    if (!groupedByCreator[key]) {
      groupedByCreator[key] = { creatorName: name, items: [] };
    }
    groupedByCreator[key].items.push(sample);
  });

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
                <span className="text-xs text-[#1D1D1F] font-medium">Portfolio Catalog</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
                Official YouTube Portfolio
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Live catalog of official Artsy YouTube videos featured on the public /work page and creator profiles.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E5E5E7] shadow-2xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                All Videos ({samples.length})
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'company'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Company ({companySamples.length})
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'add'
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                + Add Video
              </button>
            </div>
          </div>

          {notice && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span>{notice}</span>
              <button onClick={() => setNotice(null)} className="font-bold ml-4">✕</button>
            </div>
          )}

          {/* TAB 1: Company Videos */}
          {activeTab === 'company' && (
            <div className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs overflow-hidden">
              <div className="p-6 border-b border-[#E5E5E7] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1D1D1F]">Company Portfolio Showcase</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Videos where creator is unassigned (Artsy Studio Official), served directly on /work.
                  </p>
                </div>
                <button onClick={fetchSamples} className="text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]">
                  ↻ Refresh
                </button>
              </div>

              {loading ? (
                <div className="p-16 text-center text-xs text-[#86868B]">Loading company videos...</div>
              ) : fetchError ? (
                <div className="p-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl">
                    ⚠️
                  </div>
                  <h3 className="text-sm font-semibold text-rose-900">Failed to load company catalog</h3>
                  <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">{fetchError}</p>
                  <button
                    onClick={fetchSamples}
                    className="mt-4 px-4 py-2 bg-[#1D1D1F] text-white text-xs font-semibold rounded-xl hover:bg-black transition-all cursor-pointer"
                  >
                    ↻ Retry Fetch
                  </button>
                </div>
              ) : companySamples.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-3 text-xl">
                    🏢
                  </div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">No company videos yet</h3>
                  <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                    Use the &ldquo;Add Video&rdquo; tab with Creator set to &ldquo;None (Company)&rdquo; to publish official studio work.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5E7]">
                  {companySamples.map((sample) => renderVideoRow(sample))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: All Videos (Grouped by Creator) */}
          {activeTab === 'all' && (
            <div className="space-y-6">
              {loading ? (
                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-16 text-center text-xs text-[#86868B]">
                  Loading catalog...
                </div>
              ) : fetchError ? (
                <div className="bg-white border border-rose-200 rounded-2xl p-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl">
                    ⚠️
                  </div>
                  <h3 className="text-sm font-semibold text-rose-900">Failed to load official catalog</h3>
                  <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">{fetchError}</p>
                  <button
                    onClick={fetchSamples}
                    className="mt-4 px-4 py-2 bg-[#1D1D1F] text-white text-xs font-semibold rounded-xl hover:bg-black transition-all cursor-pointer"
                  >
                    ↻ Retry Fetch
                  </button>
                </div>
              ) : samples.length === 0 ? (
                <div className="bg-white border border-[#E5E5E7] rounded-2xl p-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto mb-3 text-xl">
                    🎬
                  </div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">Catalog is empty</h3>
                  <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                    No videos have been added to the official portfolio yet.
                  </p>
                </div>
              ) : (
                Object.entries(groupedByCreator).map(([groupKey, group]) => (
                  <div key={groupKey} className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-[#E5E5E7] bg-[#F9F9FB] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${groupKey === 'company' ? 'bg-[#1D1D1F]' : 'bg-[#3B82F6]'}`} />
                        <h2 className="text-sm font-bold text-[#1D1D1F]">{group.creatorName}</h2>
                        <span className="text-[11px] font-semibold text-[#86868B] bg-white px-2 py-0.5 rounded-full border border-[#E5E5E7]">
                          {group.items.length} {group.items.length === 1 ? 'video' : 'videos'}
                        </span>
                      </div>
                      {groupKey !== 'company' && (
                        <Link
                          href={`/creators/${groupKey}`}
                          target="_blank"
                          className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Public Profile</span>
                          <span>↗</span>
                        </Link>
                      )}
                    </div>
                    <div className="divide-y divide-[#E5E5E7]">
                      {group.items.map((sample) => renderVideoRow(sample))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Add Video Form */}
          {activeTab === 'add' && (
            <div className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs p-6 md:p-8 space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-[#1D1D1F]">Add Video to Official Portfolio</h2>
                <p className="text-xs text-[#86868B] mt-1">
                  Add a video uploaded to Artsy&apos;s official YouTube channel. You can assign it to a vetted creator or feature it as company studio work.
                </p>
              </div>

              {addError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1D1D1F]">
                    Artsy YouTube Video URL *
                  </label>
                  <input
                    type="text"
                    value={addYoutubeUrl}
                    onChange={(e) => setAddYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... (Must be on Artsy's Channel)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs font-mono text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                    required
                  />
                </div>

                {addPreviewThumb && (
                  <div className="p-3.5 rounded-xl bg-[#F9F9FB] border border-[#E5E5E7] flex items-center gap-4">
                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-[#E5E5E7]">
                      <img src={addPreviewThumb} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ID: {addPreviewId}
                      </span>
                      <p className="text-xs text-[#86868B]">Verified YouTube video thumbnail preview loaded.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1D1D1F]">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="e.g. Royal Heritage Wedding Film — 4K Director's Cut"
                    maxLength={200}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1D1D1F]">
                    Category *
                  </label>
                  <select
                    value={addCategory}
                    onChange={(e) => setAddCategory(e.target.value)}
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
                    Assign to Creator
                  </label>
                  <select
                    value={addCreatorId}
                    onChange={(e) => setAddCreatorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                  >
                    <option value="">None (Company Portfolio)</option>
                    {creators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.display_name} ({c.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1D1D1F]">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={addDescription}
                    onChange={(e) => setAddDescription(e.target.value)}
                    placeholder="Editorial credits, color profile, or cameras used."
                    maxLength={1000}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={addingLoading}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1D1D1F] text-white hover:bg-black transition-all disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    {addingLoading ? 'Adding Video...' : 'Add Video to Catalog'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      {/* Edit Modal */}
      {editingSample && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F]">Edit Portfolio Video</h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Update catalog details for this live sample.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">Category *</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
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
                <label className="block text-xs font-bold text-[#1D1D1F]">Assign to Creator</label>
                <select
                  value={editCreatorId}
                  onChange={(e) => setEditCreatorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                >
                  <option value="">None (Company Portfolio)</option>
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1D1D1F]">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F9F9FB] text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#3B82F6] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setEditingSample(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#1D1D1F] text-white hover:bg-black transition-all disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1D1D1F] rounded-2xl max-w-3xl w-full p-4 border border-white/10 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-white/10">
              <span className="text-xs font-bold">Video Player</span>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center font-bold hover:bg-white/20"
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <iframe
                src={previewVideoUrl.replace('watch?v=', 'embed/')}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );

  function renderVideoRow(sample: PortfolioSample) {
    return (
      <div
        key={sample.id}
        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#F9F9FB] transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Thumb */}
          <div
            onClick={() => setPreviewVideoUrl(sample.video_url)}
            className="relative w-36 aspect-video rounded-xl overflow-hidden bg-black/10 shrink-0 border border-[#E5E5E7] cursor-pointer group"
          >
            <img
              src={sample.thumbnail_url}
              alt={sample.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center text-white">
              <div className="w-7 h-7 rounded-full bg-white/90 text-[#1D1D1F] flex items-center justify-center pl-0.5 text-xs shadow-md">
                ▶
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#1D1D1F] text-white">
                {sample.category}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sample.is_visible
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {sample.is_visible ? 'Live Visible' : 'Hidden'}
              </span>
            </div>

            <h3 className="text-sm font-bold text-[#1D1D1F]">{sample.title}</h3>

            {sample.description && (
              <p className="text-xs text-[#86868B] max-w-xl line-clamp-1">{sample.description}</p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-[#86868B] pt-0.5">
              <span>
                Creator: <strong className="text-[#1D1D1F]">{sample.creatorName}</strong>
              </span>
              <span>•</span>
              <a
                href={sample.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-mono"
              >
                YouTube ↗
              </a>
            </div>
          </div>
        </div>

        {/* Actions: [👁] [Edit] [🗑] */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => handleToggleVisibility(sample)}
            title={sample.is_visible ? 'Hide from public site' : 'Show on public site'}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              sample.is_visible
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {sample.is_visible ? '👁 Visible' : '👁‍🗨 Hidden'}
          </button>
          <button
            onClick={() => openEditModal(sample)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5E7] transition-all cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(sample)}
            className="p-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
            title="Delete video"
          >
            🗑
          </button>
        </div>
      </div>
    );
  }
}
