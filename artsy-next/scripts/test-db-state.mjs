import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

const content = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  global: { headers: { 'x-artsy-server-auth': 'ArtsyServerSubmissionAuth2026' } },
});

async function run() {
  console.log('Inspecting Supabase database with anon key + server auth header...');

  // 1. Check all users
  const { data: users, error: uErr } = await sb.from('users').select('*');
  console.log('--- ALL USERS ---');
  console.log(users, uErr);

  // 2. Check creator profiles
  const { data: profiles, error: pErr } = await sb.from('creator_profiles').select('*');
  console.log('--- ALL CREATOR PROFILES ---');
  console.log(profiles, pErr);

  // 3. Test insert a brand new user with role 'freelancer'
  const testPhone = '+919999900001';
  const testEmail = 'test_freelancer_check@artsyproduction.in';
  
  // Cleanup test user first
  await sb.from('users').delete().eq('phone', testPhone);
  
  console.log('\n--- INSERTING TEST FREELANCER INTO public.users ---');
  const { data: newUser, error: insErr } = await sb.from('users').insert([{
    phone: testPhone,
    email: testEmail,
    full_name: 'Test Freelancer',
    role: 'freelancer',
  }]).select().single();

  console.log('Inserted user:', newUser, insErr);

  // Check if creator_profiles row was automatically generated
  if (newUser?.id) {
    const { data: autoProfile, error: autoErr } = await sb
      .from('creator_profiles')
      .select('*')
      .eq('id', newUser.id)
      .maybeSingle();

    console.log('\nWas creator_profiles row auto-generated?', autoProfile, autoErr);

    // Clean up
    await sb.from('creator_profiles').delete().eq('id', newUser.id);
    await sb.from('users').delete().eq('id', newUser.id);
    console.log('Cleaned up test record.');
  }
}

run().catch(console.error);

