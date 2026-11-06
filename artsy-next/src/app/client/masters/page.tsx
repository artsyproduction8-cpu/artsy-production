'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';

interface MasterDeliverable {
  id: string;
  projectId: string;
  projectTitle: string;
  orderRef: string;
  completedDate: string;
  status: string;
  resolution: string;
  audioSpec: string;
  downloads: { label: string; format: string; size: string; url: string }[];
}

export default function ClientMastersPage() {
  const [masters, setMasters] = useState<MasterDeliverable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMasters() {
      try {
        setLoading(true);
        const res = await fetch('/api/client/projects');
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          // Filter for projects that are completed, approved, or have final_download_url
          const completedProjects = data.projects.filter(
            (p: any) =>
              p.status === 'completed' ||
              p.status === 'approved' ||
              Boolean(p.final_download_url)
          );

          const mapped: MasterDeliverable[] = completedProjects.map((p: any) => {
            const ord = p.orders || {};
            const downloadUrl = p.final_download_url || '#';
            const orderRef = ord.order_number || p.project_number || `ORD-${p.id.slice(0, 8)}`;
            const dateStr = p.created_at
              ? new Date(p.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            return {
              id: p.id,
              projectId: p.id,
              projectTitle: p.title || 'Cinematic Film Delivery',
              orderRef,
              completedDate: dateStr,
              status: p.status === 'approved' || p.status === 'completed' ? 'Approved & Finalized' : 'Ready for Ingest',
              resolution: '4K DCI (3840x2160) ProRes 422 HQ',
              audioSpec: '24-bit 48kHz Stereo Master',
              downloads: [
                {
                  label: '4K Master Video (ProRes / High Bitrate)',
                  format: 'Apple ProRes 422 HQ / MP4 Clean',
                  size: 'Primary Master Delivery',
                  url: downloadUrl,
                },
                {
                  label: 'Web & Social Cut (H.264)',
                  format: 'H.264 High Profile (Optimized)',
                  size: 'Web Deliverable',
                  url: downloadUrl,
                },
                {
                  label: 'Full Delivery Vault Folder',
                  format: 'Master Archive (Raw Cuts + Project File)',
                  size: 'Studio Archival',
                  url: downloadUrl,
                },
              ],
            };
          });

          setMasters(mapped);
        }
      } catch (err) {
        console.warn('Failed to load completed deliverables:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMasters();
  }, []);

  const handleDownload = (url: string, label: string) => {
    if (!url || url === '#') {
      alert(`Master file for ${label} is being prepared by the studio render engine.`);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans overflow-x-hidden">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-4 sm:p-5 space-y-5 w-full max-w-[1400px] mx-auto">
            {/* Header */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1D1D1F] tracking-tight">
                Final Downloads
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5">
                Download your approved videos and assets in clean 4K quality.
              </p>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#86868B] font-medium">Loading deliverables...</p>
              </div>
            ) : masters.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-gray-200 rounded-2xl bg-white p-6 space-y-2.5 shadow-2xs">
                <div className="text-3xl mb-1">📦</div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">No final downloads yet</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                  Once you approve a draft cut, your clean 4K video and export files will appear here ready to download.
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  <Link
                    href="/client/projects"
                    className="inline-block px-4 py-2 bg-white hover:bg-slate-50 border border-[#E5E5E7] text-[#1D1D1F] rounded-xl font-bold text-xs transition-all shadow-2xs"
                  >
                    View Active Projects →
                  </Link>
                  <Link
                    href="/book"
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs"
                  >
                    Start New Project
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {masters.map((master) => (
                  <div
                    key={master.id}
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5E5E7] shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F5F7]">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ {master.status.toUpperCase()}
                        </span>
                        <h2 className="text-base font-bold text-[#1D1D1F] mt-1.5">{master.projectTitle}</h2>
                        <div className="text-xs text-[#86868B] mt-0.5">
                          Order: <span className="font-mono text-[#1D1D1F] font-semibold">{master.orderRef}</span> • Delivery: {master.completedDate}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/client/projects/${master.projectId}`}
                          className="px-3.5 py-1.5 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-xs font-bold text-[#1D1D1F] transition-colors"
                        >
                          View Workroom →
                        </Link>
                      </div>
                    </div>

                    {/* Master Video Technical Specs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-[#F5F5F7]/60 rounded-xl border border-[#E5E5E7]/60 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#86868B] block">Format &amp; Codec</span>
                        <span className="font-semibold text-[#1D1D1F]">{master.resolution}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#86868B] block">Audio Track</span>
                        <span className="font-semibold text-[#1D1D1F]">{master.audioSpec}</span>
                      </div>
                    </div>

                    {/* Downloads Cards */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868B] mb-2.5">
                        Ready to Download
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {master.downloads.map((dl, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between space-y-2.5"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#1D1D1F]">{dl.label}</div>
                              <div className="text-[11px] text-[#86868B] mt-0.5">{dl.format}</div>
                              <div className="text-[10px] font-mono font-semibold text-blue-600 mt-0.5">
                                {dl.size}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownload(dl.url, dl.label)}
                              className="w-full py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E5E7] text-xs font-bold text-[#1D1D1F] transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Download</span>
                              <span>↓</span>
                            </button>
                          </div>
                        ))}
                      </div>
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
