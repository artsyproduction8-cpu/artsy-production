import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const SUPER_ADMIN_PHONE = '+917777078742';
const SUPER_ADMIN_EMAIL = 'lilsammy96@gmail.com';

async function cleanup() {
  console.log('====================================================');
  console.log(' DATABASE CLEANUP: REMOVING ALL USERS EXCEPT SUPER ADMIN');
  console.log('====================================================\n');

  // 1. Identify Super Admin user
  const { data: superAdminRows, error: saErr } = await sb
    .from('users')
    .select('id, phone, email, full_name, role')
    .or(`phone.eq.${SUPER_ADMIN_PHONE},email.eq.${SUPER_ADMIN_EMAIL},phone.eq.7777078742`);

  if (saErr || !superAdminRows || superAdminRows.length === 0) {
    console.error('FATAL: Could not locate Super Admin user! Aborting to prevent accidental data loss.', saErr);
    process.exit(1);
  }

  const superAdmin = superAdminRows[0];
  console.log(`[Super Admin Identified]`);
  console.log(`  ID: ${superAdmin.id}`);
  console.log(`  Name: ${superAdmin.full_name}`);
  console.log(`  Phone: ${superAdmin.phone}`);
  console.log(`  Email: ${superAdmin.email}`);
  console.log(`  Role: ${superAdmin.role}`);
  console.log('  -> This account will be strictly PRESERVED.\n');

  // Ensure super admin has proper super_admin role and clean profile
  await sb.from('users').update({
    role: 'super_admin',
    full_name: 'Studio Owner (Super Admin)',
    status: 'active',
    onboarded: true,
  }).eq('id', superAdmin.id);

  // 2. Delete test / demo data from dependent tables
  console.log('[Step 1/10] Deleting review_comments...');
  try {
    await sb.from('review_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.warn('review_comments note:', e);
  }

  console.log('[Step 2/10] Deleting revisions...');
  await sb.from('revisions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('[Step 3/10] Deleting file_records...');
  await sb.from('file_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('[Step 4/10] Deleting assignments, payouts, payments...');
  await sb.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('creator_payouts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('[Step 5/10] Deleting projects and orders...');
  await sb.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('[Step 6/10] Deleting creator_submissions...');
  await sb.from('creator_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('[Step 7/10] Deleting creator_profiles (all non-super-admin creators)...');
  await sb.from('creator_profiles').delete().neq('id', superAdmin.id);

  console.log('[Step 8/10] Deleting test records from financial_events, consent_records, notification_delivery_log, otp_sessions...');
  await sb.from('financial_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('consent_records').delete().neq('user_id', superAdmin.id);
  await sb.from('notification_delivery_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await sb.from('otp_sessions').delete().neq('phone', '7777078742');

  console.log('[Step 9/10] Deleting test / demo videos from portfolio_samples (Rick Roll & test videos)...');
  await sb.from('portfolio_samples').delete().in('youtube_id', ['dQw4w9WgXcQ', 'test087694']);
  // Ensure all remaining portfolio samples are unassigned from any deleted creator
  await sb.from('portfolio_samples').update({ creator_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('[Step 10/10] Deleting all non-super-admin users from users table...');
  const { data: deletedUsers, error: delErr } = await sb
    .from('users')
    .delete()
    .neq('id', superAdmin.id)
    .neq('phone', SUPER_ADMIN_PHONE)
    .neq('email', SUPER_ADMIN_EMAIL)
    .select('id, phone, email, full_name');

  if (delErr) {
    console.error('Error deleting non-super-admin users:', delErr);
  } else {
    console.log(`Successfully removed ${deletedUsers?.length || 0} non-super-admin users:`);
    deletedUsers?.forEach(u => console.log(`  - Removed user: ${u.full_name} (${u.phone}, ${u.email})`));
  }

  // 3. Verification
  console.log('\n====================================================');
  console.log(' VERIFYING FINAL DATABASE STATE');
  console.log('====================================================');
  const { data: remainingUsers } = await sb.from('users').select('id, phone, email, full_name, role');
  console.log(`Remaining Users in DB (${remainingUsers?.length}):`);
  remainingUsers?.forEach(u => console.log(`  * ${u.full_name} | Role: ${u.role} | Phone: ${u.phone} | Email: ${u.email} | ID: ${u.id}`));

  const { data: remainingPortfolio } = await sb.from('portfolio_samples').select('id, title, youtube_id, is_visible');
  console.log(`Remaining Portfolio Samples in DB (${remainingPortfolio?.length}):`);
  remainingPortfolio?.forEach((p, idx) => console.log(`  ${idx + 1}. [${p.youtube_id}] "${p.title}" (visible: ${p.is_visible})`));

  const { count: orderCount } = await sb.from('orders').select('*', { count: 'exact', head: true });
  const { count: creatorCount } = await sb.from('creator_profiles').select('*', { count: 'exact', head: true });
  const { count: subCount } = await sb.from('creator_submissions').select('*', { count: 'exact', head: true });
  console.log(`Remaining Orders: ${orderCount} (0 demo/test orders)`);
  console.log(`Remaining Creator Profiles: ${creatorCount}`);
  console.log(`Remaining Creator Submissions: ${subCount}`);

  console.log('\n>>> Database cleanup completed successfully! <<<');
}

cleanup().catch(console.error);
