/**
 * ARTSY PRODUCTION — Change Order Engine
 * ========================================
 * Handles scope-change tracking and billing.
 *
 * Workflow:
 *   1. Admin detects scope creep → creates change order
 *   2. Client notified (in-app; WhatsApp in future phases)
 *   3. Client accepts → additional Razorpay payment → work continues
 *   4. Client declines → work continues on original scope only
 *   5. No response after 48h → auto-expired
 *
 * All amounts in PAISE.
 */

import { loadPlatformConfig, type PlatformConfig } from '../financial/engine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ChangeOrderType =
  | 'additional_footage'
  | 'additional_format'
  | 'additional_variant'
  | 'extra_duration'
  | 'extra_revisions'
  | 'creative_redirect'
  | 'rush_upgrade';

export type ChangeOrderStatus =
  | 'draft'
  | 'pending_client'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface ChangeOrderInput {
  projectId: string;
  orderId: string;
  changeType: ChangeOrderType;
  description: string;
  originalScope: Record<string, unknown>;
  requestedScope: Record<string, unknown>;
  additionalPricePaise: number;
  createdBy: string; // admin user ID
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  orderId: string;
  changeType: ChangeOrderType;
  description: string;
  originalScope: Record<string, unknown>;
  requestedScope: Record<string, unknown>;
  additionalPrice: number;     // paise
  gstAmount: number;           // paise
  totalPrice: number;          // paise
  status: ChangeOrderStatus;
  paymentId?: string;
  createdBy: string;
  clientRespondedAt?: string;
  expiresAt: string;           // ISO date
  createdAt: string;
}

export interface ChangeOrderSummary {
  totalChangeOrders: number;
  accepted: number;
  declined: number;
  pending: number;
  expired: number;
  totalAdditionalRevenue: number; // paise — from accepted change orders
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Order Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new change order with GST calculation and auto-expiry.
 */
export function createChangeOrder(
  input: ChangeOrderInput,
  configOverride?: Partial<PlatformConfig>
): ChangeOrder {
  const config = { ...loadPlatformConfig(), ...configOverride };

  // Calculate GST on the additional price (GST-inclusive like original order)
  const preGstAdditional = Math.round(input.additionalPricePaise / (1 + config.gstRate));
  const gstAmount = input.additionalPricePaise - preGstAdditional;

  // Calculate expiry (48 hours from now by default)
  const expiryHours = 48; // from platform_config.change_order_expiry_hours
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

  return {
    id: `co_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    projectId: input.projectId,
    orderId: input.orderId,
    changeType: input.changeType,
    description: input.description,
    originalScope: input.originalScope,
    requestedScope: input.requestedScope,
    additionalPrice: input.additionalPricePaise,
    gstAmount,
    totalPrice: input.additionalPricePaise,
    status: 'pending_client',
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Order Status Transitions
// ─────────────────────────────────────────────────────────────────────────────

/** Valid status transitions for change orders */
const VALID_TRANSITIONS: Record<ChangeOrderStatus, ChangeOrderStatus[]> = {
  draft: ['pending_client', 'cancelled'],
  pending_client: ['accepted', 'declined', 'expired', 'cancelled'],
  accepted: [],       // terminal
  declined: [],       // terminal
  expired: [],        // terminal
  cancelled: [],      // terminal
};

/**
 * Validate whether a status transition is allowed.
 */
export function canTransition(
  currentStatus: ChangeOrderStatus,
  targetStatus: ChangeOrderStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * Process client response to a change order.
 */
export function processClientResponse(
  changeOrder: ChangeOrder,
  response: 'accepted' | 'declined'
): {
  updatedStatus: ChangeOrderStatus;
  clientRespondedAt: string;
  requiresPayment: boolean;
} {
  if (!canTransition(changeOrder.status, response)) {
    throw new Error(
      `Cannot transition change order from "${changeOrder.status}" to "${response}"`
    );
  }

  return {
    updatedStatus: response,
    clientRespondedAt: new Date().toISOString(),
    requiresPayment: response === 'accepted',
  };
}

/**
 * Check if a pending change order has expired.
 */
export function isExpired(changeOrder: ChangeOrder): boolean {
  if (changeOrder.status !== 'pending_client') return false;
  return new Date(changeOrder.expiresAt).getTime() < Date.now();
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Order Financial Impact
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the creator payout adjustment for an accepted change order.
 * The additional price is split using the same creator/Artsy ratio.
 */
export function calculateChangeOrderPayout(
  totalPricePaise: number,
  configOverride?: Partial<PlatformConfig>
): {
  creatorAdditional: number;
  artsyAdditional: number;
} {
  const config = { ...loadPlatformConfig(), ...configOverride };

  // Extract GST from additional price
  const preGst = Math.round(totalPricePaise / (1 + config.gstRate));

  // Gateway fee on additional payment
  const gatewayFee = Math.round(totalPricePaise * config.gatewayFeePct);
  const gatewayFeeGst = Math.round(gatewayFee * config.gatewayFeeGstPct);

  // Available for split (no infra allocation on change orders)
  const availableForSplit = preGst - gatewayFee - gatewayFeeGst;

  const creatorAdditional = Math.round(availableForSplit * (config.creatorSharePct / 100));
  const artsyAdditional = availableForSplit - creatorAdditional;

  return { creatorAdditional, artsyAdditional };
}

// ─────────────────────────────────────────────────────────────────────────────
// Summarization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Summarize change orders for a project or order.
 */
export function summarizeChangeOrders(changeOrders: ChangeOrder[]): ChangeOrderSummary {
  return {
    totalChangeOrders: changeOrders.length,
    accepted: changeOrders.filter(co => co.status === 'accepted').length,
    declined: changeOrders.filter(co => co.status === 'declined').length,
    pending: changeOrders.filter(co => co.status === 'pending_client').length,
    expired: changeOrders.filter(co => co.status === 'expired').length,
    totalAdditionalRevenue: changeOrders
      .filter(co => co.status === 'accepted')
      .reduce((sum, co) => sum + co.totalPrice, 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Human-readable labels
// ─────────────────────────────────────────────────────────────────────────────

export const CHANGE_TYPE_LABELS: Record<ChangeOrderType, string> = {
  additional_footage: 'Additional Footage',
  additional_format: 'Additional Output Format',
  additional_variant: 'Additional Version/Variant',
  extra_duration: 'Extended Duration',
  extra_revisions: 'Extra Revision Rounds',
  creative_redirect: 'Creative Direction Change',
  rush_upgrade: 'Rush Delivery Upgrade',
};

export const CHANGE_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  draft: 'Draft',
  pending_client: 'Awaiting Client Response',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired (No Response)',
  cancelled: 'Cancelled',
};
