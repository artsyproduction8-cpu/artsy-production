/**
 * ARTSY PRODUCTION — Financial Engine
 * ====================================
 * Implements the finalized Part 1 financial model:
 *
 *   Client pays ₹8,000 (all-inclusive)
 *     → Extract GST: ₹8,000 / 1.18 = ₹6,780 pre-GST, ₹1,220 GST
 *     → Deduct gateway: 2% + GST on fee = ₹189
 *     → Deduct infrastructure: ₹115 (configurable)
 *     → Available for split: ₹6,476
 *     → Creator (70%): ₹4,533
 *     → Artsy (30%): ₹1,943
 *
 * All amounts are in PAISE (1 ₹ = 100 paise).
 * This eliminates floating-point rounding errors entirely.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Platform configuration — mirrors the `platform_config` table */
export interface PlatformConfig {
  creatorSharePct: number;       // e.g. 70
  artsySharePct: number;         // e.g. 30
  gstRate: number;               // e.g. 0.18
  tdsRate: number;               // e.g. 0.01 (placeholder)
  gatewayFeePct: number;         // e.g. 0.02
  gatewayFeeGstPct: number;      // e.g. 0.18
  infraAllocationPerProject: number; // paise, e.g. 11500 (₹115)
  minOrderValue: number;         // paise
  maxOrderValue: number;         // paise
  includedRevisionRounds: number;
  quoteValidityDays: number;
}

/** The full financial breakdown for a single order */
export interface FinancialWaterfall {
  // Input
  clientPayment: number;         // paise — what client pays (all-inclusive)

  // Step 1: Extract GST
  preGstRevenue: number;         // paise — clientPayment / (1 + gstRate)
  gstAmount: number;             // paise — GST liability to government

  // Step 2: Gateway fee
  gatewayFee: number;            // paise — gatewayFeePct * clientPayment
  gatewayFeeGst: number;         // paise — GST on gateway fee
  totalGatewayDeduction: number; // paise — gatewayFee + gatewayFeeGst

  // Step 3: Infrastructure allocation
  infraAllocation: number;       // paise — fixed per-project allocation

  // Step 4: Available for split
  availableForSplit: number;     // paise — preGstRevenue - totalGatewayDeduction - infraAllocation

  // Step 5: Split
  creatorSharePct: number;
  creatorAmount: number;         // paise
  artsySharePct: number;
  artsyAmount: number;           // paise

  // Step 6: TDS on creator payout
  tdsRate: number;
  tdsAmount: number;             // paise
  creatorNetPayout: number;      // paise — after TDS

  // Metadata
  configSnapshot: PlatformConfig;
}

/** A single entry for the financial_ledger table */
export interface LedgerEntry {
  entryType: string;
  amount: number;                // paise — positive = credit, negative = debit
  currency: string;
  referenceType?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default configuration (matches platform_config seed data)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  creatorSharePct: 70,
  artsySharePct: 30,
  gstRate: 0.18,
  tdsRate: 0.02, // 2% under Section 194J-Tech (Master Plan v2.1 Locked)
  gatewayFeePct: 0.02,
  gatewayFeeGstPct: 0.18,
  infraAllocationPerProject: 11500,  // ₹115 in paise
  minOrderValue: 200000,             // ₹2,000 in paise
  maxOrderValue: 50000000,           // ₹5,00,000 in paise
  includedRevisionRounds: 1,         // 1 Complimentary revision (Master Plan v2.1 Locked)
  quoteValidityDays: 7,
};

/**
 * Load platform config from the database or localStorage fallback.
 * In V1 (mock mode), this reads from localStorage. Once Supabase is live,
 * it reads from the platform_config table.
 */
