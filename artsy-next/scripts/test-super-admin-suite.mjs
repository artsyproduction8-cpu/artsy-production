import fs from 'fs';
import path from 'path';

// Read COOKIE_SIGNING_SECRET from .env.local
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const secretMatch = envContent.match(/COOKIE_SIGNING_SECRET=([^\r\n]+)/);
const COOKIE_SIGNING_SECRET = secretMatch[1].trim();

// Crypto HMAC
import crypto from 'crypto';

function signCookie(payload) {
  const payloadWithExp = {
    ...payload,
    exp: Date.now() + 604800000,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payloadWithExp), 'utf-8').toString('base64');
  const signature = crypto.createHmac('sha256', COOKIE_SIGNING_SECRET).update(payloadBase64).digest('hex');
  return encodeURIComponent(`${payloadBase64}.${signature}`);
}

const SUPER_ADMIN = {
  id: '50d2d4d3-b55f-4c9c-8281-a3fa324c52ad',
  phone: '+917777078742',
  email: 'lilsammy96@gmail.com',
  role: 'super_admin',
  full_name: 'Super Admin'
};

const STANDARD_ADMIN = {
  id: '87bee9c7-03a7-4259-81ed-64f434d8e5a0',
  phone: '+919876543212',
  email: 'admin@artsyprod.studio',
  role: 'admin',
  full_name: 'Studio Director'
};

const CLIENT_USER = {
  id: 'a6f142bf-69b8-4c45-947b-37d67e90fa32',
  phone: '+919999999999',
  email: 'test9999@artsyproduction.in',
  role: 'client',
  full_name: 'Demo Member'
};

const PROD_BASE = 'https://artsyproduction.com';

async function testSuite() {
  console.log('=== STARTING 5-TEST VERIFICATION SUITE ===\n');

  const superAdminCookie = signCookie(SUPER_ADMIN);
  const adminCookie = signCookie(STANDARD_ADMIN);

  // TEST 1: Super admin OTP verify returns role 'super_admin'
  console.log('--- TEST 1: Super Admin Login / User Resolution ---');
  // First insert an active OTP session for verification
  // In production, when Meta WhatsApp OTP is verified, the client sends code:
  // Using previously verified token or fresh code verification:
  const res1 = await fetch(`${PROD_BASE}/api/auth/otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+917777078742',
      action: 'verify',
      code: '787421'
    })
  });
  const data1 = await res1.json().catch(() => ({}));
  console.log('Test 1 Status:', res1.status);
  console.log('Test 1 Set-Cookie Header:', Boolean(res1.headers.get('set-cookie')));
  console.log('Test 1 Response Body:', JSON.stringify(data1, null, 2));

  // TEST 2: Super admin cannot be deleted
  console.log('\n--- TEST 2: Super Admin Cannot Be Deleted ---');
  // 2a: Test via deletion API
  const res2 = await fetch(`${PROD_BASE}/api/user/data-deletion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${superAdminCookie}`
    },
    body: JSON.stringify({ userId: SUPER_ADMIN.id, confirm: true })
  });
  const data2 = await res2.json().catch(() => ({}));
  console.log('Test 2 API Deletion Status:', res2.status);
  console.log('Test 2 API Response:', JSON.stringify(data2, null, 2));

  // TEST 3: Super admin cannot be modified by other admin
  console.log('\n--- TEST 3: Super Admin Cannot Be Modified by Other Admin ---');
  // Attempt to modify user role of super admin using standard admin credentials
  const res3 = await fetch(`${PROD_BASE}/api/admin/users/${SUPER_ADMIN.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${adminCookie}`
    },
    body: JSON.stringify({ role: 'admin' })
  });
  const data3 = await res3.json().catch(() => ({}));
  console.log('Test 3 (Admin attempting to modify Super Admin) Status:', res3.status);
  console.log('Test 3 Response:', JSON.stringify(data3, null, 2));

  // TEST 4: Super admin can promote another user to admin
  console.log('\n--- TEST 4: Super Admin Promotes User to Admin ---');
  const res4 = await fetch(`${PROD_BASE}/api/admin/users/${CLIENT_USER.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${superAdminCookie}`
    },
    body: JSON.stringify({ role: 'admin' })
  });
  const data4 = await res4.json().catch(() => ({}));
  console.log('Test 4 Status:', res4.status);
  console.log('Test 4 Response:', JSON.stringify(data4, null, 2));

  // Revert back to client
  console.log('Reverting user back to client role...');
  const res4Revert = await fetch(`${PROD_BASE}/api/admin/users/${CLIENT_USER.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${superAdminCookie}`
    },
    body: JSON.stringify({ role: 'client' })
  });
  const data4Revert = await res4Revert.json().catch(() => ({}));
  console.log('Revert Status:', res4Revert.status, 'Response:', JSON.stringify(data4Revert));

  // TEST 5: Super admin cannot be demoted
  console.log('\n--- TEST 5: Super Admin Cannot Be Demoted ---');
  const res5 = await fetch(`${PROD_BASE}/api/admin/users/${SUPER_ADMIN.id}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `artsy_auth_token=${superAdminCookie}`
    },
    body: JSON.stringify({ role: 'admin' })
  });
  const data5 = await res5.json().catch(() => ({}));
  console.log('Test 5 Demotion Status:', res5.status);
  console.log('Test 5 Demotion Response:', JSON.stringify(data5, null, 2));

  console.log('\n=== SUITE COMPLETE ===');
}

testSuite();
