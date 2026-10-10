'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ClientHeader from '../components/ClientHeader';
import ClientSidebar from '../components/ClientSidebar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface NotificationItem {
  id: string;
  user_id?: string;
  event_number?: number;
  title: string;
  message: string;
  action_url?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  category?: 'projects' | 'payments' | 'general';
}

const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-001',
    event_number: 22,
    title: 'Master Cut Ready for Review',
    message: 'Your Udaipur Palace Royal Wedding highlight master cut is ready for timestamped review.',
    action_url: '/client/review',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: 'projects',
  },
  {
    id: 'notif-002',
    event_number: 4,
    title: 'GST Tax Invoice Generated',
    message: 'Statutory tax invoice #ART-INV-2026-004 (₹8,000) is now available in your Vault.',
    action_url: '/client/invoices',
    read: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    category: 'payments',
  },
  {
    id: 'notif-003',
    event_number: 11,
    title: 'Editor Assigned to Workroom',
    message: 'Senior Wedding Editor Kabir Sharma was assigned to project AP-8841.',
    action_url: '/client/projects',
    read: true,
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    category: 'projects',
  },
  {
    id: 'notif-004',
    event_number: 2,
    title: 'Payment Confirmed & Vault Locked',
    message: 'Razorpay payment receipt rzp_pay_9921 verified. ₹8,000 held in production escrow.',
    action_url: '/client/invoices',
    read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'payments',
  },
  {
    id: 'notif-005',
    event_number: 8,
    title: 'Media Ingest Verified',
    message: '142 GB raw Sony FX6 and RED log footage verified with zero checksum errors.',
    action_url: '/client/files',
    read: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'projects',
  },
];

export default function ClientNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'projects' | 'payments'>('all');

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      try {
        if (supabase) {
          let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

          if (user?.id) {
            query = query.eq('user_id', user.id);
          }

          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            const mapped = data.map((n: any) => {
              const ev = n.event_number || 0;
              const isPayment = [1, 2, 4, 18, 29, 31].includes(ev);
              return {
                ...n,
                category: isPayment ? 'payments' : 'projects',
              };
            });
            setNotifications(mapped);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load from Supabase notifications, using fallback', err);
      }
      setNotifications(FALLBACK_NOTIFICATIONS);
      setLoading(false);
    }

    loadNotifications();
  }, [user?.id]);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (supabase) {
      try {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .in('id', unreadIds);
        }
      } catch (err) {
        console.warn('Failed to mark read in Supabase', err);
      }
    }
  };

  const markSingleAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    if (supabase) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Failed to mark single read in Supabase', err);
      }
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread') return !n.read;
      if (activeTab === 'projects') return n.category === 'projects';
      if (activeTab === 'payments') return n.category === 'payments';
      return true;
    });
  }, [notifications, activeTab]);

  // Group by Date: Today, Yesterday, Last 7 days, Older
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;

    const groups: { [key: string]: NotificationItem[] } = {
      Today: [],
      Yesterday: [],
      'Last 7 days': [],
      Older: [],
    };

    filteredNotifications.forEach((n) => {
      const itemTime = new Date(n.created_at).getTime();
      if (itemTime >= today) {
        groups.Today.push(n);
      } else if (itemTime >= yesterday) {
        groups.Yesterday.push(n);
      } else if (itemTime >= sevenDaysAgo) {
        groups['Last 7 days'].push(n);
      } else {
        groups.Older.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen font-sans">
      <ClientHeader />
      <div className="flex w-full max-w-full overflow-x-hidden">
        <ClientSidebar />
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden lg:pl-72 pt-28 lg:pt-16 min-h-screen">
          <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link href="/client" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
                    Dashboard
                  </Link>
                  <span className="text-xs text-[#86868B]">/</span>
                  <span className="text-xs font-bold text-[#1D1D1F]">Notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#3B82F6] text-white">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#86868B] mt-1">
                  Production lifecycle alerts, review deliverables, and payment receipts.
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E5E5E7] pb-3">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: `Unread (${unreadCount})` },
                  { key: 'projects', label: 'Projects' },
                  { key: 'payments', label: 'Payments' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification Lists Grouped by Date */}
            {loading ? (
              <div className="text-center py-16 text-xs text-[#86868B]">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-12 text-center space-y-2">
                <div className="text-base font-bold text-[#1D1D1F]">No notifications found</div>
                <p className="text-xs text-[#86868B]">
                  {activeTab === 'unread'
                    ? 'All caught up! You have zero unread notifications.'
                    : 'There are no notifications matching the selected filter.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {(['Today', 'Yesterday', 'Last 7 days', 'Older'] as const).map((groupTitle) => {
                  const items = groupedNotifications[groupTitle];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={groupTitle} className="space-y-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B] px-1">
                        {groupTitle}
                      </h2>
                      <div className="bg-white border border-[#E5E5E7] rounded-2xl divide-y divide-[#F5F5F7] overflow-hidden shadow-xs">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 md:p-5 flex items-start justify-between gap-4 transition-colors ${
                              !item.read ? 'bg-blue-50/30' : 'hover:bg-[#FAFAFA]'
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <span
                                className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                                  !item.read ? 'bg-[#3B82F6]' : 'bg-transparent'
                                }`}
                              />
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[#1D1D1F]">
                                    {item.title}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      item.category === 'payments'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-blue-50 text-blue-700'
                                    }`}
                                  >
                                    {item.category === 'payments' ? 'Payment' : 'Project'}
                                  </span>
                                </div>
                                <p className="text-xs text-[#555] leading-relaxed">
                                  {item.message}
                                </p>
                                <span className="text-[11px] text-[#86868B] block pt-0.5">
                                  {new Date(item.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}{' '}
                                  • {new Date(item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.action_url && (
                                <Link
                                  href={item.action_url}
                                  onClick={() => markSingleAsRead(item.id)}
                                  className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] rounded-lg text-xs font-semibold transition-colors"
                                >
                                  View
                                </Link>
                              )}
                              {!item.read && (
                                <button
                                  type="button"
                                  onClick={() => markSingleAsRead(item.id)}
                                  title="Mark as read"
                                  className="text-xs text-[#86868B] hover:text-[#3B82F6] px-2 py-1"
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
