'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
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

export default function ClientProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/client/projects');
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          const mapped: ClientProject[] = data.projects.map((p: any) => {
            const ord = p.orders || {};
            const snap = ord.requirements_snapshot || {};

            // Dynamic price calculation from actual order in paise
            const grossPaise = ord.gross_amount;
            const priceFormatted = typeof grossPaise === 'number' && grossPaise > 0
              ? `₹${(grossPaise / 100).toLocaleString('en-IN')} INR`
              : '₹1,000 INR';

            // Dynamic project title derived from actual booked service
            let displayTitle = p.title || 'Cinematic Edit';
            const rawSub = snap.subCategory || snap.serviceId;
            if (rawSub) {
              const cleanSub = String(rawSub).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
              const rawCat = snap.category || ord.service_key || '';
              const cleanCat = rawCat ? String(rawCat).replace(/\b\w/g, (c: string) => c.toUpperCase()) : '';
              displayTitle = cleanCat ? `${cleanCat} • ${cleanSub}` : cleanSub;
            }

            // Dynamic turnaround delivery
            const deliveryDate = snap.turnaround === 'express'
              ? 'Fast 24h Express Delivery'
              : 'Standard 48-72h Delivery';

            // Dynamic aspect ratio
            const isReel = (snap.subCategory && String(snap.subCategory).toLowerCase().includes('reel')) ||
              (snap.category && String(snap.category).toLowerCase() === 'personal');
            const aspectRatios = snap.aspectRatios || snap.aspectRatio || (
              isReel ? '9:16 Vertical Reel' : '16:9 Master + 9:16 Reel'
            );

            // Dynamic camera angles
            const cameraAngles = snap.angles === 'multi'
              ? 'Multi-Camera Editing'
              : 'Single Camera Edit';

            // Dynamic category label
            const categoryLabel = snap.category
              ? String(snap.category).replace(/\b\w/g, (c: string) => c.toUpperCase()) + ' Production'
              : 'Post-Production';

            return {
              id: p.id,
              orderId: ord.order_number || p.order_id || `ORD-${p.id?.slice(0, 8)}`,
              title: displayTitle,
              category: categoryLabel,
              status: p.status || 'in_progress',
              statusLabel:
                p.status === 'review_ready'
                  ? 'Review Ready'
                  : p.status === 'completed' || p.status === 'approved'
                  ? 'Completed'
                  : 'In Production',
              statusColor:
                p.status === 'review_ready'
                  ? 'bg-blue-500/10 text-blue-600 border-blue-200'
                  : p.status === 'completed' || p.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                  : 'bg-amber-500/10 text-amber-700 border-amber-200',
              deliveryDate,
              priceFormatted,
              aspectRatios,
              cameraAngles,
            };
          });
          setProjects(mapped);
        }
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    } else if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artsy_client_profile');
        if (stored) {
          const p = JSON.parse(stored);
          if (p.logoUrl) setAvatarUrl(p.logoUrl);
        }
      } catch {}
    }
  }, [user]);

  const clientName = user?.full_name || '';
  const clientInitials = clientName.trim()
    ? clientName
        .split(/\s+/)
        .filter((n) => n.length > 0)
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'CL';

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans overflow-x-hidden">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
            {/* User Identity Greeting */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E5E5E7]">
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Client Logo"
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm bg-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
                    {clientInitials}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    My Projects
                  </h1>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Track your ongoing video edits and review drafts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/book"
                  className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                >
                  + Start New Project
                </Link>
              </div>
            </div>

            {/* Project Cards List or Empty State */}
            {loading ? (
              <div className="text-center py-12 text-xs text-[#86868B]">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-8">
                <div className="text-4xl mb-3">🎬</div>
                <h3 className="text-lg font-semibold mb-2">No active projects yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Start your first video project — upload your footage and our team will get to work.
                </p>
                <Link
                  href="/book"
                  className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-sm"
                >
                  Start New Project →
                </Link>
              </div>
            ) : (
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
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${proj.statusColor}`}
                          >
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
                            Watch &amp; Review Video →
                          </Link>
                        </div>
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
