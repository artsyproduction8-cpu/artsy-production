import crypto from 'crypto';

const COOKIE_SIGNING_SECRET = process.env.COOKIE_SIGNING_SECRET || '';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://artsyproduction.com';

function signCookie(payload) {
  const payloadWithExp = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const jsonStr = JSON.stringify(payloadWithExp);
  const base64 = Buffer.from(jsonStr).toString('base64');
  const hmac = crypto.createHmac('sha256', COOKIE_SIGNING_SECRET).update(base64).digest('hex');
  return `${base64}.${hmac}`;
}

const clientA = {
  id: 'a6f142bf-69b8-4c45-947b-37d67e90fa32',
  role: 'client',
  email: 'test9999@artsyproduction.in',
  phone: '+919999999999',
  full_name: 'Client A Test',
};
const cookieA = signCookie(clientA);

async function executeAll() {
  console.log('========================================================================');
  console.log('  ARTSY PRODUCTION — COMPREHENSIVE SECURITY FIX VERIFICATION SUITE       ');
  console.log('========================================================================\n');

  // TEST A: Presign & Invoice IDOR
  console.log('=== TEST A: Presign & Invoice IDOR Prevention ===');
  
  // A1: Client A -> Client B's project
  const resA1 = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      projectId: 'aae0af60-844e-44a2-b8b5-ec7e4e2acd60',
      fileName: 'leak_attempt.mp4',
    }),
  });
  console.log('Test A1 (Client A -> Client B Project Presign):');
  console.log(`Status: ${resA1.status} | Body: ${await resA1.text()}`);

  // A2: Client A -> Own project
  const resA2 = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      projectId: '18bb488c-1675-4ec2-a47d-009dd97b6a96',
      fileName: 'my_footage.mp4',
    }),
  });
  console.log('\nTest A2 (Client A -> Own Project Presign):');
  console.log(`Status: ${resA2.status} | Body: ${await resA2.text()}`);

  // A3: Client A -> Non-existent project
  const resA3 = await fetch(`${BASE_URL}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${cookieA}`,
    },
    body: JSON.stringify({
      projectId: '00000000-0000-0000-0000-000000000000',
      fileName: 'ghost.mp4',
    }),
  });
  console.log('\nTest A3 (Client A -> Non-existent Project Presign):');
  console.log(`Status: ${resA3.status} | Body: ${await resA3.text()}`);

  // A4: Client A -> Client B's Order Invoice
  const resA4 = await fetch(`${BASE_URL}/api/invoices/fb8b50f0-ff14-46d6-a969-5d0051c933a2?format=json`, {
    method: 'GET',
    headers: {
      Cookie: `artsy_auth_token=${cookieA}`,
    },
  });
  console.log('\nTest A4 (Client A -> Client B Order Invoice):');
  console.log(`Status: ${resA4.status} | Body: ${await resA4.text()}`);

  // A5: Client A -> Own Order Invoice
  const resA5 = await fetch(`${BASE_URL}/api/invoices/36781e00-7c6b-4ffb-bdd2-adbeaa537bb0?format=json`, {
    method: 'GET',
    headers: {
      Cookie: `artsy_auth_token=${cookieA}`,
    },
  });
  console.log('\nTest A5 (Client A -> Own Order Invoice):');
  console.log(`Status: ${resA5.status} | Body: ${await resA5.text()}`);

  // TEST B: Razorpay Webhook Timing-Safe Signature Check
  console.log('\n=== TEST B: Razorpay Webhook Timing-Safe Verification ===');
  const resB = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': 'fake_signature_hex_attack_vector_12345',
    },
    body: JSON.stringify({ event: 'payment.captured' }),
  });
  console.log(`Status: ${resB.status} | Body: ${await resB.text()}`);

  // TEST C: Meta WhatsApp Webhook Signature Verification
  console.log('\n=== TEST C: Meta WhatsApp Webhook Signature Verification ===');
  const resC1 = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ test: true }),
  });
  console.log(`Without Header -> Status: ${resC1.status} | Body: ${await resC1.text()}`);

  const resC2 = await fetch(`${BASE_URL}/api/whatsapp/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': 'sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    },
    body: JSON.stringify({ test: true }),
  });
  console.log(`With Fake Header -> Status: ${resC2.status} | Body: ${await resC2.text()}`);

  // TEST D: User Enumeration Blocked
  console.log('\n=== TEST D: User Enumeration Blocked ===');
  const resD = await fetch(`${BASE_URL}/api/auth/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'lookup',
      identifier: '917777078742',
    }),
  });
  console.log(`Lookup 917777078742 -> Status: ${resD.status} | Body: ${await resD.text()}`);

  const resD2 = await fetch(`${BASE_URL}/api/auth/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'lookup',
      identifier: 'nonexistent_user_99999@example.com',
    }),
  });
  console.log(`Lookup Non-existent -> Status: ${resD2.status} | Body: ${await resD2.text()}`);

  // TEST E: Email Dispatch Domain
  console.log('\n=== TEST E: Email Sender Domain Test ===');
  const resE = await fetch(`${BASE_URL}/api/auth/otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'artsyproduction8@gmail.com',
      role: 'client',
      consentGiven: true,
    }),
  });
  console.log(`Send Email OTP -> Status: ${resE.status} | Body: ${await resE.text()}`);
}

executeAll().catch(console.error);
