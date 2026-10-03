'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface ClientOrder {
  orderId: string;
  orderTitle: string;
  category: 'Wedding' | 'Brand' | 'Corporate' | 'Personal';
  format: string;
  assignedCreator: string;
  orderDate: string;
  deliveryDate: string;
  grossAmount: number; // ex-GST in INR
  gstAmount: number; // 18% GST in INR
  totalAmount: number; // total paid in INR
  invoiceRef: string;
  orderStatus: 'Completed & Signed Off' | 'In Production (Color Pass)' | 'In Production Vault (QC Pass)';
  vaultStatus: 'Released Post-Signoff' | 'Locked in Production Vault';
  clientRating: number;
  feedback: string;
}

interface ComprehensiveClient {
  id: string;
  displayName: string;
  companyOrCouple: string;
  email: string;
  phone: string;
  location: string;
  clientType: 'Wedding' | 'Brand' | 'Corporate' | 'Personal';
  accountTier: 'Enterprise Retainer' | 'High-Growth DTC' | 'Luxury Private Client';
  gstin: string;
  billingAddress: string;
  joinedDate: string;
  // Financial metrics
  lifetimeGrossSpend: number;
  gstPaid: number;
  netPlatformSpend: number;
  currentVaultFunded: number;
  averageOrderValue: number;
  // Order track record
  totalOrdersCount: number;
  completedOrdersCount: number;
  activeOrdersCount: number;
  avgSlaMetRate: number;
  // Detailed orders
  orders: ClientOrder[];
}

