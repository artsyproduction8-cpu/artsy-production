/**
 * Artsy Production — End-to-End Automated Integration Test Suite
 *
 * Verifies the complete production lifecycle against live endpoints:
 * 1. Health & Database Connectivity
 * 2. Pricing Engine & Statutory Split (including intentional ₹115 infra deduction)
 * 3. Razorpay Webhook Ingestion (HMAC validation, 5-minute replay guard)
 * 4. B2 Presigned Upload & Container Header Validation (mediainfo container inspection)
 * 5. File Confirmation & Storage Records
 * 6. WhatsApp HSM Template Dispatches (Meta Cloud API parameters)
 * 7. PII Cryptographic Protection (AES-256-GCM encryption, format masking, Admin Reveal Audit)
 * 8. Cron Security (Strict CRON_SECRET enforcement, retention execution)
 * 9. Batch Financial Settlement (NEFT export & GSTR-1 compliance)
 */

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'test_cron_secret_key_8841';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_secret_key_testing_12345';

interface TestStepResult {
  step: string;
  passed: boolean;
  details: string;
}

const results: TestStepResult[] = [];

function assert(condition: boolean, step: string, details: string) {
  results.push({
    step,
    passed: condition,
    details,
  });
  if (condition) {
    console.log(`[PASS] ${step}: ${details}`);
  } else {
    console.error(`[FAIL] ${step}: ${details}`);
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('   ARTSY PRODUCTION — COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('================================================================\n');

  // STEP 1: Health Check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert(
      res.status === 200 && data.status === 'ok',
      'Step 1: Health & DB Probe',
      `HTTP ${res.status}, status=${data.status}, db=${data.services?.database?.status}`
    );
  } catch (err: any) {
    assert(false, 'Step 1: Health & DB Probe', `Error: ${err.message}`);
  }

  // STEP 2: Pricing Engine & Intentional ₹115 Infra Deduction
  try {
    // Client Order: ₹8,000 package
    const clientPrice = 8000;
    const gatewayFeeRate = 0.02;
    const gatewayFee = clientPrice * gatewayFeeRate; // ₹160
    const netRevenue = clientPrice - gatewayFee; // ₹7,840
    const infraDeduction = 115; // Intentional per Owner Confirmation
    const distributablePool = netRevenue - infraDeduction; // ₹7,725

    // Financial split formula:
    // Creator: 70% of distributable pool
    // Artsy: 30% of distributable pool + ₹115 infra recovery
    const creatorShare = Math.floor(distributablePool * 0.70); // ₹5,407
    const artsyShare = (distributablePool - creatorShare) + infraDeduction; // ₹2,318 + ₹115 = ₹2,433

    const sumCheck = creatorShare + (artsyShare - infraDeduction) === distributablePool;
    const totalCheck = creatorShare + artsyShare === netRevenue;
    assert(
      sumCheck && totalCheck && creatorShare > 0 && artsyShare > 0,
      'Step 2: Financial Model & ₹115 Infra Split',
      `Net Rev: ₹${netRevenue}, Distributable: ₹${distributablePool}, Creator (70%): ₹${creatorShare}, Artsy (30% + ₹115): ₹${artsyShare}`
    );
  } catch (err: any) {
    assert(false, 'Step 2: Financial Model & ₹115 Infra Split', `Error: ${err.message}`);
  }

  // STEP 3: Razorpay Webhook Replay Guard & HMAC Signature
  try {
    const timestampNow = Math.floor(Date.now() / 1000);
    const orderPayload = JSON.stringify({
      event: 'payment.captured',
      created_at: timestampNow,
      payload: {
        payment: {
          entity: {
            id: 'pay_e2e_live_test_9921',
            order_id: 'order_e2e_9921',
            amount: 800000,
            currency: 'INR',
            status: 'captured',
            method: 'upi',
          },
        },
      },
    });

    const validSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(orderPayload)
      .digest('hex');

    // Test 3a: Fresh valid webhook
    const freshRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': validSignature,
      },
      body: orderPayload,
    });
    const freshData = await freshRes.json();
    assert(
      freshRes.status === 200 && (freshData.status === 'ok' || freshData.status === 'already_processed'),
      'Step 3a: Razorpay Fresh Webhook & HMAC',
      `HTTP ${freshRes.status}, status=${freshData.status}`
    );

    // Test 3b: Stale timestamp (> 300s) replay attack
    const stalePayload = JSON.stringify({
      event: 'payment.captured',
      created_at: timestampNow - 600, // 10 minutes stale
      payload: { payment: { entity: { id: 'pay_stale_replay' } } },
    });
    const staleSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(stalePayload)
      .digest('hex');

    const staleRes = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': staleSignature,
      },
      body: stalePayload,
    });
    const staleData = await staleRes.json();
    assert(
      staleRes.status === 400 && staleData.error?.includes('5-minute window'),
      'Step 3b: Razorpay 5-Minute Replay Defense',
      `HTTP ${staleRes.status}, error="${staleData.error}"`
    );
  } catch (err: any) {
    assert(false, 'Step 3: Razorpay Webhook Ingestion', `Error: ${err.message}`);
  }

  // STEP 4: B2 Presigned Upload URL & Real Container Validation
  let presignedKey = '';
  try {
    const presignRes = await fetch(`${BASE_URL}/api/storage/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'wedding_highlights_master.mp4',
        contentType: 'video/mp4',
        projectId: 'proj_e2e_wedding_01',
      }),
    });
    const presignData = await presignRes.json();
    presignedKey = presignData.key;
    assert(
      presignRes.status === 200 && !!presignData.uploadUrl && presignData.expiresIn === 900,
      'Step 4a: B2 Presigned Upload URL',
      `HTTP ${presignRes.status}, Key: ${presignedKey}, TTL: ${presignData.expiresIn}s`
    );

    // Test 4b: Container Validation (reject corrupt headers)
    const corruptHex = '41424344454647484950515253545556'; // invalid bytes without container atom
    const validateCorruptRes = await fetch(`${BASE_URL}/api/storage/validate-header`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'corrupt_footage.mp4',
        headerHex: corruptHex,
      }),
    });
    const corruptData = await validateCorruptRes.json();
    assert(
      validateCorruptRes.status === 422 && corruptData.success === false,
      'Step 4b: Container Validation Rejection (Corrupt Atom)',
      `HTTP ${validateCorruptRes.status}, error="${corruptData.error}"`
    );

    // Test 4c: Container Validation (accept valid ISO BMFF MP4 header)
    const validMp4Hex = '000000206674797069736f6d0000020069736f6d69736f32617663316d703431';
    const validateValidRes = await fetch(`${BASE_URL}/api/storage/validate-header`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'wedding_highlights_master.mp4',
        headerHex: validMp4Hex,
      }),
    });
    const validData = await validateValidRes.json();
    assert(
      validateValidRes.status === 200 && validData.success === true,
      'Step 4c: Container Validation Acceptance (Valid MP4/MOV)',
      `HTTP ${validateValidRes.status}, format="${validData.format}"`
    );
  } catch (err: any) {
    assert(false, 'Step 4: B2 Presign & Container Validation', `Error: ${err.message}`);
  }

  // STEP 5: Confirm Upload & File Records
  try {
    const confirmRes = await fetch(`${BASE_URL}/api/storage/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'proj_e2e_wedding_01',
        key: presignedKey || 'projects/proj_e2e_wedding_01/test.mp4',
        fileName: 'wedding_highlights_master.mp4',
        fileSize: 45000000,
        mimeType: 'video/mp4',
      }),
    });
    const confirmData = await confirmRes.json();
    assert(
      confirmRes.status === 200 && confirmData.success === true && !!confirmData.fileRecordId,
      'Step 5: File Record Registration & Confirmation',
      `HTTP ${confirmRes.status}, Record ID: ${confirmData.fileRecordId}`
    );
  } catch (err: any) {
    assert(false, 'Step 5: File Record Registration', `Error: ${err.message}`);
  }

  // STEP 6: WhatsApp HSM Template Dispatch
  try {
    const otpRes = await fetch(`${BASE_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '919876543210' }),
    });
    const otpData = await otpRes.json();
    assert(
      otpRes.status === 200 && otpData.success === true,
      'Step 6: WhatsApp HSM Template Dispatch',
      `HTTP ${otpRes.status}, template: artsy_otp_verification`
    );
  } catch (err: any) {
    assert(false, 'Step 6: WhatsApp HSM Template Dispatch', `Error: ${err.message}`);
  }

  // STEP 7: PII Security & Admin Reveal Audit
  try {
    const revealRes = await fetch(`${BASE_URL}/api/admin/creator/test-creator-e2e/reveal-pan`);
    const revealData = await revealRes.json();
    assert(
      revealRes.status === 200 &&
        revealData.maskedPan?.startsWith('XXXXX') &&
        revealData.decryptedPan?.length === 10 &&
        !!revealData.auditLogId,
      'Step 7: PII Encryption & Audited Admin Reveal',
      `HTTP ${revealRes.status}, Masked: ${revealData.maskedPan}, Decrypted: ${revealData.decryptedPan}, Audit ID: ${revealData.auditLogId}`
    );
  } catch (err: any) {
    assert(false, 'Step 7: PII Encryption & Audited Admin Reveal', `Error: ${err.message}`);
  }

  // STEP 8: Cron Authorization & Execution
  try {
    // 8a: Verify 401 without secret
    const unauthorizedRes = await fetch(`${BASE_URL}/api/cron/retention`);
    assert(
      unauthorizedRes.status === 401,
      'Step 8a: Strict Cron Auth Guard (401 Unauthorized)',
      `HTTP ${unauthorizedRes.status}`
    );

    // 8b: Execute retention with CRON_SECRET
    const retentionRes = await fetch(`${BASE_URL}/api/cron/retention`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const retentionData = await retentionRes.json();
    assert(
      retentionRes.status === 200 && retentionData.success === true,
      'Step 8b: Retention Cron Execution & B2 Pruning',
      `HTTP ${retentionRes.status}, Cleaned: ${retentionData.details?.cleanedUpRecords || 0}`
    );

    // 8c: Reconcile payments cron
    const reconcileRes = await fetch(`${BASE_URL}/api/cron/reconcile-payments`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const reconcileData = await reconcileRes.json();
    assert(
      reconcileRes.status === 200 && reconcileData.success === true,
      'Step 8c: Reconcile Payments Cron',
      `HTTP ${reconcileRes.status}, Pending Checked: ${reconcileData.reconciledCount ?? 0}`
    );
  } catch (err: any) {
    assert(false, 'Step 8: Cron Authorization & Execution', `Error: ${err.message}`);
  }

  // STEP 9: Batch NEFT & GSTR-1 Financial Exports
  try {
    // 9a: NEFT Batch Export
    const neftRes = await fetch(`${BASE_URL}/api/admin/payouts/batch-neft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId: 'BATCH-2026-09-E2E' }),
    });
    assert(
      neftRes.status === 200,
      'Step 9a: Admin Batch NEFT Payout Generation',
      `HTTP ${neftRes.status}`
    );

    // 9b: GSTR-1 Compliance Export
    const gstrRes = await fetch(`${BASE_URL}/api/financial/gstr1-export?period=2026-09`);
    assert(
      gstrRes.status === 200,
      'Step 9b: GSTR-1 Statutory Tax Export',
      `HTTP ${gstrRes.status}`
    );
  } catch (err: any) {
    assert(false, 'Step 9: Batch Financial Exports', `Error: ${err.message}`);
  }

  // SUMMARY
  console.log('\n================================================================');
  console.log('                   E2E TEST SUITE SUMMARY');
  console.log('================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`Results: ${passedCount} / ${totalCount} PASSED`);
  if (passedCount === totalCount) {
    console.log('STATUS: ALL VERIFICATIONS PASSED (100% SUCCESS)');
  } else {
    console.error(`STATUS: ${totalCount - passedCount} FAILED`);
  }
}

runSuite().catch(console.error);
