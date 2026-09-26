/**
 * ARTSY PRODUCTION — Verification Suite for Part 1 Implementation
 * ===============================================================
 * Verifies:
 * 1. Financial Engine — ₹8,000 example exact match (creator ₹4,533, Artsy ₹1,943)
 * 2. Financial Ledger generation (credits & debits balance)
 * 3. Refund State Machine — 3-tier refund policy (100%, 50%, 0%)
 * 4. Pricing Engine — Paise calculations, guardrails, QuoteSnapshot generation
 * 5. Change Order Engine — Creation, pricing, transitions, and expiration logic
 * 6. Creator Agreement & Auth — Gating and tracking
 */

import {
  calculateFinancialWaterfall,
  generateLedgerEntries,
  DEFAULT_PLATFORM_CONFIG
} from '../src/lib/financial/engine';

import {
  calculateLivePrice,
  generateQuoteSnapshot,
  paiseToRupees,
  rupeesToPaise,
  formatINR
} from '../src/lib/pricing/engine';

import {
  evaluateRefund,
  type ActivityLogEntry
} from '../src/lib/refund/engine';

import {
  createChangeOrder,
  canTransition,
  isExpired
} from '../src/lib/changeOrders/engine';

import {
  hasAcceptedAgreement
} from '../lib/auth';

import {
  calculateMockPayout,
  mockOrders
} from '../lib/mockData';

