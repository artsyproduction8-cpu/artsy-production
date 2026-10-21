'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface PreferredRequest {
  id: string;
  order_number: string;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  service_key: string;
  gross_amount: number;
  status: string;
  preferred_creator_id: string;
  preferred_creator_assigned: boolean;
  preferred_creator_rejection_reason: string | null;
  created_at: string;
  preferredCreator: {
    id: string;
    public_display_name: string;
    public_specialty: string;
    creator_tier: string;
    avg_rating: number;
    is_accepting_work: boolean;
  };
}

interface CreatorOption {
  id: string;
  public_display_name: string;
  public_specialty: string;
  creator_tier: string;
  avg_rating: number;
  is_accepting_work: boolean;
}

export default function AdminCreatorRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PreferredRequest[]>([]);
  const [availableCreators, setAvailableCreators] = useState<CreatorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Alternate creator modal state
  const [selectedOrderForAlt, setSelectedOrderForAlt] = useState<PreferredRequest | null>(null);
  const [selectedAltCreatorId, setSelectedAltCreatorId] = useState<string>('');

  // Reject modal state
  const [selectedOrderForReject, setSelectedOrderForReject] = useState<PreferredRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Creator unavailable for project schedule');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/creator-requests');
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.requests || []);
        setAvailableCreators(data.availableCreators || []);
      }
    } catch (err) {
      console.error('Error fetching creator requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAssignRequested = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const res = await fetch('/api/admin/creator-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'assign_requested',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice('Requested creator successfully confirmed and assigned.');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to assign requested creator');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing assignment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmAlternate = async () => {
    if (!selectedOrderForAlt || !selectedAltCreatorId) return;

    try {
      setActionLoading(selectedOrderForAlt.id);
      const res = await fetch('/api/admin/creator-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForAlt.id,
          action: 'assign_alternate',
          alternateCreatorId: selectedAltCreatorId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice(data.message || 'Alternate creator assigned and client notified.');
        setSelectedOrderForAlt(null);
        setSelectedAltCreatorId('');
        fetchRequests();
      } else {
        alert(data.error || 'Failed to assign alternate creator');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning alternate creator');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedOrderForReject) return;

    try {
      setActionLoading(selectedOrderForReject.id);
      const res = await fetch('/api/admin/creator-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForReject.id,
          action: 'reject',
          reason: rejectReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotice('Preferred creator request rejected.');
        setSelectedOrderForReject(null);
        fetchRequests();
      } else {
        alert(data.error || 'Failed to reject request');
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E7] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs text-[#1D1D1F] font-medium">Preferred Creator Requests</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Preferred Creator Requests
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            Incoming bookings where clients requested a specific creator. Review availability and confirm or offer an alternate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequests}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all"
          >
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Queue Card */}
      <div className="bg-white border border-[#E5E5E7] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E5E5E7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-sm font-bold text-[#1D1D1F]">
              Pending Confirmation Queue ({requests.length})
            </h2>
          </div>
          <span className="text-xs text-[#86868B]">
            All assignments require studio admin confirmation
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#86868B]">
            Loading preferred creator requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Queue Clear</h3>
            <p className="text-xs text-[#86868B] mt-1 max-w-sm mx-auto">
              No unassigned preferred creator requests at this moment. New requests from clients will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] text-[#86868B] border-b border-[#E5E5E7] text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Order</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Client</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Requested Creator</th>
                  <th className="py-3 px-4 font-semibold">Service & Value</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 font-semibold whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F9F9FB] transition-colors">
                    <td className="py-4 px-4 font-mono font-medium text-[#1D1D1F]">
                      {req.order_number}
                      <div className="text-[10px] text-[#86868B] font-sans mt-0.5">
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#1D1D1F]">
                        {req.client_name || 'Client'}
                      </div>
                      <div className="text-[11px] text-[#86868B]">
                        {req.client_phone || req.client_email || '—'}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center text-xs font-bold">
                          {req.preferredCreator.public_display_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                            {req.preferredCreator.public_display_name}
                            <span className="text-[10px] bg-[#F5F5F7] text-[#86868B] px-1.5 py-0.5 rounded">
                              ★ {req.preferredCreator.avg_rating}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#86868B]">
                            {req.preferredCreator.public_specialty}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-[#1D1D1F] capitalize">
                        {req.service_key.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600">
                        ₹{(req.gross_amount / 100).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Awaiting Admin Confirmation
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => handleAssignRequested(req.id)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#1D1D1F] text-white hover:bg-black transition-all disabled:opacity-50"
                        >
                          {actionLoading === req.id ? 'Assigning...' : 'Assign Creator'}
                        </button>
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => {
                            setSelectedOrderForAlt(req);
                            setSelectedAltCreatorId(
                              availableCreators.find((c) => c.id !== req.preferred_creator_id)?.id || ''
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7] transition-all"
                        >
                          Offer Alternate
                        </button>
                        <button
                          disabled={actionLoading === req.id}
                          onClick={() => setSelectedOrderForReject(req)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alternate Creator Modal */}
      {selectedOrderForAlt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">Assign Alternate Creator</h3>
              <p className="text-xs text-[#86868B] mt-1">
                Order <span className="font-mono text-[#1D1D1F]">{selectedOrderForAlt.order_number}</span> originally requested{' '}
                <span className="font-bold text-[#1D1D1F]">{selectedOrderForAlt.preferredCreator.public_display_name}</span>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1D1D1F] block">Select Alternate Editor</label>
              <select
                value={selectedAltCreatorId}
                onChange={(e) => setSelectedAltCreatorId(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] font-medium focus:outline-hidden focus:border-[#1D1D1F]"
              >
                {availableCreators.map((creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.public_display_name} — {creator.public_specialty} (★ {creator.avg_rating})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <strong>Client Notification Preview:</strong>
              <div className="mt-1 italic">
                &ldquo;Your requested creator was not available for this project. We have assigned [Alternate Name] who specializes in the same category.&rdquo;
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrderForAlt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
              >
                Cancel
              </button>
              <button
                disabled={!selectedAltCreatorId || actionLoading === selectedOrderForAlt.id}
                onClick={handleConfirmAlternate}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1D1D1F] text-white hover:bg-black transition-all disabled:opacity-50"
              >
                Confirm Alternate Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {selectedOrderForReject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E5E7] space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">Decline Creator Request</h3>
              <p className="text-xs text-[#86868B] mt-1">
                Decline the preferred creator selection for Order{' '}
                <span className="font-mono text-[#1D1D1F]">{selectedOrderForReject.order_number}</span>. Project will proceed with standard curation matching.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1D1D1F] block">Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl p-3 text-xs text-[#1D1D1F] focus:outline-hidden focus:border-[#1D1D1F]"
                placeholder="e.g. Creator calendar fully booked for project timeline"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrderForReject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F]"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading === selectedOrderForReject.id}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
