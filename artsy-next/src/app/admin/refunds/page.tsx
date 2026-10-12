'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RefundItem {
  id: string;
  order_id: string;
  amount: number;
  reason: string;
  razorpay_refund_id: string | null;
  status: 'pending' | 'processed' | 'failed';
  credit_note_number: string | null;
  reference: string | null;
  created_at: string;
  order?: {
    order_number: string;
    client_name: string;
    client_email: string;
    gross_amount: number;
  } | null;
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/refunds');
      const data = await res.json();
      if (data.success) {
        setRefunds(data.refunds || []);
      }
    } catch (err) {
      console.error('Failed to fetch refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Refund ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        fetchRefunds();
      } else {
        setFeedback(`Error: ${data.error || 'Failed to update refund'}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatInr = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paisa / 100);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Refunds Desk & Credit Notes</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Real-time DB
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Review client cancellation refunds, process approvals, and trace GST credit note issues.
          </p>
        </div>

        <button
          onClick={fetchRefunds}
          className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs cursor-pointer"
        >
          Refresh Refunds
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          {feedback}
        </div>
      )}

      {/* Refunds Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading refund entries...</div>
        ) : refunds.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#86868B]">No refund entries logged in the database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Original Order</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Refund Amount</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Credit Note</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {refunds.map((ref) => (
                  <tr key={ref.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3 px-4 text-[#86868B] whitespace-nowrap">
                      {new Date(ref.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      {ref.order ? (
                        <div className="font-mono font-medium text-[#3B82F6]">
                          {ref.order.order_number}
                        </div>
                      ) : (
                        <span className="font-mono text-[#86868B]">{ref.order_id?.slice(0, 8) || '—'}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1D1D1F]">{ref.order?.client_name || 'Client'}</div>
                      <div className="text-[10px] text-[#86868B]">{ref.order?.client_email || ''}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {formatInr(ref.amount)}
                    </td>
                    <td className="py-3 px-4 text-[#1D1D1F] max-w-xs truncate" title={ref.reason}>
                      {ref.reason}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#86868B]">
                      {ref.credit_note_number || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ref.status === 'processed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ref.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {ref.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ref.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(ref.id, 'approve')}
                            disabled={actionLoading === ref.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(ref.id, 'reject')}
                            disabled={actionLoading === ref.id}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#86868B] text-[10px]">Settled</span>
                      )}
                    </td>
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
