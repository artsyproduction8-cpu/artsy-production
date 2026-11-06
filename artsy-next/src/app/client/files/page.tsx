'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';
import { useAuth } from '@/lib/auth';

interface FileRecordItem {
  id: string;
  project_id: string;
  project_title?: string;
  project_number?: string;
  file_name: string;
  file_size_bytes: number;
  file_type: 'raw_footage' | 'master_delivery' | 'proxy' | 'audio_stem' | string;
  storage_provider: string;
  download_url?: string;
  b2_key?: string;
  retention_delete_at?: string;
  is_soft_deleted?: boolean;
  status?: 'delivered' | 'in_progress' | 'expiring_soon' | 'ready';
  created_at: string;
}

const FALLBACK_FILES: FileRecordItem[] = [];

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isFileExpiring(retentionDate?: string): boolean {
  if (!retentionDate) return false;
  const now = Date.now();
  const diff = new Date(retentionDate).getTime() - now;
  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function ClientFilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'raw_footage' | 'delivered' | 'in_progress' | 'expiring_soon'>('all');

  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      try {
        const res = await fetch('/api/client/files');
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setFiles(data.files);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to load file records from API', err);
      }
      setFiles(FALLBACK_FILES);
      setLoading(false);
    }

    loadFiles();
  }, [user?.id]);

  // Files Expiring Within 7 Days
  const expiringFiles = useMemo(() => {
    return files.filter((f) => isFileExpiring(f.retention_delete_at));
  }, [files]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (activeFilter === 'raw_footage') return f.file_type === 'raw_footage';
      if (activeFilter === 'delivered') return f.file_type === 'master_delivery' || f.status === 'delivered';
      if (activeFilter === 'in_progress') return f.file_type === 'proxy' || f.status === 'in_progress';
      if (activeFilter === 'expiring_soon') {
        return isFileExpiring(f.retention_delete_at);
      }
      return true;
    });
  }, [files, activeFilter]);

  // Grouped by Project
  const groupedFiles = useMemo(() => {
    const map = new Map<string, { title: string; number?: string; files: FileRecordItem[] }>();
    filteredFiles.forEach((file) => {
      const projId = file.project_id || 'general';
      const title = file.project_title || `Project #${projId}`;
      const number = file.project_number;
      if (!map.has(projId)) {
        map.set(projId, { title, number, files: [] });
      }
      map.get(projId)!.files.push(file);
    });
    return Array.from(map.entries());
  }, [filteredFiles]);

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans overflow-x-hidden">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-4 sm:p-5 space-y-4 w-full max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1D1D1F]">
                  Files &amp; Footage
                </h1>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Direct links to your raw footage, preview drafts, and final 4K master files.
                </p>
              </div>
              <Link
                href="/client/review"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] rounded-xl transition-colors shrink-0 shadow-2xs"
              >
                <span>Review Suite</span>
                <span>→</span>
              </Link>
            </div>

            {/* Retention Warning Banner (if files expiring within 7 days) */}
            {expiringFiles.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                    !
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-amber-900">
                      Storage Notice: {expiringFiles.length} file{expiringFiles.length > 1 ? 's' : ''} expiring within 7 days
                    </h2>
                    <p className="text-[11px] text-amber-800/80 mt-0.5 leading-relaxed">
                      Raw footage is kept for 15 days, final files for 30 days. Please save your local copies.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('expiring_soon')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    View Expiring
                  </button>
                  <a
                    href={`https://wa.me/${(process.env.NEXT_PUBLIC_SUPPORT_PHONE || '').replace(/\D/g, '')}?text=Hello%20Artsy,%20I%20would%20like%20to%20request%20extended%20storage%20for%20my%20files`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Chat With Us
                  </a>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E5E5E7] pb-2.5">
              {(
                [
                  { key: 'all', label: `All Files (${files.length})` },
                  { key: 'raw_footage', label: 'Raw Footage' },
                  { key: 'delivered', label: 'Final Videos' },
                  { key: 'in_progress', label: 'Drafts' },
                  ...(expiringFiles.length > 0 ? [{ key: 'expiring_soon' as const, label: `Expiring Soon (${expiringFiles.length})` }] : []),
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeFilter === tab.key
                      ? 'bg-[#1D1D1F] text-white shadow-2xs'
                      : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Projects and File Cards */}
            {loading ? (
              <div className="text-center py-16 text-xs text-[#86868B]">
                Loading files and video links...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#E5E5E7] rounded-2xl bg-white p-8 space-y-3">
                <div className="text-3xl mb-2">📁</div>
                <h3 className="text-base font-bold text-[#1D1D1F]">No files or links registered yet</h3>
                <p className="text-xs text-[#86868B] max-w-md mx-auto leading-relaxed">
                  Your raw camera footage links, draft preview videos, and final 4K master downloads will appear here automatically as your project progresses.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-5 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  Start New Project →
                </Link>
              </div>
            ) : groupedFiles.length === 0 ? (
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-10 text-center space-y-2">
                <div className="text-sm font-bold text-[#1D1D1F]">No items in this category</div>
                <p className="text-xs text-[#86868B]">
                  No files match your selected filter tab. Try clicking &quot;All Files &amp; Links&quot; above.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedFiles.map(([projectId, { title, number, files: projectFiles }]) => (
                  <div key={projectId} className="bg-white rounded-2xl border border-[#E5E5E7] p-4 sm:p-5 space-y-3 shadow-2xs">
                    {/* Project Group Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-[#F5F5F7] gap-2">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#1D1D1F]">{title}</h2>
                        <span className="text-[11px] text-[#86868B] font-mono">
                          {number ? `Order #${number}` : `ID: ${projectId.slice(0, 8)}`} • {projectFiles.length} item{projectFiles.length > 1 ? 's' : ''} available
                        </span>
                      </div>
                      <Link
                        href={`/client/review?project=${encodeURIComponent(projectId)}`}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline flex items-center gap-1"
                      >
                        <span>Open Review Suite</span>
                        <span>→</span>
                      </Link>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {projectFiles.map((file) => {
                        const now = Date.now();
                        const isExpiring =
                          file.retention_delete_at &&
                          new Date(file.retention_delete_at).getTime() - now <= 7 * 24 * 3600 * 1000 &&
                          new Date(file.retention_delete_at).getTime() > now;

                        const daysLeft = file.retention_delete_at
                          ? Math.ceil(
                              (new Date(file.retention_delete_at).getTime() - now) /
                                (24 * 60 * 60 * 1000)
                            )
                          : null;

                        const isRaw = file.file_type === 'raw_footage';
                        const isFinal = file.file_type === 'master_delivery';
                        const isDraft = file.file_type === 'proxy';

                        return (
                          <div
                            key={file.id}
                            className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between ${
                              isFinal
                                ? 'bg-blue-50/30 border-blue-200'
                                : isRaw
                                ? 'bg-purple-50/20 border-purple-200'
                                : isExpiring
                                ? 'bg-amber-50/20 border-amber-300'
                                : 'bg-[#F5F5F7] border-[#E5E5E7]'
                            }`}
                          >
                            <div className="space-y-1.5">
                              {/* Top Badge */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    isFinal
                                      ? 'bg-blue-100 text-blue-800'
                                      : isRaw
                                      ? 'bg-purple-100 text-purple-800'
                                      : isDraft
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-zinc-200 text-zinc-800'
                                  }`}
                                >
                                  {isFinal
                                    ? 'Final Video'
                                    : isRaw
                                    ? 'Raw Footage'
                                    : isDraft
                                    ? 'Draft Cut'
                                    : file.file_type.replace('_', ' ')}
                                </span>
                                {isExpiring && (
                                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                    {daysLeft}d left
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <div>
                                <h3 className="text-xs font-bold text-[#1D1D1F] leading-snug line-clamp-2" title={file.file_name}>
                                  {file.file_name}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#86868B]">
                                  <span>{file.storage_provider || 'Cloud Storage'}</span>
                                  {file.file_size_bytes > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{formatBytes(file.file_size_bytes)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action CTA */}
                            <div className="pt-2.5 mt-2.5 border-t border-[#E5E5E7] flex items-center justify-between gap-2">
                              {file.download_url ? (
                                <a
                                  href={file.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`w-full py-1.5 px-3 text-white rounded-lg text-center text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                                    isFinal
                                      ? 'bg-[#3B82F6] hover:bg-blue-600'
                                      : isRaw
                                      ? 'bg-[#1D1D1F] hover:bg-black'
                                      : 'bg-[#3B82F6] hover:bg-blue-600'
                                  }`}
                                >
                                  {isFinal ? (
                                    <>
                                      <span>Download Final Video</span>
                                      <span>↗</span>
                                    </>
                                  ) : isRaw ? (
                                    <>
                                      <span>Open Raw Footage Link</span>
                                      <span>↗</span>
                                    </>
                                  ) : isDraft ? (
                                    <>
                                      <span>Watch Draft Video</span>
                                      <span>↗</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>Download File</span>
                                      <span>↓</span>
                                    </>
                                  )}
                                </a>
                              ) : (
                                <span className="text-xs text-[#86868B]">Processing file...</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
