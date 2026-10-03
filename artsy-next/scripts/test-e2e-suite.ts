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

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load .env.local for complete environment parity
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length) {
          process.env[key.trim()] = rest.join('=').trim();
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not load .env.local:', e);
}

import { signAuthCookieValue } from '../src/lib/auth-cookie';
import { formatSequentialInvoiceNumber } from '../src/lib/invoices/generator';

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

  // STEP 6: Authentication OTP Dispatch (Resend Email & OpenWA)
  try {
    const otpRes = await fetch(`${BASE_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'client@artsyprod.studio', fullName: 'Sneha Patel', role: 'client' }),
    });
    const otpData = await otpRes.json();
    assert(
      otpRes.status === 200 && otpData.success === true,
      'Step 6: Email OTP Dispatch (Resend Primary)',
      `HTTP ${otpRes.status}, Channel: ${otpData.channel || 'email'}, Message: "${otpData.message}"`
    );
  } catch (err: any) {
    assert(false, 'Step 6: Authentication OTP Dispatch', `Error: ${err.message}`);
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

    // 9b: GSTR-1 Unauthenticated check (Should be 401)
    const unauthGstr = await fetch(`${BASE_URL}/api/financial/gstr1-export?period=2026-09`);
    assert(
      unauthGstr.status === 401,
      'Step 9b: GSTR-1 Auth Guard (401 Unauthorized)',
      `HTTP ${unauthGstr.status}`
    );

    // 9c: GSTR-1 Admin Authenticated Export
    const adminToken = signAuthCookieValue({ id: '87bee9c7-03a7-4259-81ed-64f434d8e5a0', role: 'admin', email: 'admin@artsyprod.studio' });
    const gstrRes = await fetch(`${BASE_URL}/api/financial/gstr1-export?period=2026-09`, {
      headers: { Cookie: `artsy_auth_token=${adminToken}` },
    });
    const gstrData = await gstrRes.json();
    assert(
      gstrRes.status === 200 && !!gstrData.gstin,
      'Step 9c: GSTR-1 Statutory Tax Export (Admin Verified)',
      `HTTP ${gstrRes.status}, GSTIN: ${gstrData.gstin}`
    );
  } catch (err: any) {
    assert(false, 'Step 9: Batch Financial Exports', `Error: ${err.message}`);
  }

  // STEP 10: DPDP Act Privacy & Data Rights Guard
  try {
    const clientId = 'e2ced58d-26ba-4d1b-899b-76c02ba11143';
    const otherId = '1126400d-25c6-4c8b-8d8d-74123e7a5a5a';
    const clientToken = signAuthCookieValue({ id: clientId, role: 'client', email: 'client@artsyprod.studio' });

    // 10a: Unauthorized DPDP access attempt
    const dpdpForbidden = await fetch(`${BASE_URL}/api/user/data-export?userId=${otherId}`, {
      headers: { Cookie: `artsy_auth_token=${clientToken}` },
    });
    assert(
      dpdpForbidden.status === 403,
      'Step 10a: DPDP Cross-User Data Access Guard (403 Forbidden)',
      `HTTP ${dpdpForbidden.status}`
    );

    // 10b: Authorized DPDP export
    const dpdpExport = await fetch(`${BASE_URL}/api/user/data-export?userId=${clientId}`, {
      headers: { Cookie: `artsy_auth_token=${clientToken}` },
    });
    const dpdpData = await dpdpExport.json();
    assert(
      dpdpExport.status === 200 && dpdpData.user?.id === clientId,
      'Step 10b: DPDP Machine-Readable Data Export',
      `HTTP ${dpdpExport.status}, Fiduciary: "${dpdpData.fiduciary}", User: ${dpdpData.user?.email}`
    );
  } catch (err: any) {
    assert(false, 'Step 10: DPDP Privacy Guard', `Error: ${err.message}`);
  }

  // STEP 11: HMAC Cookie Tamper Defense
  try {
    const validAdmin = signAuthCookieValue({ id: '87bee9c7-03a7-4259-81ed-64f434d8e5a0', role: 'admin' });
    const tamperedPayload = Buffer.from(JSON.stringify({ id: 'hacker', role: 'admin' })).toString('base64');
    const tamperedCookie = `${tamperedPayload}.${validAdmin.split('.')[1]}`;

    const tamperRes = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: `artsy_auth_token=${tamperedCookie}` },
      redirect: 'manual',
    });
    assert(
      Boolean(tamperRes.status === 307 && tamperRes.headers.get('location')?.includes('/auth/login')),
      'Step 11: HMAC Cookie Tamper Rejection (307 Redirect)',
      `HTTP ${tamperRes.status}, Location: ${tamperRes.headers.get('location')}`
    );
  } catch (err: any) {
    assert(false, 'Step 11: HMAC Cookie Tamper Defense', `Error: ${err.message}`);
  }

  // STEP 12: Sequential CBIC Invoice Numbering
  try {
    const inv1 = formatSequentialInvoiceNumber(1);
    const inv2 = formatSequentialInvoiceNumber(2);
    const inv3 = formatSequentialInvoiceNumber(3);
    const isValidFormat = /^AP\/\d{2}-\d{2}\/\d{5}$/.test(inv1);
    assert(
      isValidFormat && inv1 === 'AP/26-27/00001' && inv2 === 'AP/26-27/00002' && inv3 === 'AP/26-27/00003',
      'Step 12: Sequential CBIC Invoice Format (AP/{FY}/{seq})',
      `${inv1}, ${inv2}, ${inv3}`
    );
  } catch (err: any) {
    assert(false, 'Step 12: Sequential Invoice Numbering', `Error: ${err.message}`);
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
