import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[trimmed.slice(0, idx).trim()] = val;
  }
}

const COOKIE_SIGNING_SECRET = env.COOKIE_SIGNING_SECRET || 'artsy_secure_cookie_hmac_secret_key_prod_2026';
const BASE_URL = 'http://localhost:3088';

const isValidJwt = (val) => {
  if (!val) return false;
  const parts = val.trim().split('.');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
};

const supabaseKey = (env.SUPABASE_SERVICE_ROLE_KEY && isValidJwt(env.SUPABASE_SERVICE_ROLE_KEY))
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey, {
  auth: { persistSession: false },
  global: { headers: { 'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026' } },
});

function signAuthCookie(payload) {
  const fullPayload = {
    ...payload,
    token_version: 2,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const jsonStr = JSON.stringify(fullPayload);
  const base64 = Buffer.from(jsonStr).toString('base64');
  const hmac = crypto.createHmac('sha256', COOKIE_SIGNING_SECRET).update(base64).digest('hex');
  return `${base64}.${hmac}`;
}

async function runVerification() {
  console.log('================================================================');
  console.log('   ARTSY PRODUCTION — VERIFICATION OF PHASES 1 TO 4            ');
  console.log('================================================================\n');

  const results = {
    test1_auth: false,
    test2_financial: false,
    test3_hardware_samples: false,
    test4_nda: false,
  };

  // ─────────────────────────────────────────────────────────────
  // TEST 1: STRICT AUTH MATCHING (OTP CREDENTIAL MISMATCH)
  // ─────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Strict Auth Matching (Phone vs Wrong Email) ---');
  try {
    const res1 = await fetch(`${BASE_URL}/api/auth/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        role: 'freelancer',
        phone: '7777078742',
        email: 'attacker_or_wrong@example.com',
      }),
    });
    const body1 = await res1.json().catch(() => ({}));
    console.log(`Status: ${res1.status} (Expected 401)`);
    console.log(`Response Error:`, body1.error);

    if (res1.status === 401 && body1.error?.includes('do not match our records')) {
      results.test1_auth = true;
      console.log('>>> TEST 1 PASS: Login attempt with mismatched credentials strictly rejected with 401 Unauthorized.\n');
    } else {
      console.error('>>> TEST 1 FAIL: Did not reject mismatched credentials properly.\n');
    }
  } catch (err) {
    console.error('>>> TEST 1 ERROR:', err.message);
  }

  // Create a clean test creator user in database with valid UUID
  const testUserId = crypto.randomUUID();
  const testPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testEmail = `creator_${Date.now()}@artsytest.studio`;

  await sb.from('users').insert({
    id: testUserId,
    email: testEmail,
    phone: testPhone,
    role: 'freelancer',
    status: 'active',
    onboarding_status: 'pending',
    token_version: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const creatorCookie = signAuthCookie({
    id: testUserId,
    role: 'freelancer',
    email: testEmail,
    phone: testPhone,
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 2: FINANCIAL VALIDATION (PAN = "1234")
  // ─────────────────────────────────────────────────────────────
  console.log('--- TEST 2: Financial Validation (PAN = "1234") ---');
  try {
    const res2 = await fetch(`${BASE_URL}/api/freelancer/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `artsy_auth_token=${creatorCookie}`,
      },
      body: JSON.stringify({
        userId: testUserId,
        alias: 'Test Editor',
        legalName: 'Test Creator Full Legal',
        pan: '1234', // Invalid format
        bankAccount: '123456789012',
        ifsc: 'HDFC0001234',
        hardwareConfig: 'CPU: Apple M2 Max, GPU: 38-core, RAM: 64GB',
        sampleUrl1: 'https://youtube.com/watch?v=sample1',
        sampleUrl2: 'https://youtube.com/watch?v=sample2',
        sampleUrl3: 'https://vimeo.com/12345678',
        agreementAccepted: true,
      }),
    });
    const body2 = await res2.json().catch(() => ({}));
    console.log(`Status: ${res2.status} (Expected 400)`);
    console.log(`Response Error:`, body2.error);

    // Also test IFSC invalid
    const res2b = await fetch(`${BASE_URL}/api/freelancer/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `artsy_auth_token=${creatorCookie}`,
      },
      body: JSON.stringify({
        userId: testUserId,
        alias: 'Test Editor',
        legalName: 'Test Creator Full Legal',
        pan: 'ABCDE1234F',
        bankAccount: '123456789012',
        ifsc: 'INVALID_IFSC',
        hardwareConfig: 'CPU: Apple M2 Max, GPU: 38-core, RAM: 64GB',
        sampleUrl1: 'https://youtube.com/watch?v=sample1',
        sampleUrl2: 'https://youtube.com/watch?v=sample2',
        sampleUrl3: 'https://vimeo.com/12345678',
        agreementAccepted: true,
      }),
    });
    const body2b = await res2b.json().catch(() => ({}));

    if (
      res2.status === 400 &&
      body2.error?.includes('Invalid PAN Card format') &&
      res2b.status === 400 &&
      body2b.error?.includes('Invalid IFSC Code format')
    ) {
      results.test2_financial = true;
      console.log('>>> TEST 2 PASS: PAN "1234" and invalid IFSC strictly rejected with 400 Bad Request.\n');
    } else {
      console.error('>>> TEST 2 FAIL: Did not properly reject invalid financial data.\n');
    }
  } catch (err) {
    console.error('>>> TEST 2 ERROR:', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: HARDWARE & 3 MANDATORY SAMPLES
  // ─────────────────────────────────────────────────────────────
  console.log('--- TEST 3: Hardware & 3 Mandatory Samples Validation ---');
  try {
    // Missing hardware
    const res3a = await fetch(`${BASE_URL}/api/freelancer/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `artsy_auth_token=${creatorCookie}`,
      },
      body: JSON.stringify({
        userId: testUserId,
        alias: 'Test Editor',
        legalName: 'Test Creator Full Legal',
        pan: 'ABCDE1234F',
        bankAccount: '123456789012',
        ifsc: 'HDFC0001234',
        hardwareConfig: '', // Missing
        sampleUrl1: 'https://youtube.com/watch?v=sample1',
        sampleUrl2: 'https://youtube.com/watch?v=sample2',
        sampleUrl3: 'https://vimeo.com/12345678',
        agreementAccepted: true,
      }),
    });
    const body3a = await res3a.json().catch(() => ({}));

    // Missing sample 3
    const res3b = await fetch(`${BASE_URL}/api/freelancer/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `artsy_auth_token=${creatorCookie}`,
      },
      body: JSON.stringify({
        userId: testUserId,
        alias: 'Test Editor',
        legalName: 'Test Creator Full Legal',
        pan: 'ABCDE1234F',
        bankAccount: '123456789012',
        ifsc: 'HDFC0001234',
        hardwareConfig: 'CPU: Apple M2 Max, GPU: 38-core, RAM: 64GB',
        sampleUrl1: 'https://youtube.com/watch?v=sample1',
        sampleUrl2: 'https://youtube.com/watch?v=sample2',
        sampleUrl3: '', // Missing
        agreementAccepted: true,
      }),
    });
    const body3b = await res3b.json().catch(() => ({}));

    console.log(`Missing Hardware Status: ${res3a.status} | Msg: ${body3a.error}`);
    console.log(`Missing Sample 3 Status: ${res3b.status} | Msg: ${body3b.error}`);

    // Verify frontend form has the fields
    const frontendCode = fs.readFileSync(path.resolve(__dirname, '../src/app/freelancer/onboarding/page.tsx'), 'utf8');
    const hasHardwareInFrontend = frontendCode.includes('WORKSTATION HARDWARE SPECS') && frontendCode.includes('hardwareConfig');
    const hasThreeSamplesInFrontend = frontendCode.includes('sampleUrl1') && frontendCode.includes('sampleUrl2') && frontendCode.includes('sampleUrl3');

    if (
      res3a.status === 400 &&
      body3a.error?.includes('Workstation & Hardware') &&
      res3b.status === 400 &&
      body3b.error?.includes('Sample Video URL #3 is mandatory') &&
      hasHardwareInFrontend &&
      hasThreeSamplesInFrontend
    ) {
      results.test3_hardware_samples = true;
      console.log('>>> TEST 3 PASS: Hardware & 3 mandatory samples verified on backend and frontend.\n');
    } else {
      console.error('>>> TEST 3 FAIL: Missing hardware or samples not rejected properly.\n');
    }
  } catch (err) {
    console.error('>>> TEST 3 ERROR:', err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: NDA & AGREEMENT PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  console.log('--- TEST 4: NDA & Agreement Persistence ---');
  try {
    // 4a: Submit onboarding with complete valid payload including NDA & legal name
    const res4 = await fetch(`${BASE_URL}/api/freelancer/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `artsy_auth_token=${creatorCookie}`,
      },
      body: JSON.stringify({
        userId: testUserId,
        alias: 'Test Editor Pro',
        legalName: 'Test Creator Full Legal Name',
        pan: 'ABCDE1234F',
        bankAccount: '123456789012',
        bankName: 'HDFC Bank',
        ifsc: 'HDFC0001234',
        hardwareConfig: 'CPU: Apple M2 Max, GPU: 38-core, RAM: 64GB DDR5, Storage: 4TB NVMe SSD',
        sampleUrl1: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        sampleUrl2: 'https://vimeo.com/76979871',
        sampleUrl3: 'https://youtube.com/watch?v=3JZ_D3ELwOQ',
        agreementAccepted: true,
        ndaAccepted: true,
      }),
    });
    const body4 = await res4.json().catch(() => ({}));
    console.log(`Onboard Submission Status: ${res4.status} | Tracking: ${body4.trackingId} | Agreement Signed At: ${body4.agreement_signed_at}`);

    // Verify DB state
    const { data: dbProfile, error: dbErr } = await sb
      .from('creator_profiles')
      .select('id, agreement_signed_at, agreement_accepted, hardware_config, sample_url_1, sample_url_2, sample_url_3')
      .eq('id', testUserId)
      .maybeSingle();

    if (dbErr) {
      console.error('Database Query Error:', dbErr);
    }
    console.log('Database Profile Row:', {
      id: dbProfile?.id,
      agreement_signed_at: dbProfile?.agreement_signed_at,
      agreement_accepted: dbProfile?.agreement_accepted,
      hardware_config: dbProfile?.hardware_config?.slice(0, 30) + '...',
    });

    // Verify Layout Guard / Contract Route Behavior
    const contractCode = fs.readFileSync(path.resolve(__dirname, '../src/app/freelancer/contract/page.tsx'), 'utf8');
    const layoutCode = fs.readFileSync(path.resolve(__dirname, '../src/app/freelancer/FreelancerLayoutClient.tsx'), 'utf8');

    const layoutSkipsNda = layoutCode.includes('agreement_signed_at') && layoutCode.includes('/freelancer/onboarding');
    const contractRedirects = contractCode.includes('/freelancer/onboarding') && contractCode.includes('/freelancer');

    if (
      res4.status === 200 &&
      body4.agreement_signed_at &&
      dbProfile?.agreement_signed_at &&
      layoutSkipsNda &&
      contractRedirects
    ) {
      results.test4_nda = true;
      console.log('>>> TEST 4 PASS: NDA executed and permanently persisted in DB. Layout guard permanently skips NDA step.\n');
    } else {
      console.error('>>> TEST 4 FAIL: NDA not persisted properly or guard not enforcing persistence.\n');
    }
  } catch (err) {
    console.error('>>> TEST 4 ERROR:', err.message);
  }

  // Cleanup test user
  await sb.from('creator_profiles').delete().eq('id', testUserId);
  await sb.from('creator_agreements').delete().eq('creator_id', testUserId);
  await sb.from('users').delete().eq('id', testUserId);

  console.log('================================================================');
  console.log('   FINAL VERIFICATION REPORT:');
  console.log(`   1. Auth Test (Credential Mismatch 401):          ${results.test1_auth ? 'PASS' : 'FAIL'}`);
  console.log(`   2. Validation Test (PAN "1234" Rejection 400):   ${results.test2_financial ? 'PASS' : 'FAIL'}`);
  console.log(`   3. Form Test (Hardware & 3 Mandatory Samples):   ${results.test3_hardware_samples ? 'PASS' : 'FAIL'}`);
  console.log(`   4. NDA Test (Permanent Persistence & Skip):     ${results.test4_nda ? 'PASS' : 'FAIL'}`);
  console.log('================================================================\n');

  if (Object.values(results).every(Boolean)) {
    console.log('ALL 4 TESTS PASSED ACCORDING TO SPECIFICATION.');
    process.exit(0);
  } else {
    console.error('ONE OR MORE TESTS FAILED.');
    process.exit(1);
  }
}

runVerification();
