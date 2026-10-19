import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { 'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026' } },
});

async function runRegressionTest() {
  console.log(`\n===============================================================`);
  console.log(` PHASE 2.3: DATA LOSS REGRESSION & ADMIN PORTFOLIO CHECK`);
  console.log(`===============================================================\n`);

  // PART A: Client Data Loss & Onboarding Test
  const testPhone = '9998887766';
  const testOtp = '819203';
  const testName = 'Vikram Malhotra Enterprises';
  console.log(`[Part A] Setting up Client Onboarding test for +91${testPhone}...`);

  // 1. Clean existing user if any
  await sb.from('users').delete().eq('phone', `+91${testPhone}`);
  await sb.from('otp_sessions').delete().eq('phone', testPhone);

  // 2. Insert valid OTP session
  const otpHash = await bcrypt.hash(testOtp, 10);
  await sb.from('otp_sessions').insert({
    phone: testPhone,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() + 600000).toISOString(),
    verified: false,
    ip_address: '127.0.0.1',
    role: 'client',
  });

  // 3. First login via verify
  console.log(`[Part A] Logging in first time via POST /api/auth/otp...`);
  const loginRes1 = await fetch('http://localhost:3000/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testPhone,
      action: 'verify',
      code: testOtp,
      role: 'client',
    }),
  });

  const loginCookie1 = loginRes1.headers.get('set-cookie');
  const loginData1 = await loginRes1.json();
  console.log(`[Part A] First login response: status=${loginRes1.status}, success=${loginData1.success}, user_id=${loginData1.user?.id}`);

  // Extract auth cookie
  const cookieHeader = loginCookie1?.split(';')[0];

  // 4. Update Profile & Complete Onboarding
  console.log(`[Part A] Completing onboarding and updating full_name to "${testName}"...`);
  const updateRes = await fetch('http://localhost:3000/api/user/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      full_name: testName,
      onboarded: true,
      display_name: 'Vikram Malhotra',
    }),
  });
  const updateData = await updateRes.json();
  console.log(`[Part A] Update profile response: status=${updateRes.status}, success=${updateData.success}`);

  // 5. Verify GET /api/user/me
  const meRes1 = await fetch('http://localhost:3000/api/user/me', {
    headers: { Cookie: cookieHeader },
  });
  const meData1 = await meRes1.json();
  console.log(`[Part A] GET /api/user/me immediately after onboarding:`, {
    full_name: meData1.user?.full_name,
    onboarded: meData1.user?.onboarded,
  });

  // 6. Simulate Logout: Discard cookie
  console.log(`[Part A] Logging out (discarding auth token)...`);

  // 7. Second Login via new OTP
  console.log(`[Part A] Re-authenticating user after logout...`);
  const reOtp = '554433';
  const reHash = await bcrypt.hash(reOtp, 10);
  await sb.from('otp_sessions').insert({
    phone: testPhone,
    otp_hash: reHash,
    expires_at: new Date(Date.now() + 600000).toISOString(),
    verified: false,
    ip_address: '127.0.0.1',
    role: 'client',
  });

  const loginRes2 = await fetch('http://localhost:3000/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: testPhone,
      action: 'verify',
      code: reOtp,
      role: 'client',
    }),
  });
  const loginCookie2 = loginRes2.headers.get('set-cookie');
  const cookieHeader2 = loginCookie2?.split(';')[0];

  // 8. Call GET /api/user/me to verify DB persistence (not stale JWT)
  const meRes2 = await fetch('http://localhost:3000/api/user/me', {
    headers: { Cookie: cookieHeader2 },
  });
  const meData2 = await meRes2.json();
  console.log(`[Part A] GET /api/user/me after second login (fresh DB fetch):`, {
    id: meData2.user?.id,
    full_name: meData2.user?.full_name,
    onboarded: meData2.user?.onboarded,
  });

  const dataLossPreserved =
    meData2.user?.full_name === testName &&
    meData2.user?.onboarded === true;

  console.log(`[Part A Result] Data Loss Regression Check: ${dataLossPreserved ? 'PASSED (0 DATA LOSS)' : 'FAILED'}`);

  // Clean up test client
  await sb.from('users').delete().eq('phone', `+91${testPhone}`);
  await sb.from('otp_sessions').delete().eq('phone', testPhone);

  // PART B: Admin Portfolio & Redirect Loop Check
  console.log(`\n[Part B] Checking Admin Portfolio & Infinite Redirect Loop...`);

  // Log in as Super Admin via OTP (canonical super admin phone 7777078742)
  const adminPhone = '7777078742';
  const adminOtp = '990011';
  const adminHash = await bcrypt.hash(adminOtp, 10);
  await sb.from('otp_sessions').insert({
    phone: adminPhone,
    otp_hash: adminHash,
    expires_at: new Date(Date.now() + 600000).toISOString(),
    verified: false,
    ip_address: '127.0.0.1',
    role: 'super_admin',
  });

  const adminLoginRes = await fetch('http://localhost:3000/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: adminPhone,
      action: 'verify',
      code: adminOtp,
      role: 'super_admin',
    }),
  });
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  const adminCookieHeader = adminCookie?.split(';')[0];
  const adminData = await adminLoginRes.json();
  console.log(`[Part B] Admin Login: status=${adminLoginRes.status}, role=${adminData.user?.role}`);

  // Fetch /api/admin/portfolio
  const portfolioRes = await fetch('http://localhost:3000/api/admin/portfolio', {
    headers: { Cookie: adminCookieHeader },
  });
  const portfolioData = await portfolioRes.json();
  console.log(`[Part B] GET /api/admin/portfolio status=${portfolioRes.status}, success=${portfolioData.success}, sampleCount=${portfolioData.samples?.length}`);

  if (portfolioData.samples) {
    console.log(`[Part B Samples Loaded]:`);
    portfolioData.samples.forEach((s, idx) => {
      console.log(`  ${idx + 1}. [${s.category}] "${s.title}" (YouTube: ${s.youtube_id}, Visible: ${s.is_visible})`);
    });
  }

  const loopGone = portfolioRes.status === 200 && portfolioData.success === true;
  const sevenVideosLoaded = (portfolioData.samples?.length || 0) === 7;

  console.log(`[Part B Result] Redirect loop gone: ${loopGone ? 'YES (HTTP 200)' : 'NO'}`);
  console.log(`[Part B Result] Exactly 7 videos loaded: ${sevenVideosLoaded ? 'YES (7/7 videos)' : `Count: ${portfolioData.samples?.length}`}`);

  // Cleanup admin OTP session
  await sb.from('otp_sessions').delete().eq('phone', adminPhone);

  if (dataLossPreserved && loopGone && sevenVideosLoaded) {
    console.log(`\n>>> Phase 2.3 PASS: All data loss and admin portfolio regression tests PASSED! <<<\n`);
  } else {
    console.error(`\n>>> Phase 2.3 WARNING: Some checks did not match exact expectations. <<<\n`);
  }
}

runRegressionTest().catch(console.error);
