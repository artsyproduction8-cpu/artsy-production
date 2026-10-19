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

const sbAnon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const sbAuthed = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  global: { headers: { 'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026' } },
});

async function main() {
  const unauthed = await sbAnon.rpc('is_server_authorized');
  console.log('Unauthenticated call to is_server_authorized():', unauthed);

  const authed = await sbAuthed.rpc('is_server_authorized');
  console.log('Authenticated call to is_server_authorized():', authed);

  // Test an anon write attempt to users table
  const testAnonWrite = await sbAnon.from('users').insert({
    id: '00000000-0000-0000-0000-000000000000',
    phone: '+910000000000',
    email: 'hack@anon.com',
    role: 'super_admin'
  });
  console.log('Anon write attempt to users table:', {
    error: testAnonWrite.error?.message,
    status: testAnonWrite.status,
    statusText: testAnonWrite.statusText
  });
}

main().catch(console.error);
