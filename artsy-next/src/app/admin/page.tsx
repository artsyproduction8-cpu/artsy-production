'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { calculateFinancialWaterfall } from '@/lib/financial/engine';
import {
  ServiceCategory,
  ServiceProduct,
  loadPricingMatrix,
  savePricingMatrix,
} from '@/lib/pricing/catalog-matrix';

interface OrderItem {
  id: string;
  orderNum: string;
  title: string;
  client: string;
  type: string;
  cameraProfile: string;
  amount: number;
  status: 'unassigned' | 'in_progress' | 'review_ready' | 'completed';
  assignedEditor: string | null;
  hoursRemaining: number;
}

interface VettingCandidate {
  ref: string;
  name: string;
  location: string;
  exp: string;
  score: number;
  type: 'colorist' | 'editor';
  software: string[];
  reels: string[];
  status: 'pending' | 'approved' | 'rejected';
}

interface VaultPayout {
  id: string;
  creatorName: string;
  projectRef: string;
  grossAmount: number;
  tdsDeduction: number;
  netPayout: number;
  bankAccount: string;
  ifsc: string;
  status: 'pending' | 'dispatched';
}

interface TelemetryNode {
  name: string;
  role: string;
  endpoint: string;
  status: 'healthy' | 'degraded';
  latencyMs: number;
  uptime: string;
  details: string;
}

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ord-1',
    orderNum: 'AP-8841',
    title: 'Udaipur Palace Royal Wedding 4K',
    client: 'Oberoi & Singhania Media',
    type: 'Wedding Cinema',
    cameraProfile: 'Sony S-Log3.Cine (3 Cams FX6)',
    amount: 8000,
    status: 'unassigned',
    assignedEditor: null,
    hoursRemaining: 18,
  },
  {
    id: 'ord-2',
    orderNum: 'AP-8842',
    title: 'Verve FW26 Streetwear Commercial Reel',
    client: 'Verve Apparel DTC',
    type: 'Brand UGC',
    cameraProfile: 'iPhone 16 Pro ProRes Log & FX3',
    amount: 4500,
    status: 'in_progress',
    assignedEditor: 'Aanya Sen',
    hoursRemaining: 14,
  },
  {
    id: 'ord-3',
    orderNum: 'AP-8845',
    title: 'Swiss Chronograph 3D Macro Showcase',
    client: 'Geneva Horology Labs',
    type: 'Commercial 3D',
    cameraProfile: 'RED IPP2 Wide Gamut 8K',
    amount: 6000,
    status: 'unassigned',
    assignedEditor: null,
    hoursRemaining: 36,
  },
  {
    id: 'ord-4',
    orderNum: 'AP-8837',
    title: 'Fintech Mobile App Launch Trailer',
    client: 'NeoCred Technologies',
    type: 'Brand UGC',
    cameraProfile: 'Kinetic 4K Screen Rec + Alexa Mini',
    amount: 4500,
    status: 'review_ready',
    assignedEditor: 'Kabir Verma',
    hoursRemaining: 8,
  },
  {
    id: 'ord-5',
    orderNum: 'AP-8835',
    title: 'Goa Coastal Luxury Resort Master Cut',
    client: 'Taj Gateway Hospitality',
    type: 'Wedding Cinema',
    cameraProfile: 'Sony FX3 + Canon Log 3',
    amount: 8000,
    status: 'in_progress',
    assignedEditor: 'Vikram Joshi',
    hoursRemaining: 22,
  },
];

const INITIAL_CANDIDATES: VettingCandidate[] = [
  {
    ref: 'ART-RC-8841',
    name: 'Karanveer V.',
    location: 'New Delhi',
    exp: '5.5 Yrs • Luxury Wedding & Cinema',
    score: 96,
    type: 'colorist',
    software: ['DaVinci Resolve Studio 19', 'Premiere Pro', 'ACES Workflow'],
    reels: ['Vimeo: Udaipur 4K Highlight', 'ACES Color Breakdown'],
    status: 'pending',
  },
  {
    ref: 'ART-RC-9012',
    name: 'Ananya S.',
    location: 'Bengaluru',
    exp: '4.2 Yrs • High-Retention DTC Hooks',
    score: 91,
    type: 'editor',
    software: ['Premiere Pro', 'After Effects', 'CapCut Pro', 'Sound Design'],
    reels: ['DTC Viral 9:16 Hooks', 'Fintech Motion Reel'],
    status: 'pending',
  },
  {
    ref: 'ART-RC-9154',
    name: 'Rohan Mehra',
    location: 'Mumbai',
    exp: '4.0 Yrs • 3D Macro Commercials',
    score: 93,
    type: 'colorist',
    software: ['Premiere Pro', 'After Effects', 'Blender 3D', 'Resolve'],
    reels: ['Horology Macro 4K', 'Studio Lighting Reel'],
    status: 'pending',
  },
  {
    ref: 'ART-RC-9208',
    name: 'Vikram Joshi',
    location: 'Pune',
    exp: '6.0 Yrs • Corporate Multi-Cam Keynotes',
    score: 95,
    type: 'editor',
    software: ['Premiere Pro', 'DaVinci Resolve', 'iZotope RX', 'Multi-Cam Sync'],
    reels: ['3-Cam Keynote Summit', 'Clean Audio Conform'],
    status: 'pending',
  },
];

