'use client';

import { useState, useEffect } from 'react';

interface CostItem {
  platform: string;
  usage: string;
  costInr: number;
  trend: string;
  status: string;
}

export default function AdminInfraCostsPage() {
  const [breakdown, setBreakdown] = useState<CostItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/infra-costs');
      const data = await res.json();
      if (data.success) {
        setBreakdown(data.breakdown || []);
        setTotalCost(data.totalCostInr || 0);
        setLastRefreshed(data.lastRefreshed || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch infrastructure costs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
    // Auto-refresh every 5 minutes (300,000 ms)
    const interval = setInterval(fetchCosts, 300000);
    return () => clearInterval(interval);
  }, []);

  const formatInr = (inr: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(inr);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Real-Time Infrastructure Costs</h1>
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Refreshes 5m
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Live telemetry and consumption billing across Vercel, Supabase, B2, Bunny, Meta WhatsApp, Resend, Cloudflare, and Razorpay.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-[#86868B] uppercase tracking-wider font-semibold">Last Refreshed</div>
            <div className="text-xs font-mono font-medium text-[#1D1D1F]">
              {lastRefreshed ? new Date(lastRefreshed).toLocaleTimeString() : '—'}
            </div>
          </div>
          <button
            onClick={fetchCosts}
            className="p-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] rounded-xl text-[#86868B] transition-all cursor-pointer"
            title="Refresh Costs Now"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Total Monthly Infra Burn</div>
          <div className="text-3xl font-extrabold text-[#1D1D1F] mt-2">{formatInr(totalCost)}</div>
          <div className="text-xs text-[#86868B] mt-1">Direct third-party compute & API fees</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Active Connected APIs</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">
            {breakdown.filter((b) => b.status.includes('Connected')).length} / 8
          </div>
          <div className="text-xs text-[#86868B] mt-1">Live integrations streaming telemetry</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Storage & CDN Unit Economics</div>
          <div className="text-3xl font-extrabold text-[#3B82F6] mt-2">₹0.48 / GB</div>
          <div className="text-xs text-[#86868B] mt-1">Bunny Stream + Backblaze B2 Billed Rate</div>
        </div>
      </div>

      {/* Costs Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Querying vendor APIs and calculating real-time usage...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold text-[11px]">
                  <th className="py-3 px-4 whitespace-nowrap">Platform</th>
                  <th className="py-3 px-4 whitespace-nowrap">Usage Telemetry</th>
                  <th className="py-3 px-4 whitespace-nowrap">Monthly Cost (INR)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trend</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Provider Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {breakdown.map((item) => (
                  <tr key={item.platform} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#1D1D1F] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
                      {item.platform}
                    </td>
                    <td className="py-3 px-4 text-[#1D1D1F] font-mono">{item.usage}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1D1D1F]">
                      {item.costInr > 0 ? formatInr(item.costInr) : '₹0.00 (Included)'}
                    </td>
                    <td className="py-3 px-4 font-bold text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                          item.trend === '↑'
                            ? 'bg-amber-50 text-amber-700'
                            : item.trend === '↓'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-[#F5F5F7] text-[#86868B]'
                        }`}
                      >
                        {item.trend === 'stable' ? '—' : item.trend}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status.includes('Connected')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-[#FAFAFA] font-bold text-[#1D1D1F] border-t-2 border-[#E5E5E7]">
                  <td className="py-4 px-4 text-sm font-extrabold">TOTAL INFRASTRUCTURE</td>
                  <td className="py-4 px-4 text-[#86868B] font-normal">Combined Monthly Cloud Commit</td>
                  <td className="py-4 px-4 font-mono text-base font-extrabold text-blue-600">
                    {formatInr(totalCost)}
                  </td>
                  <td className="py-4 px-4 text-center">—</td>
                  <td className="py-4 px-4 text-right text-xs text-emerald-600 font-semibold">Active Monitoring</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
