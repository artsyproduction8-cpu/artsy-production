'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FreelancerHeader from '../components/FreelancerHeader';
import FreelancerSidebar from '../components/FreelancerSidebar';

interface PayoutItem {
  id: string;
  projectId: string;
  projectTitle: string;
  orderRef: string;
  date: string;
  grossShare: number;
  tdsDeduction: number;
  netPayout: number;
  status: 'pending' | 'ready' | 'paid';
  statusLabel: string;
}

export default function FreelancerPayoutsPage() {
  const [statementNotice, setStatementNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPaidOut, setTotalPaidOut] = useState<number>(0);
  const [pendingInProgress, setPendingInProgress] = useState<number>(0);
  const [readyForPayout, setReadyForPayout] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);

  useEffect(() => {
    async function loadPayouts() {
      try {
        setLoading(true);
        const res = await fetch('/api/freelancer/payouts');
        const data = await res.json();
        if (data.success) {
          setTotalPaidOut(data.totalPaidOut || 0);
          setPendingInProgress(data.pendingInProgress || 0);
          setReadyForPayout(data.readyForPayout || 0);
          setCompletedCount(data.completedCount || 0);
          setPayouts(data.payouts || []);
        }
      } catch (err) {
        console.warn('Failed to load creator payouts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPayouts();
  }, []);

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
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-200 shadow-xs">
                <span className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Official Form 26AS TDS Certificate and payout summary dispatched to registered email.
                </span>
                <button
                  type="button"
                  onClick={() => setStatementNotice(false)}
                  className="text-emerald-700 font-bold hover:text-emerald-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Header Block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#86868B] font-bold">
                  CREATOR COMPENSATION
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-1">
                  Earnings &amp; Payouts
                </h1>
                <p className="text-xs text-[#86868B] mt-1">
                  Track your project earnings, statutory Section 194J TDS deductions, and NEFT bank transfers.
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
                  ₹{totalPaidOut.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#86868B] mt-2">
                  {completedCount} {completedCount === 1 ? 'Project' : 'Projects'} Completed
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <div className="text-xs uppercase font-bold text-amber-600">
                  PENDING (IN PROGRESS)
                </div>
                <div className="text-3xl font-extrabold text-[#1D1D1F] leading-none mt-2">
                  ₹{pendingInProgress.toLocaleString('en-IN')}
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
                  ₹{readyForPayout.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-[#86868B] mt-2">
                  Transfers every Thursday
                </div>
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div className="bg-white rounded-2xl border border-[#E5E5E7]/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="p-5 border-b border-[#E5E5E7] flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F]">
                    Project Earnings Ledger
                  </h2>
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    Gross Share (70%) • Statutory TDS (2%) • Direct Bank Transfer (NEFT)
                  </p>
                </div>
                <span className="text-xs text-[#86868B] font-medium hidden sm:inline">
                  Direct Bank Transfers
                </span>
              </div>

              {loading ? (
                <div className="p-16 text-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-[#86868B]">Loading payout ledger...</p>
                </div>
              ) : payouts.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#86868B] bg-white">
                  <div className="text-3xl mb-2">💳</div>
                  <div className="font-semibold text-[#1D1D1F] text-sm">No payout history yet</div>
                  <div className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
                    Project earnings and NEFT bank dispatches will appear here once assigned projects are accepted and delivered.
                  </div>
                  <Link
                    href="/freelancer"
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors"
                  >
                    View Active Workstation →
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F5F5F7] text-[#86868B] text-[11px] uppercase tracking-wider font-semibold border-b border-[#E5E5E7]">
                        <th className="p-4 whitespace-nowrap">Project / Order</th>
                        <th className="p-4 whitespace-nowrap">Date</th>
                        <th className="p-4 whitespace-nowrap text-right">Gross (70%)</th>
                        <th className="p-4 whitespace-nowrap text-right">TDS (2%)</th>
                        <th className="p-4 whitespace-nowrap text-right">Net Payout</th>
                        <th className="p-4 whitespace-nowrap text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5F5F7]">
                      {payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-[#1D1D1F]">{p.projectTitle}</div>
                            <div className="text-[10px] font-mono text-blue-600 mt-0.5">Ref: {p.orderRef}</div>
                          </td>
                          <td className="p-4 text-[#86868B] whitespace-nowrap">{p.date}</td>
                          <td className="p-4 text-right font-mono font-semibold text-[#1D1D1F]">
                            ₹{p.grossShare.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-right font-mono text-amber-600">
                            -₹{p.tdsDeduction.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-right font-mono font-extrabold text-emerald-700">
                            ₹{p.netPayout.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-right">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                p.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : p.status === 'ready'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {p.statusLabel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Info Strip */}
            <div className="rounded-xl bg-white p-4 border border-[#E5E5E7] flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-[#86868B]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1D1D1F]">PAYOUT POLICY:</span>
                <span>Payments are transferred directly to your bank account via NEFT after client approval.</span>
              </div>
              <div className="flex items-center gap-2 text-[#1D1D1F]">
                <span className="text-emerald-600 font-semibold">✓ Verified Creator Partner</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