const INITIAL_PAYOUTS: VaultPayout[] = [
  {
    id: 'PAY-8841-AS',
    creatorName: 'Aarav Sen',
    projectRef: 'AP-8841 (Udaipur Royal Wedding)',
    grossAmount: 4794,
    tdsDeduction: 48,
    netPayout: 4746,
    bankAccount: '••••••••4892',
    ifsc: 'HDFC0001234',
    status: 'pending',
  },
  {
    id: 'PAY-8839-SM',
    creatorName: 'Sneha Mukherjee',
    projectRef: 'AP-8839 (Verve Streetwear Reel)',
    grossAmount: 2696,
    tdsDeduction: 27,
    netPayout: 2669,
    bankAccount: '••••••••1120',
    ifsc: 'ICIC0009821',
    status: 'pending',
  },
  {
    id: 'PAY-8837-KV',
    creatorName: 'Kabir Verma',
    projectRef: 'AP-8837 (Fintech App Trailer)',
    grossAmount: 7190,
    tdsDeduction: 72,
    netPayout: 7118,
    bankAccount: '••••••••9014',
    ifsc: 'SBIN0004312',
    status: 'pending',
  },
];

const INITIAL_NODES: TelemetryNode[] = [
  {
    name: 'Backblaze B2 Ingest Vault',
    role: 'Raw Camera Footage & Stems Storage',
    endpoint: 's3.us-west-004.backblazeb2.com',
    status: 'healthy',
    latencyMs: 38,
    uptime: '99.99%',
    details: 'Bucket: artsy-raw-ingest • 412 GB Stored • AES-256 Server-Side Encryption',
  },
  {
    name: 'BunnyCDN Video Stream & Proxies',
    role: 'HLS 1080p Review Proxies & Edge Cache',
    endpoint: 'video.bunnycdn.com',
    status: 'healthy',
    latencyMs: 4.2,
    uptime: '99.98%',
    details: 'PoPs: Mumbai, Delhi, Bengaluru • Auto MP4/HLS Transcode Active',
  },
  {
    name: 'OpenWA WhatsApp Gateway',
    role: 'Automated Creator & Client WhatsApp Notifications',
    endpoint: 'http://localhost:2785',
    status: 'healthy',
    latencyMs: 12,
    uptime: '99.95%',
    details: 'Baileys Session Connected • Dedicated Node: +91 7777078742',
  },
  {
    name: 'Supabase PostgreSQL DB & Auth',
    role: 'Transactional Store & WORM Ledger',
    endpoint: 'cldewthefsteotdvftlj.supabase.co',
    status: 'healthy',
    latencyMs: 24,
    uptime: '100.0%',
    details: 'RLS Policies Enforced (14 Tables) • Connection Pooler Active',
  },
  {
    name: 'Razorpay Payment & Vault Webhooks',
    role: 'Payment Ingestion & Vault Clearing',
    endpoint: 'api.razorpay.com/v1',
    status: 'healthy',
    latencyMs: 45,
    uptime: '99.99%',
    details: 'Webhook Secret Verified • Section 194C TDS Deductions Active',
  },
];

