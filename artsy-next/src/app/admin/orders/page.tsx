'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  orderNum: string;
  title: string;
  client: string;
  clientPhone?: string;
  clientEmail?: string;
  type: string;
  cameraProfile: string;
  amount: number;
  status: 'unassigned' | 'in_progress' | 'review_ready' | 'completed' | 'pending' | 'paid';
  rawStatus: string;
  createdAt: string;
  paidAt?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'completed'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.warn('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMarkAsPaid = async (order: OrderItem) => {
    if (!confirm(`Mark Order ${order.orderNum} as PAID?`)) return;

    setUpdatingId(order.id);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: 'paid' }),
      });

      if (res.ok) {
        showToast(`✓ Order ${order.orderNum} marked as PAID. Financial records updated.`);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, status: 'paid', rawStatus: 'paid', paidAt: new Date().toISOString() }
              : o
          )
        );
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(`Error: ${data.error || 'Failed to update order status'}`);
      }
    } catch {
      showToast('Network error updating order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'pending') return o.status === 'pending' || o.rawStatus === 'payment_pending';
    if (filter === 'paid') return o.status === 'paid' || o.rawStatus === 'paid';
    if (filter === 'completed') return o.status === 'completed' || o.rawStatus === 'completed';
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white ml-2">✕</button>
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
            <span className="text-xs font-bold text-[#1D1D1F]">Client Orders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
            Studio Production Orders
          </h1>
          <p className="text-xs text-[#86868B] mt-1">
            Real-time orders ledger, payment confirmation gate, and client billing lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-white border border-[#E5E5E7] text-[#1D1D1F] text-xs font-semibold rounded-xl hover:bg-[#F5F5F7] transition-colors cursor-pointer shadow-xs"
          >
            ↻ Refresh Orders
          </button>
          <Link
            href="/admin"
            className="px-4 py-2 bg-[#1D1D1F] text-white text-xs font-semibold rounded-xl hover:bg-black transition-colors"
          >
            ← Admin Console
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E7] pb-3">
        {(['all', 'pending', 'paid', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === tab
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-white'
            }`}
          >
            {tab === 'pending' ? 'Pending Payment' : tab}
            <span className="ml-1.5 opacity-60 text-[10px]">
              ({tab === 'all'
                ? orders.length
                : orders.filter((o) => {
                    if (tab === 'pending') return o.status === 'pending' || o.rawStatus === 'payment_pending';
                    if (tab === 'paid') return o.status === 'paid' || o.rawStatus === 'paid';
                    if (tab === 'completed') return o.status === 'completed' || o.rawStatus === 'completed';
                    return true;
                  }).length})
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-[#86868B] animate-pulse">
            Loading client orders from Supabase PostgreSQL...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">No orders found</h3>
            <p className="text-xs text-[#86868B] mt-1">There are no client bookings under the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] text-[#86868B] font-semibold border-b border-[#E5E5E7] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Service Package</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'pending' || order.rawStatus === 'payment_pending';
                  const isPaid = order.status === 'paid' || order.rawStatus === 'paid';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-[#1D1D1F]">
                        {order.orderNum}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#1D1D1F]">{order.client}</div>
                        {order.clientPhone && (
                          <div className="text-[10px] text-[#86868B]">{order.clientPhone}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-[#1D1D1F]">{order.title}</div>
                        <div className="text-[10px] text-[#86868B] capitalize">{order.type} • {order.cameraProfile}</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-emerald-600">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            PAID
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            PENDING PAYMENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {order.rawStatus.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[#86868B] text-[11px]">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Recent'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {isPending && (
                          <button
                            onClick={() => handleMarkAsPaid(order)}
                            disabled={updatingId === order.id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {updatingId === order.id ? 'Updating...' : 'Mark as Paid'}
                          </button>
                        )}
                        {isPaid && (
                          <span className="text-[11px] text-emerald-700 font-medium">✓ Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
