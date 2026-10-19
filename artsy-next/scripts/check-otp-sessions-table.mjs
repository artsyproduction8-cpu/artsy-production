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
  const testPhone = '9999010099';
  const { data, error } = await sb.from('otp_sessions').insert({
    phone: testPhone,
    otp_hash: 'testhash',
    expires_at: new Date(Date.now() + 600000).toISOString(),
    verified: false,
    ip_address: '127.0.0.1'
  }).select();
  console.log('Insert test into otp_sessions:', { data, error });

  if (!error) {
    await sb.from('otp_sessions').delete().eq('phone', testPhone);
    console.log('Cleaned up test row');
  }
}

main().catch(console.error);
