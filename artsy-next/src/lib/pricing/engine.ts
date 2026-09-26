/**
 * ARTSY PRODUCTION — Dynamic Pricing Engine
 * =========================================
 * Implements the Master Plan & Part 1 Audit finalized pricing model:
 *
 * 1. Base price per service + weighted adjustments from wizard answers
 * 2. All monetary calculations are performed in PAISE (integers)
 * 3. Enforces platform guardrails:
 *      - Min order value: ₹2,000 (200,000 paise)
 *      - Max order value: ₹5,00,000 (50,000,000 paise)
 * 4. Integrates with Financial Engine for full waterfall:
 *      - GST Extraction (18% inclusive)
 *      - Payment Gateway Deduction (2% + 18% GST on fee)
 *      - Infrastructure Allocation (₹115 / 11,500 paise)
 *      - 70% Creator / 30% Artsy split
 * 5. Generates immutable QuoteSnapshot objects matching the `quotes` table
 * 6. Configurable via Admin panel (localStorage in V1 / platform_config table in V2)
 */

import {
  calculateFinancialWaterfall,
  loadPlatformConfig,
  PlatformConfig,
  FinancialWaterfall,
  DEFAULT_PLATFORM_CONFIG
} from '../financial/engine';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatINR(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(rupees);
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PricingOption {
  label: string;
  value: string | number;
  costPaise: number; // in paise (e.g. 200000 = ₹2,000)
}

export interface PricingRule {
  id: string;
  name: string;
  category: 'wedding' | 'brand_ugc' | 'store_product' | 'corporate_event';
  description: string;
  basePricePaise: number; // in paise
  baseDeliveryDays: number;
  options: {
    cameraAngles?: PricingOption[];
    duration?: PricingOption[];
    variants?: PricingOption[];
    formats?: PricingOption[];
    rushTurnaround?: {
      label: string;
      costPaise: number;
      days: number;
    };
  };
}

export const DEFAULT_PRICING_RULES: Record<string, PricingRule> = {
  wedding: {
    id: 'wedding',
    name: 'Wedding Films',
    category: 'wedding',
    description: 'Cinematic wedding highlight reels (3–5 min) and comprehensive documentary films.',
    basePricePaise: 600000, // ₹6,000
    baseDeliveryDays: 8,
    options: {
      cameraAngles: [
        { label: '1 Camera Angle (Single Shooter)', value: 1, costPaise: 0 },
        { label: '2–3 Camera Angles (Multi-Cam Sync)', value: 2, costPaise: 200000 },
        { label: '4+ Camera Angles (Full Multi-Cam & Drone)', value: 4, costPaise: 450000 }
      ],
      duration: [
        { label: 'Teaser Reel (60–90 seconds)', value: 'teaser', costPaise: -100000 },
        { label: 'Cinematic Highlight (3–5 minutes)', value: 'highlight', costPaise: 0 },
        { label: 'Full Documentary Film (15–30 minutes)', value: 'documentary', costPaise: 500000 }
      ],
      formats: [
        { label: '16:9 4K Master', value: '16_9', costPaise: 0 },
        { label: '9:16 Vertical Reel Cut', value: '9_16', costPaise: 80000 },
        { label: 'Both 16:9 Master + 9:16 Vertical Cut', value: 'both', costPaise: 140000 }
      ],
      rushTurnaround: {
        label: 'Priority Express Delivery (3–4 Days)',
        costPaise: 250000,
        days: 4
      }
    }
  },
  brand_ugc: {
    id: 'brand_ugc',
    name: 'Brand & UGC Reels',
    category: 'brand_ugc',
    description: 'High-retention talking heads, product hooks, sound design, and viral short-form.',
    basePricePaise: 280000, // ₹2,800
    baseDeliveryDays: 5,
    options: {
      variants: [
        { label: '1 Main Cut (Single Hook)', value: 1, costPaise: 0 },
        { label: '2 Hook Variations (A/B Test Ready)', value: 2, costPaise: 90000 },
        { label: '3 Hook Variations + 2 CTA Outros', value: 3, costPaise: 160000 }
      ],
      duration: [
        { label: 'Quick Impact (15–30s)', value: 'short', costPaise: 0 },
        { label: 'In-Depth Hook Reel (45–60s)', value: 'standard', costPaise: 40000 },
        { label: 'Extended Story Reel (60–90s)', value: 'extended', costPaise: 90000 }
      ],
      formats: [
        { label: '9:16 Vertical (Instagram / TikTok / YouTube Shorts)', value: '9_16', costPaise: 0 },
        { label: '1:1 Square Feed Cut', value: '1_1', costPaise: 50000 },
        { label: '9:16 + 1:1 + 16:9 Multi-Platform Pack', value: 'all', costPaise: 120000 }
      ],
      rushTurnaround: {
        label: '24–48 Hour Express Delivery',
        costPaise: 120000,
        days: 2
      }
    }
  },
  store_product: {
    id: 'store_product',
    name: 'Store & Product Reels',
    category: 'store_product',
    description: 'E-commerce showcase reels with 3D cutaway graphics, feature spotlights, and conversions.',
    basePricePaise: 380000, // ₹3,800
    baseDeliveryDays: 6,
    options: {
      variants: [
        { label: 'Single Hero Product Showcase', value: 1, costPaise: 0 },
        { label: '2 Products Showcase Bundle', value: 2, costPaise: 260000 },
        { label: '3 Products Showcase Bundle', value: 3, costPaise: 480000 }
      ],
      duration: [
        { label: '30s High-Energy Showcase', value: '30s', costPaise: 0 },
        { label: '60s Detailed Walkthrough', value: '60s', costPaise: 80000 }
      ],
      formats: [
        { label: '9:16 Mobile First (Shop / Reels)', value: '9_16', costPaise: 0 },
        { label: '16:9 Website Hero Banner + 9:16 Social Cut', value: 'both', costPaise: 150000 }
      ],
      rushTurnaround: {
        label: '48-Hour Rush Delivery',
        costPaise: 160000,
        days: 2
      }
    }
  },
  corporate_event: {
    id: 'corporate_event',
    name: 'Corporate & Event Videos',
    category: 'corporate_event',
    description: 'Multi-cam keynotes, summit recaps, brand anthems, and panel discussion edits.',
    basePricePaise: 750000, // ₹7,500
    baseDeliveryDays: 8,
    options: {
      cameraAngles: [
        { label: 'Single Camera Presentation', value: 1, costPaise: 0 },
        { label: '2 Cameras (Speaker + Audience/Slides Sync)', value: 2, costPaise: 250000 },
        { label: '3+ Multi-Cam Setup with Audio Master', value: 3, costPaise: 450000 }
      ],
      duration: [
        { label: 'Highlights / Recap Reel (2–3 minutes)', value: 'recap', costPaise: 0 },
        { label: 'Executive Keynote (up to 30 minutes)', value: 'keynote_30', costPaise: 350000 },
        { label: 'Full Summit Session (up to 60 minutes)', value: 'full_session', costPaise: 650000 }
      ],
      rushTurnaround: {
        label: 'Priority Event Turnaround (3 Days)',
        costPaise: 300000,
        days: 3
      }
    }
  }
};

const STORAGE_KEY = 'artsy_admin_pricing_rules';

/**
 * Retrieve active pricing rules (persisted overrides from admin panel, or defaults)
 */
export function getActivePricingRules(): Record<string, PricingRule> {
  if (typeof window === 'undefined') return DEFAULT_PRICING_RULES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PRICING_RULES, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse admin pricing rules', e);
  }
  return DEFAULT_PRICING_RULES;
}

