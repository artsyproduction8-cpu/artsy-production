'use client';

import { useState, useEffect } from 'react';

interface DisputeItem {
  id: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  reason: string;
  amount: number;
  status: 'open' | 'resolved' | 'escalated' | 'refunded';
  openedAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (data.success) {
        setDisputes(data.disputes || []);
      }
    } catch (err) {
      console.error('Failed to fetch disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleAction = async (id: string, action: 'resolve' | 'escalate' | 'refund') => {
    setActionLoading(id);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, notes: resolutionNote }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Dispute marked as ${data.status} successfully.`);
        setSelectedDispute(null);
        setResolutionNote('');
        fetchDisputes();
      } else {
        setFeedback(`Error: ${data.error || 'Failed to update dispute'}`);
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
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Disputes & Mediation Desk</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Real-time DB
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Arbitrate quality, timeline, and deliverables disagreements between clients and creators.
          </p>
        </div>

        <button
          onClick={fetchDisputes}
          className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs cursor-pointer"
        >
          Refresh Disputes
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          {feedback}
        </div>
      )}

      {/* Disputes Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading disputes from database...</div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#86868B]">
            No open or unresolved disputes found. All projects are operating smoothly!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold">
                  <th className="py-3 px-4">Opened Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Project / Order</th>
                  <th className="py-3 px-4">Disputed Amount</th>
                  <th className="py-3 px-4">Dispute Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Resolution Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {disputes.map((disp) => (
                  <tr key={disp.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3 px-4 text-[#86868B] whitespace-nowrap">
                      {new Date(disp.openedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1D1D1F]">{disp.clientName}</div>
                      <div className="text-[10px] text-[#86868B]">{disp.clientEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#1D1D1F]">{disp.projectName}</div>
                      <div className="font-mono text-[10px] text-[#3B82F6]">{disp.orderNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-red-600">
                      {formatInr(disp.amount)}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[#1D1D1F]" title={disp.reason}>
                      {disp.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          disp.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : disp.status === 'escalated'
                            ? 'bg-purple-50 text-purple-700'
                            : disp.status === 'refunded'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {disp.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#86868B] text-[10px]">
                      {disp.resolvedAt ? (
                        <div>
                          <div>Resolved: {new Date(disp.resolvedAt).toLocaleDateString()}</div>
                          {disp.resolutionNotes && <div className="italic truncate">{disp.resolutionNotes}</div>}
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium">Pending Decision</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {disp.status === 'open' || disp.status === 'escalated' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDispute(disp)}
                            className="px-2 py-1 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                          >
                            Mediate
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#86868B] text-[10px]">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mediation Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E5E5E7]">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#1D1D1F]">Mediate Dispute</h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs space-y-1">
              <div><span className="font-semibold">Client:</span> {selectedDispute.clientName}</div>
              <div><span className="font-semibold">Project:</span> {selectedDispute.projectName}</div>
              <div><span className="font-semibold">Amount:</span> {formatInr(selectedDispute.amount)}</div>
              <div><span className="font-semibold">Reason:</span> {selectedDispute.reason}</div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Resolution Notes / Audit Justification
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Enter notes explaining mediation decision..."
                className="w-full text-xs p-2.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl focus:bg-white focus:outline-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleAction(selectedDispute.id, 'resolve')}
                disabled={actionLoading === selectedDispute.id}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Resolve in Favor of Work
              </button>
              <button
                onClick={() => handleAction(selectedDispute.id, 'refund')}
                disabled={actionLoading === selectedDispute.id}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Issue Full Refund
              </button>
              <button
                onClick={() => handleAction(selectedDispute.id, 'escalate')}
                disabled={actionLoading === selectedDispute.id}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