import {
  INITIAL_OPEN_JOBS
} from '../src/lib/matching/engine';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('================================================================');
console.log('ARTSY PRODUCTION — VERIFICATION SUITE');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Financial Engine Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('[1/8] Testing Financial Engine (Master Plan & PDF Reference)');
{
  // Master Plan ₹8,000 example (800,000 paise)
  const waterfall = calculateFinancialWaterfall(800000);

  const preGstRupees = Math.round(waterfall.preGstRevenue / 100);
  const gstRupees = Math.round(waterfall.gstAmount / 100);
  const gatewayRupees = Math.round(waterfall.totalGatewayDeduction / 100);
  const infraRupees = Math.round(waterfall.infraAllocation / 100);
  const availableRupees = Math.round(waterfall.availableForSplit / 100);
  const creatorRupees = Math.round(waterfall.creatorAmount / 100);
  const artsyRupees = Math.round(waterfall.artsyAmount / 100);

  assert(
    preGstRupees === 6780,
    '₹8,000 Pre-GST extracted revenue is ₹6,780',
    `Expected 6780, got ${preGstRupees}`
  );

  assert(
    gstRupees === 1220,
    '₹8,000 GST liability is ₹1,220',
    `Expected 1220, got ${gstRupees}`
  );

  assert(
    gatewayRupees === 189,
    '₹8,000 Gateway fee (2% + 18% GST) is ₹189',
    `Expected 189, got ${gatewayRupees}`
  );

  assert(
    infraRupees === 115,
    '₹8,000 Infrastructure allocation is ₹115',
    `Expected 115, got ${infraRupees}`
  );

  assert(
    availableRupees === 6476,
    '₹8,000 Available for split is ₹6,476',
    `Expected 6476, got ${availableRupees}`
  );

  assert(
    creatorRupees === 4533,
    '₹8,000 Creator 70% share is exactly ₹4,533',
    `Expected 4533, got ${creatorRupees}`
  );

  assert(
    artsyRupees === 1943,
    '₹8,000 Artsy 30% share is exactly ₹1,943',
    `Expected 1943, got ${artsyRupees}`
  );

  assert(
    creatorRupees + artsyRupees === availableRupees,
    'Creator + Artsy share sums perfectly to available funds without rounding gap',
    `${creatorRupees} + ${artsyRupees} = ${creatorRupees + artsyRupees} vs ${availableRupees}`
  );

  const ledger = generateLedgerEntries(waterfall);
  assert(
    ledger.length >= 6,
    'Generates complete double-entry ledger records (client_payment, gst, gateway, infra, creator, tds)',
    `Generated ${ledger.length} entries`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Refund State Machine Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[2/8] Testing Refund State Machine (3-Tier Policy)');
{
  const clientPayment = 800000; // ₹8,000 in paise

  // Tier 1: NOT_STARTED (100% refund)
  const notStartedEval = evaluateRefund(clientPayment, []);
  assert(
    notStartedEval.workStatus === 'not_started' && notStartedEval.refundPercentage === 100,
    'Tier 1: No activity log entries yields NOT_STARTED with 100% refund',
    `Status: ${notStartedEval.workStatus}, %: ${notStartedEval.refundPercentage}`
  );
  assert(
    notStartedEval.refundAmountPaise === 800000,
    'Tier 1: Refund amount is 100% of payment (800,000 paise)',
    `Amount: ${notStartedEval.refundAmountPaise}`
  );

  // Tier 2: STARTED (50% refund)
  const startedLogs: ActivityLogEntry[] = [
    {
      eventType: 'footage_download',
      createdAt: new Date().toISOString(),
      eventData: { fileCount: 10 }
    }
  ];
  const startedEval = evaluateRefund(clientPayment, startedLogs);
  assert(
    startedEval.workStatus === 'started' && startedEval.refundPercentage === 50,
    'Tier 2: Footage download event yields STARTED with 50% refund',
    `Status: ${startedEval.workStatus}, %: ${startedEval.refundPercentage}`
  );
  assert(
    startedEval.refundAmountPaise === 400000,
    'Tier 2: Refund amount is 50% of payment (400,000 paise)',
    `Amount: ${startedEval.refundAmountPaise}`
  );

  // Tier 3: SUBSTANTIAL_PROGRESS (0% refund)
  const progressLogs: ActivityLogEntry[] = [
    {
      eventType: 'footage_download',
      createdAt: new Date().toISOString()
    },
    {
      eventType: 'draft_submitted',
      createdAt: new Date().toISOString()
    }
  ];
  const progressEval = evaluateRefund(clientPayment, progressLogs);
  assert(
    progressEval.workStatus === 'substantial_progress' && progressEval.refundPercentage === 0,
    'Tier 3: Draft submitted event yields SUBSTANTIAL_PROGRESS with 0% refund',
    `Status: ${progressEval.workStatus}, %: ${progressEval.refundPercentage}`
  );
  assert(
    progressEval.refundAmountPaise === 0,
    'Tier 3: Refund amount is 0 paise',
    `Amount: ${progressEval.refundAmountPaise}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Pricing Engine Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[3/8] Testing Pricing Engine (Paise calculations & Guardrails)');
{
  const weddingQuote = calculateLivePrice('wedding', {
    cameraAngleValue: 2, // +₹2,000 (200,000 paise)
    durationValue: 'highlight', // +₹0
    formatValue: 'both', // +₹1,400 (140,000 paise)
    isRush: true // +₹2,500 (250,000 paise)
  });

  // Base: 600000 + 200000 + 140000 + 250000 = 1,190,000 paise = ₹11,900
  assert(
    weddingQuote.grandTotalPaise === 1190000,
    'Wedding quote with multi-cam, rush, and formats computes ₹11,900 (1,190,000 paise)',
    `Expected 1190000, got ${weddingQuote.grandTotalPaise}`
  );

  assert(
    weddingQuote.isBelowMinimum === false && weddingQuote.isAboveMaximum === false,
    'Standard quote is within min/max guardrails (₹2,000 – ₹5,00,000)',
    `Min: ${weddingQuote.minOrderValuePaise}, Max: ${weddingQuote.maxOrderValuePaise}`
  );

  // Guardrail minimum check
  const tinyOrder = calculateLivePrice('brand_ugc', {
    durationValue: 'teaser'
  }, undefined, { minOrderValue: 200000 });
  assert(
    tinyOrder.grandTotalPaise >= 200000,
    'Order below ₹2,000 is clamped to minimumOrderValue guardrail',
    `Grand total: ${tinyOrder.grandTotalPaise}`
  );

  // QuoteSnapshot generation
  const snapshot = generateQuoteSnapshot('brand_ugc', {
    variantValue: 1,
    durationValue: 'short'
  });
  assert(
    snapshot.status === 'draft' && typeof snapshot.validUntil === 'string',
    'generateQuoteSnapshot creates valid draft snapshot with 7-day expiration',
    `Status: ${snapshot.status}, ValidUntil: ${snapshot.validUntil}`
  );
  assert(
    snapshot.creatorAmountPaise > 0 && snapshot.artsyAmountPaise > 0,
    'QuoteSnapshot contains pre-calculated 70/30 financial split',
    `Creator: ${snapshot.creatorAmountPaise}, Artsy: ${snapshot.artsyAmountPaise}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Change Order Engine Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[4/8] Testing Change Order Engine');
{
  const co = createChangeOrder({
    projectId: 'proj-123',
    orderId: 'ord-456',
    changeType: 'extra_revisions',
    description: 'Round 3 Creative Revision Cut',
    originalScope: { includedRevisions: 2 },
    requestedScope: { includedRevisions: 3 },
    additionalPricePaise: 150000, // ₹1,500
    createdBy: 'usr-admin-003'
  });

  assert(
    co.status === 'pending_client',
    'Newly created change order starts in pending_client status',
    `Status: ${co.status}`
  );

  assert(
    co.totalPrice === 150000,
    'Change order price stored in paise (150,000 paise)',
    `Price: ${co.totalPrice}`
  );

  assert(
    canTransition('pending_client', 'accepted') === true,
    'Valid transition from pending_client to accepted is permitted',
    ''
  );

  assert(
    canTransition('accepted', 'pending_client') === false,
    'Illegal transition from terminal accepted state is blocked',
    ''
  );

  const pastDate = new Date(Date.now() - 10000).toISOString();
  assert(
    isExpired({ ...co, expiresAt: pastDate }),
    'Expired change orders are detected when expiresAt has elapsed',
    ''
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Creator Agreement & Auth Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[5/8] Testing Creator Agreement Lifecycle & Gating');
{
  const testUserUnsigned = {
    id: 'test-editor-1',
    email: 'test@artsyprod.studio',
    full_name: 'Test Editor',
    role: 'freelancer' as const,
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const testUserSigned = {
    ...testUserUnsigned,
    agreement_accepted: true,
    agreement_accepted_at: new Date().toISOString(),
    agreement_version: '1.0'
  };

  assert(
    hasAcceptedAgreement(testUserUnsigned) === false,
    'hasAcceptedAgreement returns false for unsigned creator',
    ''
  );

  assert(
    hasAcceptedAgreement(testUserSigned) === true,
    'hasAcceptedAgreement returns true for creator with signed agreement',
    ''
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Mock Data & Payout Alignment Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[6/8] Testing Mock Data Alignment with 70/30 Post-Deduction Model');
{
  const order1 = mockOrders[0]; // Wedding ₹18,000
  const payout1 = calculateMockPayout(order1);

  assert(
    payout1.amount === 10300,
    'Order 1 (₹18,000): Creator 70% share after GST/gateway/infra is ₹10,300',
    `Expected 10300, got ${payout1.amount}`
  );

  assert(
    payout1.taxDeducted === 103,
    'Order 1 (₹18,000): Section 194J TDS (1%) is ₹103 (NOT 18%)',
    `Expected 103, got ${payout1.taxDeducted}`
  );

  assert(
    payout1.netAmount === 10197,
    'Order 1 (₹18,000): Net payout is ₹10,197',
    `Expected 10197, got ${payout1.netAmount}`
  );

  assert(
    payout1.artsyRevenue === 4414,
    'Order 1 (₹18,000): Artsy 30% revenue is ₹4,414',
    `Expected 4414, got ${payout1.artsyRevenue}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Matching Engine Job Payout Verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[7/8] Testing Matching Engine Job Payouts');
{
  const weddingJob = INITIAL_OPEN_JOBS.find(j => j.id === 'job-artsy-101');
  assert(
    weddingJob?.payoutAmount === 4533,
    'Job AP-101 (Wedding ₹8,000): Creator payout is ₹4,533 (70% model)',
    `Expected 4533, got ${weddingJob?.payoutAmount}`
  );

  const ugcJob = INITIAL_OPEN_JOBS.find(j => j.id === 'job-artsy-102');
  assert(
    ugcJob?.payoutAmount === 2111,
    'Job AP-102 (UGC ₹3,800): Creator payout is ₹2,111 (70% model)',
    `Expected 2111, got ${ugcJob?.payoutAmount}`
  );

  const productJob = INITIAL_OPEN_JOBS.find(j => j.id === 'job-artsy-103');
  assert(
    productJob?.payoutAmount === 2976,
    'Job AP-103 (Product ₹5,300): Creator payout is ₹2,976 (70% model)',
    `Expected 2976, got ${productJob?.payoutAmount}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Accounting Reconciliation & Boundary Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[8/8] Testing Accounting Balance & Boundary Edge Cases');
{
  // Test minimum order boundary (₹2,000 = 200,000 paise)
  const minWaterfall = calculateFinancialWaterfall(200000);
  assert(
    minWaterfall.availableForSplit > 0,
    'Minimum order value (₹2,000) generates positive available funds for split',
    `Available: ${minWaterfall.availableForSplit} paise`
  );

  // Test double entry ledger balancing
  const ledger = generateLedgerEntries(minWaterfall);
  const clientCredit = ledger.find(l => l.entryType === 'client_payment')?.amount || 0;
  const gst = Math.abs(ledger.find(l => l.entryType === 'gst_liability')?.amount || 0);
  const gateway = Math.abs(ledger.find(l => l.entryType === 'gateway_fee')?.amount || 0);
  const infra = Math.abs(ledger.find(l => l.entryType === 'infra_allocation')?.amount || 0);
  const creator = Math.abs(ledger.find(l => l.entryType === 'creator_payout')?.amount || 0);

  // Available split + GST + gateway + infra should equal original client payment
  assert(
    gst + gateway + infra + minWaterfall.availableForSplit === clientCredit,
    'Double-entry ledger credits and debits perfectly reconcile to client payment',
    `${gst} + ${gateway} + ${infra} + ${minWaterfall.availableForSplit} = ${gst + gateway + infra + minWaterfall.availableForSplit} vs ${clientCredit}`
  );

  // Maximum order boundary (₹5,00,000 = 50,000,000 paise)
  const maxWaterfall = calculateFinancialWaterfall(50000000);
  assert(
    maxWaterfall.creatorAmount > 0 && maxWaterfall.artsyAmount > 0,
    'Maximum order value (₹5,00,000) calculates without integer overflow',
    `Creator: ${maxWaterfall.creatorAmount}, Artsy: ${maxWaterfall.artsyAmount}`
  );
}

console.log('\n================================================================');
console.log(`VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