export function loadPlatformConfig(): PlatformConfig {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_CONFIG;

  try {
    const saved = localStorage.getItem('artsy_platform_config');
    if (saved) {
      return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(saved) };
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_PLATFORM_CONFIG;
}

/**
 * Save platform config (admin use only).
 */
export function savePlatformConfig(config: Partial<PlatformConfig>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadPlatformConfig();
    const merged = { ...current, ...config };
    localStorage.setItem('artsy_platform_config', JSON.stringify(merged));
  } catch {
    console.error('Failed to save platform config');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Financial Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the full financial waterfall for a client payment.
 *
 * @param clientPaymentPaise - Total amount paid by client, in paise
 * @param configOverride     - Optional config override (for testing / admin preview)
 * @returns The complete financial breakdown
 *
 * @example
 * ```ts
 * const result = calculateFinancialWaterfall(800000); // ₹8,000
 * // result.creatorAmount = 453300 (₹4,533)
 * // result.artsyAmount   = 194300 (₹1,943) — approx
 * ```
 */
export function calculateFinancialWaterfall(
  clientPaymentPaise: number,
  configOverride?: Partial<PlatformConfig>
): FinancialWaterfall {
  const config = { ...loadPlatformConfig(), ...configOverride };

  // Step 1: Extract GST
  // Client price is GST-inclusive: preGstRevenue = clientPayment / (1 + gstRate)
  const preGstRevenue = Math.round(clientPaymentPaise / (1 + config.gstRate));
  const gstAmount = clientPaymentPaise - preGstRevenue;

  // Step 2: Gateway fee (charged on full client payment)
  const gatewayFee = Math.round(clientPaymentPaise * config.gatewayFeePct);
  const gatewayFeeGst = Math.round(gatewayFee * config.gatewayFeeGstPct);
  const totalGatewayDeduction = gatewayFee + gatewayFeeGst;

  // Step 3: Infrastructure allocation (fixed per project)
  const infraAllocation = config.infraAllocationPerProject;

  // Step 4: Available for split
  // = preGstRevenue - totalGatewayDeduction - infraAllocation
  const availableForSplit = preGstRevenue - totalGatewayDeduction - infraAllocation;

  // Step 5: Split
  const creatorAmount = Math.round(availableForSplit * (config.creatorSharePct / 100));
  const artsyAmount = availableForSplit - creatorAmount; // remainder to Artsy (avoids rounding gaps)

  // Step 6: TDS on creator payout
  const tdsAmount = Math.round(creatorAmount * config.tdsRate);
  const creatorNetPayout = creatorAmount - tdsAmount;

  return {
    clientPayment: clientPaymentPaise,
    preGstRevenue,
    gstAmount,
    gatewayFee,
    gatewayFeeGst,
    totalGatewayDeduction,
    infraAllocation,
    availableForSplit,
    creatorSharePct: config.creatorSharePct,
    creatorAmount,
    artsySharePct: config.artsySharePct,
    artsyAmount,
    tdsRate: config.tdsRate,
    tdsAmount,
    creatorNetPayout,
    configSnapshot: config,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ledger Entry Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate double-entry financial ledger entries for a completed payment.
 * These entries are written to the `financial_ledger` table and are immutable.
 */
export function generateLedgerEntries(waterfall: FinancialWaterfall): LedgerEntry[] {
  return [
    {
      entryType: 'client_payment',
      amount: waterfall.clientPayment,
      currency: 'INR',
      referenceType: 'payment',
      notes: `Client payment of ₹${(waterfall.clientPayment / 100).toFixed(2)}`,
    },
    {
      entryType: 'gst_liability',
      amount: -waterfall.gstAmount,
      currency: 'INR',
      notes: `GST liability at ${(waterfall.configSnapshot.gstRate * 100).toFixed(0)}%: ₹${(waterfall.gstAmount / 100).toFixed(2)}`,
    },
    {
      entryType: 'gateway_fee',
      amount: -waterfall.totalGatewayDeduction,
      currency: 'INR',
      referenceType: 'payment',
      notes: `Gateway fee (${(waterfall.configSnapshot.gatewayFeePct * 100).toFixed(0)}% + GST): ₹${(waterfall.totalGatewayDeduction / 100).toFixed(2)}`,
    },
    {
      entryType: 'infra_allocation',
      amount: -waterfall.infraAllocation,
      currency: 'INR',
      notes: `Infrastructure allocation: ₹${(waterfall.infraAllocation / 100).toFixed(2)}`,
    },
    {
      entryType: 'creator_payout',
      amount: -waterfall.creatorAmount,
      currency: 'INR',
      referenceType: 'payout',
      notes: `Creator payout (${waterfall.creatorSharePct}% of split): ₹${(waterfall.creatorAmount / 100).toFixed(2)}`,
    },
    {
      entryType: 'tds_deduction',
      amount: waterfall.tdsAmount,
      currency: 'INR',
      referenceType: 'payout',
      notes: `TDS deduction at ${(waterfall.tdsRate * 100).toFixed(1)}%: ₹${(waterfall.tdsAmount / 100).toFixed(2)}`,
    },
    {
      entryType: 'artsy_revenue',
      amount: waterfall.artsyAmount,
      currency: 'INR',
      notes: `Artsy revenue (${waterfall.artsySharePct}% of split): ₹${(waterfall.artsyAmount / 100).toFixed(2)}`,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: Convert between paise and rupees for display
// ─────────────────────────────────────────────────────────────────────────────

/** Convert paise to formatted rupee string for display */
export function paiseToRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Convert rupees to paise (integer) */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/** Validate an order amount against platform min/max bounds */
export function validateOrderAmount(
  amountPaise: number,
  config?: Partial<PlatformConfig>
): { valid: boolean; error?: string } {
  const c = { ...loadPlatformConfig(), ...config };

  if (amountPaise < c.minOrderValue) {
    return {
      valid: false,
      error: `Order value ₹${(amountPaise / 100).toFixed(2)} is below the minimum of ${paiseToRupees(c.minOrderValue)}`,
    };
  }
  if (amountPaise > c.maxOrderValue) {
    return {
      valid: false,
      error: `Order value ₹${(amountPaise / 100).toFixed(2)} exceeds the maximum of ${paiseToRupees(c.maxOrderValue)}`,
    };
  }
  return { valid: true };
}
