'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

interface AdminUser {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'admin' | 'super_admin';
  status: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  isProtected: boolean;
}

interface ClientCandidate {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'client';
  created_at: string;
}

export default function AdminUsersManagementPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [candidates, setCandidates] = useState<ClientCandidate[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  const isUserSuperAdmin = (u: any) => {
    if (!u) return false;
    if (u.role === 'super_admin') return true;
    const phone = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
    const email = u.email ? u.email.toLowerCase().trim() : '';
    return phone === '7777078742' || email === 'lilsammy96@gmail.com';
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins || []);
        setCandidates(data.clientCandidates || []);
        setIsSuperAdmin(Boolean(data.isSuperAdmin || isUserSuperAdmin(user)));
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (isUserSuperAdmin(user)) {
      setIsSuperAdmin(true);
    }
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: 'client' | 'admin') => {
    setActionLoading(userId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`User role successfully changed to ${newRole}.`);
        fetchUsers();
      } else {
        setFeedback(`Error: ${data.error || 'Failed to update role'}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Administrative Access & Roles</h1>
            <span className="text-[11px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full">
              SEC-02 Access Control
            </span>
          </div>
          <p className="text-sm text-[#86868B] mt-1">
            Manage studio directors and admin delegates. Only the Super Admin (+91 77770 78742 / lilsammy96@gmail.com) can modify role assignments.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-semibold rounded-xl text-[#1D1D1F] transition-all shadow-2xs cursor-pointer"
        >
          Refresh Users
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          {feedback}
        </div>
      )}

      {/* Super Admin Privileges Notice */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            🛡️
          </div>
          <div>
            <div className="text-xs font-bold text-[#1D1D1F]">
              Super Admin Ownership Protection Active
            </div>
            <div className="text-xs text-[#86868B]">
              Designated Account: <span className="font-mono font-semibold text-purple-700">+91 77770 78742 (lilsammy96@gmail.com)</span>. Protected against deletion, role alteration, or non-owner modification by Postgres triggers.
            </div>
          </div>
        </div>

        <div>
          <span
            className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
              isSuperAdmin ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isSuperAdmin ? 'Super Admin Mode Active' : 'Standard Admin Mode (Read Only)'}
          </span>
        </div>
      </div>

      {/* Promote Client to Admin (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="bg-white p-5 rounded-2xl border border-[#E5E5E7] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1D1D1F]">Promote Client Member to Admin</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="flex-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs font-medium text-[#1D1D1F] focus:outline-none"
            >
              <option value="">Select a client to promote...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email || c.phone})
                </option>
              ))}
            </select>

            <button
              onClick={() => selectedCandidate && handleRoleChange(selectedCandidate, 'admin')}
              disabled={!selectedCandidate || actionLoading === selectedCandidate}
              className="px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Elevate to Admin
            </button>
          </div>
        </div>
      )}

      {/* Admin Users Table */}
      <div className="bg-white rounded-2xl border border-[#E5E5E7] overflow-hidden shadow-xs">
        <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E7] flex justify-between items-center">
          <h2 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
            Active Executive Roster ({admins.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#86868B]">Loading administrative users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E5E5E7] text-[#86868B] font-semibold">
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Protection</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Role Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {admins.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1D1D1F]">{u.full_name}</div>
                      <div className="text-[10px] text-[#86868B]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#1D1D1F]">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.isProtected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          🔒 Protected Account
                        </span>
                      ) : (
                        <span className="text-[#86868B] text-[10px]">Standard Admin</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#86868B]">
                      {new Date(u.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-[#86868B]">
                      {u.updated_at
                        ? new Date(u.updated_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {/* Task 13: Super admin cannot be modified or deleted */}
                      {u.isProtected ? (
                        <span className="text-[10px] text-[#86868B] italic">Immutable</span>
                      ) : isSuperAdmin ? (
                        <button
                          onClick={() => handleRoleChange(u.id, 'client')}
                          disabled={actionLoading === u.id}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                        >
                          Demote to Client
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#86868B]">Super Admin Only</span>
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
