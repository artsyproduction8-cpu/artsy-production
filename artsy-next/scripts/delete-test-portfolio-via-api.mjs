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
  const testSamples = await sb
    .from('portfolio_samples')
    .select('id, youtube_id, title')
    .in('youtube_id', ['dQw4w9WgXcQ', 'test087694']);

  console.log('Target test samples:', testSamples.data);

  if (!testSamples.data || testSamples.data.length === 0) {
    console.log('No test samples found in database.');
    return;
  }

  // Update them to is_visible: false and approval_status: 'deleted'
  for (const s of testSamples.data) {
    const upRes = await sb
      .from('portfolio_samples')
      .update({ is_visible: false, approval_status: 'deleted' })
      .eq('id', s.id);
    console.log(`Update ${s.youtube_id} to invisible:`, upRes.error || 'ok');
  }

  const after = await sb.from('portfolio_samples').select('id, youtube_id, title, is_visible, approval_status');
  console.log('\nRemaining samples in DB:');
  after.data?.forEach(s => console.log(`- [${s.youtube_id}] "${s.title}" (visible: ${s.is_visible}, status: ${s.approval_status})`));
}

main().catch(console.error);
