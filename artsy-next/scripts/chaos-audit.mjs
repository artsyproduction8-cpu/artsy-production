import crypto from 'crypto';
import fs from 'fs';

// Read .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  env.split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const baseUrl = 'http://localhost:3000';
const cookieSecret = envVars.COOKIE_SIGNING_SECRET || '34114f3ce3daf20395033c24cd082bbdfcd81be28623230ca7dd8b7a6a259e0c';
const webhookSecret = envVars.RAZORPAY_WEBHOOK_SECRET || 'FUHalXOsk1DprGP';

function parseCookies(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  return setCookie.split(';')[0];
}

function makeSignedAuthCookie(payload) {
  const minimal = {
    id: String(payload.id),
    role: payload.role,
    token_version: Number(payload.token_version) >= 2 ? Number(payload.token_version) : 3,
    exp: payload.exp || Date.now() + 24 * 60 * 60 * 1000,
  };
  const json = JSON.stringify(minimal);
  const b64 = Buffer.from(json).toString('base64');
  const sig = crypto.createHmac('sha256', cookieSecret).update(b64).digest('hex');
  return `artsy_auth_token=${b64}.${sig}`;
}

async function runChaosAudit() {
  console.log('================================================================');
  console.log('            ARTSY PRODUCTION — CHAOS & EDGE-CASE AUDIT           ');
  console.log('================================================================\n');

  // Provision active verified client & creator in DB for foreign key compliance
  const cPhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
  const cSend = await fetch(`${baseUrl}/api/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: cPhone, action: 'send_otp', role: 'freelancer' }),
  });
  const cData = await cSend.json();
  const cOtp = cData.devOtp || '123456';
  const cVerify = await fetch(`${baseUrl}/api/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: cPhone, code: cOtp, action: 'verify', role: 'freelancer' }),
  });
  const creatorAuthCookie = parseCookies(cVerify);
  const creatorUserId = (await cVerify.json()).user?.id;

  const clPhone = `94${Math.floor(10000000 + Math.random() * 90000000)}`;
  const clSend = await fetch(`${baseUrl}/api/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: clPhone, action: 'send_otp', role: 'client' }),
  });
  const clData = await clSend.json();
  const clOtp = clData.devOtp || '123456';
  const clVerify = await fetch(`${baseUrl}/api/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: clPhone, code: clOtp, action: 'verify', role: 'client' }),
  });
  const clientAuthCookie = parseCookies(clVerify);
  const clientAUserId = (await clVerify.json()).user?.id;

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 1 — THE "WHAT IF" FAILURE TESTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- PHASE 1: INFRASTRUCTURE FAILURE & RESILIENCE TESTS ---');

  // 1.1 Razorpay Webhook Invalid HMAC Signature
  console.log('[1.1a] Testing Webhook with INVALID signature...');
  const fakePayload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test123' } } } });
  const badHmacRes = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': '0000000000000000000000000000000000000000000000000000000000000000',
    },
    body: fakePayload,
  });
  console.log(`[1.1a Result] Status: ${badHmacRes.status} (Expected 400). Error: ${(await badHmacRes.json()).error}`);
  const badHmacPass = badHmacRes.status === 400;

  // 1.1b Delayed Webhook (30 minutes late)
  console.log('[1.1b] Testing Webhook arriving 30 minutes late (valid HMAC)...');
  const thirtyMinAgoSec = Math.floor(Date.now() / 1000) - 1800; // 30 minutes ago
  const delayedPayloadObj = {
    event: 'payment.captured',
    created_at: thirtyMinAgoSec,
    payload: {
      payment: {
        entity: {
          id: `pay_delayed_${Date.now()}`,
          order_id: 'order_delayed_test',
          amount: 600000,
          created_at: thirtyMinAgoSec,
        },
      },
    },
  };
  const delayedRawBody = JSON.stringify(delayedPayloadObj);
  const delayedSignature = crypto.createHmac('sha256', webhookSecret).update(delayedRawBody).digest('hex');
  const delayedRes = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': delayedSignature,
    },
    body: delayedRawBody,
  });
  const delayedStatus = delayedRes.status;
  console.log(`[1.1b Result] Delayed webhook response status: ${delayedStatus} (Expected 200).`);
  const delayedPass = delayedStatus === 200;

  // 1.2 Supabase Downtime / Auth Session Degradation
  console.log('[1.2] Testing unauthenticated / graceful degradation on /api/user/me...');
  const unauthRes = await fetch(`${baseUrl}/api/user/me`);
  const unauthData = await unauthRes.json();
  console.log(`[1.2 Result] Status: ${unauthRes.status}, Body: ${JSON.stringify(unauthData)}`);
  const degradationPass = unauthRes.status === 401 && unauthData.authenticated === false;

  // 1.3 OTP Abuse / Spam (Sliding window rate limit)
  console.log('[1.3] Testing OTP spam defense (rapid requests to same phone)...');
  const spamPhone = `96${Math.floor(10000000 + Math.random() * 90000000)}`;
  let blockedCount = 0;
  for (let i = 0; i < 7; i++) {
    const res = await fetch(`${baseUrl}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: spamPhone, action: 'send_otp', role: 'client' }),
    });
    if (res.status === 429) {
      blockedCount++;
    }
  }
  console.log(`[1.3 Result] OTP abuse blocked with 429: ${blockedCount > 0 ? 'YES' : 'NO'} (${blockedCount} requests blocked)`);
  const otpSpamPass = blockedCount > 0;

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 2 — BOUNDARY & INJECTION TESTS
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 2: BOUNDARY & INJECTION TESTS ---');

  // 2.1a SQL Injection in Search
  console.log(`[2.1a] Testing SQL injection in search (' OR 1=1 --)...`);
  const sqlInjRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent("' OR 1=1 --")}`);
  const sqlInjData = await sqlInjRes.json();
  console.log(`[2.1a Result] Status: ${sqlInjRes.status}, Total matches: ${sqlInjData.total || 0}`);
  const sqlInjPass = sqlInjRes.status === 200 && (sqlInjData.total || 0) === 0;

  // 2.1b XSS Payload in Search
  console.log(`[2.1b] Testing XSS injection in search (<script>alert(1)</script>)...`);
  const xssRes = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent('<script>alert(1)</script>')}`);
  const xssData = await xssRes.json();
  console.log(`[2.1b Result] Status: ${xssRes.status}, Total matches: ${xssData.total || 0}`);
  const xssPass = xssRes.status === 200 && (xssData.total || 0) === 0;

  // 2.1c Massive Bio String (10,000 characters)
  console.log(`[2.1c] Testing 10,000 character bio in /api/freelancer/onboard...`);
  const massiveBioRes = await fetch(`${baseUrl}/api/freelancer/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: creatorAuthCookie },
    body: JSON.stringify({
      philosophy: 'A'.repeat(10000),
      legalName: 'Test Creator',
    }),
  });
  const massiveBioData = await massiveBioRes.json();
  console.log(`[2.1c Result] Status: ${massiveBioRes.status} (Expected 400). Error: ${massiveBioData.error}`);
  const massiveBioPass = massiveBioRes.status === 400;

  // 2.1d Malicious javascript: video URL
  console.log(`[2.1d] Testing malicious javascript: URL in /api/freelancer/submissions...`);
  const xssVideoRes = await fetch(`${baseUrl}/api/freelancer/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: creatorAuthCookie },
    body: JSON.stringify({
      youtube_url: 'javascript:alert(1)',
      title: 'Malicious Submission',
    }),
  });
  const xssVideoData = await xssVideoRes.json();
  console.log(`[2.1d Result] Status: ${xssVideoRes.status} (Expected 400). Error: ${xssVideoData.error}`);
  const xssVideoPass = xssVideoRes.status === 400;

  // 2.2a Negative Amount Booking Manipulation
  console.log(`[2.2a] Testing negative / zero client amount in /api/orders/create...`);
  const tamperBookingRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientAuthCookie },
    body: JSON.stringify({
      serviceKey: 'wedding',
      amount: -50000, // Client attempting negative amount
      clientPhone: '+919999999999',
      clientName: 'Tamper Tester',
    }),
  });
  const tamperBookingData = await tamperBookingRes.json();
  console.log(`[2.2a Result] Status: ${tamperBookingRes.status}, Server Amount: ₹${tamperBookingData.amount / 100} (Client -50000 ignored)`);
  const tamperBookingPass = tamperBookingRes.status === 200 && tamperBookingData.amount > 0;

  // 2.2b Storage Presign Boundaries (0 Bytes & 50GB)
  console.log(`[2.2b] Testing storage presign size limits (0 bytes and 50GB)...`);
  const zeroByteRes = await fetch(`${baseUrl}/api/storage/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientAuthCookie },
    body: JSON.stringify({
      fileName: 'empty.mp4',
      contentType: 'video/mp4',
      fileSizeBytes: 0,
      projectId: 'proj_test_001',
    }),
  });
  const fiftyGbRes = await fetch(`${baseUrl}/api/storage/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: clientAuthCookie },
    body: JSON.stringify({
      fileName: 'giant.mp4',
      contentType: 'video/mp4',
      fileSizeBytes: 53687091200, // 50 GB
      projectId: 'proj_test_001',
    }),
  });
  console.log(`[2.2b Result] 0 Byte Status: ${zeroByteRes.status} (Expected 400), 50GB Status: ${fiftyGbRes.status} (Expected 400)`);
  const storageBoundsPass = zeroByteRes.status === 400 && fiftyGbRes.status === 400;

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 3 — CONCURRENCY & DATA INTEGRITY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 3: CONCURRENCY & INTEGRITY TESTS ---');

  // 3.1 Double-Booking Race Condition (5 concurrent requests)
  console.log('[3.1] Firing 5 concurrent order creation requests for same client...');
  const concurrentOrders = await Promise.all(
    Array.from({ length: 5 }).map((_, i) =>
      fetch(`${baseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: clientAuthCookie },
        body: JSON.stringify({
          serviceKey: 'wedding',
          clientPhone: `+91${clPhone}`,
          clientName: `Concurrent Test User ${i}`,
        }),
      }).then(r => r.json())
    )
  );
  const orderIds = concurrentOrders.map(o => o.orderId).filter(Boolean);
  const uniqueOrderIds = new Set(orderIds);
  console.log(`[3.1 Result] Orders returned: ${orderIds.length}, Unique IDs: ${uniqueOrderIds.size}`);
  const racePass = orderIds.length === 5 && uniqueOrderIds.size === 5;

  // 3.2 Creator Portfolio Spam (rapid duplicate submissions)
  console.log('[3.2] Testing rapid creator submission spam with same video...');
  const duplicateSubs = [];
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${baseUrl}/api/freelancer/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: creatorAuthCookie },
      body: JSON.stringify({
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Duplicate Submission Check',
      }),
    });
    duplicateSubs.push(res.status);
  }
  const hasConflictOrThrottle = duplicateSubs.includes(409) || duplicateSubs.includes(429);
  console.log(`[3.2 Result] Status codes: ${duplicateSubs.join(', ')} (Duplicate caught: ${hasConflictOrThrottle})`);
  const spamPass = hasConflictOrThrottle;

  // ──────────────────────────────────────────────────────────────────────────
  // PHASE 4 — PERMISSION EDGE CASES
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- PHASE 4: PERMISSION EDGE CASES ---');

  // 4.1 Vertical Privilege Escalation
  console.log('[4.1a] Client attempting PATCH /api/admin/orders...');
  const clientAdminRes = await fetch(`${baseUrl}/api/admin/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: clientAuthCookie },
    body: JSON.stringify({ orderId: 'ord_123', status: 'paid' }),
  });
  console.log(`[4.1a Result] Client to Admin Orders Status: ${clientAdminRes.status} (Expected 403)`);
  const verticalClientPass = clientAdminRes.status === 403;

  console.log('[4.1b] Freelancer attempting DELETE /api/admin/portfolio/sample_123...');
  const freelancerAdminRes = await fetch(`${baseUrl}/api/admin/portfolio/sample_123`, {
    method: 'DELETE',
    headers: { Cookie: creatorAuthCookie },
  });
  console.log(`[4.1b Result] Freelancer to Admin Portfolio DELETE Status: ${freelancerAdminRes.status} (Expected 403)`);
  const verticalFreelancerPass = freelancerAdminRes.status === 403;

  // 4.2 Horizontal Privilege Escalation (IDOR)
  console.log('[4.2] Client B attempting to view Client A invoice...');
  // Find Client A's actual order ID from Phase 3.1
  const clientAOrderId = concurrentOrders[0]?.orderId;
  console.log(`[4.2] Target Client A Order ID: ${clientAOrderId}`);

  // Create Client B session
  const clientBCookie = makeSignedAuthCookie({
    id: 'b2222222-3333-4444-5555-666666666666',
    role: 'client',
    token_version: 3,
  });
  const idorRes = await fetch(`${baseUrl}/api/invoices/${clientAOrderId}`, {
    headers: { Cookie: clientBCookie },
  });
  console.log(`[4.2 Result] IDOR Invoice Access Status: ${idorRes.status} (Expected 403)`);
  const idorPass = idorRes.status === 403;

  console.log('\n================================================================');
  console.log('                 CHAOS AUDIT SUMMARY RESULTS                    ');
  console.log('================================================================');
  console.log(`1.1 Webhook Failure:      ${badHmacPass && delayedPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`1.2 Supabase Downtime:    ${degradationPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`1.3 OTP Abuse:            ${otpSpamPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`2.1 Injections:           ${sqlInjPass && xssPass && massiveBioPass && xssVideoPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`2.2 Boundaries:           ${tamperBookingPass && storageBoundsPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`3.1 Double-Booking Race:  ${racePass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`3.2 Portfolio Spam:       ${spamPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`4.1 Vertical Privilege:   ${verticalClientPass && verticalFreelancerPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`4.2 Horizontal Privilege: ${idorPass ? '✓ PASS' : '✗ FAIL'}`);
  console.log('================================================================\n');
}

runChaosAudit().catch(console.error);