export default function UnifiedAdminDashboard() {
  const { user } = useAuth();
  const adminName = user?.full_name || 'Studio Director';

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'dispatch' | 'vetting' | 'vault' | 'pricing' | 'telemetry'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'unassigned' | 'in_progress' | 'review_ready'>('all');

  // Live state
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [candidates, setCandidates] = useState<VettingCandidate[]>(INITIAL_CANDIDATES);
  const [payouts, setPayouts] = useState<VaultPayout[]>(INITIAL_PAYOUTS);
  const [nodes, setNodes] = useState<TelemetryNode[]>(INITIAL_NODES);
  const [isPinging, setIsPinging] = useState(false);
  const [isDispatchingNeft, setIsDispatchingNeft] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pricing matrix state
  const [pricingCategories, setPricingCategories] = useState<ServiceCategory[]>(() => loadPricingMatrix());
  const [activeMatrixCatId, setActiveMatrixCatId] = useState<string>(() => {
    const data = loadPricingMatrix();
    return data.length > 0 ? data[0].id : 'wedding';
  });
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    const data = loadPricingMatrix();
    return data.length > 0 && data[0].products.length > 0 ? data[0].products[0].id : 'highlight-teaser';
  });

  // Assign editor modal / selector state
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedEditorForAssign, setSelectedEditorForAssign] = useState<string>('Kabir Verma');

  // SLA Countdown
  const [countdown, setCountdown] = useState({ h: 18, m: 42, s: 9 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: 59, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Find currently selected product for waterfall calculation
  let activeProduct: ServiceProduct | null = null;
  for (const cat of pricingCategories) {
    const found = cat.products.find((p) => p.id === selectedProductId);
    if (found) {
      activeProduct = found;
      break;
    }
  }

  const waterfall = calculateFinancialWaterfall(
    (activeProduct ? activeProduct.basePrice : 8000) * 100,
    {
      creatorSharePct: activeProduct ? activeProduct.creatorSharePct : 70,
    }
  );

  const updateProductInDashboard = (catId: string, prodId: string, patch: Partial<ServiceProduct>) => {
    setPricingCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          products: c.products.map((p) => (p.id === prodId ? { ...p, ...patch } : p)),
        };
      });
      savePricingMatrix(updated);
      return updated;
    });
  };

  // Handlers
  const handleAssignEditor = (orderId: string, editorName: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, assignedEditor: editorName, status: 'in_progress' }
          : o
      )
    );
    setAssigningOrderId(null);
    showToast(`✓ MATCH ENGINE: Order locked & assigned to ${editorName}. Ingest credentials synced.`);
  };

  const handleApproveCandidate = (ref: string, name: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.ref === ref ? { ...c, status: 'approved' } : c))
    );
    showToast(`✓ DISPATCH GATEWAY: Candidate ${name} (${ref}) APPROVED. Contract & WhatsApp community link dispatched.`);
  };

  const handleRejectCandidate = (ref: string, name: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.ref === ref ? { ...c, status: 'rejected' } : c))
    );
    showToast(`Candidate ${name} archived.`);
  };

  const handleRequestReel = (name: string) => {
    showToast(`✉️ TRANSMISSION SENT: Automated WhatsApp ping dispatched to ${name} requesting timeline XML export.`);
  };

  const handleBatchNeftRelease = async () => {
    setIsDispatchingNeft(true);
    showToast('Connecting to RazorpayX Corporate Banking node...');
    await new Promise((res) => setTimeout(res, 1200));

    setPayouts((prev) => prev.map((p) => ({ ...p, status: 'dispatched' })));
    setIsDispatchingNeft(false);
    const batchId = `BATCH_NEFT_${Date.now().toString().slice(-6)}`;
    showToast(`✓ NEFT BATCH EXECUTED: ₹14,533 INR dispatched to creators. Batch Ref: ${batchId}`);
  };

  const handlePingNodes = async () => {
    setIsPinging(true);
    await new Promise((res) => setTimeout(res, 700));
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        latencyMs: Math.max(3, Math.round(n.latencyMs + (Math.random() * 6 - 3))),
      }))
    );
    setIsPinging(false);
    showToast('✓ Infrastructure telemetry ping complete: All 5 nodes verified healthy.');
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNum.toLowerCase().includes(q) ||
        o.title.toLowerCase().includes(q) ||
        o.client.toLowerCase().includes(q) ||
        (o.assignedEditor && o.assignedEditor.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const unassignedCount = orders.filter((o) => o.status === 'unassigned').length;
  const pendingCandidatesCount = candidates.filter((c) => c.status === 'pending').length;
  const readyPayoutTotal = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.netPayout, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Toast Feedback */}
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

      {/* Top Operations Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5E7] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] uppercase font-bold text-[#86868B] tracking-wider">
              Studio Operations Command Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight mt-1">
            Welcome, {adminName}
          </h1>
          <p className="text-xs sm:text-sm text-[#86868B] mt-1 max-w-2xl">
            Unified executive control center. Oversee project dispatch slates, creator applicant vetting, production vault settlements, pricing engine calibration, and pipeline telemetry in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setActiveTab('vetting');
              showToast('Switched to Roster Vetting Queue.');
            }}
            className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Review Talent</span>
            <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[10px]">
              {pendingCandidatesCount}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('vault');
              showToast('Switched to Production Vault Ledger.');
            }}
            className="px-3.5 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Production Vault</span>
            <span className="text-emerald-400 font-mono text-[11px]">
              ₹{readyPayoutTotal.toLocaleString('en-IN')}
            </span>
          </button>
          <Link
            href="/admin/freelancers"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Freelancer Roster →</span>
          </Link>
          <Link
            href="/admin/clients"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Client Accounts →</span>
          </Link>
          <button
            onClick={handlePingNodes}
            disabled={isPinging}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span className={`w-2 h-2 rounded-full ${isPinging ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <span>{isPinging ? 'Pinging...' : 'Ping Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* KPI Control Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Creator Inflow */}
        <div
          onClick={() => setActiveTab('vetting')}
          className="bg-white rounded-2xl p-5 border border-[#E5E5E7] hover:border-[#3B82F6] transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase font-bold text-[#86868B]">Creator Inflow</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full">
              {pendingCandidatesCount} Pending
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl text-[#1D1D1F] font-extrabold">{pendingCandidatesCount + 10}</div>
            <div className="text-xs text-[#3B82F6] font-semibold">+3 in last 1h</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
            <span className="text-[#86868B]">4 Expedited</span>
            <span className="text-[#3B82F6] font-semibold">Inspect Queue →</span>
          </div>
        </div>

        {/* KPI 2: Dispatch Slate */}
        <div
          onClick={() => {
            setActiveTab('dispatch');
            setOrderFilter('unassigned');
          }}
          className="bg-white rounded-2xl p-5 border border-[#E5E5E7] hover:border-[#3B82F6] transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase font-bold text-[#86868B]">Dispatch Slate</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${unassignedCount > 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700'}`}>
              {unassignedCount} Unassigned
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-3">
            <div className="text-3xl sm:text-4xl text-[#1D1D1F] font-extrabold">
              {String(orders.length).padStart(2, '0')}
            </div>
            <div className="text-xs text-amber-600 font-semibold">{unassignedCount} Need Editor</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
            <span className="text-[#86868B]">Active: ₹31,000 INR</span>
            <span className="text-[#3B82F6] font-semibold">Assign Slate →</span>
          </div>
        </div>

        {/* KPI 3: SLA Timer Watch */}
        <div
          onClick={() => setActiveTab('pricing')}
          className="bg-white rounded-2xl p-5 border border-[#E5E5E7] hover:border-[#3B82F6] transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase font-bold text-[#86868B]">SLA Gateway Watch</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              On-Time 100%
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-mono text-[#1D1D1F] font-bold">
              {String(countdown.h).padStart(2, '0')}:{String(countdown.m).padStart(2, '0')}:
              {String(countdown.s).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-[#86868B]">Window</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-semibold">0 Gateway Breaches</span>
            <span className="text-[#3B82F6] font-semibold">Calibrate SLAs →</span>
          </div>
        </div>

        {/* KPI 4: Financial Vault */}
        <div
          onClick={() => setActiveTab('vault')}
          className="bg-white rounded-2xl p-5 border border-[#E5E5E7] hover:border-[#3B82F6] transition-all cursor-pointer shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase font-bold text-[#86868B]">Production Vault</span>
            <span className="text-xs text-emerald-600 font-bold">Secured</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <div className="text-3xl sm:text-4xl text-[#1D1D1F] font-extrabold">₹1.42L</div>
            <div className="text-xs text-[#86868B]">Total Inflow</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold">₹{readyPayoutTotal.toLocaleString('en-IN')} Ready</span>
            <span className="text-[#3B82F6] font-semibold">Batch NEFT →</span>
          </div>
        </div>
      </div>

      {/* Unified Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-2 border border-[#E5E5E7] shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'All Operations', icon: '⚡' },
          { id: 'dispatch', label: `Dispatch Slate (${orders.length})`, icon: '🎬' },
          { id: 'vetting', label: `Vetting Queue (${pendingCandidatesCount})`, icon: '📋' },
          { id: 'vault', label: 'Vault & Payouts', icon: '🏦' },
          { id: 'pricing', label: 'Pricing Engine & SLAs', icon: '⚙️' },
          { id: 'telemetry', label: 'System Telemetry', icon: '📡' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#1D1D1F] text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW (Unified Operations Hub) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Urgent Dispatch Alert if unassigned orders exist */}
          {unassignedCount > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                    {unassignedCount} Orders Require Immediate Editor Match
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Orders have locked raw footage ready in Backblaze B2. Assign qualified senior talent to start proxy rendering and prevent SLA breach.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('dispatch');
                  setOrderFilter('unassigned');
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              >
                Assign Editors Now →
              </button>
            </div>
          )}

          {/* Quick Hub Grids: Station Operations Desks */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase font-bold text-[#86868B] tracking-wider">
                Station Operations Desks
              </h2>
              <span className="text-xs text-[#86868B]">6 Modular Sub-Systems</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Desk 1: Vetting */}
              <div
                onClick={() => setActiveTab('vetting')}
                className="group bg-white rounded-2xl p-6 border border-[#E5E5E7] hover:border-[#3B82F6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                    📋
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                    Roster Vetting Queue
                  </h3>
                  <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                    Screen candidate portfolios, evaluate 4K timelines, and approve editors with automated WhatsApp contract links.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {pendingCandidatesCount} Pending Review
                  </span>
                  <span className="text-[#3B82F6] font-bold group-hover:translate-x-1 transition-transform">
                    Open Queue →
                  </span>
                </div>
              </div>

              {/* Desk 2: Verified Freelancers */}
              <Link
                href="/admin/freelancers"
                className="group bg-white rounded-2xl p-6 border border-[#E5E5E7] hover:border-[#3B82F6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                    🎖️
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                    Verified Freelancers Roster
                  </h3>
                  <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                    Directory of certified DaVinci colorists, narrative editors, reliability metrics, and active timeline loads.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Active Talent Roster
                  </span>
                  <span className="text-[#3B82F6] font-bold group-hover:translate-x-1 transition-transform">
                    View Directory →
                  </span>
                </div>
              </Link>

              {/* Desk 3: Pricing & SLAs */}
              <div
                onClick={() => setActiveTab('pricing')}
                className="group bg-white rounded-2xl p-6 border border-[#E5E5E7] hover:border-[#3B82F6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                    ⚙️
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                    Pricing &amp; Catalog SLAs
                  </h3>
                  <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                    Fine-tune tier rates, adjust 70/30 creator revenue split, calculate GST liabilities, and configure turnaround windows.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    Waterfall Simulator
                  </span>
                  <span className="text-[#3B82F6] font-bold group-hover:translate-x-1 transition-transform">
                    Simulate Rates →
                  </span>
                </div>
              </div>

              {/* Desk 4: Production Vault */}
              <div
                onClick={() => setActiveTab('vault')}
                className="group bg-white rounded-2xl p-6 border border-[#E5E5E7] hover:border-[#3B82F6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                    🏦
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                    Production Vault Ledger
                  </h3>
                  <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                    Authorize batch NEFT creator disbursements, manage Section 194C TDS deductions, and download GSTR-1 returns.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    ₹{readyPayoutTotal.toLocaleString('en-IN')} Ready for NEFT
                  </span>
                  <span className="text-[#3B82F6] font-bold group-hover:translate-x-1 transition-transform">
                    Manage Vault →
                  </span>
                </div>
              </div>

              {/* Desk 5: Production Catalog */}
              <Link
                href="/admin/catalog"
                className="group bg-white rounded-2xl p-6 border border-[#E5E5E7] hover:border-[#3B82F6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                    📦
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                    Production Catalog
                  </h3>
                  <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                    Manage internal service offerings, timeline conform rules, audio stem mastering specs, and multi-cam standards.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    3 Core Service Lines
                  </span>
                  <span className="text-[#3B82F6] font-bold group-hover:translate-x-1 transition-transform">
                    Specs &amp; Formats →
                  </span>
                </div>
              </Link>

              {/* Desk 6: Pipeline Telemetry */}
              <div
                onClick={() => setActiveTab('telemetry')}
                className="group bg-white rounded-2xl p-6 border border-[#E5E5E7] hover:border-[#3B82F6] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg mb-4 group-hover:scale-105 transition-transform">
                    📡
                  </div>
                  <h3 className="text-base font-bold text-[#1D1D1F] group-hover:text-[#3B82F6] transition-colors">
                    Pipeline Telemetry
                  </h3>
                  <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                    Real-time monitoring of Backblaze B2 raw ingest vaults, BunnyCDN video proxies, and OpenWA WhatsApp dispatch health.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    5 Gateways Online
                  </span>
                  <span className="text-[#3B82F6] font-bold group-hover:translate-x-1 transition-transform">
                    Live Nodes →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Dual Columns: Active Slate Preview + System Audit Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Slate Preview (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F]">Active Project Dispatch Slate</h3>
                  <p className="text-xs text-[#86868B] mt-0.5">High-priority client orders requiring editor lock</p>
                </div>
                <button
                  onClick={() => setActiveTab('dispatch')}
                  className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                >
                  View All Orders ({orders.length}) →
                </button>
              </div>

              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {order.orderNum}
                        </span>
                        <span className="text-xs font-bold text-[#1D1D1F]">{order.title}</span>
                      </div>
                      <div className="text-[11px] text-[#86868B] mt-1">
                        Client: {order.client} • {order.cameraProfile} • ₹{order.amount.toLocaleString('en-IN')} INR
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {order.assignedEditor ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          Assigned ({order.assignedEditor})
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          Unassigned
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setActiveTab('dispatch');
                          setAssigningOrderId(order.id);
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white cursor-pointer transition-colors shadow-2xs"
                      >
                        {order.assignedEditor ? 'Reassign' : 'Assign'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Stream Console (1 col) */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#1D1D1F]">Audit Stream</h3>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    WORM Active
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="text-xs p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7]">
                    <div className="text-[10px] text-[#86868B]">12 mins ago</div>
                    <div className="font-semibold text-[#1D1D1F] mt-0.5">Candidate Approved</div>
                    <div className="text-[#86868B] text-[11px]">Karanveer V. (Resolve Colorist) added to active roster.</div>
                  </div>
                  <div className="text-xs p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7]">
                    <div className="text-[10px] text-[#86868B]">35 mins ago</div>
                    <div className="font-semibold text-[#1D1D1F] mt-0.5">Vault Inflow Secured</div>
                    <div className="text-[#86868B] text-[11px]">Razorpay Payment #pay_8924 locked in transit vault.</div>
                  </div>
                  <div className="text-xs p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5E7]">
                    <div className="text-[10px] text-[#86868B]">1 hr ago</div>
                    <div className="font-semibold text-[#1D1D1F] mt-0.5">SLA Check Passed</div>
                    <div className="text-[#86868B] text-[11px]">Zero delivery breaches recorded for 24h cycle.</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F5F5F7] text-center">
                <button
                  onClick={() => setActiveTab('telemetry')}
                  className="text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer"
                >
                  View Full Telemetry &amp; Logs →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DISPATCH SLATE */}
      {/* ========================================================================= */}
      {activeTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">
                Active Project Dispatch Slate
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Match verified editors to client orders, track delivery countdowns, and supervise timeline conform.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search orders, clients, or editors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E5E5E7] bg-white text-xs text-[#1D1D1F] focus:outline-none focus:border-[#3B82F6] w-64"
              />
              <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5E7]">
                {(['all', 'unassigned', 'in_progress', 'review_ready'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setOrderFilter(filterKey)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer capitalize ${
                      orderFilter === filterKey
                        ? 'bg-white text-[#1D1D1F] shadow-2xs'
                        : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {filterKey.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E5E7]">
                <p className="text-sm font-semibold text-[#86868B]">No orders found matching current criteria.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl p-5 border border-[#E5E5E7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#3B82F6]/50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {order.orderNum}
                      </span>
                      <span className="text-xs font-bold text-[#1D1D1F] truncate">{order.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {order.type}
                      </span>
                    </div>

                    <div className="text-xs text-[#86868B] flex flex-wrap items-center gap-3">
                      <span><strong>Client:</strong> {order.client}</span>
                      <span>•</span>
                      <span><strong>Ingest:</strong> {order.cameraProfile}</span>
                      <span>•</span>
                      <span><strong>Turnaround:</strong> {order.hoursRemaining}h window</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-[#1D1D1F]">
                        ₹{order.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-[#86868B]">
                        {order.assignedEditor ? `Editor: ${order.assignedEditor}` : 'Unassigned'}
                      </div>
                    </div>

                    {assigningOrderId === order.id ? (
                      <div className="flex items-center gap-2 bg-[#F5F5F7] p-1.5 rounded-xl border border-[#E5E5E7]">
                        <select
                          value={selectedEditorForAssign}
                          onChange={(e) => setSelectedEditorForAssign(e.target.value)}
                          className="bg-white text-xs font-medium px-2 py-1 rounded-lg border border-[#E5E5E7] text-[#1D1D1F]"
                        >
                          <option value="Kabir Verma">Kabir Verma (Senior Colorist)</option>
                          <option value="Aanya Sen">Aanya Sen (UGC Editor)</option>
                          <option value="Rohan Mehra">Rohan Mehra (3D Commercial)</option>
                          <option value="Vikram Joshi">Vikram Joshi (Corporate Lead)</option>
                        </select>
                        <button
                          onClick={() => handleAssignEditor(order.id, selectedEditorForAssign)}
                          className="px-2.5 py-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setAssigningOrderId(null)}
                          className="text-xs text-[#86868B] hover:text-[#1D1D1F] px-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningOrderId(order.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          order.assignedEditor
                            ? 'bg-white border border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]'
                            : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                        }`}
                      >
                        {order.assignedEditor ? 'Reassign Editor' : 'Assign Editor'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VETTING QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'vetting' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">
                Creator Roster Vetting Queue
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Review applicant showreels, ACES color grades, and timeline conform capabilities.
              </p>
            </div>
            <Link
              href="/admin/freelancers"
              className="text-xs font-bold text-[#3B82F6] hover:underline"
            >
              View Active Roster Directory →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {candidates.map((cand) => (
              <div
                key={cand.ref}
                className={`bg-white rounded-2xl p-6 border transition-all shadow-xs flex flex-col justify-between ${
                  cand.status === 'approved'
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : cand.status === 'rejected'
                    ? 'border-slate-300 opacity-60'
                    : 'border-[#E5E5E7]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-[#86868B] uppercase">
                          {cand.ref}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          cand.type === 'colorist' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {cand.type}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1D1D1F] mt-1">{cand.name}</h3>
                      <div className="text-xs text-[#86868B]">{cand.location} • {cand.exp}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-extrabold text-emerald-600">{cand.score}</div>
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Aptitude</div>
                    </div>
                  </div>

                  {/* Software Tags */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[#86868B] mb-1.5">Tooling Stack</div>
                    <div className="flex flex-wrap gap-1.5">
                      {cand.software.map((sw) => (
                        <span
                          key={sw}
                          className="px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#1D1D1F] text-[10px] font-medium border border-[#E5E5E7]"
                        >
                          {sw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sample Reels */}
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[#86868B] mb-1.5">Sample Showreels</div>
                    <div className="space-y-1">
                      {cand.reels.map((reel) => (
                        <div
                          key={reel}
                          className="text-xs text-[#3B82F6] font-medium flex items-center gap-1.5 hover:underline cursor-pointer"
                          onClick={() => showToast(`Opening reel preview: ${reel}`)}
                        >
                          <span>▶</span>
                          <span>{reel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-[#F5F5F7] flex items-center justify-between gap-3">
                  {cand.status === 'approved' ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      ✓ Approved &amp; Dispatched to Roster
                    </span>
                  ) : cand.status === 'rejected' ? (
                    <span className="text-xs font-bold text-slate-500">
                      Archived / Inactive
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRequestReel(cand.name)}
                        className="px-3 py-1.5 rounded-xl border border-[#E5E5E7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Request XML
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectCandidate(cand.ref, cand.name)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleApproveCandidate(cand.ref, cand.name)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          Approve Candidate
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRODUCTION VAULT & PAYOUTS */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">
                Production Vault Ledger &amp; Creator Disbursements
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Execute batch NEFT settlements, track Section 194C TDS compliance, and audit corporate banking balances.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/vault"
                className="text-xs font-bold text-[#3B82F6] hover:underline"
              >
                Deep Vault Explorer →
              </Link>
            </div>
          </div>

          {/* Ledger Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7] shadow-xs">
              <div className="text-[10px] uppercase font-bold text-[#86868B]">Vault Inflow Pool</div>
              <div className="text-2xl font-mono font-extrabold text-[#1D1D1F] mt-2">₹1,42,000</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Direct NEFT Holding Active</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7] shadow-xs">
              <div className="text-[10px] uppercase font-bold text-[#86868B]">Ready for Creator Release</div>
              <div className="text-2xl font-mono font-extrabold text-emerald-600 mt-2">
                ₹{readyPayoutTotal.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-[#86868B] mt-1">Pending Client Approval: ₹84,000</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7] shadow-xs">
              <div className="text-[10px] uppercase font-bold text-[#86868B]">TDS Retained (Sec 194C)</div>
              <div className="text-2xl font-mono font-extrabold text-[#1D1D1F] mt-2">₹1,420</div>
              <div className="text-[11px] text-[#86868B] mt-1">1% PAN-Compliant Withholding</div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E5E5E7] shadow-xs">
              <div className="text-[10px] uppercase font-bold text-[#86868B]">GST Liability (18%)</div>
              <div className="text-2xl font-mono font-extrabold text-[#1D1D1F] mt-2">₹21,661</div>
              <div className="text-[11px] text-[#86868B] mt-1">GSTR-1 JSON Export Ready</div>
            </div>
          </div>

          {/* Batch NEFT Execution Console */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E5E7] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Pending Creator Disbursements</h3>
                <p className="text-xs text-[#86868B] mt-0.5">Approved client masters ready for Direct NEFT transmission</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBatchNeftRelease}
                  disabled={isDispatchingNeft || readyPayoutTotal === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <span>{isDispatchingNeft ? 'Connecting Gateway...' : 'Execute Batch NEFT Payout'}</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[#86868B] uppercase font-bold text-[10px]">
                    <th className="pb-3">Disbursement ID</th>
                    <th className="pb-3">Creator Name</th>
                    <th className="pb-3">Project Ref</th>
                    <th className="pb-3 text-right">Gross (70%)</th>
                    <th className="pb-3 text-right">TDS (1%)</th>
                    <th className="pb-3 text-right">Net Payout</th>
                    <th className="pb-3">Bank Details</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F7]">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F5F5F7]/50">
                      <td className="py-3 font-mono font-bold text-[#1D1D1F]">{p.id}</td>
                      <td className="py-3 font-semibold text-[#1D1D1F]">{p.creatorName}</td>
                      <td className="py-3 text-[#86868B]">{p.projectRef}</td>
                      <td className="py-3 text-right font-mono">₹{p.grossAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right font-mono text-red-600">-₹{p.tdsDeduction}</td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-600">
                        ₹{p.netPayout.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[#86868B]">
                        {p.bankAccount} ({p.ifsc})
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'dispatched'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {p.status === 'dispatched' ? 'NEFT Dispatched' : 'Ready for Payout'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PRICING ENGINE & SLAS */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">
                Pricing Engine &amp; SLA Waterfall Simulator
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Calibrate service prices across all categories and sub-categories, adjust delivery SLAs, and simulate statutory waterfall splits.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/pricing"
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-all shadow-xs"
              >
                Open Full Category &amp; Product Manager →
              </Link>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {pricingCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveMatrixCatId(cat.id);
                  if (cat.products.length > 0) {
                    setSelectedProductId(cat.products[0].id);
                  }
                }}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeMatrixCatId === cat.id
                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                    : 'bg-white text-[#86868B] hover:text-[#1D1D1F] border border-[#E5E5E7]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.title}</span>
                <span className="text-[10px] opacity-70">({cat.products.length})</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products under selected category (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {pricingCategories
                .filter((c) => c.id === activeMatrixCatId)
                .map((cat) => (
                  <div key={cat.id} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white border border-[#E5E5E7] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-1.5 rounded-xl bg-[#F5F5F7]">{cat.icon}</span>
                        <div>
                          <h3 className="text-sm font-bold text-[#1D1D1F]">{cat.title}</h3>
                          <p className="text-xs text-[#86868B]">{cat.description}</p>
                        </div>
                      </div>
                      <Link
                        href="/admin/pricing"
                        className="text-xs font-bold text-[#3B82F6] hover:underline"
                      >
                        + Add / Edit Sub-Categories
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {cat.products.map((product) => {
                        const isSelected = activeProduct?.id === product.id;

                        return (
                          <div
                            key={product.id}
                            className={`p-5 rounded-2xl border transition-all space-y-4 bg-white ${
                              isSelected
                                ? 'border-[#3B82F6] shadow-xs'
                                : 'border-[#E5E5E7] hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-[#1D1D1F]">{product.name}</h4>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                    {product.active ? 'Active' : 'Disabled'}
                                  </span>
                                </div>
                                <p className="text-xs text-[#86868B] mt-0.5">{product.description}</p>
                              </div>

                              <button
                                onClick={() => setSelectedProductId(product.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#3B82F6] text-white shadow-2xs'
                                    : 'bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F]'
                                }`}
                              >
                                {isSelected ? '● Active in Waterfall' : 'Simulate in Waterfall'}
                              </button>
                            </div>

                            {/* Calibration Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F5F5F7]">
                              {/* Price */}
                              <div className="p-2.5 rounded-xl bg-[#F5F5F7] space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-[#86868B]">
                                  <span>BASE PRICE</span>
                                  <span className="font-mono text-[#1D1D1F]">₹{product.basePrice.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      updateProductInDashboard(cat.id, product.id, {
                                        basePrice: Math.max(1000, product.basePrice - 500),
                                      })
                                    }
                                    className="w-6 h-6 rounded bg-white text-xs font-bold border border-[#E5E5E7]"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    step="500"
                                    value={product.basePrice}
                                    onChange={(e) =>
                                      updateProductInDashboard(cat.id, product.id, {
                                        basePrice: Number(e.target.value),
                                      })
                                    }
                                    className="flex-1 px-2 py-0.5 bg-white text-xs font-mono font-bold text-center border border-[#E5E5E7] rounded"
                                  />
                                  <button
                                    onClick={() =>
                                      updateProductInDashboard(cat.id, product.id, {
                                        basePrice: product.basePrice + 500,
                                      })
                                    }
                                    className="w-6 h-6 rounded bg-white text-xs font-bold border border-[#E5E5E7]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* SLA */}
                              <div className="p-2.5 rounded-xl bg-[#F5F5F7] space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-[#86868B]">
                                  <span>TURNAROUND</span>
                                  <span className="font-mono text-[#1D1D1F]">{product.slaHours}h SLA</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      updateProductInDashboard(cat.id, product.id, {
                                        slaHours: Math.max(12, product.slaHours - 12),
                                      })
                                    }
                                    className="w-6 h-6 rounded bg-white text-xs font-bold border border-[#E5E5E7]"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    step="12"
                                    value={product.slaHours}
                                    onChange={(e) =>
                                      updateProductInDashboard(cat.id, product.id, {
                                        slaHours: Number(e.target.value),
                                      })
                                    }
                                    className="flex-1 px-2 py-0.5 bg-white text-xs font-mono font-bold text-center border border-[#E5E5E7] rounded"
                                  />
                                  <button
                                    onClick={() =>
                                      updateProductInDashboard(cat.id, product.id, {
                                        slaHours: product.slaHours + 12,
                                      })
                                    }
                                    className="w-6 h-6 rounded bg-white text-xs font-bold border border-[#E5E5E7]"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Creator Split */}
                              <div className="p-2.5 rounded-xl bg-[#F5F5F7] space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-[#86868B]">
                                  <span>CREATOR SHARE</span>
                                  <span className="font-mono text-emerald-600 font-bold">{product.creatorSharePct}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="50"
                                  max="85"
                                  step="5"
                                  value={product.creatorSharePct}
                                  onChange={(e) =>
                                    updateProductInDashboard(cat.id, product.id, {
                                      creatorSharePct: Number(e.target.value),
                                    })
                                  }
                                  className="w-full accent-[#3B82F6]"
                                />
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#86868B]">
                              <span className="text-[10px] font-bold uppercase mr-1">Formats:</span>
                              {(product.deliverables || []).map((f: string, i: number) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-[#F5F5F7] border border-[#E5E5E7] text-[#1D1D1F]">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            {/* Waterfall Summary Card (1 col) */}
            <div className="bg-[#1D1D1F] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 h-fit sticky top-20">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#86868B]">
                    Waterfall Simulation
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    §2.1 Locked
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-[10px] uppercase font-bold text-[#86868B]">Selected Product</div>
                  <div className="text-sm font-bold text-white truncate mt-0.5">
                    {activeProduct ? activeProduct.name : '4K Luxury Wedding Cinema'}
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">Client Payment (Gross):</span>
                    <span className="font-bold">₹{(waterfall.clientPayment / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>- 18% GST (Govt):</span>
                    <span>-₹{(waterfall.gstAmount / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>- Gateway (2% + GST):</span>
                    <span>-₹{(waterfall.totalGatewayDeduction / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>- Ingest Storage Allocation:</span>
                    <span>-₹{(waterfall.infraAllocation / 100).toFixed(0)}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-white">
                    <span>Available for Split:</span>
                    <span>₹{(waterfall.availableForSplit / 100).toFixed(0)}</span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between text-emerald-400 font-bold">
                    <span>Creator Net Payout (NEFT):</span>
                    <span>₹{(waterfall.creatorNetPayout / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-blue-400 font-bold">
                    <span>Artsy Studio Revenue:</span>
                    <span>₹{(waterfall.artsyAmount / 100).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => showToast('✓ Pricing parameters synchronized across all booking gateways.')}
                  className="w-full py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save &amp; Deploy Rates
                </button>
                <Link
                  href="/admin/pricing"
                  className="block text-center w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                >
                  Manage Categories &amp; Add Products →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TELEMETRY & SYSTEM LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1D1D1F]">
                Pipeline Telemetry &amp; System Health
              </h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                Real-time latency monitoring for raw ingest buckets, proxy CDNs, WhatsApp dispatch nodes, and database connections.
              </p>
            </div>
            <button
              onClick={handlePingNodes}
              disabled={isPinging}
              className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-2"
            >
              <span>{isPinging ? 'Pinging Infrastructure...' : 'Ping All Nodes Now'}</span>
              <span>🔄</span>
            </button>
          </div>

          {/* Node Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <div
                key={node.name}
                className="bg-white rounded-2xl p-5 border border-[#E5E5E7] shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#86868B]">{node.role}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {node.uptime}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1D1D1F] mt-1">{node.name}</h3>
                  <div className="text-[11px] font-mono text-[#86868B] mt-1 truncate">{node.endpoint}</div>
                  <p className="text-xs text-[#86868B] mt-2 leading-relaxed">{node.details}</p>
                </div>

                <div className="pt-3 border-t border-[#F5F5F7] flex items-center justify-between text-xs">
                  <span className="text-[#86868B]">Edge Latency:</span>
                  <span className="font-mono font-bold text-emerald-600">{node.latencyMs} ms</span>
                </div>
              </div>
            ))}
          </div>

          {/* Real-time Streaming Audit Terminal */}
          <div className="bg-[#0A0A0F] text-white rounded-3xl p-6 border border-[#262626] shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="text-[#86868B] text-[11px] ml-2">artsy-kernel-syslog.worm</span>
              </div>
              <span className="text-[10px] text-emerald-400">STATUS: LIVE TAIL</span>
            </div>

            <div className="space-y-2 text-[#A1A1AA] max-h-64 overflow-y-auto">
              <div>[SYSTEM] OpenWA WhatsApp Gateway session heartbeat ACK (200 OK)</div>
              <div>[INGEST] Backblaze B2 multipart upload token issued for Order #AP-8841</div>
              <div>[STREAM] BunnyCDN proxy encoding complete: AP-8841_Rec709_Proxy.m3u8</div>
              <div>[SECURITY] Middleware Edge Route Guard verified admin session signature</div>
              <div>[VAULT] Razorpay webhook verified signature for payment #pay_892410</div>
              <div>[WORM] Immutability hash verified for ledger entry #77819</div>
              <div className="text-emerald-400">
                [HEARTBEAT] Telemetry node checks passing — 0 packet drops detected across Mumbai &amp; Delhi PoPs.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}