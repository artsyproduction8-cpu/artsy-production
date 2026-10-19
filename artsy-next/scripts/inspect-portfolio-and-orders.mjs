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
  const { data: portfolio } = await sb.from('portfolio_samples').select('id, title, youtube_id, is_visible, creator_id');
  console.log('--- PORTFOLIO SAMPLES ---');
  portfolio?.forEach((p, i) => console.log(`${i+1}. [${p.youtube_id}] "${p.title}" (creator_id: ${p.creator_id}, visible: ${p.is_visible})`));

  const { data: orders } = await sb.from('orders').select('id, client_id, status, amount_paise, created_at');
  console.log('\n--- ORDERS ---');
  orders?.forEach((o, i) => console.log(`${i+1}. id=${o.id} client_id=${o.client_id} status=${o.status} amount=${o.amount_paise}`));

  const { data: creatorProfiles } = await sb.from('creator_profiles').select('id, public_display_name, approval_status');
  console.log('\n--- CREATOR PROFILES ---');
  creatorProfiles?.forEach((c, i) => console.log(`${i+1}. id=${c.id} name="${c.public_display_name}" status=${c.approval_status}`));

  const { data: submissions } = await sb.from('creator_submissions').select('id, full_name, phone, email, status');
  console.log('\n--- CREATOR SUBMISSIONS ---');
  submissions?.forEach((s, i) => console.log(`${i+1}. id=${s.id} name="${s.full_name}" phone=${s.phone} status=${s.status}`));
}

main().catch(console.error);