const CLIENTS_DATA: ComprehensiveClient[] = [
  {
    id: 'clt-001',
    displayName: 'Aarav Singhania',
    companyOrCouple: 'NexGen FinTech Alliance Pvt. Ltd.',
    email: 'aarav.singhania@nexgenfin.in',
    phone: '+91 98190 33412',
    location: 'Mumbai, Maharashtra',
    clientType: 'Corporate',
    accountTier: 'Enterprise Retainer',
    gstin: '27AABCU9603R1ZM (Verified)',
    billingAddress: 'Level 14, Tower B, Peninsula Business Park, Lower Parel, Mumbai 400013',
    joinedDate: '10 Nov 2024',
    lifetimeGrossSpend: 540000,
    gstPaid: 97200,
    netPlatformSpend: 442800,
    currentVaultFunded: 35400,
    averageOrderValue: 24545,
    totalOrdersCount: 22,
    completedOrdersCount: 20,
    activeOrdersCount: 2,
    avgSlaMetRate: 100,
    orders: [
      {
        orderId: 'ORD-CRP-2026-091',
        orderTitle: 'FinTech Horizons 2026 Summit Keynote Cut',
        category: 'Corporate',
        format: 'Corporate Film (Full Keynote)',
        assignedCreator: 'Vikram Joshi (Senior Lead)',
        orderDate: '18 Sep 2026',
        deliveryDate: '22 Sep 2026',
        grossAmount: 15000,
        gstAmount: 2700,
        totalAmount: 17700,
        invoiceRef: 'INV-2026-0819',
        orderStatus: 'Completed & Signed Off',
        vaultStatus: 'Released Post-Signoff',
        clientRating: 5.0,
        feedback: 'Immaculate multi-speaker switching and slide conforming. EBU audio was broadcast-grade.',
      },
      {
        orderId: 'ORD-CRP-2026-074',
        orderTitle: 'Executive Leadership Interview Series (4 Episodes)',
        category: 'Corporate',
        format: 'Testimonial Video (4 Episodes)',
        assignedCreator: 'Vikram Joshi (Senior Lead)',
        orderDate: '06 Sep 2026',
        deliveryDate: '10 Sep 2026',
        grossAmount: 18000,
        gstAmount: 3240,
        totalAmount: 21240,
        invoiceRef: 'INV-2026-0741',
        orderStatus: 'Completed & Signed Off',
        vaultStatus: 'Released Post-Signoff',
        clientRating: 4.9,
        feedback: 'Subtle b-roll cuts and clean corporate branding. Delivered ahead of schedule.',
      },
      {
        orderId: 'ORD-CRP-2026-103',
        orderTitle: 'Q4 Product Roadmap & Investor Sizzle Reel',
        category: 'Corporate',
        format: 'Event Highlight + Presentation Cut',
        assignedCreator: 'Vikram Joshi (Senior Lead)',
        orderDate: '29 Sep 2026',
        deliveryDate: 'In Production (QC Pass)',
        grossAmount: 15000,
        gstAmount: 2700,
        totalAmount: 17700,
        invoiceRef: 'INV-2026-0922',
        orderStatus: 'In Production Vault (QC Pass)',
        vaultStatus: 'Locked in Production Vault',
        clientRating: 5.0,
        feedback: 'Funds funded in Production Vault; color conformance pass currently under review.',
      },
    ],
  },
  {
    id: 'clt-002',
    displayName: 'Rhea Mehra & Arjun Singhal',
    companyOrCouple: 'The Singhal & Kapoor Celebration',
    email: 'arjun.singhal.wed@gmail.com',
    phone: '+91 98201 88129',
    location: 'Jaipur / Delhi NCR',
    clientType: 'Wedding',
    accountTier: 'Luxury Private Client',
    gstin: 'Unregistered Private Client (B2C)',
    billingAddress: '42 Jor Bagh, New Delhi 110003',
    joinedDate: '14 Feb 2025',
    lifetimeGrossSpend: 248000,
    gstPaid: 44640,
    netPlatformSpend: 203360,
    currentVaultFunded: 23600,
    averageOrderValue: 24800,
    totalOrdersCount: 10,
    completedOrdersCount: 8,
    activeOrdersCount: 2,
    avgSlaMetRate: 98,
    orders: [
      {
        orderId: 'ORD-WED-2026-118',
        orderTitle: 'Royal Palace Udaipur Highlight + Cinematic Teaser',
        category: 'Wedding',
        format: 'Highlight + Teaser + Reel',
        assignedCreator: 'Kabir Verma (Senior Colorist)',
        orderDate: '20 Sep 2026',
        deliveryDate: '28 Sep 2026',
        grossAmount: 10000,
        gstAmount: 1800,
        totalAmount: 11800,
        invoiceRef: 'INV-2026-0881',
        orderStatus: 'Completed & Signed Off',
        vaultStatus: 'Released Post-Signoff',
        clientRating: 5.0,
        feedback: 'The sunset grading and waveform audio dialogue match was extraordinary. Truly grateful!',
      },
      {
        orderId: 'ORD-WED-2026-085',
        orderTitle: 'Sangeet Choreography Multi-Cam Synchronization Cut',
        category: 'Wedding',
        format: 'Multi-Cam Wedding Celebration Cut',
        assignedCreator: 'Kabir Verma (Senior Colorist)',
        orderDate: '01 Sep 2026',
        deliveryDate: '08 Sep 2026',
        grossAmount: 8000,
        gstAmount: 1440,
        totalAmount: 9440,
        invoiceRef: 'INV-2026-0710',
        orderStatus: 'Completed & Signed Off',
        vaultStatus: 'Released Post-Signoff',
        clientRating: 5.0,
        feedback: 'Every family dance move matched the beat perfectly. Great revision turnaround.',
      },
    ],
  },
  {
    id: 'clt-003',
    displayName: 'Pooja Bhatt',
    companyOrCouple: 'Glow Botanics India Pvt. Ltd.',
    email: 'pooja.bhatt@glowbotanics.in',
    phone: '+91 99204 11820',
    location: 'Bengaluru, Karnataka',
    clientType: 'Brand',
    accountTier: 'High-Growth DTC',
    gstin: '29AAGCG1928K1Z5 (Verified)',
    billingAddress: 'Indiranagar 100ft Road, Bengaluru 560038',
    joinedDate: '15 Jan 2025',
    lifetimeGrossSpend: 312000,
    gstPaid: 56160,
    netPlatformSpend: 255840,
    currentVaultFunded: 14160,
    averageOrderValue: 7428,
    totalOrdersCount: 42,
    completedOrdersCount: 40,
    activeOrdersCount: 2,
    avgSlaMetRate: 100,
    orders: [
      {
        orderId: 'ORD-BRD-2026-092',
        orderTitle: 'Ceramide Barrier Serum — 3x Viral Hook Cuts',
        category: 'Brand',
        format: 'Product Video + Variant Social Cuts',
        assignedCreator: 'Aanya Sen (Growth Editor)',
        orderDate: '22 Sep 2026',
        deliveryDate: '26 Sep 2026',
        grossAmount: 6000,
        gstAmount: 1080,
        totalAmount: 7080,
        invoiceRef: 'INV-2026-0904',
        orderStatus: 'Completed & Signed Off',
        vaultStatus: 'Released Post-Signoff',
        clientRating: 5.0,
        feedback: 'Conversion increased substantially. Aanya nailed the pacing and dynamic subtitles.',
      },
      {
        orderId: 'ORD-BRD-2026-068',
        orderTitle: 'Summer Monsoon Skincare Campaign Commercial Master',
        category: 'Brand',
        format: 'Ad Film (Commercial Cut)',
        assignedCreator: 'Aanya Sen (Growth Editor)',
        orderDate: '10 Sep 2026',
        deliveryDate: '15 Sep 2026',
        grossAmount: 10000,
        gstAmount: 1800,
        totalAmount: 11800,
        invoiceRef: 'INV-2026-0812',
        orderStatus: 'Completed & Signed Off',
        vaultStatus: 'Released Post-Signoff',
        clientRating: 4.9,
        feedback: 'Macro droplet speed ramps and color palette were studio quality.',
      },
    ],
  },
  {
    id: 'clt-004',
    displayName: 'Dr. Sameer Kulkarni',
    companyOrCouple: 'Kulkarni Hospital & Healthcare Trust',
    email: 'director@kulkarnihospital.org',
    phone: '+91 94220 99182',
    location: 'Pune, Maharashtra',
    clientType: 'Corporate',
    accountTier: 'Enterprise Retainer',
    gstin: '27AAATK4812L1ZP (Verified)',
    billingAddress: 'Shivajinagar, Pune 411005',
    joinedDate: '20 Dec 2024',
    lifetimeGrossSpend: 184000,
    gstPaid: 33120,
    netPlatformSpend: 150880,
    currentVaultFunded: 0,
    averageOrderValue: 15333,
    totalOrdersCount: 12,
    completedOrdersCount: 12,
    activeOrdersCount: 0,
    avgSlaMetRate: 100,
    orders: [
      {
        orderId: 'ORD-CRP-2026-042',
        orderTitle: 'Cardiology Center of Excellence — Documentary Facility Showcase',
        category: 'Corporate',
        format: 'Corporate Film (Full Keynote)',
        assignedCreator: 'Vikram Joshi (Senior Lead)',
        orderDate: '02 Aug 2026',
        deliveryDate: '09 Aug 2026',
        grossAmount: 15000,
        gstAmount: 2700,
        totalAmount: 17700,
        invoiceRef: 'INV-2026-0622',
        orderStatus: 'Completed & Signed Off',
        vaultStatus: 'Released Post-Signoff',
        clientRating: 5.0,
        feedback: 'Very sensitive, dignified pacing and clean patient interview sound mastering.',
      },
    ],
  },
];

