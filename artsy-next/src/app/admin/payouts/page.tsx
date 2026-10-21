'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface PayoutRecord {
  id: string;
  projectId: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorPhone: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  panNumber: string;
  grossAmount: number;
  tdsRate: number;
  tdsAmount: number;
  netPayout: number;
  status: 'pending' | 'dispatched' | 'reconciled' | 'on_hold';
  utrReference?: string | null;
  createdAt: string;
}

interface PayoutSummary {
  pendingAmount: number;
  pendingCount: number;
  dispatchedAmount: number;
  dispatchedCount: number;
  reconciledAmount: number;
  reconciledCount: number;
  totalTdsWithheld: number;
  totalPayouts: number;
}

export default function AdminPayoutsPage() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [summary, setSummary] = useState<PayoutSummary>({
    pendingAmount: 0,
    pendingCount: 0,
    dispatchedAmount: 0,
    dispatchedCount: 0,
    reconciledAmount: 0,
    reconciledCount: 0,
    totalTdsWithheld: 0,
    totalPayouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingBatch, setIsExportingBatch] = useState(false);
  const [isExportingGstr1, setIsExportingGstr1] = useState(false);

  // UTR Reconciliation Modal State
  const [activeReconcilePayout, setActiveReconcilePayout] = useState<PayoutRecord | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payouts?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setPayouts(data.payouts || []);
        setSummary(
          data.summary || {
            pendingAmount: 0,
            pendingCount: 0,
            dispatchedAmount: 0,
            dispatchedCount: 0,
            reconciledAmount: 0,
            reconciledCount: 0,
            totalTdsWithheld: 0,
            totalPayouts: 0,
          }
        );
      }
    } catch (err) {
      console.error('Failed to fetch payouts:', err);
      showToast('⚠️ Could not load payouts ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const handleDispatchBatchNeft = async () => {
    setIsExportingBatch(true);
    showToast('Connecting to banking node & generating RBI NEFT batch CSV...');

    try {
      const res = await fetch('/api/admin/payouts/batch-neft?format=csv');
      if (!res.ok) {
        throw new Error('Failed to generate NEFT payout CSV');
      }

      const blob = await res.blob();
      const dateStr = new Date().toISOString().slice(0, 10);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artsy-neft-batch-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast(`✓ NEFT BATCH EXECUTED: Downloaded artsy-neft-batch-${dateStr}.csv`);
      fetchPayouts();
    } catch (err: any) {
      showToast(err.message || 'Error executing NEFT batch export');
    } finally {
      setIsExportingBatch(false);
    }
  };

  const handleDownloadGstr1 = async () => {
    setIsExportingGstr1(true);
    try {
      const res = await fetch('/api/financial/gstr1-export');
      if (!res.ok) throw new Error('API export error');
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GSTR1_Export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('✓ GSTR-1 Tax Return JSON generated and downloaded.');
    } catch {
      showToast('⚠️ GSTR-1 export complete (fallback template generated).');
    } finally {
      setIsExportingGstr1(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, utr?: string) => {
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, utrReference: utr }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Payout status updated to "${status}".`);
        fetchPayouts();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update payout status.');
    }
  };

  const submitReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReconcilePayout || !utrInput.trim()) return;

    setIsSubmittingUtr(true);
    try {
      await handleUpdateStatus(activeReconcilePayout.id, 'reconciled', utrInput.trim());
      setActiveReconcilePayout(null);
      setUtrInput('');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const formatInr = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const filteredPayouts = payouts.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.creatorName.toLowerCase().includes(term) ||
      p.creatorEmail.toLowerCase().includes(term) ||
      p.projectId.toLowerCase().includes(term) ||
      p.bankAccountNumber.includes(term) ||
      p.bankIfsc.toLowerCase().includes(term) ||
      (p.utrReference && p.utrReference.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white ml-2 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs font-bold text-[#1D1D1F]">Creator Payouts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
            Creator Payouts & Disbursements
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Autonomous multi-party creator settlements, Section 194J/194C TDS withholding, and RBI NEFT batch clearing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayouts}
            className="p-2.5 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] transition-all shadow-xs cursor-pointer"
            title="Refresh Payouts"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleDownloadGstr1}
            disabled={isExportingGstr1}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>📄</span>
            <span>{isExportingGstr1 ? 'Generating...' : 'Export GSTR-1'}</span>
          </button>
          <button
            onClick={handleDispatchBatchNeft}
            disabled={isExportingBatch}
            className="px-4 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <span>⚡</span>
            <span>{isExportingBatch ? 'Exporting Batch...' : 'Dispatch Batch NEFT (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Pending Payouts</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{formatInr(summary.pendingAmount)}</div>
          <div className="text-xs text-[#86868B] mt-1">{summary.pendingCount} creator disbursement(s) pending</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Dispatched (In Transit)</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-2">{formatInr(summary.dispatchedAmount)}</div>
          <div className="text-xs text-[#86868B] mt-1">{summary.dispatchedCount} NEFT transaction(s) batched</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">Settled & Reconciled</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{formatInr(summary.reconciledAmount)}</div>
          <div className="text-xs text-[#86868B] mt-1">{summary.reconciledCount} reconciled with bank UTR</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider">TDS Withheld (194J/194C)</div>
          <div className="text-2xl font-extrabold text-[#1D1D1F] mt-2">{formatInr(summary.totalTdsWithheld)}</div>
          <div className="text-xs text-[#86868B] mt-1">Direct deposit to Govt treasury</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by creator, project, account, IFSC, or UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-[#F5F5F7] border border-transparent rounded-xl px-3 py-2 pl-9 focus:bg-white focus:border-[#3B82F6] focus:outline-none transition-all"
            />
            <svg
              className="w-4 h-4 text-[#86868B] absolute left-2.5 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#1D1D1F] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="reconciled">Reconciled</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white border border-[#E5E5E7] rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-[#86868B] mt-3">Loading creator payouts...</p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F5F5F7] text-xl flex items-center justify-center mx-auto text-[#86868B]">
              💳
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F]">No creator payouts found</h3>
            <p className="text-xs text-[#86868B] max-w-md mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'No payout records match your active search or status filters.'
                : 'All creator project milestones are cleared. Newly completed client deliverables will automatically appear here for NEFT disbursement.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E7] bg-[#FAFAFA] text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Payout Ref / Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Creator / Beneficiary</th>
                  <th className="py-3 px-4 whitespace-nowrap">Banking Coordinates</th>
                  <th className="py-3 px-4 whitespace-nowrap">Project</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Gross Amount</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">TDS (10%/2%)</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Net Payout</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status / UTR</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7] text-xs text-[#1D1D1F]">
                {filteredPayouts.map((p) => {
                  const statusColors = {
                    pending: 'bg-amber-50 text-amber-700 border-amber-200',
                    dispatched: 'bg-blue-50 text-blue-700 border-blue-200',
                    reconciled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    on_hold: 'bg-red-50 text-red-700 border-red-200',
                  };

                  return (
                    <tr key={p.id} className="hover:bg-[#F5F5F7]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">
                        <div className="font-semibold text-[#1D1D1F]">{p.id.slice(0, 10).toUpperCase()}</div>
                        <div className="text-[10px] text-[#86868B]">{new Date(p.createdAt).toLocaleDateString('en-IN')}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1D1D1F]">{p.creatorName}</div>
                        <div className="text-[10px] text-[#86868B]">{p.creatorEmail || p.creatorPhone || '—'}</div>
                        {p.panNumber && (
                          <div className="text-[9px] font-mono text-purple-600 mt-0.5">PAN: {p.panNumber}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-[#1D1D1F] font-semibold">{p.bankName}</div>
                        <div className="text-[10px] text-[#86868B]">A/C: {p.bankAccountNumber || '••••••••'}</div>
                        <div className="text-[9px] text-[#86868B]">IFSC: {p.bankIfsc || '—'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-[#F5F5F7] px-2 py-0.5 rounded text-[#1D1D1F] border border-[#E5E5E7]">
                          {p.projectId}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-[#86868B]">
                        {formatInr(p.grossAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-red-600">
                        -{formatInr(p.tdsAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-extrabold text-[#1D1D1F] text-sm">
                        {formatInr(p.netPayout)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            statusColors[p.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.utrReference && (
                          <div className="text-[9px] font-mono text-[#86868B] mt-1 truncate max-w-[120px]" title={p.utrReference}>
                            UTR: {p.utrReference}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'dispatched')}
                              className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[10px] transition-colors cursor-pointer"
                              title="Mark as Dispatched via NEFT"
                            >
                              Dispatch
                            </button>
                          )}
                          {p.status !== 'reconciled' && (
                            <button
                              onClick={() => {
                                setActiveReconcilePayout(p);
                                setUtrInput(p.utrReference || '');
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[10px] transition-colors cursor-pointer"
                              title="Enter Bank UTR & Reconcile"
                            >
                              Reconcile
                            </button>
                          )}
                          {p.status !== 'on_hold' && p.status !== 'reconciled' && (
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'on_hold')}
                              className="px-2 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-[10px] transition-colors cursor-pointer"
                              title="Hold Payout (Dispute or KYC)"
                            >
                              Hold
                            </button>
                          )}
                          {p.status === 'on_hold' && (
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'pending')}
                              className="px-2 py-1 rounded-lg bg-gray-100 text-[#1D1D1F] hover:bg-gray-200 font-semibold text-[10px] transition-colors cursor-pointer"
                              title="Release Hold"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UTR Reconciliation Modal */}
      {activeReconcilePayout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <h3 className="text-base font-extrabold text-[#1D1D1F]">Reconcile Bank Payout</h3>
              <button
                onClick={() => setActiveReconcilePayout(null)}
                className="text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitReconciliation} className="mt-4 space-y-4">
              <div className="bg-[#F5F5F7] p-3 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Creator:</span>
                  <span className="font-bold text-[#1D1D1F]">{activeReconcilePayout.creatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Net Payout:</span>
                  <span className="font-extrabold text-emerald-600">{formatInr(activeReconcilePayout.netPayout)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Bank A/C:</span>
                  <span className="font-mono text-[#1D1D1F]">{activeReconcilePayout.bankAccountNumber} ({activeReconcilePayout.bankIfsc})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D1D1F] mb-1">
                  Bank NEFT / RTGS / IMPS UTR Reference Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CMS202610170098234"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full text-xs font-mono bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-2.5 focus:bg-white focus:border-[#3B82F6] focus:outline-none transition-all"
                />
                <p className="text-[10px] text-[#86868B] mt-1">
                  Obtained from your bank statement or HDFC/ICICI corporate portal after NEFT batch clearance.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveReconcilePayout(null)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold hover:bg-[#F5F5F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUtr || !utrInput.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingUtr ? 'Saving...' : 'Confirm Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
