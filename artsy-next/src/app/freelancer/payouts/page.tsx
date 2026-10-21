'use client';

import { useState } from 'react';
import FreelancerHeader from '../components/FreelancerHeader';
import FreelancerSidebar from '../components/FreelancerSidebar';

export default function FreelancerPayoutsPage() {
  const [statementNotice, setStatementNotice] = useState(false);

  const handleExportStatement = () => {
    setStatementNotice(true);
    setTimeout(() => setStatementNotice(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans overflow-x-hidden">
      <FreelancerHeader />

      <div className="flex w-full max-w-full overflow-x-hidden">
        <FreelancerSidebar />

        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen bg-[#F5F5F7]">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-[1600px] mx-auto">
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
              CREATOR EARNINGS
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-1">
              Earnings &amp; Payouts
            </h1>
            <p className="text-xs text-[#86868B] mt-1">
              Track your completed project payments, pending earnings, and bank payouts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportStatement}
            className="self-start sm:self-auto text-xs font-semibold px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] transition-all cursor-pointer shadow-xs flex items-center gap-2"
          >
            <span>📄</span>
            <span>Download Statement (.pdf)</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-xs uppercase font-bold text-[#86868B]">TOTAL PAID OUT</div>
            <div className="text-3xl font-extrabold text-[#1D1D1F] leading-none mt-2">
              ₹0
            </div>
            <div className="text-[11px] text-[#86868B] mt-2">
              0 Projects Completed
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-xs uppercase font-bold text-amber-600">
              PENDING (IN PROGRESS)
            </div>
            <div className="text-3xl font-extrabold text-[#1D1D1F] leading-none mt-2">
              ₹0
            </div>
            <div className="text-[11px] text-[#86868B] mt-2">
              Released when client approves cut
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-xs uppercase font-bold text-[#3B82F6]">
              READY FOR PAYOUT
            </div>
            <div className="text-3xl font-extrabold text-[#3B82F6] leading-none mt-2">
              ₹0
            </div>
            <div className="text-[11px] text-[#86868B] mt-2">
              Transfers every Thursday
            </div>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="bg-white rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 border-b border-[#E5E5E7] flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F]">
              Payment History
            </h2>
            <span className="text-xs text-[#86868B] font-medium">
              Direct Bank Transfers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F5F7] text-[#86868B] text-[11px] uppercase tracking-wider font-semibold border-b border-[#E5E5E7]">
                  <th className="p-4 whitespace-nowrap">Project</th>
                  <th className="p-4 whitespace-nowrap">Date</th>
                  <th className="p-4 whitespace-nowrap text-right">Amount</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F7]">
                <tr>
                  <td colSpan={4} className="p-12 text-center text-xs text-[#86868B] bg-white">
                    <div className="text-3xl mb-2">💳</div>
                    <div className="font-semibold text-[#1D1D1F] text-sm">No payout history yet</div>
                    <div className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                      Completed project earnings and NEFT bank dispatches will appear here once delivered and approved.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info Strip */}
        <div className="rounded-xl bg-white p-4 border border-[#E5E5E7] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-[#86868B]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1D1D1F]">PAYOUT POLICY:</span>
            <span>Payments are transferred directly to your bank account after client approval.</span>
          </div>
          <div className="flex items-center gap-2 text-[#1D1D1F]">
            <span className="text-emerald-600 font-semibold">✓ Verified Creator</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>
  );
}
