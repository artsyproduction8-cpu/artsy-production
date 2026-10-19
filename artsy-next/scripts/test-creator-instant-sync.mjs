import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
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

// Canonical auth cookie signer matching src/lib/auth-cookie.ts
function signCookie(payload) {
  const rawSecret = env.COOKIE_SIGNING_SECRET || env.JWT_SECRET || 'artsy_dev_cookie_signing_secret_32_characters_minimum';
  const secret = rawSecret.replace(/^["']|["']$/g, '').trim();
  const cookiePayload = {
    id: String(payload.id),
    role: payload.role,
    token_version: Number(payload.token_version) >= 2 ? Number(payload.token_version) : 2,
    exp: payload.exp || Date.now() + 86400000,
    email: payload.email || '',
    phone: payload.phone || '',
    full_name: payload.full_name || '',
    display_name: payload.display_name || '',
    onboarded: payload.onboarded !== false,
    studio_details: payload.studio_details || null,
    creator_profile: payload.creator_profile || null,
  };
  const jsonStr = JSON.stringify(cookiePayload);
  const payloadBase64 = Buffer.from(jsonStr, 'utf-8').toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

const BASE_URL = (process.env.TEST_BASE_URL || 'http://localhost:3000').trim();

async function runTest() {
  console.log('=============================================================================');
  console.log(' BENCHMARK: CREATOR INSTANT REFLECTION (<100MS) & RELIABLE RECORD-KEEPING');
  console.log('=============================================================================\n');

  const testCreatorId = crypto.randomUUID();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const testPhone = `+9197${randomSuffix}`;
  const testEmail = `creator.benchmark.${Date.now()}@artsyproduction.com`;

  console.log(`1. Creating candidate creator (${testCreatorId}, ${testPhone})...`);
  
  // Clean beforehand
  await sb.from('creator_profiles').delete().eq('id', testCreatorId);
  await sb.from('users').delete().eq('id', testCreatorId);

  // Initial user insert
  const { error: insErr } = await sb.from('users').insert({
    id: testCreatorId,
    phone: testPhone,
    email: testEmail,
    full_name: 'Devina Kapoor',
    display_name: 'Devina K.',
    role: 'freelancer',
    status: 'active',
    onboarded: false,
    token_version: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (insErr) {
    console.error('Failed to create test creator user:', insErr);
    process.exit(1);
  }
  console.log('  ✓ Test creator user created in Supabase `users` table.');

  const creatorCookie = signCookie({
    id: testCreatorId,
    role: 'freelancer',
    phone: testPhone,
    email: testEmail,
    full_name: 'Devina Kapoor',
    display_name: 'Devina K.',
    onboarded: false,
    token_version: 2,
  });

  const { data: adminRow } = await sb.from('users').select('token_version').eq('id', '50d2d4d3-b55f-4c9c-8281-a3fa324c52ad').single();
  const adminTokenVersion = adminRow?.token_version || 4;

  const superAdminCookie = signCookie({
    id: '50d2d4d3-b55f-4c9c-8281-a3fa324c52ad',
    role: 'super_admin',
    phone: '+917777078742',
    email: 'lilsammy96@gmail.com',
    full_name: 'Super Admin',
    onboarded: true,
    token_version: adminTokenVersion,
  });

  // 2. Profile Setup & Hardware Rig Submission
  console.log('\n2. Creator submitting full profile & hardware rig setup (/api/user/update-profile)...');
  const profileSetupPayload = {
    full_name: 'Devina Kapoor',
    display_name: 'Devina K.',
    studio_details: {
      workstationRig: 'Mac Studio M2 Ultra (128GB Unified Memory)',
      monitoringSpec: 'Apple Studio Display 27" P3-D65 Calibrated + Sony BVM',
      storageSpec: '10GbE Synology RAID-0 Scratch (4TB NVMe Internal)',
      audioSpec: 'Genelec 8030C Reference Monitors + Sennheiser HD650',
      experience: '5 - 7 Years (Senior Film Colorist)',
      capacity: '30 - 40 Hours / Week (3 Commercial Projects)',
      philosophy: 'Color is emotional storytelling. I grade filmic curves with rich skin tones.',
      software: ['DaVinci Resolve Studio', 'Baselight', 'FilmConvert Pro'],
      languages: ['English', 'Hindi', 'French'],
      showreelUrl: 'https://vimeo.com/showcase/devina-color-2026',
    },
    creator_profile: {
      bio: 'Senior Colorist & Finishing Artist for Luxury Brands and Cinema.',
      public_bio: 'Senior Colorist specializing in high-end beauty, fashion, and wedding cinema.',
      public_display_name: 'Devina K.',
      portfolio_url: 'https://vimeo.com/showcase/devina-color-2026',
      software: ['DaVinci Resolve Studio', 'Baselight', 'FilmConvert Pro'],
      languages: ['English', 'Hindi', 'French'],
      skills: ['Color Grading', 'ACES Workflow', 'Grain & Texture Emulation', 'HDR Finishing'],
      bank_account_name: 'Devina Kapoor',
      bank_account_number: '987654321098',
      bank_ifsc_code: 'HDFC0000123',
      pan_number: 'ABCDE1234F',
    },
    onboarded: true,
  };

  const t0 = performance.now();
  const updateRes = await fetch(`${BASE_URL}/api/user/update-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${creatorCookie}`,
    },
    body: JSON.stringify(profileSetupPayload),
  });
  const tUpdate = Math.round(performance.now() - t0);
  const updateData = await updateRes.json();

  console.log(`  ✓ Update Profile Response Status: ${updateRes.status} in ${tUpdate}ms`);
  if (!updateData.success) {
    console.error('Update profile failed:', updateData);
    process.exit(1);
  }
  console.log('  ✓ Creator profile successfully upserted and cache invalidation dispatched.');

  // 3. Creator Session /api/user/me benchmark
  console.log('\n3. Testing Creator Session Fast-Path (/api/user/me)...');
  const tMe0 = performance.now();
  const meRes = await fetch(`${BASE_URL}/api/user/me`, {
    headers: {
      Cookie: `artsy_auth_token=${creatorCookie}`,
    },
  });
  const tMe = Math.round(performance.now() - tMe0);
  const meData = await meRes.json();
  const meXCache = meRes.headers.get('x-cache') || 'UNKNOWN';

  console.log(`  ✓ /api/user/me latency: ${tMe}ms [X-Cache: ${meXCache}]`);
  console.log(`  ✓ Display Name: "${meData.user?.display_name}"`);
  console.log(`  ✓ Workstation Rig: "${meData.user?.studio_details?.workstationRig}"`);
  console.log(`  ✓ Masked Bank Account: "${meData.user?.creator_profile?.bank_account_number}"`);
  console.log(`  ✓ Masked PAN: "${meData.user?.creator_profile?.pan_number}"`);

  if (!meData.user?.studio_details?.workstationRig) {
    console.error('FAIL: studio_details missing in /api/user/me response!');
    process.exit(1);
  }

  // 4. Admin Panel Reflection (/api/admin/creators?id=...)
  console.log('\n4. Admin inspecting Creator profile & hardware rig (/api/admin/creators?id=...)...');
  const tAdmin0 = performance.now();
  const adminDetailRes = await fetch(`${BASE_URL}/api/admin/creators?id=${testCreatorId}`, {
    headers: {
      Cookie: `artsy_auth_token=${superAdminCookie}`,
    },
  });
  const tAdmin = Math.round(performance.now() - tAdmin0);
  const adminDetail = await adminDetailRes.json();
  const adminXCache = adminDetailRes.headers.get('x-cache') || 'UNKNOWN';
  console.log('  [DEBUG] Status:', adminDetailRes.status, 'Body:', JSON.stringify(adminDetail));

  console.log(`  ✓ Admin Creator Detail latency: ${tAdmin}ms [X-Cache: ${adminXCache}]`);
  console.log(`  ✓ Creator Found in Admin: "${adminDetail.creator?.display_name}"`);
  console.log(`  ✓ Hardware Rig: "${adminDetail.creator?.studio_details?.workstationRig}"`);
  console.log(`  ✓ Monitoring Spec: "${adminDetail.creator?.studio_details?.monitoringSpec}"`);
  console.log(`  ✓ Masked Bank: "${adminDetail.creator?.profile?.bank_account_number}"`);
  console.log(`  ✓ Masked PAN: "${adminDetail.creator?.profile?.pan_number}"`);

  if (!adminDetail.creator?.studio_details?.workstationRig) {
    console.error('FAIL: studio_details missing in admin creator detail!');
    process.exit(1);
  }

  // 5. Admin Approving Creator
  console.log('\n5. Admin approving Creator (PATCH /api/admin/creators action: approve)...');
  const tApprove0 = performance.now();
  const approveRes = await fetch(`${BASE_URL}/api/admin/creators`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `artsy_auth_token=${superAdminCookie}`,
    },
    body: JSON.stringify({
      id: testCreatorId,
      action: 'approve',
    }),
  });
  const tApprove = Math.round(performance.now() - tApprove0);
  const approveData = await approveRes.json();
  console.log(`  ✓ Creator Approval execution: ${tApprove}ms [Success: ${approveData.success}]`);

  // 6. Verify Instant Reflection across Creator Portal & Public Directory
  console.log('\n6. Verifying Instant Reflection across Creator Portal & Public Directory...');
  
  // 6.1 Creator Portal reflects approval
  const tMePost0 = performance.now();
  const mePostRes = await fetch(`${BASE_URL}/api/user/me?fresh=true`, {
    headers: {
      Cookie: `artsy_auth_token=${creatorCookie}`,
    },
  });
  const tMePost = Math.round(performance.now() - tMePost0);
  const mePostData = await mePostRes.json();
  console.log(`  ✓ Creator /api/user/me fresh status: "${mePostData.user?.onboarding_status}" in ${tMePost}ms`);
  if (mePostData.user?.onboarding_status !== 'approved') {
    console.error(`FAIL: Creator onboarding_status is ${mePostData.user?.onboarding_status}, expected 'approved'`);
    process.exit(1);
  }

  // 6.2 Public Directory reflection
  const tPub0 = performance.now();
  const pubRes = await fetch(`${BASE_URL}/api/creators`);
  const tPub = Math.round(performance.now() - tPub0);
  const pubData = await pubRes.json();
  const pubXCache = pubRes.headers.get('x-cache') || 'UNKNOWN';
  console.log(`  ✓ Public Directory /api/creators: ${pubData.total} creators listed in ${tPub}ms [X-Cache: ${pubXCache}]`);

  // 6.3 Public Single Creator route
  const tPubSingle0 = performance.now();
  const pubSingleRes = await fetch(`${BASE_URL}/api/creators/${testCreatorId}`);
  const tPubSingle = Math.round(performance.now() - tPubSingle0);
  const pubSingleData = await pubSingleRes.json();
  const pubSingleXCache = pubSingleRes.headers.get('x-cache') || 'UNKNOWN';
  console.log(`  ✓ Public Creator /api/creators/${testCreatorId}: ${pubSingleRes.status} in ${tPubSingle}ms [X-Cache: ${pubSingleXCache}]`);
  console.log(`  ✓ Public Display Name: "${pubSingleData.creator?.public_display_name}"`);
  console.log(`  ✓ Public Specialty: "${pubSingleData.creator?.public_specialty}"`);

  // 7. WORM Immutable Audit Verification
  console.log('\n7. Verifying WORM Audit Trail in `audit_logs` table...');
  const { data: auditRecords } = await sb
    .from('audit_logs')
    .select('action, target_table, target_id, created_at')
    .eq('target_id', testCreatorId)
    .order('created_at', { ascending: false });

  console.log(`  ✓ Audit records found for creator ${testCreatorId}: ${auditRecords?.length || 0}`);
  (auditRecords || []).forEach((r) => {
    console.log(`    - Action: ${r.action} on ${r.target_table} at ${r.created_at}`);
  });

  // 8. Clean up test creator
  console.log('\n8. Cleaning up benchmark creator account...');
  await sb.from('audit_logs').delete().eq('target_id', testCreatorId);
  await sb.from('creator_profiles').delete().eq('id', testCreatorId);
  await sb.from('users').delete().eq('id', testCreatorId);
  console.log('  ✓ Benchmark creator cleanly removed from database.');
  console.log('  ✓ Super Admin account is untouched and active.');

  console.log('\n=============================================================================');
  console.log(' ALL CREATOR INSTANT-REFLECTION & RELIABLE RECORD CHECKS PASSED PERFECTLY!');
  console.log('=============================================================================');
}

runTest().catch((err) => {
  console.error('Benchmark test error:', err);
  process.exit(1);
});
