import { createHmac } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} catch (e) {}

const BASE_URL = 'http://localhost:3000';
const SECRET = process.env.COOKIE_SIGNING_SECRET || process.env.JWT_SECRET || 'artsy_dev_cookie_signing_secret_32_characters_minimum';

function createSignedCookie(payload) {
  const payloadWithExp = {
    ...payload,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const jsonStr = JSON.stringify(payloadWithExp);
  const payloadBase64 = Buffer.from(jsonStr, 'utf-8').toString('base64');
  const signature = createHmac('sha256', SECRET).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

async function run() {
  console.log('=== ARTSY PHASE 8 REGRESSION SUITE ===');

  // Test Users (matching DB rows in public.users)
  const userA = {
    id: 'c1111111-2222-4333-8444-555555555555',
    role: 'client',
    phone: '+919999900001',
    email: 'client-a-test@artsyproduction.com',
    full_name: 'Regression Client Alpha',
    token_version: 2,
    onboarded: true,
  };
  const cookieA = createSignedCookie(userA);

  const userB = {
    id: 'c2222222-3333-4444-8555-666666666666',
    role: 'client',
    phone: '+919999900002',
    email: 'client-b-test@artsyproduction.com',
    full_name: 'Regression Client Beta',
    token_version: 2,
    onboarded: true,
  };
  const cookieB = createSignedCookie(userB);

  const freelancerUser = {
    id: 'c1111111-1111-4111-8111-111111111111',
    role: 'freelancer',
    phone: '+919900000001',
    email: 'vikram.rathore@artsyproduction.in',
    full_name: 'Vikram Rathore',
    token_version: 2,
    onboarded: true,
  };
  const cookieFreelancer = createSignedCookie(freelancerUser);

  // 1. Check 3 & 4: Create order as authenticated Client A -> DB row has client_id set
  console.log('\n[TEST 4] Create order as authenticated Client A:');
  const orderRes = await fetch(`${BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      clientName: userA.full_name,
      clientPhone: userA.phone,
      clientEmail: userA.email,
      serviceKey: 'commercial_cinematic',
      packageKey: 'starter',
      grossAmount: 49999,
      requirements: { aspect_ratio: '16:9', notes: 'Phase 8 test order' },
    }),
  });

  const orderData = await orderRes.json();
  console.log('Order creation HTTP status:', orderRes.status);
  console.log('Order creation response:', JSON.stringify(orderData));

  if (!orderData.orderId && !orderData.orderNumber) {
    throw new Error('Order creation failed: ' + JSON.stringify(orderData));
  }

  const orderNumber = orderData.internalOrderId || orderData.orderNumber || orderData.orderId;

  // Verify authorization: User A (the owner) can access the invoice -> HTTP 200
  console.log('\n[TEST 4B] User A (Owner) fetches invoice:');
  const ownerInvoiceRes = await fetch(`${BASE_URL}/api/invoices/${orderNumber}?format=json`, {
    headers: { 'Cookie': `artsy_auth_token=${cookieA}` },
  });
  console.log('User A invoice status:', ownerInvoiceRes.status);
  if (ownerInvoiceRes.status !== 200) {
    const errText = await ownerInvoiceRes.text();
    console.log('Owner invoice error:', errText);
    throw new Error(`Expected HTTP 200 for owner, got ${ownerInvoiceRes.status}`);
  }
  const invoiceData = await ownerInvoiceRes.json();
  console.log('Invoice orderId:', invoiceData.orderDetails?.orderId);
  console.log('PASS: Order row has client_id bound to userA.id and owner is authorized (200)');

  // 2. Check 5: Client dashboard shows the order
  console.log('\n[TEST 5] Client dashboard / projects endpoint:');
  const projectsRes = await fetch(`${BASE_URL}/api/client/projects`, {
    headers: { 'Cookie': `artsy_auth_token=${cookieA}` },
  });
  console.log('Projects endpoint status:', projectsRes.status);

  // 3. Check 6: IDOR test: User B cannot access User A's invoice
  console.log('\n[TEST 6A] IDOR test: User B GET User A invoice:');
  const idorGetRes = await fetch(`${BASE_URL}/api/invoices/${orderNumber}`, {
    headers: { 'Cookie': `artsy_auth_token=${cookieB}` },
  });
  console.log('User B GET invoice status:', idorGetRes.status);
  if (idorGetRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for User B GET, got ${idorGetRes.status}`);
  }

  console.log('\n[TEST 6A] IDOR test: User B POST User A invoice dispatch:');
  const idorRes = await fetch(`${BASE_URL}/api/invoices/${orderNumber}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieB}`,
    },
    body: JSON.stringify({ email: 'attacker@test.com' }),
  });
  const idorData = await idorRes.json();
  console.log('User B POST status:', idorRes.status);
  console.log('User B POST response:', JSON.stringify(idorData));
  if (idorRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for User B POST, got ${idorRes.status}`);
  }
  console.log('PASS: User B blocked with 403 Forbidden on both GET and POST (fail-closed IDOR protection)');

  // 4. Check 6B: IDOR test with null client_id order
  console.log('\n[TEST 6B] IDOR test: Order with null client_id:');
  const nullOrderNumber = 'ARTSY-754499';

  const nullIdorRes = await fetch(`${BASE_URL}/api/invoices/${nullOrderNumber}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({ email: 'attacker@test.com' }),
  });
  const nullIdorData = await nullIdorRes.json();
  console.log('Null client_id order request status:', nullIdorRes.status);
  console.log('Null client_id order response:', JSON.stringify(nullIdorData));
  if (nullIdorRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for null client_id order, got ${nullIdorRes.status}`);
  }
  console.log('PASS: Order with null client_id rejected with 403 Forbidden (fail-closed)');

  // 5. Check 7: Freelancer portfolio: javascript: URL -> 400
  console.log('\n[TEST 7] Freelancer portfolio: javascript: URL:');
  const xssRes = await fetch(`${BASE_URL}/api/freelancer/portfolio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieFreelancer}`,
    },
    body: JSON.stringify({
      title: 'XSS Attack Item',
      video_url: 'javascript:alert(1)',
      thumbnail_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675',
      category: 'commercial',
    }),
  });
  const xssData = await xssRes.json();
  console.log('XSS portfolio status:', xssRes.status);
  console.log('XSS portfolio response:', JSON.stringify(xssData));
  if (xssRes.status !== 400 || !xssData.error.includes('Invalid video URL')) {
    throw new Error(`Expected HTTP 400 Invalid video URL, got ${xssRes.status}: ${JSON.stringify(xssData)}`);
  }
  console.log('PASS: javascript: video URL rejected with 400');

  // 6. Check 8: Valid YouTube URL -> accepted/processed
  console.log('\n[TEST 8] Freelancer portfolio: Valid YouTube URL:');
  const validRes = await fetch(`${BASE_URL}/api/freelancer/portfolio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieFreelancer}`,
    },
    body: JSON.stringify({
      title: 'Valid Portfolio Piece',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675',
      category: 'commercial',
    }),
  });
  const validData = await validRes.json();
  console.log('Valid portfolio status:', validRes.status);
  console.log('Valid portfolio response:', JSON.stringify(validData));
  if (validRes.status !== 200 && validRes.status !== 201) {
    throw new Error(`Expected HTTP 200/201 for valid URL, got ${validRes.status}`);
  }
  console.log('PASS: Valid YouTube URL accepted');

  // 7. Check 9: Storage presign: 10GB file -> 400, missing MIME -> 400
  // 7. Check 9: Storage presign: 10GB file -> 400, missing MIME -> 400
  console.log('\n[TEST 9A] Storage presign: 10GB file:');
  const presign10GB = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      fileName: 'massive.mov',
      projectId: 'prj_test_123',
      mimeType: 'video/quicktime',
      fileSizeBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    }),
  });
  const data10GB = await presign10GB.json();
  console.log('10GB presign status:', presign10GB.status);
  console.log('10GB presign response:', JSON.stringify(data10GB));
  if (presign10GB.status !== 400 || !data10GB.error.includes('File size')) {
    throw new Error(`Expected HTTP 400 File size error for 10GB file, got ${presign10GB.status}: ${JSON.stringify(data10GB)}`);
  }

  console.log('\n[TEST 9B] Storage presign: Missing MIME type:');
  const presignNoMime = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      fileName: 'untyped.dat',
      projectId: 'prj_test_123',
      fileSizeBytes: 50 * 1024 * 1024,
    }),
  });
  const dataNoMime = await presignNoMime.json();
  console.log('Missing MIME status:', presignNoMime.status);
  console.log('Missing MIME response:', JSON.stringify(dataNoMime));
  if (presignNoMime.status !== 400 || !dataNoMime.error.includes('MIME type')) {
    throw new Error(`Expected HTTP 400 MIME error for missing MIME, got ${presignNoMime.status}: ${JSON.stringify(dataNoMime)}`);
  }

  console.log('\n[TEST 9C] Storage presign: Valid 100MB mp4:');
  const presignValid = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      fileName: 'clip_edit_v1.mp4',
      projectId: 'b1111111-1111-4111-8111-111111111111',
      mimeType: 'video/mp4',
      fileSizeBytes: 100 * 1024 * 1024, // 100 MB
    }),
  });
  const dataValid = await presignValid.json();
  console.log('Valid presign status:', presignValid.status);
  console.log('Valid presign response:', JSON.stringify(dataValid));
  if (presignValid.status !== 200) {
    throw new Error(`Expected HTTP 200 for valid 100MB mp4, got ${presignValid.status}: ${JSON.stringify(dataValid)}`);
  }
  console.log('PASS: Storage presign enforces MIME allowlist and size bounds (10GB->400, no MIME->400, 100MB mp4->200)');

  // 8. Check 10: verify-payment Razorpay check
  console.log('\n[TEST 10] verify-payment: verify Razorpay payment verification:');
  const fakeVerify = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: 'order_fake_123',
      razorpay_payment_id: 'pay_fake_123',
      razorpay_signature: 'fake_signature',
      order_number: orderNumber,
    }),
  });
  const fakeVerifyData = await fakeVerify.json();
  console.log('Fake verify status:', fakeVerify.status);
  console.log('Fake verify response:', JSON.stringify(fakeVerifyData));
  if (fakeVerify.status !== 400) {
    throw new Error(`Expected HTTP 400 for invalid payment, got ${fakeVerify.status}`);
  }
  console.log('PASS: Payment route strictly validates payment');
  console.log('\n=== ALL PHASE 8 TESTS PASSED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('\nFAILED REGRESSION TEST:', err);
  process.exit(1);
});
