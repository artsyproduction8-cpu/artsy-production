'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, logout } from '@/lib/auth';

export default function FreelancerPayoutsPage() {
  const { user } = useAuth();
  const [statementNotice, setStatementNotice] = useState(false);

  const handleExportStatement = () => {
    setStatementNotice(true);
    setTimeout(() => setStatementNotice(false), 5000);
  };

  const creatorName = user?.full_name || 'Aarav Sen';
  const creatorInitials = creatorName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AS';

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#1D1D1F] text-white border-b border-white/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-black text-xl tracking-tight uppercase">ARTSY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
            </Link>
            <span className="text-xs font-semibold text-white/50">/</span>
            <span className="text-xs font-bold text-[#3B82F6] uppercase tracking-wider">
              Escrow Ledger &amp; Payouts
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/freelancer"
              className="text-xs font-semibold uppercase px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              ← Back to Workstation
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs font-semibold uppercase px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
            <div className="pl-2 border-l border-white/10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xs">
                {creatorInitials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Notice Alert */}
        {statementNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200">
            <span className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Official Form 26AS TDS Certificate and payout summary dispatched to registered email.
            </span>
            <button
              type="button"
              onClick={() => setStatementNotice(false)}
              className="text-emerald-700 font-bold hover:text-emerald-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#86868B] font-bold">
              FINANCIAL ROSTER ACCOUNTING
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-1">
              Escrow Ledger &amp; Payouts
            </h1>
            <p className="text-xs text-[#86868B] mt-1">
              Real-time settlement status, milestone escrow balances, and direct NEFT bank transfers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportStatement}
            className="self-start sm:self-auto text-xs font-semibold px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] transition-all cursor-pointer shadow-xs flex items-center gap-2"
          >
            <span>📄</span>
            <span>Export Tax Statement (.pdf)</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-xs uppercase font-bold text-[#86868B]">TOTAL DISBURSED EARNED</div>
            <div className="text-3xl font-extrabold text-[#1D1D1F] leading-none mt-2">
              ₹48,500
            </div>
            <div className="text-[11px] text-[#86868B] mt-2">
              FY 2024–25 // 8 Slates Completed
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-xs uppercase font-bold text-amber-600">
              IN ESCROW HOLD (STATION CUSTODY)
            </div>
            <div className="text-3xl font-extrabold text-[#1D1D1F] leading-none mt-2">
              ₹12,000
            </div>
            <div className="text-[11px] text-[#86868B] mt-2">
              Release Trigger: Client QA Signoff
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-xs uppercase font-bold text-[#3B82F6]">
              READY FOR NEFT DISBURSEMENT
            </div>
            <div className="text-3xl font-extrabold text-[#3B82F6] leading-none mt-2">
              ₹15,500
            </div>
            <div className="text-[11px] text-[#86868B] mt-2">
              Scheduled Cycle: Thursday 18:00 IST
            </div>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E7] flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F]">
              Settlement History &amp; Milestone Ledger
            </h2>
            <span className="text-xs text-[#86868B] font-medium">
              Direct Bank Settlements
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F5F7] text-[#86868B] text-[11px] uppercase tracking-wider font-semibold border-b border-[#E5E5E7]">
                  <th className="p-4">Project Ref</th>
                  <th className="p-4">Delivery Date</th>
                  <th className="p-4 text-right">Settlement Amount</th>
                  <th className="p-4">Disbursement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F7]">
                {/* Row 1 */}
                <tr className="hover:bg-[#F5F5F7]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#1D1D1F]">
                    <span className="text-[#3B82F6] font-bold mr-1.5">[AP-8840]</span> 90s TVC Master Grade
                  </td>
                  <td className="p-4 text-[#86868B]">14 Oct 2024</td>
                  <td className="p-4 text-right font-mono font-bold text-[#1D1D1F]">
                    ₹15,500
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Ready // Batch #402
                    </span>
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-[#F5F5F7]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#1D1D1F]">
                    <span className="text-[#3B82F6] font-bold mr-1.5">[AP-8799]</span> Fashion Lookbook 4K
                  </td>
                  <td className="p-4 text-[#86868B]">08 Oct 2024</td>
                  <td className="p-4 text-right font-mono font-bold text-[#1D1D1F]">
                    ₹24,000
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      ✓ Disbursed to HDFC ****1234
                    </span>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-[#F5F5F7]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#1D1D1F]">
                    <span className="text-[#3B82F6] font-bold mr-1.5">[AP-8721]</span> Music Video Color Sync
                  </td>
                  <td className="p-4 text-[#86868B]">28 Sep 2024</td>
                  <td className="p-4 text-right font-mono font-bold text-[#1D1D1F]">
                    ₹24,500
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      ✓ Disbursed to HDFC ****1234
                    </span>
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-[#F5F5F7]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#1D1D1F]">
                    <span className="text-amber-600 font-bold mr-1.5">[AP-8910]</span> DTC 60s Brand Cut
                  </td>
                  <td className="p-4 text-amber-600 font-medium">In Flight</td>
                  <td className="p-4 text-right font-mono font-bold text-[#1D1D1F]">
                    ₹12,000
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                      Escrow Locked (Day 2/4)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Compliance Strip */}
        <div className="rounded-xl bg-white p-4 border border-[#E5E5E7] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-[#86868B]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1D1D1F]">SETTLEMENT COMPLIANCE:</span>
            <span>Direct NEFT bank transfers upon client milestone completion.</span>
          </div>
          <div className="flex items-center gap-2 text-[#1D1D1F]">
            <span>PAN Linked:</span>
            <span className="font-mono font-bold">AAAPL8821K</span>
            <span className="text-emerald-600 font-semibold ml-2">✓ Verified Vendor</span>
          </div>
        </div>
      </main>
    </div>
  );
}
