import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { 'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026' } },
});

async function main() {
  const tables = [
    'users',
    'creator_profiles',
    'creator_submissions',
    'orders',
    'projects',
    'payments',
    'creator_payouts',
    'assignments',
    'file_records',
    'revisions',
    'review_comments',
    'financial_events',
    'webhook_events',
    'otp_sessions',
    'consent_records',
    'notification_delivery_log',
    'audit_logs',
    'services',
    'portfolio_samples',
  ];

  console.log('--- DATABASE TABLES AUDIT ---');
  for (const table of tables) {
    const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${table}: ERROR -> ${error.message}`);
    } else {
      console.log(`Table ${table}: ${count} rows`);
    }
  }

  // Check users table rows specifically
  const { data: users } = await sb.from('users').select('id, phone, email, full_name, role');
  console.log('\n--- USERS IN DATABASE ---');
  users?.forEach(u => console.log(`User: id=${u.id} phone=${u.phone} email=${u.email} name="${u.full_name}" role=${u.role}`));
}

main().catch(console.error);