/**
 * Save updated pricing rules from admin panel
 */
export function savePricingRules(rules: Record<string, PricingRule>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save pricing rules', e);
  }
}

export interface ConfiguratorSelections {
  cameraAngleValue?: number;
  durationValue?: string;
  variantValue?: number;
  formatValue?: string;
  isRush?: boolean;
  songUrl?: string;
  notes?: string;
  rawDriveUrl?: string;
  driveUrl?: string;
}

export interface AdjustmentItem {
  name: string;
  costPaise: number;
  costRupees: number;
}

export interface PriceBreakdown {
  serviceName: string;
  serviceKey: string;
  basePricePaise: number;
  basePriceRupees: number;
  adjustments: AdjustmentItem[];
  subtotalPaise: number;
  subtotalRupees: number;
  // Guardrails
  isBelowMinimum: boolean;
  isAboveMaximum: boolean;
  minOrderValuePaise: number;
  maxOrderValuePaise: number;
  // Final client price
  grandTotalPaise: number;
  grandTotalRupees: number;
  estimatedDeliveryDays: number;
  // Financial waterfall breakdown
  waterfall: FinancialWaterfall;
  validUntil: string;
}

export type QuoteStatus = 'draft' | 'presented' | 'accepted' | 'expired' | 'superseded';

export interface QuoteSnapshot {
  id?: string;
  orderId?: string;
  serviceId: string;
  serviceName: string;
  requirements: Record<string, unknown>;
  basePricePaise: number;
  adjustments: AdjustmentItem[];
  subtotalPaise: number;
  gstRate: number;
  gstAmountPaise: number;
  gatewayFeePaise: number;
  infraAllocationPaise: number;
  availableForSplitPaise: number;
  creatorSharePct: number;
  creatorAmountPaise: number;
  artsyAmountPaise: number;
  totalPaise: number;
  totalRupees: number;
  adminReviewed: boolean;
  adminId?: string;
  validUntil: string;
  status: QuoteStatus;
  createdAt: string;
}

/**
 * Real-time price calculator for booking wizard and admin quote generation.
 * Enforces min/max platform guards and calculates the full financial split.
 */
