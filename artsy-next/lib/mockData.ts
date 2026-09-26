// =============================================================================
// ARTSY PRODUCTION — CANONICAL MOCK DATA (V2.0 LOCKED)
// =============================================================================
// Source: Artsy Production — Master Plan (Reviewed & Finalized).md
// Operates as the full offline / simulation engine when external providers
// (Supabase, Razorpay, B2, Bunny, Meta WhatsApp) are mocked.

import { calculateFinancialWaterfall } from '@/lib/financial/engine';
import { ServiceCategory, OrderStatus, ProjectStatus } from '@/types/database';

export interface ServiceItem {
  id: string;
  category: ServiceCategory;
  subCategory: string;
  name: string;
  description: string;
  durationLabel: string;
  basePrice: number; // in INR
  basePricePaise: number; // in paise
  standardDeliveryDays: number;
  rush4_5dFeePaise: number;
  rush48hFeePaise: number;
  deliverables: string[];
  icon: string;
}

export const mockServices: ServiceItem[] = [
  // Wedding Category (Section 2.2)
  {
    id: 'wed_01',
    category: 'wedding',
    subCategory: 'Highlight',
    name: 'Wedding Highlight',
    description: 'Cinematic highlight film covering key ceremonial and emotional moments.',
    durationLabel: '3-5 min',
    basePrice: 4000,
    basePricePaise: 400000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 200000,
    rush48hFeePaise: 0,
    deliverables: ['4K UHD Master', '16:9 Cinema Cut', 'Color Graded (Film Emulation)', 'Licensed Score'],
    icon: '💍',
  },
  {
    id: 'wed_02',
    category: 'wedding',
    subCategory: 'Teaser',
    name: 'Wedding Teaser',
    description: 'Snappy, high-energy wedding teaser ready for quick social sharing.',
    durationLabel: '45-60 sec',
    basePrice: 2000,
    basePricePaise: 200000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 200000,
    rush48hFeePaise: 0,
    deliverables: ['9:16 Vertical Reel', '16:9 Master', 'Fast-Cut Pacing'],
    icon: '✨',
  },
  {
    id: 'wed_03',
    category: 'wedding',
    subCategory: 'Bundle',
    name: 'Highlight + Teaser + Reel',
    description: 'Complete wedding delivery package: full highlight film, teaser, and vertical reel.',
    durationLabel: '3-5 min + 45-60s + 30-60s',
    basePrice: 8000,
    basePricePaise: 800000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 200000,
    rush48hFeePaise: 0,
    deliverables: ['4K Highlight Film', 'Social Teaser', 'Vertical Instagram Reel', 'Cloud Delivery Archive'],
    icon: '🎬',
  },
  {
    id: 'wed_04',
    category: 'wedding',
    subCategory: 'Cinematic Story',
    name: 'Cinematic Story',
    description: 'Extended cinematic documentary storytelling covering the complete wedding celebration.',
    durationLabel: '10-15 min',
    basePrice: 8000,
    basePricePaise: 800000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 200000,
    rush48hFeePaise: 0,
    deliverables: ['4K DCI Extended Cut', 'Multi-Chapter Structure', 'Full Audio Waveform Polish'],
    icon: '🎥',
  },

  // Brand Category (Section 2.3)
  {
    id: 'brd_01',
    category: 'brand',
    subCategory: 'Product Video',
    name: 'Product Commercial Video',
    description: 'Crisp, high-conversion product demonstration video.',
    durationLabel: 'Max 2 min',
    basePrice: 3000,
    basePricePaise: 300000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 100000,
    rush48hFeePaise: 200000,
    deliverables: ['4K Product Showcase', 'Dynamic Callouts', 'Sound Design & SFX'],
    icon: '🛍️',
  },
  {
    id: 'brd_02',
    category: 'brand',
    subCategory: 'Ad Film',
    name: 'Digital Ad Film',
    description: 'Conversion-optimized advertisement film crafted for paid media campaigns.',
    durationLabel: 'Max 2 min',
    basePrice: 10000,
    basePricePaise: 1000000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 100000,
    rush48hFeePaise: 200000,
    deliverables: ['Performance Hook Variations', '4K Master', 'Burned-in Subtitles & Motion Graphics'],
    icon: '📱',
  },

  // Corporate Category (Section 2.4)
  {
    id: 'crp_01',
    category: 'corporate',
    subCategory: 'Event Highlight',
    name: 'Corporate Event Highlight',
    description: 'Polished recap capturing summits, annual days, conferences, or launches.',
    durationLabel: '3-5 min',
    basePrice: 12000,
    basePricePaise: 1200000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 100000,
    rush48hFeePaise: 200000,
    deliverables: ['Executive Highlight Cut', 'Keynote Speech Waveform Alignment', 'B-Roll Montage'],
    icon: '🏢',
  },

  // Personal Category (Section 2.5)
  {
    id: 'prs_01',
    category: 'personal',
    subCategory: 'Birthday Highlight',
    name: 'Birthday Highlight Reel',
    description: 'Memorable highlight reel celebrating birthdays and family milestones.',
    durationLabel: '3-5 min',
    basePrice: 3000,
    basePricePaise: 300000,
    standardDeliveryDays: 7,
    rush4_5dFeePaise: 100000,
    rush48hFeePaise: 200000,
    deliverables: ['Celebration Cut', 'Music Sync', 'Color Grade'],
    icon: '🎂',
  },
];

