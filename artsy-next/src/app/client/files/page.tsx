'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface FileRecordItem {
  id: string;
  project_id: string;
  project_title?: string;
  file_name: string;
  file_size_bytes: number;
  file_type: 'raw_footage' | 'master_delivery' | 'proxy' | 'audio_stem' | string;
  storage_provider: string;
  b2_key?: string;
  retention_delete_at?: string;
  is_soft_deleted?: boolean;
  status?: 'delivered' | 'in_progress' | 'expiring_soon';
  created_at: string;
}

const FALLBACK_FILES: FileRecordItem[] = [
  {
    id: 'f-001',
    project_id: 'AP-8841',
    project_title: 'Udaipur Palace Royal Wedding — Master Highlight',
    file_name: 'Udaipur_Royal_Wedding_Master_ProRes422HQ_4K.mov',
    file_size_bytes: 48318382080, // ~45 GB
    file_type: 'master_delivery',
    storage_provider: 'b2',
    retention_delete_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days left
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
  },
  {
    id: 'f-002',
    project_id: 'AP-8841',
    project_title: 'Udaipur Palace Royal Wedding — Master Highlight',
    file_name: 'FX6_Day1_Vows_SLog3_A001_C001.mxf',
    file_size_bytes: 34359738368, // ~32 GB
    file_type: 'raw_footage',
    storage_provider: 'b2',
    retention_delete_at: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days left (Expiring Soon)
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'expiring_soon',
  },
  {
    id: 'f-003',
    project_id: 'AP-8841',
    project_title: 'Udaipur Palace Royal Wedding — Master Highlight',
    file_name: 'Stereo_Audio_Mix_Master_24bit48k.wav',
    file_size_bytes: 157286400, // ~150 MB
    file_type: 'audio_stem',
    storage_provider: 'b2',
    retention_delete_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days left (Expiring Soon)
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'expiring_soon',
  },
  {
    id: 'f-004',
    project_id: 'AP-8845',
    project_title: 'Autumn Commercial Brand Campaign & Direct UGC',
    file_name: 'Autumn_Campaign_RoughCut_v02_Proxy1080p.mp4',
    file_size_bytes: 3221225472, // ~3 GB
    file_type: 'proxy',
    storage_provider: 'b2',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
  },
  {
    id: 'f-005',
    project_id: 'AP-8845',
    project_title: 'Autumn Commercial Brand Campaign & Direct UGC',
    file_name: 'RED_Komodo_6K_Commercial_Ingest_Archive.zip',
    file_size_bytes: 85899345920, // ~80 GB
    file_type: 'raw_footage',
    storage_provider: 'b2',
    retention_delete_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'delivered' | 'in_progress' | 'expiring_soon'>('all');

  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('file_records')
            .select('*')
            .eq('is_soft_deleted', false)
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const mapped: FileRecordItem[] = data.map((item: any) => {
              const isExpiring = isFileExpiring(item.retention_delete_at);

              let status: 'delivered' | 'in_progress' | 'expiring_soon' = 'in_progress';
              if (isExpiring) {
                status = 'expiring_soon';
              } else if (item.file_type === 'master_delivery') {
                status = 'delivered';
              }

              return {
                ...item,
                project_title: `Project ${item.project_id}`,
                status,
              };
            });
            setFiles(mapped);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load file records from Supabase', err);
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
      if (activeFilter === 'delivered') return f.file_type === 'master_delivery' || f.status === 'delivered';
      if (activeFilter === 'in_progress') return f.status === 'in_progress';
      if (activeFilter === 'expiring_soon') {
        return isFileExpiring(f.retention_delete_at);
      }
      return true;
    });
  }, [files, activeFilter]);

  // Grouped by Project
  const groupedFiles = useMemo(() => {
    const map = new Map<string, { title: string; files: FileRecordItem[] }>();
    filteredFiles.forEach((file) => {
      const projId = file.project_id || 'general';
      const title = file.project_title || `Project #${projId}`;
      if (!map.has(projId)) {
        map.set(projId, { title, files: [] });
      }
      map.get(projId)!.files.push(file);
    });
    return Array.from(map.entries());
  }, [filteredFiles]);

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href="/client" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Dashboard
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs font-bold text-[#1D1D1F]">My Files</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                My Files
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Raw camera ingests, proxies, audio stems, and finished high-bitrate master exports.
              </p>
            </div>

            {/* Retention Warning Banner (if files expiring within 7 days) */}
            {expiringFiles.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-base shrink-0">
                    !
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-amber-900">
                      Retention Alert: {expiringFiles.length} file{expiringFiles.length > 1 ? 's' : ''} scheduled for auto-purge within 7 days
                    </h2>
                    <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed">
                      Under Artsy statutory retention (15 days raw / 30 days master post-approval), these files will be permanently erased. Download copies now or request cold vault archiving.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('expiring_soon')}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    View Expiring Files
                  </button>
                  <a
                    href="https://wa.me/917777078742?text=Hello%20Artsy,%20I%20would%20like%20to%20request%20extended%20storage%20for%20my%20files"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white border border-amber-200 hover:bg-amber-100/50 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Request Extension
                  </a>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E5E5E7] pb-3">
              {(
                [
                  { key: 'all', label: 'All Files' },
                  { key: 'delivered', label: 'Delivered Masters' },
                  { key: 'in_progress', label: 'In Progress / Proxies' },
                  { key: 'expiring_soon', label: `Expiring Soon (${expiringFiles.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === tab.key
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Projects and File Cards */}
            {loading ? (
              <div className="text-center py-16 text-xs text-[#86868B]">
                Loading file records...
              </div>
            ) : groupedFiles.length === 0 ? (
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-12 text-center space-y-2">
                <div className="text-base font-bold text-[#1D1D1F]">No files found</div>
                <p className="text-xs text-[#86868B]">
                  No file records match your selected filter.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedFiles.map(([projectId, { title, files: projectFiles }]) => (
                  <div key={projectId} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <h2 className="text-sm font-bold text-[#1D1D1F]">{title}</h2>
                        <span className="text-[11px] text-[#86868B] font-mono">
                          Project ID: {projectId} • {projectFiles.length} item{projectFiles.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <Link
                        href={`/client/projects`}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline"
                      >
                        Project Details →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        return (
                          <div
                            key={file.id}
                            className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                              isExpiring ? 'border-amber-300 bg-amber-50/10' : 'border-[#E5E5E7]'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                    file.file_type === 'master_delivery'
                                      ? 'bg-blue-50 text-blue-700'
                                      : file.file_type === 'raw_footage'
                                      ? 'bg-purple-50 text-purple-700'
                                      : 'bg-zinc-100 text-zinc-700'
                                  }`}
                                >
                                  {file.file_type.replace('_', ' ')}
                                </span>
                                {isExpiring && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                    {daysLeft}d left
                                  </span>
                                )}
                              </div>

                              <div>
                                <h3
                                  className="text-xs font-bold text-[#1D1D1F] break-all leading-snug line-clamp-2"
                                  title={file.file_name}
                                >
                                  {file.file_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#86868B]">
                                  <span>{formatBytes(file.file_size_bytes)}</span>
                                  <span>•</span>
                                  <span>B2 Vault</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 mt-3 border-t border-[#F5F5F7] space-y-2">
                              {file.retention_delete_at && (
                                <div className="text-[10px] text-[#86868B]">
                                  Purge date:{' '}
                                  <span className="font-semibold text-[#1D1D1F]">
                                    {new Date(file.retention_delete_at).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/api/storage/download?fileId=${file.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 px-3 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-center text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Download File
                                </a>
                              </div>
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
