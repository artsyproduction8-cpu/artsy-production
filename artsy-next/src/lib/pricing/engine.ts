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
import {
  DEFAULT_PRICING_MATRIX,
  DEFAULT_CAMERA_ANGLES,
  DEFAULT_DELIVERY_SLAS,
  ServiceCategory,
  ServiceProduct
} from './catalog-matrix';

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
  category: 'wedding' | 'brand_ugc' | 'store_product' | 'corporate_event' | 'personal';
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
    basePricePaise: 500000, // ₹5,000 (Standard Highlight + Teaser package rate)
    baseDeliveryDays: 8,
    options: {
      cameraAngles: [
        { label: '1 Camera Angle (Single Shooter)', value: 1, costPaise: 0 },
        { label: '2–3 Camera Angles (Multi-Cam Sync)', value: 2, costPaise: 80000 },
        { label: '4+ Camera Angles (Full Multi-Cam & Drone)', value: 4, costPaise: 160000 }
      ],
      duration: [
        { label: 'Teaser Reel (60–90 seconds)', value: 'teaser', costPaise: -300000 },
        { label: 'Cinematic Highlight (3–5 minutes)', value: 'highlight', costPaise: 0 },
        { label: 'Full Documentary Film (15–30 minutes)', value: 'documentary', costPaise: 300000 }
      ],
      formats: [
        { label: '16:9 4K Master', value: '16_9', costPaise: 0 },
        { label: '9:16 Vertical Reel Cut', value: '9_16', costPaise: 80000 },
        { label: 'Both 16:9 Master + 9:16 Vertical Cut', value: 'both', costPaise: 140000 }
      ],
      rushTurnaround: {
        label: 'Priority Express Delivery (4–5 Days)',
        costPaise: 200000,
        days: 4
      }
    }
  },
  brand_ugc: {
    id: 'brand_ugc',
    name: 'Brand & UGC Reels',
    category: 'brand_ugc',
    description: 'High-retention talking heads, product hooks, sound design, and viral short-form.',
    basePricePaise: 300000, // ₹3,000
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
        label: 'Priority 4-5 Days / Rush 48h Express',
        costPaise: 200000,
        days: 2
      }
    }
  },
  store_product: {
    id: 'store_product',
    name: 'Store & Product Reels',
    category: 'store_product',
    description: 'E-commerce showcase reels with 3D cutaway graphics, feature spotlights, and conversions.',
    basePricePaise: 300000, // ₹3,000
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
        costPaise: 200000,
        days: 2
      }
    }
  },
  corporate_event: {
    id: 'corporate_event',
    name: 'Corporate & Event Videos',
    category: 'corporate_event',
    description: 'Multi-cam keynotes, summit recaps, brand anthems, and panel discussion edits.',
    basePricePaise: 350000, // ₹3,500
    baseDeliveryDays: 8,
    options: {
      cameraAngles: [
        { label: 'Single Camera Presentation', value: 1, costPaise: 0 },
        { label: '2 Cameras (Speaker + Audience/Slides Sync)', value: 2, costPaise: 50000 },
        { label: '3+ Multi-Cam Setup with Audio Master', value: 3, costPaise: 100000 }
      ],
      duration: [
        { label: 'Highlights / Recap Reel (2–3 minutes)', value: 'recap', costPaise: 0 },
        { label: 'Executive Keynote (up to 30 minutes)', value: 'keynote_30', costPaise: 350000 },
        { label: 'Full Summit Session (up to 60 minutes)', value: 'full_session', costPaise: 650000 }
      ],
      rushTurnaround: {
        label: 'Priority Event Turnaround (3 Days)',
        costPaise: 200000,
        days: 3
      }
    }
  },
  personal: {
    id: 'personal',
    name: 'Personal & Milestone Films',
    category: 'personal',
    description: 'Birthdays, engagements, baby showers, memorials, and family anniversaries.',
    basePricePaise: 100000, // ₹1,000 (Base rate matching entry milestone reels like Maternity Reel Only)
    baseDeliveryDays: 7,
    options: {
      cameraAngles: [
        { label: 'Single Angle (1 Camera)', value: 1, costPaise: 0 },
        { label: 'Dual Angles (2 Cameras)', value: 2, costPaise: 80000 },
        { label: 'Multi-Cam / Drone (3+ Cameras)', value: 3, costPaise: 160000 }
      ],
      duration: [
        { label: 'Social Reel (30–60s)', value: 'reel', costPaise: 0 },
        { label: 'Teaser Cut (45–60s)', value: 'teaser', costPaise: 50000 },
        { label: 'Milestone Highlight (3–5 min)', value: 'highlight', costPaise: 200000 }
      ],
      rushTurnaround: {
        label: 'Priority Express Delivery (4–5 Days)',
        costPaise: 100000,
        days: 4
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
  category?: string;
  subCategory?: string;
  subCategoryId?: string;
  angles?: 'single' | 'dual' | 'multicam' | string;
  turnaround?: 'standard' | 'priority' | 'rush' | string;
  cameraAngleValue?: number;
  durationValue?: string;
  variantValue?: number;
  formatValue?: string;
  isRush?: boolean;
  songUrl?: string;
  notes?: string;
  rawDriveUrl?: string;
  driveUrl?: string;
  [key: string]: unknown;
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

  // 0. Canonical Catalog Matrix & Rule Resolution
  const subCategoryInput = selections.subCategory || selections.subCategoryId || (selections as any).serviceId;
  let catalogCategory: ServiceCategory | undefined;
  let catalogProduct: ServiceProduct | undefined;

  const rawKey = (selections.category || serviceKey || '').toLowerCase();
  catalogCategory = DEFAULT_PRICING_MATRIX.find(
    c => c.id.toLowerCase() === rawKey || 
         c.title.toLowerCase() === rawKey ||
         (rawKey.includes('wedding') && c.id === 'wedding') || 
         (rawKey.includes('brand') && c.id === 'brand') || 
         (rawKey.includes('corp') && c.id === 'corporate') || 
         (rawKey.includes('personal') && c.id === 'personal') ||
         (rawKey.includes('maternity') && c.id === 'personal') ||
         (rawKey.includes('birthday') && c.id === 'personal') ||
         (rawKey.includes('engagement') && c.id === 'personal') ||
         (rawKey.includes('baby') && c.id === 'personal') ||
         (rawKey.includes('memorial') && c.id === 'personal')
  );

  if (subCategoryInput) {
    const subLower = String(subCategoryInput).toLowerCase();
    if (catalogCategory) {
      catalogProduct = catalogCategory.products.find(
        p => p.id.toLowerCase() === subLower || p.name.toLowerCase() === subLower
      );
    }
    if (!catalogProduct) {
      for (const cat of DEFAULT_PRICING_MATRIX) {
        const found = cat.products.find(
          p => p.id.toLowerCase() === subLower || p.name.toLowerCase() === subLower
        );
        if (found) {
          catalogProduct = found;
          if (!catalogCategory) catalogCategory = cat;
          break;
        }
      }
    }
    // Fallback fuzzy match if no exact match exists
    if (!catalogProduct && catalogCategory) {
      catalogProduct = catalogCategory.products.find(
        p => p.id.toLowerCase().includes(subLower) || 
             subLower.includes(p.id.toLowerCase()) ||
             p.name.toLowerCase().includes(subLower) ||
             subLower.includes(p.name.toLowerCase())
      );
    }
    if (!catalogProduct) {
      for (const cat of DEFAULT_PRICING_MATRIX) {
        const found = cat.products.find(
          p => p.id.toLowerCase().includes(subLower) || 
               subLower.includes(p.id.toLowerCase()) ||
               p.name.toLowerCase().includes(subLower) ||
               subLower.includes(p.name.toLowerCase())
        );
        if (found) {
          catalogProduct = found;
          if (!catalogCategory) catalogCategory = cat;
          break;
        }
      }
    }
  } else {
    // If no explicit subcategory passed, check if serviceKey or rawKey matches a product directly
    const sLower = (serviceKey || '').toLowerCase();
    for (const cat of DEFAULT_PRICING_MATRIX) {
      const found = cat.products.find(
        p => p.id.toLowerCase() === sLower || 
             p.name.toLowerCase() === sLower ||
             p.id.toLowerCase().includes(sLower) || 
             sLower.includes(p.id.toLowerCase()) ||
             p.name.toLowerCase().includes(sLower) || 
             sLower.includes(p.name.toLowerCase())
      );
      if (found) {
        catalogProduct = found;
        if (!catalogCategory) catalogCategory = cat;
        break;
      }
    }
  }

  // Resolve rule key
  let ruleKey = (catalogCategory ? catalogCategory.id : serviceKey || '').toLowerCase();
  if (ruleKey.includes('maternity') || ruleKey.includes('personal')) ruleKey = 'personal';
  else if (ruleKey.includes('wedding')) ruleKey = 'wedding';
  else if (ruleKey.includes('brand') || ruleKey.includes('ugc')) ruleKey = 'brand_ugc';
  else if (ruleKey.includes('store') || ruleKey.includes('product')) ruleKey = 'store_product';
  else if (ruleKey.includes('corp') || ruleKey.includes('event')) ruleKey = 'corporate_event';

  const rule = rules[ruleKey] || (catalogCategory ? rules[catalogCategory.id] : undefined);

  // If configuration is completely unrecognized, throw 400 error rather than silently defaulting to wedding
  if (!catalogProduct && !catalogCategory && !rule) {
    throw new Error('Unable to calculate price for this configuration');
  }

  const effectiveRule = rule || (catalogCategory ? rules[catalogCategory.id] : undefined) || rules.personal || rules.wedding;

  const adjustments: AdjustmentItem[] = [];
  let currentDeliveryDays = effectiveRule.baseDeliveryDays;

  let effectiveBasePricePaise = effectiveRule.basePricePaise;
  let resolvedServiceName = effectiveRule.name;

  if (catalogProduct) {
    effectiveBasePricePaise = catalogProduct.basePrice * 100;
    resolvedServiceName = catalogCategory ? `${catalogCategory.title} — ${catalogProduct.name}` : catalogProduct.name;
    currentDeliveryDays = Math.ceil((catalogProduct.slaHours || 168) / 24);
  }

  // 1. Camera angles adjustment
  if (selections.angles) {
    const isWeddingPersonal = Boolean(
      (catalogCategory && (catalogCategory.id === 'wedding' || catalogCategory.id === 'personal')) ||
      rawKey.includes('wedding') ||
      rawKey.includes('personal') ||
      rawKey.includes('maternity')
    );
    const angleRule = DEFAULT_CAMERA_ANGLES.find(a => a.id === selections.angles);
    if (angleRule) {
      const angleCostRupees = isWeddingPersonal ? angleRule.costWeddingPersonal : angleRule.costBrandCorporate;
      if (angleCostRupees > 0) {
        adjustments.push({
          name: angleRule.label,
          costPaise: angleCostRupees * 100,
          costRupees: angleCostRupees
        });
      }
    }
  } else if (effectiveRule.options.cameraAngles && selections.cameraAngleValue !== undefined) {
    const found = effectiveRule.options.cameraAngles.find(a => a.value === selections.cameraAngleValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  // 2. Turnaround / Delivery SLA adjustment
  if (selections.turnaround) {
    const isWeddingPersonal = Boolean(
      (catalogCategory && (catalogCategory.id === 'wedding' || catalogCategory.id === 'personal')) ||
      rawKey.includes('wedding') ||
      rawKey.includes('personal') ||
      rawKey.includes('maternity')
    );
    const slaRule = DEFAULT_DELIVERY_SLAS.find(s => s.id === selections.turnaround);
    if (slaRule) {
      const slaCostRupees = isWeddingPersonal ? slaRule.costWeddingPersonal : slaRule.costBrandCorporate;
      if (slaCostRupees > 0) {
        adjustments.push({
          name: slaRule.label,
          costPaise: slaCostRupees * 100,
          costRupees: slaCostRupees
        });
      }
      currentDeliveryDays = Math.ceil(slaRule.hours / 24);
    }
  } else if (selections.isRush && effectiveRule.options.rushTurnaround) {
    adjustments.push({
      name: effectiveRule.options.rushTurnaround.label,
      costPaise: effectiveRule.options.rushTurnaround.costPaise,
      costRupees: paiseToRupees(effectiveRule.options.rushTurnaround.costPaise)
    });
    currentDeliveryDays = effectiveRule.options.rushTurnaround.days;
  }

  // 3. Duration adjustment (if durationValue provided)
  if (effectiveRule.options.duration && selections.durationValue) {
    const found = effectiveRule.options.duration.find(d => d.value === selections.durationValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  // 4. Variants adjustment (if variantValue provided)
  if (effectiveRule.options.variants && selections.variantValue !== undefined) {
    const found = effectiveRule.options.variants.find(v => v.value === selections.variantValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  // 5. Formats adjustment (if formatValue provided)
  if (effectiveRule.options.formats && selections.formatValue) {
    const found = effectiveRule.options.formats.find(f => f.value === selections.formatValue);
    if (found && found.costPaise !== 0) {
      adjustments.push({
        name: found.label,
        costPaise: found.costPaise,
        costRupees: paiseToRupees(found.costPaise)
      });
    }
  }

  const rawSubtotalPaise = effectiveBasePricePaise + adjustments.reduce((acc, item) => acc + item.costPaise, 0);

  // Guardrails
  const effectiveMinOrderValue = Math.min(
    config.minOrderValue,
    catalogProduct ? catalogProduct.basePrice * 100 : config.minOrderValue
  );
  const isBelowMinimum = rawSubtotalPaise < effectiveMinOrderValue;
  const isAboveMaximum = rawSubtotalPaise > config.maxOrderValue;

  // Clamped subtotal within guardrails
  const clampedTotalPaise = Math.max(effectiveMinOrderValue, Math.min(rawSubtotalPaise, config.maxOrderValue));

  // Compute financial waterfall on client-facing total
  const waterfall = calculateFinancialWaterfall(clampedTotalPaise, config);

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + (config.quoteValidityDays || 7));

  return {
    serviceName: resolvedServiceName,
    serviceKey,
    basePricePaise: effectiveBasePricePaise,
    basePriceRupees: paiseToRupees(effectiveBasePricePaise),
    adjustments,
    subtotalPaise: rawSubtotalPaise,
    subtotalRupees: paiseToRupees(rawSubtotalPaise),
    isBelowMinimum,
    isAboveMaximum,
    minOrderValuePaise: effectiveMinOrderValue,
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