export default function AdminClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ComprehensiveClient[]>(CLIENTS_DATA);
  const [filter, setFilter] = useState<'all' | 'corporate' | 'brand' | 'wedding' | 'top_spenders'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClientId, setExpandedClientId] = useState<string | null>('clt-001');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Metrics calculations
  const totalLifetimeSpend = clients.reduce((sum, c) => sum + c.lifetimeGrossSpend, 0);
  const totalGstPaid = clients.reduce((sum, c) => sum + c.gstPaid, 0);
  const totalVaultFunded = clients.reduce((sum, c) => sum + c.currentVaultFunded, 0);
  const totalOrdersPlaced = clients.reduce((sum, c) => sum + c.totalOrdersCount, 0);

  // Filtered clients list
  const filteredClients = clients
    .filter((c) => {
      if (filter === 'corporate') return c.clientType === 'Corporate';
      if (filter === 'brand') return c.clientType === 'Brand';
      if (filter === 'wedding') return c.clientType === 'Wedding';
      if (filter === 'top_spenders') return c.lifetimeGrossSpend >= 300000;
      return true;
    })
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.displayName.toLowerCase().includes(q) ||
        c.companyOrCouple.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q)
      );
    });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-2xl bg-[#1D1D1F] text-white text-xs font-semibold shadow-2xl border border-white/10 flex items-center gap-3 animate-fade-in max-w-md">
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-[#86868B] hover:text-[#1D1D1F]">
              Dashboard
            </Link>
            <span className="text-xs text-[#86868B]">/</span>
            <span className="text-xs font-bold text-[#1D1D1F]">Client Accounts &amp; Spend</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F] mt-2">
            Client Accounts, Spend &amp; Order Ledgers
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1 max-w-3xl leading-relaxed">
            Complete client directory with lifetime billing volume, 18% Output GST records, active
            Production Vault escrow commitments, and historical format orders.
          </p>
        </div>

        {/* Global Action / Secondary Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/freelancers"
            className="px-4 py-2.5 rounded-xl border border-[#E5E5E7] hover:border-[#1D1D1F] text-[#1D1D1F] text-xs font-semibold transition-all bg-white"
          >
            ← View Freelancer Roster &amp; Payouts
          </Link>
        </div>
      </div>

      {/* High-Level Spend & Billing KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Lifetime Billing Volume */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Total Client Billing Volume
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] mt-1">
            ₹{totalLifetimeSpend.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Across {totalOrdersPlaced} booked orders
          </span>
        </div>

        {/* KPI 2: 18% Output GST Collected */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            18% Output GST Invoiced
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#0071E3] mt-1">
            ₹{totalGstPaid.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#86868B] mt-1 block">
            Tax invoice input credit documented
          </span>
        </div>

        {/* KPI 3: Active Production Vault Escrow */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Active in Production Vault
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
            ₹{totalVaultFunded.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-[#86868B] mt-1 block">
            Client funds secured pending QC
          </span>
        </div>

        {/* KPI 4: Total Verified Client Accounts */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E5E7] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
            Verified Client Accounts
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] mt-1">
            {clients.length} Accounts
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            100% on-time SLA fulfillment
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Segmented Filter Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            All Clients ({clients.length})
          </button>
          <button
            onClick={() => setFilter('corporate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'corporate'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            🏢 Corporate Enterprise ({clients.filter((c) => c.clientType === 'Corporate').length})
          </button>
          <button
            onClick={() => setFilter('brand')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'brand'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            🎬 Brand &amp; DTC ({clients.filter((c) => c.clientType === 'Brand').length})
          </button>
          <button
            onClick={() => setFilter('wedding')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'wedding'
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            💒 Luxury Wedding ({clients.filter((c) => c.clientType === 'Wedding').length})
          </button>
          <button
            onClick={() => setFilter('top_spenders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filter === 'top_spenders'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            ★ Top Spenders (&gt;₹3L)
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search company, client, GSTIN, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-white rounded-xl border border-[#E5E5E7] text-xs focus:outline-hidden focus:border-[#0071E3]"
          />
        </div>
      </div>

      {/* Clients List with In-Depth Financial & Order History */}
      <div className="space-y-6">
        {filteredClients.map((client) => {
          const isExpanded = expandedClientId === client.id;
          const initials = client.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={client.id}
              className={`rounded-3xl border transition-all ${
                isExpanded
                  ? 'border-[#0071E3] bg-white shadow-md'
                  : 'border-[#E5E5E7] bg-white hover:border-[#86868B]/40 shadow-xs'
              }`}
            >
              {/* Main Card Overview */}
              <div className="p-6 sm:p-7 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                      {initials}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-extrabold text-[#1D1D1F]">
                          {client.companyOrCouple}
                        </h2>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                          {client.accountTier}
                        </span>
                        <span className="text-[11px] font-medium text-[#86868B]">
                          ID: <code className="font-mono text-[10px] text-[#1D1D1F]">{client.id}</code>
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-[#1D1D1F]">
                        Primary Contact: <span className="text-[#0071E3]">{client.displayName}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#86868B] pt-0.5">
                        <span>📍 {client.location}</span>
                        <span>•</span>
                        <span>✉ {client.email}</span>
                        <span>•</span>
                        <span>📞 {client.phone}</span>
                        <span>•</span>
                        <span>Client Since: {client.joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Order Volume & SLA Performance Badges */}
                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/60 text-center min-w-[80px]">
                      <span className="text-[10px] font-bold uppercase text-[#86868B] block">Total Orders</span>
                      <div className="text-sm font-black text-[#1D1D1F] mt-0.5">
                        {client.totalOrdersCount} Projects
                      </div>
                    </div>

                    <div className="p-3 bg-[#F5F5F7] rounded-xl border border-[#E5E5E7]/60 text-center min-w-[80px]">
                      <span className="text-[10px] font-bold uppercase text-[#86868B] block">Active In Prod</span>
                      <div className="text-sm font-black text-[#0071E3] mt-0.5">
                        {client.activeOrdersCount} Formats
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center min-w-[80px]">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">SLA Rate</span>
                      <div className="text-sm font-black text-emerald-700 mt-0.5">
                        {client.avgSlaMetRate}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Ledger Summary Cards Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F5F5F7]/80 border border-[#E5E5E7]">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#86868B] block">
                      Lifetime Gross Billing
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#1D1D1F] block mt-0.5">
                      ₹{client.lifetimeGrossSpend.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#0071E3] block">
                      Output GST Paid (18%)
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#0071E3] block mt-0.5">
                      ₹{client.gstPaid.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#86868B] block">
                      Net Platform Billing (ex-GST)
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[#1D1D1F] block mt-0.5">
                      ₹{client.netPlatformSpend.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-600 block">
                      Active Vault Balance
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-600 block mt-0.5">
                      ₹{client.currentVaultFunded.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Statutory Invoicing Credentials */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#86868B] uppercase">GSTIN:</span>
                    <code className="font-mono font-bold text-[#1D1D1F] bg-[#F5F5F7] px-2 py-0.5 rounded border border-[#E5E5E7]">
                      {client.gstin}
                    </code>
                  </div>

                  <div className="text-[11px] text-[#86868B] max-w-xl truncate">
                    <span className="font-semibold text-[#1D1D1F]">Billing Address: </span>
                    {client.billingAddress}
                  </div>
                </div>

                {/* Toggle Drawer Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F7]">
                  <button
                    type="button"
                    onClick={() => setExpandedClientId(isExpanded ? null : client.id)}
                    className="px-4 py-2 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>
                      {isExpanded
                        ? '▲ Hide Detailed Order & Spend History'
                        : `▼ View Detailed Order & Spend History (${client.orders.length} Logged Orders)`}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showToast(`✓ Statement for ${client.companyOrCouple} exported successfully.`)}
                      className="px-3.5 py-2 rounded-xl border border-[#E5E5E7] hover:border-[#1D1D1F] text-[#1D1D1F] text-xs font-semibold transition-all cursor-pointer bg-white"
                    >
                      Export Tax Statement
                    </button>
                    <a
                      href={`mailto:${client.email}`}
                      className="px-3.5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Contact Client
                    </a>
                  </div>
                </div>
              </div>

              {/* EXPANDABLE IN-DEPTH ORDER & SPEND HISTORY TABLE */}
              {isExpanded && (
                <div className="bg-[#FAF9F6]/60 border-t border-[#E5E5E7] p-6 sm:p-7 space-y-4 rounded-b-3xl">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-[#1D1D1F]">
                        Complete Project Orders &amp; Tax Invoice Ledger
                      </h3>
                      <p className="text-[11px] text-[#86868B] mt-0.5">
                        Track every production format commissioned by {client.companyOrCouple}, assigned
                        supervising freelancer, 18% embedded GST invoice reference, and milestone
                        Production Vault escrow status.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white border border-[#E5E5E7] text-[#1D1D1F]">
                      AOV: ₹{client.averageOrderValue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[#E5E5E7] rounded-2xl bg-white overflow-hidden">
                      <thead className="bg-[#F5F5F7] text-[#86868B] font-bold uppercase text-[10px] border-b border-[#E5E5E7]">
                        <tr>
                          <th className="py-3 px-4">Order &amp; Deliverables</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Assigned Creator</th>
                          <th className="py-3 px-3">Delivery Date</th>
                          <th className="py-3 px-3 text-right">Base Amount</th>
                          <th className="py-3 px-3 text-right">GST (18%)</th>
                          <th className="py-3 px-3 text-right">Total Invoiced</th>
                          <th className="py-3 px-4">Production Vault / Signoff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F7]">
                        {client.orders.map((ord) => (
                          <tr key={ord.orderId} className="hover:bg-[#F5F5F7]/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#1D1D1F]">
                              <div className="font-bold">{ord.orderTitle}</div>
                              <span className="text-[11px] text-[#86868B] font-normal block mt-0.5">
                                Format: {ord.format} • <span className="font-mono text-[10px]">{ord.orderId}</span>
                              </span>
                              {ord.feedback && (
                                <p className="text-[10px] text-[#86868B] italic mt-1 bg-amber-50/60 p-1.5 rounded border border-amber-100/60 max-w-sm">
                                  &ldquo;{ord.feedback}&rdquo; — ★ {ord.clientRating}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F5F7] text-[#1D1D1F]">
                                {ord.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-[#1D1D1F] font-medium">{ord.assignedCreator}</td>
                            <td className="py-3.5 px-3 text-[#86868B] whitespace-nowrap">{ord.deliveryDate}</td>
                            <td className="py-3.5 px-3 text-right font-mono text-[#86868B]">
                              ₹{ord.grossAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-[#0071E3]">
                              + ₹{ord.gstAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-black text-[#1D1D1F]">
                              ₹{ord.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ord.vaultStatus.includes('Released')
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {ord.vaultStatus}
                              </span>
                              <span className="block font-mono text-[10px] text-[#86868B] mt-0.5">
                                Invoice: {ord.invoiceRef}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
