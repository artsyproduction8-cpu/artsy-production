'use client';

import { useState, useEffect } from 'react';

interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  created_at: string;
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?search=${encodeURIComponent(search)}&action=${actionFilter}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Immutable Security Audit Log</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              Real-time DB
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Tamper-evident trail of administrative mutations, creator approvals, refunds, and permission alterations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/admin/audit-logs?format=csv"
            download
            className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#86868B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.5L19 9.5V19a2 2 0 01-2 2z" />
            </svg>
            Export Audit Log CSV
          </a>
          <button
            onClick={fetchLogs}
            className="p-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] rounded-xl text-[#86868B] transition-all cursor-pointer"
            title="Refresh Logs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by admin email, action, or target table..."
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

        <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
          <span>Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-lg px-2 py-1 text-xs font-medium text-[#1D1D1F] focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="SETUP_SUPER_ADMIN">Setup Super Admin</option>
            <option value="CREATOR_APPROVE">Creator Approve</option>
            <option value="CREATOR_REJECT">Creator Reject</option>
            <option value="CREATOR_SUSPEND">Creator Suspend</option>
            <option value="REFUND_APPROVE">Refund Approve</option>
            <option value="REFUND_REJECT">Refund Reject</option>
            <option value="DISPUTE_RESOLVE">Dispute Resolve</option>
            <option value="ROLE_UPDATE">Role Update</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading security audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#86868B]">No audit records matching search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold text-[11px]">
                  <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                  <th className="py-3 px-4 whitespace-nowrap">Admin Email</th>
                  <th className="py-3 px-4 whitespace-nowrap">Action</th>
                  <th className="py-3 px-4 whitespace-nowrap">Target Table</th>
                  <th className="py-3 px-4 whitespace-nowrap">Target ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Changes Snapshot</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {logs.map((log) => (
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
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1D1D1F]">{log.admin_email || 'Executive Admin'}</div>
                      <div className="text-[10px] font-mono text-[#86868B]">{log.admin_id?.slice(0, 8)}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#1D1D1F]">{log.target_table}</td>
                    <td className="py-3 px-4 font-mono text-[#86868B]">{log.target_id?.slice(0, 8) || '—'}</td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-[10px] text-[#86868B]">
                      {JSON.stringify(log.new_values || log.old_values || {})}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntry(log)}
                        className="px-2.5 py-1 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded-lg text-[10px] font-semibold cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Inspection Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#E5E5E7]">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Audit Mutation Payload</h3>
                <div className="text-xs text-[#86868B] font-mono mt-0.5">{selectedEntry.action} • {selectedEntry.target_table}</div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[#86868B]">Admin:</span> {selectedEntry.admin_email} ({selectedEntry.admin_id})
              </div>
              <div>
                <span className="font-semibold text-[#86868B]">Timestamp:</span> {selectedEntry.created_at}
              </div>
              <div>
                <span className="font-semibold text-[#86868B]">New Values JSON:</span>
                <pre className="mt-1 p-3 bg-[#1D1D1F] text-emerald-400 rounded-xl overflow-x-auto font-mono text-[11px]">
                  {JSON.stringify(selectedEntry.new_values, null, 2) || '{}'}
                </pre>
              </div>
              {selectedEntry.old_values && (
                <div>
                  <span className="font-semibold text-[#86868B]">Old Values JSON:</span>
                  <pre className="mt-1 p-3 bg-[#1D1D1F] text-amber-400 rounded-xl overflow-x-auto font-mono text-[11px]">
                    {JSON.stringify(selectedEntry.old_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEntry(null)}
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
