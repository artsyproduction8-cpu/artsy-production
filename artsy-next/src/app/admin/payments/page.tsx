'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

interface LedgerItem {
  id: string;
  date: string;
  type: 'client_payment' | 'creator_payout' | 'refund';
  reference: string;
  partyName: string;
  partyEmail: string;
  grossAmount: number;
  feeOrTds: number;
  netAmount: number;
  direction: 'IN' | 'OUT';
  status: string;
  method: string;
  runningBalance: number;
}

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<any>({ totalIn: 0, totalOut: 0, currentBalance: 0, totalTransactions: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?type=${typeFilter}&status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setLedger(data.ledger || []);
        setSummary(data.summary || {});
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [typeFilter, statusFilter]);

  const filteredItems = ledger.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.reference.toLowerCase().includes(term) ||
      item.partyName.toLowerCase().includes(term) ||
      item.partyEmail.toLowerCase().includes(term) ||
      item.method.toLowerCase().includes(term)
    );
  });

  const formatInr = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paisa / 100);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Unified Payments Ledger</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Real-time DB
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Reconciled client payments, creator payouts, and refund entries with running balance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/admin/payments?format=csv"
            download
            className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.5L19 9.5V19a2 2 0 01-2 2z" />
            </svg>
            Export Ledger CSV
          </a>
          <button
            onClick={fetchLedger}
            className="p-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] rounded-xl text-[#86868B] transition-all cursor-pointer"
            title="Refresh Ledger"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Running Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Total Money In (Clients)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{formatInr(summary.totalIn || 0)}</div>
          <div className="text-xs text-[#86868B] mt-1">Paid client orders & retains</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Total Money Out (Payouts & Refunds)</div>
          <div className="text-2xl font-bold text-red-600 mt-2">{formatInr(summary.totalOut || 0)}</div>
          <div className="text-xs text-[#86868B] mt-1">Disbursed via NEFT & refunds</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs">
          <div className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">Current Net Treasury Balance</div>
          <div className="text-2xl font-bold text-[#1D1D1F] mt-2">{formatInr(summary.currentBalance || 0)}</div>
          <div className="text-xs text-[#86868B] mt-1">Net platform treasury cash flow</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by party, email, reference, or method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-[#F5F5F7] border border-transparent rounded-xl px-3 py-2 pl-9 focus:bg-white focus:border-[#3B82F6] focus:outline-none transition-all"
            />
            <svg className="w-4 h-4 text-[#86868B] absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-2 py-1 text-xs font-medium text-[#1D1D1F] focus:outline-none"
            >
              <option value="all">All Flows</option>
              <option value="client_payment">Client Payment (IN)</option>
              <option value="creator_payout">Creator Payout (OUT)</option>
              <option value="refund">Refund (OUT)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-2 py-1 text-xs font-medium text-[#1D1D1F] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Captured / Paid</option>
              <option value="pending">Pending</option>
              <option value="processed">Processed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading reconciled ledger...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#86868B]">No ledger records matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Party</th>
                  <th className="py-3 px-4">Gross</th>
                  <th className="py-3 px-4">TDS / Fee</th>
                  <th className="py-3 px-4">Net Flow</th>
                  <th className="py-3 px-4">Running Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3 px-4 text-[#86868B] whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'client_payment'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.type === 'creator_payout'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#1D1D1F]">{item.reference}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1D1D1F]">{item.partyName}</div>
                      <div className="text-[10px] text-[#86868B]">{item.partyEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-[#1D1D1F] font-mono">{formatInr(item.grossAmount)}</td>
                    <td className="py-3 px-4 text-[#86868B] font-mono">
                      {item.feeOrTds > 0 ? formatInr(item.feeOrTds) : '—'}
                    </td>
                    <td
                      className={`py-3 px-4 font-mono font-bold whitespace-nowrap ${
                        item.direction === 'IN' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {item.direction === 'IN' ? '+' : '-'} {formatInr(item.netAmount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#1D1D1F] font-semibold whitespace-nowrap">
                      {formatInr(item.runningBalance)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-[#F5F5F7] text-[10px] font-semibold text-[#1D1D1F]">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#86868B] whitespace-nowrap">{item.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
