'use client';

import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';

interface MasterDeliverable {
  id: string;
  projectTitle: string;
  orderRef: string;
  completedDate: string;
  resolution: string;
  audioSpec: string;
  downloads: { label: string; format: string; size: string; url: string }[];
}

const MASTERS: MasterDeliverable[] = [
  {
    id: 'mst-001',
    projectTitle: 'Udaipur Palace Royal Wedding — Master Highlight Cinema',
    orderRef: 'AP-8841 (ARTSY-892410)',
    completedDate: 'September 28, 2026',
    resolution: '3840 x 2160 (4K UHD) • Rec.709 D65',
    audioSpec: '24-bit 48kHz Stereo Master (-14 LUFS)',
    downloads: [
      { label: 'ProRes 422 HQ Master', format: 'Apple ProRes (.mov)', size: '14.2 GB', url: '#' },
      { label: 'H.264 High-Bitrate Delivery', format: 'MP4 4K (80 Mbps)', size: '2.4 GB', url: '#' },
      { label: '9:16 Vertical Instagram Cut', format: 'MP4 1080x1920', size: '480 MB', url: '#' },
      { label: 'Uncompressed Audio Stems', format: 'WAV 24-bit (ZIP)', size: '1.1 GB', url: '#' },
    ],
  },
];

export default function ClientMastersPage() {
  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <Link href="/client/projects" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                  Projects
                </Link>
                <span className="text-xs text-[#86868B]">/</span>
                <span className="text-xs font-bold text-[#1D1D1F]">Completed Masters</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
                Completed Masters &amp; Vault Deliverables
              </h1>
              <p className="text-sm text-[#86868B] mt-1">
                Download your uncompressed 4K master timelines, social vertical cuts, and audio stem archives.
              </p>
            </div>

            {/* Masters Grid */}
            <div className="space-y-6">
              {MASTERS.map((master) => (
                <div
                  key={master.id}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-xs space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F5F5F7]">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ APPROVED &amp; FINALIZED
                      </span>
                      <h2 className="text-lg font-bold text-[#1D1D1F] mt-2">{master.projectTitle}</h2>
                      <div className="text-xs text-[#86868B] mt-0.5">
                        Ref: {master.orderRef} • Completed: {master.completedDate}
                      </div>
                    </div>
                  </div>

                  {/* Downloads Cards */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868B] mb-3">
                      Available High-Bitrate Downloads
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {master.downloads.map((dl, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#1D1D1F]">{dl.label}</div>
                            <div className="text-[11px] text-[#86868B] mt-0.5">{dl.format}</div>
                            <div className="text-[10px] font-mono font-semibold text-blue-600 mt-1">
                              {dl.size}
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`Starting download for ${dl.label}...`)}
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
          </div>
        </main>
      </div>
    </div>
  );
}