export function calculateLivePrice(
  serviceKey: string,
  selections: ConfiguratorSelections,
  rulesOverride?: Record<string, PricingRule>,
  configOverride?: Partial<PlatformConfig>
): PriceBreakdown {
  const config = { ...loadPlatformConfig(), ...configOverride };
  const rules = rulesOverride || getActivePricingRules();
  const rule = rules[serviceKey] || rules.wedding;

  const adjustments: AdjustmentItem[] = [];
  let currentDeliveryDays = rule.baseDeliveryDays;

  // 1. Camera angles adjustment
  if (rule.options.cameraAngles && selections.cameraAngleValue !== undefined) {
    const found = rule.options.cameraAngles.find(a => a.value === selections.cameraAngleValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  // 2. Duration adjustment
  if (rule.options.duration && selections.durationValue) {
    const found = rule.options.duration.find(d => d.value === selections.durationValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  // 3. Variants adjustment
  if (rule.options.variants && selections.variantValue !== undefined) {
    const found = rule.options.variants.find(v => v.value === selections.variantValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  // 4. Formats adjustment
  if (rule.options.formats && selections.formatValue) {
    const found = rule.options.formats.find(f => f.value === selections.formatValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  // 5. Rush turnaround adjustment
  if (selections.isRush && rule.options.rushTurnaround) {
    adjustments.push({
      name: rule.options.rushTurnaround.label,
      costPaise: rule.options.rushTurnaround.costPaise,
      costRupees: paiseToRupees(rule.options.rushTurnaround.costPaise)
    });
    currentDeliveryDays = rule.options.rushTurnaround.days;
  }

  const rawSubtotalPaise = rule.basePricePaise + adjustments.reduce((acc, item) => acc + item.costPaise, 0);

  // Guardrails
  const isBelowMinimum = rawSubtotalPaise < config.minOrderValue;
  const isAboveMaximum = rawSubtotalPaise > config.maxOrderValue;

  // Clamped subtotal within guardrails
  const clampedTotalPaise = Math.max(config.minOrderValue, Math.min(rawSubtotalPaise, config.maxOrderValue));

  // Compute financial waterfall on client-facing total
  const waterfall = calculateFinancialWaterfall(clampedTotalPaise, config);

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + (config.quoteValidityDays || 7));

  return {
    serviceName: rule.name,
    serviceKey,
    basePricePaise: rule.basePricePaise,
    basePriceRupees: paiseToRupees(rule.basePricePaise),
    adjustments,
    subtotalPaise: rawSubtotalPaise,
    subtotalRupees: paiseToRupees(rawSubtotalPaise),
    isBelowMinimum,
    isAboveMaximum,
    minOrderValuePaise: config.minOrderValue,
    maxOrderValuePaise: config.maxOrderValue,
    grandTotalPaise: clampedTotalPaise,
    grandTotalRupees: paiseToRupees(clampedTotalPaise),
    estimatedDeliveryDays: currentDeliveryDays,
    waterfall,
    validUntil: validUntilDate.toISOString()
  };
}

/**
 * Generate an immutable QuoteSnapshot for storage in the `quotes` table or localStorage.
 * Once accepted, this quote is locked and cannot be altered.
 */
export function generateQuoteSnapshot(
  serviceKey: string,
  selections: ConfiguratorSelections,
  options?: {
    orderId?: string;
    adminReviewed?: boolean;
    adminId?: string;
    validityDays?: number;
    rulesOverride?: Record<string, PricingRule>;
    configOverride?: Partial<PlatformConfig>;
  }
): QuoteSnapshot {
  const breakdown = calculateLivePrice(
    serviceKey,
    selections,
    options?.rulesOverride,
    options?.configOverride
  );

  const validUntilDate = new Date();
  validUntilDate.setDate(
    validUntilDate.getDate() + (options?.validityDays || DEFAULT_PLATFORM_CONFIG.quoteValidityDays)
  );

  return {
    serviceId: serviceKey,
    serviceName: breakdown.serviceName,
    orderId: options?.orderId,
    requirements: { ...selections },
    basePricePaise: breakdown.basePricePaise,
    adjustments: breakdown.adjustments,
    subtotalPaise: breakdown.subtotalPaise,
    gstRate: breakdown.waterfall.configSnapshot.gstRate,
    gstAmountPaise: breakdown.waterfall.gstAmount,
    gatewayFeePaise: breakdown.waterfall.totalGatewayDeduction,
    infraAllocationPaise: breakdown.waterfall.infraAllocation,
    availableForSplitPaise: breakdown.waterfall.availableForSplit,
    creatorSharePct: breakdown.waterfall.creatorSharePct,
    creatorAmountPaise: breakdown.waterfall.creatorAmount,
    artsyAmountPaise: breakdown.waterfall.artsyAmount,
    totalPaise: breakdown.grandTotalPaise,
    totalRupees: breakdown.grandTotalRupees,
    adminReviewed: options?.adminReviewed ?? false,
    adminId: options?.adminId,
    validUntil: validUntilDate.toISOString(),
    status: 'draft',
    createdAt: new Date().toISOString()
  };
}
