'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth, logout } from '@/lib/auth';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';

interface ClientProject {
  id: string;
  orderId: string;
  title: string;
  category: string;
  status: 'ingesting' | 'in_progress' | 'review_ready' | 'approved';
  statusLabel: string;
  statusColor: string;
  deliveryDate: string;
  priceFormatted: string;
  aspectRatios: string;
  cameraAngles: string;
}

const DEFAULT_PROJECTS: ClientProject[] = [
  {
    id: 'AP-8841',
    orderId: 'ARTSY-892410',
    title: 'Udaipur Palace Royal Wedding — Master Highlight',
    category: 'Wedding Cinema',
    status: 'review_ready',
    statusLabel: 'Review Ready (Round 1 of 2)',
    statusColor: 'bg-blue-500/10 text-blue-600 border-blue-200',
    deliveryDate: '2 Days Remaining (SLA 48h)',
    priceFormatted: '₹8,000 INR',
    aspectRatios: '16:9 4K Master + 9:16 Vertical Reel',
    cameraAngles: '3 Sony FX6 Angle Multi-Cam Sync',
  },
  {
    id: 'AP-8842',
    orderId: 'ARTSY-501088',
    title: 'Autumn Brand Commercial & Direct-To-Consumer UGC',
    category: 'Brand UGC',
    status: 'in_progress',
    statusLabel: 'Editorial Assembly In Progress',
    statusColor: 'bg-amber-500/10 text-amber-700 border-amber-200',
    deliveryDate: '4 Days Remaining',
    priceFormatted: '₹4,500 INR',
    aspectRatios: '9:16 Vertical Hooks + 1:1 Social Cut',
    cameraAngles: '2 Hook Variations + B-Roll Cutaways',
  },
];

export default function ClientProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ClientProject[]>(DEFAULT_PROJECTS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedOrderStr = sessionStorage.getItem('artsy_confirmed_order');
        if (storedOrderStr) {
          const storedOrder = JSON.parse(storedOrderStr);
          const activeProj: ClientProject = {
            id: `AP-${storedOrder.orderId?.slice(-4) || '9921'}`,
            orderId: storedOrder.orderId || 'ARTSY-NEW',
            title: `${storedOrder.bookingData?.serviceName || 'Custom Post-Production'} — Master Slate`,
            category: storedOrder.bookingData?.serviceKey || 'Video Post-Production',
            status: 'ingesting',
            statusLabel: 'Cloud Proxy Ingestion Initialized',
            statusColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
            deliveryDate: '48h SLA Guarantee',
            priceFormatted: `₹${(storedOrder.bookingData?.priceBreakdown?.grandTotal || 8000).toLocaleString('en-IN')} INR`,
            aspectRatios: '16:9 Master + 9:16 Cut',
            cameraAngles: 'Multi-Angle Proxy Conform',
          };

          setProjects((prev) => {
            if (prev.some((p) => p.orderId === activeProj.orderId)) return prev;
            return [activeProj, ...prev];
          });
        }
      } catch {
        // Fallback to default mock roster
      }
    }
  }, []);

  const clientName = user?.full_name || 'Sneha Patel';
  const clientInitials = clientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SP';

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
            {/* User Identity Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
              {clientInitials}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                Active Production Orders
              </h1>
              <p className="text-xs text-[#86868B] mt-0.5">
                Real-time SLA milestones &amp; master deliveries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/client/review"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-[#1D1D1F] border border-[#E5E5E7] text-xs font-semibold rounded-xl transition-all shadow-xs"
            >
              Open Frame Review Suite →
            </Link>
          </div>
        </div>

        {/* Project Cards List */}
        <div className="space-y-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-2xl border border-[#E5E5E7]/70 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:border-[#3B82F6]/50 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Meta Block */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-[#3B82F6] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      {proj.orderId}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${proj.statusColor}`}>
                      {proj.statusLabel}
                    </span>
                    <span className="text-xs text-[#86868B]">
                      • {proj.category}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight group-hover:text-[#3B82F6] transition-colors">
                      {proj.title}
                    </h2>
                    <p className="text-xs text-[#86868B] mt-1 flex flex-wrap items-center gap-3">
                      <span>🎥 {proj.cameraAngles}</span>
                      <span>📐 {proj.aspectRatios}</span>
                    </p>
                  </div>
                </div>

                {/* Right Action Block */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#F5F5F7]">
                  <div className="text-left lg:text-right">
                    <div className="font-mono text-base font-extrabold text-[#1D1D1F]">
                      {proj.priceFormatted}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                      ⏳ {proj.deliveryDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href={`/client/projects/${proj.id}`}
                      className="w-full sm:w-auto px-4 py-2 bg-[#1D1D1F] hover:bg-[#3B82F6] text-white text-xs font-semibold rounded-xl text-center transition-all shadow-xs"
                    >
                      Enter Review Suite →
                    </Link>
                  </div>
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
