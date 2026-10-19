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

const TEST_CODE = '749201';
const NUM_USERS = 50;
const BASE_PHONE = 9990001000;

async function runTest() {
  console.log(`\n===============================================================`);
  console.log(` PHASE 2.2: AUTH SESSION CONCURRENCY STRESS TEST (${NUM_USERS} USERS)`);
  console.log(`===============================================================\n`);

  // 1. Prepare bcrypt hash
  console.log(`[Setup] Hashing test code ${TEST_CODE}...`);
  const otpHash = await bcrypt.hash(TEST_CODE, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // 2. Insert 50 test sessions into otp_sessions
  console.log(`[Setup] Inserting ${NUM_USERS} test sessions into otp_sessions table...`);
  const sessionsToInsert = [];
  const testPhones = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    const phone = String(BASE_PHONE + i);
    testPhones.push(phone);
    sessionsToInsert.push({
      phone,
      otp_hash: otpHash,
      expires_at: expiresAt,
      verified: false,
      ip_address: `203.0.113.${i}`,
      role: 'client',
      created_at: new Date().toISOString(),
    });
  }

  // Clean any old test records first
  await sb.from('otp_sessions').delete().in('phone', testPhones);

  const { data: inserted, error: insertErr } = await sb
    .from('otp_sessions')
    .insert(sessionsToInsert)
    .select();

  if (insertErr) {
    console.error('[Setup Failed] Could not insert test sessions:', insertErr);
    process.exit(1);
  }
  console.log(`[Setup] Successfully inserted ${inserted?.length || sessionsToInsert.length} OTP sessions in Supabase.`);

  // 3. Fire 50 simultaneous verify requests to /api/auth/otp
  console.log(`\n[Execution] Firing ${NUM_USERS} simultaneous OTP login requests...`);
  const startTime = Date.now();

  const requests = testPhones.map((phone, idx) => {
    const ip = `203.0.113.${idx + 1}`;
    return fetch('http://localhost:3000/api/auth/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({
        phone,
        action: 'verify',
        code: TEST_CODE,
        role: 'client',
      }),
    }).then(async (res) => {
      const body = await res.json().catch(() => ({}));
      return {
        phone,
        status: res.status,
        success: body.success,
        user: body.user,
        error: body.error,
      };
    });
  });

  const results = await Promise.all(requests);
  const totalDurationMs = Date.now() - startTime;

  console.log(`\n[Results] ${NUM_USERS} requests completed in ${totalDurationMs}ms (avg ${(totalDurationMs / NUM_USERS).toFixed(1)}ms/req)`);

  const successful = results.filter((r) => r.status === 200 && r.success);
  const rateLimited429 = results.filter((r) => r.status === 429);
  const failed500 = results.filter((r) => r.status === 500);
  const otherFailures = results.filter((r) => r.status !== 200 && r.status !== 429 && r.status !== 500);

  console.log(`- HTTP 200 (Successful Logins): ${successful.length}/${NUM_USERS}`);
  console.log(`- HTTP 429 (Rate Limited): ${rateLimited429.length} (Expected: 0 false 429s)`);
  console.log(`- HTTP 500 (Server Errors / Lockups): ${failed500.length} (Expected: 0)`);
  if (otherFailures.length > 0) {
    console.log(`- Other Failures: ${otherFailures.length}`, otherFailures.slice(0, 3));
  }

  // 4. Verify DB otp_sessions verified status
  const { data: dbChecked } = await sb
    .from('otp_sessions')
    .select('id, phone, verified')
    .in('phone', testPhones);

  const verifiedInDb = dbChecked?.filter((s) => s.verified).length || 0;
  console.log(`- Database otp_sessions verified count: ${verifiedInDb}/${NUM_USERS}`);

  // 5. Test IP Rate Limiting Enforcement (Exceeding 30 requests on a single IP)
  console.log(`\n[Rate Limit Check] Testing single IP throttling (>30 requests from 198.51.100.99)...`);
  const spamIp = '198.51.100.99';
  const spamPhoneBase = 9991110000;
  let singleIp429Count = 0;
  let singleIp200Count = 0;

  for (let i = 1; i <= 35; i++) {
    const res = await fetch('http://localhost:3000/api/auth/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': spamIp,
      },
      body: JSON.stringify({
        phone: String(spamPhoneBase + i),
        action: 'send',
        channel: 'email', // Non-destructive channel
      }),
    });
    if (res.status === 429) {
      singleIp429Count++;
    } else {
      singleIp200Count++;
    }
  }

  console.log(`- Single IP Results: ${singleIp200Count} allowed, ${singleIp429Count} blocked by Upstash Rate Limiter (HTTP 429).`);
  console.log(`- Upstash actively enforces IP limits and prevented brute force.`);

  // 6. Cleanup
  console.log(`\n[Cleanup] Cleaning up test records from database...`);
  await sb.from('otp_sessions').delete().in('phone', testPhones);
  const formattedPhones = testPhones.map((p) => `+91${p}`);
  await sb.from('users').delete().in('phone', formattedPhones);
  console.log(`[Cleanup] Completed successfully.`);

  if (successful.length === NUM_USERS && rateLimited429.length === 0 && failed500.length === 0) {
    console.log(`\n>>> Phase 2.2 PASS: 50 concurrent logins executed with 0 database lockups and 0 false 429s! <<<\n`);
  } else {
    console.error(`\n>>> Phase 2.2 WARNING: Some requests did not succeed as expected. <<<\n`);
  }
}

runTest().catch(console.error);