export interface MockOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  status: OrderStatus;
  grossAmountPaise: number;
  gstAmountPaise: number;
  gatewayFeePaise: number;
  netAmountPaise: number;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface MockProject {
  id: string;
  projectNumber: string;
  orderId: string;
  clientId: string;
  assignedCreatorId: string | null;
  assignedCreatorName: string | null;
  title: string;
  category: ServiceCategory;
  status: ProjectStatus;
  priority: number;
  currentRevisionRound: number;
  maxFreeRevisions: number;
  rawFootageB2Prefix: string | null;
  rawFootageBytes: number;
  bunnyStreamVideoId: string | null;
  finalDownloadUrl: string | null;
  retentionRawDeleteAt: string | null;
  retentionFinalDeleteAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const calculateMockPayout = (order: any) => {
  const totalRupees = order.totalAmount || (order.grossAmountPaise ? Math.round(order.grossAmountPaise / 100) : 18000);
  const paymentPaise = Math.round(totalRupees * 100);
  const waterfall = calculateFinancialWaterfall(paymentPaise);

  return {
    id: `payout_${String(order.id || '').split('_')[1] || Date.now()}`,
    freelancerId: order.freelancerId || order.assignedCreatorId || 'freelancer_a',
    orderId: order.id,
    grossClientPayment: totalRupees,
    availableForSplit: Math.round(waterfall.availableForSplit / 100),
    amount: Math.round(waterfall.creatorAmount / 100),
    taxDeducted: Math.round(waterfall.tdsAmount / 100),
    netAmount: Math.round(waterfall.creatorNetPayout / 100),
    artsyRevenue: Math.round(waterfall.artsyAmount / 100),
    createdAt: new Date().toISOString(),
    status: 'pending' as const,
  };
};

export const mockOrders: any[] = [
  {
    id: 'ord_001',
    orderNumber: 'AP-8841',
    clientId: 'usr-client-001',
    freelancerId: 'usr-editor-002',
    clientName: 'Sneha Patel',
    clientEmail: 'client@artsyprod.studio',
    clientPhone: '+91 9876543210',
    serviceId: 'wed_03',
    serviceCategory: 'wedding',
    serviceName: 'Highlight + Teaser + Reel',
    category: 'wedding',
    status: 'paid',
    totalAmount: 18000,
    grossAmountPaise: 1800000,
    gstAmountPaise: 274576,
    gatewayFeePaise: 42480,
    netAmountPaise: 1482944,
    razorpayPaymentId: 'pay_rzp_mock_8841',
    paidAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'ord_002',
    orderNumber: 'AP-8842',
    clientId: 'usr-client-001',
    clientName: 'Sneha Patel',
    clientEmail: 'client@artsyprod.studio',
    clientPhone: '+91 9876543210',
    serviceId: 'brd_01',
    serviceName: 'Product Commercial Video',
    category: 'brand',
    status: 'completed',
    grossAmountPaise: 300000,
    gstAmountPaise: 45763,
    gatewayFeePaise: 7080,
    netAmountPaise: 247157,
    razorpayPaymentId: 'pay_rzp_mock_8842',
    paidAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
];

export const mockProjects: MockProject[] = [
  {
    id: 'AP-8841',
    projectNumber: 'PRJ-8841',
    orderId: 'ord_001',
    clientId: 'usr-client-001',
    assignedCreatorId: 'usr-editor-002',
    assignedCreatorName: 'Aarav Sen',
    title: 'The Royal Jaipur Wedding Highlight',
    category: 'wedding',
    status: 'client_review', // Active in client review suite
    priority: 1,
    currentRevisionRound: 1,
    maxFreeRevisions: 1,
    rawFootageB2Prefix: 'b2://artsy-raw-storage/projects/AP-8841/raw_footage/',
    rawFootageBytes: 45000000000, // 45 GB
    bunnyStreamVideoId: 'video_mock_8841',
    finalDownloadUrl: 'https://cdn.artsyproduction.com/masters/AP-8841/Royal_Jaipur_Master_4K.zip',
    retentionRawDeleteAt: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(), // 12 days left
    retentionFinalDeleteAt: new Date(Date.now() + 27 * 24 * 3600 * 1000).toISOString(), // 27 days left
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

export interface PayoutLedgerEntry {
  id: string;
  freelancerId: string;
  freelancerName: string;
  projectId: string;
  projectTitle: string;
  grossClientPaymentPaise: number;
  availableForSplitPaise: number;
  creatorSharePaise: number; // 70%
  tdsAmountPaise: number; // 1% under Section 194C
  netPayoutPaise: number; // In NEFT paise
  artsySharePaise: number; // 30%
  neftUtrReference: string | null;
  status: 'pending' | 'approved' | 'completed' | 'failed';
  processedAt: string | null;
  createdAt: string;
}

export const mockPayoutLedger: PayoutLedgerEntry[] = [
  {
    id: 'pay_8841',
    freelancerId: 'usr-editor-002',
    freelancerName: 'Aarav Sen',
    projectId: 'AP-8841',
    projectTitle: 'The Royal Jaipur Wedding Highlight',
    grossClientPaymentPaise: 800000,
    availableForSplitPaise: 659086,
    creatorSharePaise: 461360, // 70% of 659086
    tdsAmountPaise: 4614, // 1% under 194C
    netPayoutPaise: 456746, // ₹4,567.46
    artsySharePaise: 197239, // 30%
    neftUtrReference: 'HDFC240921008841',
    status: 'approved',
    processedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pay_8842',
    freelancerId: 'usr-editor-002',
    freelancerName: 'Aarav Sen',
    projectId: 'AP-8842',
    projectTitle: 'Kinetics Minimalist Product Reel',
    grossClientPaymentPaise: 300000,
    availableForSplitPaise: 247157,
    creatorSharePaise: 173010,
    tdsAmountPaise: 1730,
    netPayoutPaise: 171280,
    artsySharePaise: 74147,
    neftUtrReference: 'HDFC240915009923',
    status: 'completed',
    processedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
];
