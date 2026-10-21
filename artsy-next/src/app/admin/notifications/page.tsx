'use client';

import { useState, useEffect } from 'react';

interface NotificationLog {
  id: string;
  channel: string;
  recipient: string;
  event_number: number | null;
  provider_message_id: string | null;
  status: 'sent' | 'delivered' | 'failed';
  error_message: string | null;
  retry_count: number;
  delivered_at: string | null;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [retryLoading, setRetryLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/notifications?search=${encodeURIComponent(search)}&channel=${channelFilter}&status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [channelFilter, statusFilter]);

  const handleRetry = async (notificationId: string) => {
    setRetryLoading(notificationId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('Notification retry dispatched successfully.');
        fetchLogs();
      } else {
        setFeedback(`Retry failed: ${data.error || 'Provider rejected request'}`);
      }
    } catch (err: any) {
      setFeedback(`Retry error: ${err.message}`);
    } finally {
      setRetryLoading(null);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Notification Delivery Telemetry</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Real-time DB
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Real-time delivery status for WhatsApp Meta Cloud API, OTP authentication, and Resend transactional emails.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs cursor-pointer"
        >
          Refresh Logs
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          {feedback}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by recipient phone or email, message ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="w-full text-xs bg-[#F5F5F7] border border-transparent rounded-xl px-3 py-2 pl-9 focus:bg-white focus:border-[#3B82F6] focus:outline-none transition-all"
            />
            <svg className="w-4 h-4 text-[#86868B] absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={fetchLogs}
            className="px-3 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
            <span>Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-2 py-1 text-xs font-medium text-[#1D1D1F] focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp_otp">WhatsApp OTP</option>
              <option value="whatsapp">WhatsApp Utility</option>
              <option value="email">Resend Email</option>
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
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading notification delivery logs...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#86868B]">No notification logs matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold text-[11px]">
                  <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-4 whitespace-nowrap">Channel</th>
                  <th className="py-3 px-4 whitespace-nowrap">Recipient</th>
                  <th className="py-3 px-4 whitespace-nowrap">Provider Message ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Diagnostic Details</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {notifications.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3 px-4 text-[#86868B] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.channel === 'whatsapp_otp'
                            ? 'bg-purple-50 text-purple-700'
                            : log.channel === 'whatsapp'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {log.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#1D1D1F]">{log.recipient}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#86868B]">
                      {log.provider_message_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.status === 'sent'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[10px] text-[#86868B]">
                      {log.error_message ? (
                        <span className="text-red-600 font-mono" title={log.error_message}>
                          {log.error_message}
                        </span>
                      ) : (
                        <span>Delivered successfully</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.status === 'failed' ? (
                        <button
                          onClick={() => handleRetry(log.id)}
                          disabled={retryLoading === log.id}
                          className="px-2.5 py-1 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Retry
                        </button>
                      ) : (
                        <span className="text-[#86868B] text-[10px]">—</span>
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
