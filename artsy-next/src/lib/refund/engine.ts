/**
 * ARTSY PRODUCTION — Refund State Machine
 * =========================================
 * Implements the finalized 3-tier refund policy:
 *
 *   | Work Status           | System Evidence                                    | Refund % |
 *   |-----------------------|----------------------------------------------------|----------|
 *   | NOT_STARTED           | No download events, no timeline, no activity        | 100%     |
 *   | STARTED               | Footage downloaded/imported OR timeline created     | 50%      |
 *   | SUBSTANTIAL_PROGRESS  | ~50%+ creative work; Admin verifies milestone       | 0%       |
 *
 * All amounts in PAISE.
 */

import {
  calculateFinancialWaterfall,
  type FinancialWaterfall,
  type LedgerEntry,
  type PlatformConfig,
} from '../financial/engine';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type WorkStatus = 'not_started' | 'started' | 'substantial_progress' | 'completed';

export type RefundStatus = 'none' | 'requested' | 'approved' | 'processed' | 'denied';

/** Activity log event types that indicate work has started */
const WORK_STARTED_EVENTS = [
  'footage_download',
  'footage_import_confirmed',
  'project_started',
  'timeline_created',
] as const;

/** Activity log event types that indicate substantial progress */
const SUBSTANTIAL_PROGRESS_EVENTS = [
  'progress_milestone',
  'draft_submitted',
  'qa_review',
] as const;

/** An activity log entry (simplified for refund evaluation) */
export interface ActivityLogEntry {
  eventType: string;
  createdAt: string;
  eventData?: Record<string, unknown>;
}

/** The result of a refund evaluation */
export interface RefundEvaluation {
  workStatus: WorkStatus;
  refundPercentage: number;        // 0, 50, or 100
  refundAmountPaise: number;       // paise
  evidence: {
    hasDownloadEvents: boolean;
    hasTimelineEvents: boolean;
    hasSubstantialProgress: boolean;
    eventCount: number;
    earliestWorkEvent?: string;    // ISO date of first work evidence
  };
  requiresAdminApproval: boolean;
  reasoning: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Refund Evaluation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate the refund eligibility for a project based on activity log evidence.
 *
 * @param clientPaymentPaise - Original client payment in paise
 * @param activityLog        - Activity log entries for the project
 * @param adminOverride      - Optional admin override for work status
 * @returns RefundEvaluation with calculated refund amount and evidence
 */
export function evaluateRefund(
  clientPaymentPaise: number,
  activityLog: ActivityLogEntry[],
  adminOverride?: WorkStatus
): RefundEvaluation {
  // Check for work evidence
  const hasDownloadEvents = activityLog.some(e =>
    WORK_STARTED_EVENTS.includes(e.eventType as typeof WORK_STARTED_EVENTS[number])
  );

  const hasTimelineEvents = activityLog.some(e =>
    e.eventType === 'timeline_created'
  );

  const hasSubstantialProgress = activityLog.some(e =>
    SUBSTANTIAL_PROGRESS_EVENTS.includes(e.eventType as typeof SUBSTANTIAL_PROGRESS_EVENTS[number])
  );

  // Find earliest work event
  const workEvents = activityLog.filter(e =>
    [...WORK_STARTED_EVENTS, ...SUBSTANTIAL_PROGRESS_EVENTS].includes(e.eventType as never)
  );
  const earliestWorkEvent = workEvents.length > 0
    ? workEvents.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt
    : undefined;

  // Determine work status (admin override takes precedence)
  let workStatus: WorkStatus;
  if (adminOverride) {
    workStatus = adminOverride;
  } else if (hasSubstantialProgress) {
    workStatus = 'substantial_progress';
  } else if (hasDownloadEvents || hasTimelineEvents) {
    workStatus = 'started';
  } else {
    workStatus = 'not_started';
  }

  // Calculate refund percentage based on tier
  let refundPercentage: number;
  let reasoning: string;

  switch (workStatus) {
    case 'not_started':
      refundPercentage = 100;
      reasoning = 'No evidence of work started. Full refund eligible.';
      break;
    case 'started':
      refundPercentage = 50;
      reasoning = 'Work has started (footage downloaded/imported or timeline created). 50% refund eligible.';
      break;
    case 'substantial_progress':
      refundPercentage = 0;
      reasoning = 'Substantial creative work completed (~50%+ progress). No refund eligible.';
      break;
    case 'completed':
      refundPercentage = 0;
      reasoning = 'Project completed. No refund eligible.';
      break;
    default:
      refundPercentage = 0;
      reasoning = 'Unknown work status. Defaulting to no refund — requires admin review.';
  }

  const refundAmountPaise = Math.round(clientPaymentPaise * (refundPercentage / 100));

  return {
    workStatus,
    refundPercentage,
    refundAmountPaise,
    evidence: {
      hasDownloadEvents,
      hasTimelineEvents,
      hasSubstantialProgress,
      eventCount: activityLog.length,
      earliestWorkEvent,
    },
    requiresAdminApproval: true, // All refunds require admin approval per plan
    reasoning,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Refund Ledger Entries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate compensating ledger entries for a refund.
 * Refunds are ALWAYS compensating entries — never edits to the original.
 */
export function generateRefundLedgerEntries(
  refundAmountPaise: number,
  originalWaterfall: FinancialWaterfall,
  refundPercentage: number
): LedgerEntry[] {
  if (refundAmountPaise === 0) return [];

  const entries: LedgerEntry[] = [
    {
      entryType: 'refund',
      amount: -refundAmountPaise,
      currency: 'INR',
      referenceType: 'refund',
      notes: `Refund of ${refundPercentage}% — ₹${(refundAmountPaise / 100).toFixed(2)} returned to client`,
    },
  ];

  // If there was a creator payout, reverse it proportionally
  if (refundPercentage === 100 && originalWaterfall.creatorAmount > 0) {
    entries.push({
      entryType: 'refund_reversal',
      amount: originalWaterfall.creatorAmount,
      currency: 'INR',
      referenceType: 'refund',
      notes: `Creator payout reversal due to full refund`,
    });
  }

  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
// Refund Amount Calculations (for specific scenarios)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the net refund amount after gateway fees.
 * Gateway fees are typically non-refundable by the payment provider.
 */
export function calculateNetRefund(
  clientPaymentPaise: number,
  refundPercentage: number,
  deductGatewayFee: boolean = true,
  config?: Partial<PlatformConfig>
): {
  grossRefund: number;
  gatewayFeeDeduction: number;
  netRefund: number;
} {
  const grossRefund = Math.round(clientPaymentPaise * (refundPercentage / 100));

  let gatewayFeeDeduction = 0;
  if (deductGatewayFee) {
    const waterfall = calculateFinancialWaterfall(clientPaymentPaise, config);
    // Gateway fees are proportional to the refund percentage
    gatewayFeeDeduction = Math.round(waterfall.totalGatewayDeduction * (refundPercentage / 100));
  }

  return {
    grossRefund,
    gatewayFeeDeduction,
    netRefund: grossRefund - gatewayFeeDeduction,
  };
}
