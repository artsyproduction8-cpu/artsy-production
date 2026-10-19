'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClientItem {
  id: string;
  full_name: string;
  display_name?: string | null;
  avatar_url?: string | null;
  onboarded?: boolean;
  studio_details?: any;
  phone: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  total_orders: number;
  lifetime_value: number; // in paisa
  deleted_at?: string | null;
}

interface ClientDetail extends ClientItem {
  orders: any[];
  payments: any[];
  projects: any[];
  invoices: any[];
  notifications: any[];
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openClientDetail = async (id: string) => {
    setSelectedClientId(id);
    setDetailLoading(true);
    setClientDetail(null);
    try {
      const res = await fetch(`/api/admin/clients?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setClientDetail(data.client);
      }
    } catch (err) {
      console.error('Failed to load client detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      !search ||
      (c.full_name && c.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && (!c.deleted_at && c.status !== 'suspended')) ||
      (statusFilter === 'suspended' && c.status === 'suspended') ||
      (statusFilter === 'deleted' && Boolean(c.deleted_at));

    return matchesSearch && matchesStatus;
  });

  const formatInr = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format((paisa || 0) / 100);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Client Directory & Lifetime Spend</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Real-time DB
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Track client accounts, lifetime paid orders, project delivery histories, and invoices.
          </p>
        </div>

        <button
          onClick={fetchClients}
          className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs cursor-pointer"
        >
          Refresh Directory
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by client name, email, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-[#F5F5F7] border border-transparent rounded-xl px-3 py-2 pl-9 focus:bg-white focus:border-[#3B82F6] focus:outline-none transition-all"
            />
            <svg className="w-4 h-4 text-[#86868B] absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
          <span>Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-2 py-1 text-xs font-medium text-[#1D1D1F] focus:outline-none"
          >
            <option value="all">All Clients</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted (DPDP)</option>
          </select>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading client records from database...</div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#86868B]">No clients found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold">
                  <th className="py-3 px-4">Client ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Total Orders</th>
                  <th className="py-3 px-4">Lifetime Value</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Profile Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => openClientDetail(client.id)}
                    className="hover:bg-[#F5F5F7]/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-[#86868B] text-[10px]">{client.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1D1D1F]">{client.display_name || client.full_name}</div>
                      {client.display_name && client.display_name !== client.full_name && (
                        <div className="text-[11px] text-[#86868B]">{client.full_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#1D1D1F]">{client.email}</div>
                      <div className="text-[10px] text-[#86868B] font-mono">{client.phone || '—'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#1D1D1F]">
                      {client.total_orders} Orders
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {formatInr(client.lifetime_value)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          client.deleted_at
                            ? 'bg-gray-100 text-gray-700'
                            : client.status === 'suspended'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {client.deleted_at ? 'DELETED' : (client.status || 'ACTIVE').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#86868B]">
                      {new Date(client.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openClientDetail(client.id);
                        }}
                        className="px-2.5 py-1 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6] hover:text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Detail Modal / Drawer (Task 2.3) */}
      {selectedClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl border border-[#E5E5E7] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-[#E5E5E7] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  {clientDetail?.full_name || 'Loading Client Profile...'}
                </h2>
                <div className="text-xs text-[#86868B] font-mono mt-0.5">
                  ID: {selectedClientId} • {clientDetail?.email} • {clientDetail?.phone || 'No phone'}
                </div>
              </div>
              <button
                onClick={() => setSelectedClientId(null)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-xs text-[#86868B]">
                Fetching client orders, payments, projects, invoices, and notification logs...
              </div>
            ) : clientDetail ? (
              <div className="space-y-6">
                {/* 0. Studio & Business Profile Setup */}
                <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                      Studio & Billing Setup
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {clientDetail.studio_details?.accountType === 'b2b' ? 'B2B Studio' : 'B2C Client'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[#86868B] block text-[11px]">Studio Name:</span>
                      <span className="font-semibold text-[#1D1D1F]">{clientDetail.display_name || clientDetail.studio_details?.studioName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[#86868B] block text-[11px]">Billing Name:</span>
                      <span className="font-semibold text-[#1D1D1F]">{clientDetail.studio_details?.billingName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[#86868B] block text-[11px]">GSTIN:</span>
                      <span className="font-mono font-semibold text-[#1D1D1F]">{clientDetail.studio_details?.gstin || 'Unregistered'}</span>
                    </div>
                    <div>
                      <span className="text-[#86868B] block text-[11px]">Billing Address:</span>
                      <span className="text-[#1D1D1F]">
                        {[clientDetail.studio_details?.address, clientDetail.studio_details?.city, clientDetail.studio_details?.state, clientDetail.studio_details?.pincode].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#86868B] block text-[11px]">Ingest Provider:</span>
                      <span className="text-[#1D1D1F]">{clientDetail.studio_details?.ingestProvider || 'Google Drive Enterprise'}</span>
                    </div>
                    <div>
                      <span className="text-[#86868B] block text-[11px]">Aspect Ratio Preset:</span>
                      <span className="text-[#1D1D1F] font-mono">{clientDetail.studio_details?.aspectRatioPreset || '9:16'}</span>
                    </div>
                  </div>
                </div>

                {/* 1. All Orders */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Orders ({clientDetail.orders.length})
                  </h3>
                  {clientDetail.orders.length === 0 ? (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B]">No orders created yet.</div>
                  ) : (
                    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                          <tr>
                            <th className="py-2 px-3">Order Number</th>
                            <th className="py-2 px-3">Gross Amount</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {clientDetail.orders.map((o: any) => (
                            <tr key={o.id}>
                              <td className="py-2 px-3 font-mono text-[#3B82F6]">{o.order_number}</td>
                              <td className="py-2 px-3 font-mono">{formatInr(o.gross_amount)}</td>
                              <td className="py-2 px-3 capitalize">{o.status}</td>
                              <td className="py-2 px-3 text-[#86868B]">{new Date(o.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. All Payments */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Payments ({clientDetail.payments.length})
                  </h3>
                  {clientDetail.payments.length === 0 ? (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B]">No payments on file.</div>
                  ) : (
                    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                          <tr>
                            <th className="py-2 px-3">Payment ID</th>
                            <th className="py-2 px-3">Amount</th>
                            <th className="py-2 px-3">Gateway</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {clientDetail.payments.map((p: any) => (
                            <tr key={p.id}>
                              <td className="py-2 px-3 font-mono">{p.gateway_payment_id || p.id.slice(0, 8)}</td>
                              <td className="py-2 px-3 font-mono font-bold text-emerald-600">{formatInr(p.amount)}</td>
                              <td className="py-2 px-3">{p.gateway || 'Razorpay'}</td>
                              <td className="py-2 px-3 capitalize">{p.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. All Projects */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Projects ({clientDetail.projects.length})
                  </h3>
                  {clientDetail.projects.length === 0 ? (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B]">No projects initiated.</div>
                  ) : (
                    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                          <tr>
                            <th className="py-2 px-3">Project Title</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {clientDetail.projects.map((pr: any) => (
                            <tr key={pr.id}>
                              <td className="py-2 px-3 font-semibold">{pr.title}</td>
                              <td className="py-2 px-3 capitalize">{pr.status}</td>
                              <td className="py-2 px-3 text-[#86868B]">{new Date(pr.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. All Notifications Sent */}
                <div>
                  <h3 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider mb-2">
                    Dispatched Notifications ({clientDetail.notifications.length})
                  </h3>
                  {clientDetail.notifications.length === 0 ? (
                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#86868B]">No notifications recorded.</div>
                  ) : (
                    <div className="border border-[#E5E5E7] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B]">
                          <tr>
                            <th className="py-2 px-3">Channel</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Message ID</th>
                            <th className="py-2 px-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5E5E7]">
                          {clientDetail.notifications.map((n: any) => (
                            <tr key={n.id}>
                              <td className="py-2 px-3 uppercase font-bold text-[10px] text-[#3B82F6]">{n.channel}</td>
                              <td className="py-2 px-3 capitalize">{n.status}</td>
                              <td className="py-2 px-3 font-mono text-[10px] text-[#86868B]">{n.provider_message_id || '—'}</td>
                              <td className="py-2 px-3 text-[#86868B]">{new Date(n.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-4 border-t border-[#E5E5E7]">
              <button
                onClick={() => setSelectedClientId(null)}
                className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
