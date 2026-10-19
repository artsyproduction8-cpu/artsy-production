import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cldewthefsteotdvftlj.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('================================================================');
console.log('CRITICAL SECURITY VERIFICATION: RLS Lockdown & Endpoint Testing');
console.log('================================================================');
console.log('Target URL:', supabaseUrl);
console.log('Anon Key Present:', Boolean(anonKey));
console.log('Service Key Present:', Boolean(serviceKey));

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isValidJwt = (val) => {
  if (!val) return false;
  const parts = val.trim().split('.');
  return parts.length === 3 && parts[0].length > 0 && parts[1].length > 0;
};

const adminClient = createClient(
  supabaseUrl,
  serviceKey && isValidJwt(serviceKey) ? serviceKey : anonKey,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026',
      },
    },
  }
);

async function runTests() {
  let allPassed = true;

  // 1. Verify Anon CANNOT directly insert into otp_sessions
  console.log('\n[Test 1] Attempting direct anon INSERT to otp_sessions (should FAIL)...');
  const { data: anonOtpData, error: anonOtpErr } = await anonClient
    .from('otp_sessions')
    .insert([{
      phone: '9999999999',
      otp_hash: 'fake_hash_test',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    }])
    .select();

  if (anonOtpErr) {
    console.log('  ✓ PASS: Direct anon insert to otp_sessions rejected as expected.');
    console.log('    Error code:', anonOtpErr.code, '-', anonOtpErr.message);
  } else {
    console.error('  ✗ FAIL: Anon was able to insert into otp_sessions!', anonOtpData);
    allPassed = false;
  }

  // 2. Verify Anon CANNOT directly insert into users
  console.log('\n[Test 2] Attempting direct anon INSERT to users (should FAIL)...');
  const { data: anonUserData, error: anonUserErr } = await anonClient
    .from('users')
    .insert([{
      id: '00000000-0000-0000-0000-000000000001',
      email: 'hacker@example.com',
      role: 'admin',
    }])
    .select();

  if (anonUserErr) {
    console.log('  ✓ PASS: Direct anon insert to users rejected as expected.');
    console.log('    Error code:', anonUserErr.code, '-', anonUserErr.message);
  } else {
    console.error('  ✗ FAIL: Anon was able to insert into users!', anonUserData);
    allPassed = false;
  }

  // 3. Verify Anon CANNOT directly insert into orders
  console.log('\n[Test 3] Attempting direct anon INSERT to orders (should FAIL)...');
  const { data: anonOrderData, error: anonOrderErr } = await anonClient
    .from('orders')
    .insert([{
      order_number: 'FAKE-ORDER-999',
      gross_amount: 100,
    }])
    .select();

  if (anonOrderErr) {
    console.log('  ✓ PASS: Direct anon insert to orders rejected as expected.');
    console.log('    Error code:', anonOrderErr.code, '-', anonOrderErr.message);
  } else {
    console.error('  ✗ FAIL: Anon was able to insert into orders!', anonOrderData);
    allPassed = false;
  }

  // 4. Verify Anon CANNOT directly insert into creator_profiles
  console.log('\n[Test 4] Attempting direct anon INSERT to creator_profiles (should FAIL)...');
  const { data: anonCpData, error: anonCpErr } = await anonClient
    .from('creator_profiles')
    .insert([{
      id: '00000000-0000-0000-0000-000000000002',
      tracking_id: 'HACKER-VET-001',
    }])
    .select();

  if (anonCpErr) {
    console.log('  ✓ PASS: Direct anon insert to creator_profiles rejected as expected.');
    console.log('    Error code:', anonCpErr.code, '-', anonCpErr.message);
  } else {
    console.error('  ✗ FAIL: Anon was able to insert into creator_profiles!', anonCpData);
    allPassed = false;
  }

  // 5. Verify Anon CANNOT directly insert into notification_delivery_log
  console.log('\n[Test 5] Attempting direct anon INSERT to notification_delivery_log (should FAIL)...');
  const { data: anonNotifData, error: anonNotifErr } = await anonClient
    .from('notification_delivery_log')
    .insert([{
      channel: 'email',
      recipient: 'fake@example.com',
    }])
    .select();

  if (anonNotifErr) {
    console.log('  ✓ PASS: Direct anon insert to notification_delivery_log rejected as expected.');
    console.log('    Error code:', anonNotifErr.code, '-', anonNotifErr.message);
  } else {
    console.error('  ✗ FAIL: Anon was able to insert into notification_delivery_log!', anonNotifData);
    allPassed = false;
  }

  // 6. Verify Admin (service_role) CAN successfully insert and clean up in all tables
  console.log('\n[Test 6] Testing server-side service_role operations across tables...');

  // Test otp_sessions with service_role
  const testPhone = '9999900001';
  const { data: otpRow, error: otpErr } = await adminClient
    .from('otp_sessions')
    .insert([{
      phone: testPhone,
      otp_hash: 'test_hash_val',
      expires_at: new Date(Date.now() + 600000).toISOString(),
      verified: false,
      role: 'client',
    }])
    .select()
    .single();

  if (otpErr) {
    console.error('  ✗ FAIL: Admin insert to otp_sessions failed:', otpErr);
    allPassed = false;
  } else {
    console.log('  ✓ PASS: Service role successfully inserted otp_sessions row (id:', otpRow.id, ')');
    // Clean up
    await adminClient.from('otp_sessions').delete().eq('id', otpRow.id);
  }

  // Test orders with service_role
  const testOrderNum = `TEST-ORDER-${Date.now()}`;
  const { data: orderRow, error: orderErr } = await adminClient
    .from('orders')
    .insert([{
      order_number: testOrderNum,
      gross_amount: 500000,
      gst_amount: 76271,
      gateway_fee: 11800,
      net_amount: 411929,
      currency: 'INR',
      status: 'payment_pending',
    }])
    .select()
    .single();

  if (orderErr) {
    console.error('  ✗ FAIL: Admin insert to orders failed:', orderErr);
    allPassed = false;
  } else {
    console.log('  ✓ PASS: Service role successfully inserted orders row (id:', orderRow.id, ')');
    // Clean up
    await adminClient.from('orders').delete().eq('id', orderRow.id);
  }

  // Test users & creator_profiles with service_role
  const testUserId = `00000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`;
  const { data: userRow, error: userErr } = await adminClient
    .from('users')
    .insert([{
      id: testUserId,
      email: `test_${Date.now()}@artsyprod.test`,
      phone: '+919999900002',
      full_name: 'Test Creator',
      role: 'freelancer',
      status: 'active',
    }])
    .select()
    .single();

  if (userErr) {
    console.error('  ✗ FAIL: Admin insert to users failed:', userErr);
    allPassed = false;
  } else {
    console.log('  ✓ PASS: Service role successfully inserted users row (id:', userRow.id, ')');
    
    // Test creator profile insert
    const { data: cpRow, error: cpErr } = await adminClient
      .from('creator_profiles')
      .insert([{
        id: testUserId,
        tracking_id: `ART-TEST-${Date.now().toString().slice(-4)}`,
        bio: 'Test Bio',
        approval_status: 'pending',
      }])
      .select()
      .single();

    if (cpErr) {
      console.error('  ✗ FAIL: Admin insert to creator_profiles failed:', cpErr);
      allPassed = false;
    } else {
      console.log('  ✓ PASS: Service role successfully inserted creator_profiles row (id:', cpRow.id, ')');
      await adminClient.from('creator_profiles').delete().eq('id', testUserId);
    }

    await adminClient.from('users').delete().eq('id', testUserId);
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('STATUS: ALL RLS LOCKDOWN & SERVICE_ROLE VERIFICATIONS PASSED! ✓');
  } else {
    console.error('STATUS: ONE OR MORE VERIFICATIONS FAILED! ✗');
  }
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
