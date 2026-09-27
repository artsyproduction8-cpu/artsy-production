import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually if not in environment
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
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

console.log('Testing Supabase Connection:');
console.log('  URL:', supabaseUrl);
console.log('  Key present:', Boolean(supabaseKey && !supabaseKey.includes('your-supabase-')));

if (!supabaseKey || supabaseKey.includes('your-supabase-') || supabaseKey.includes('[PASTE')) {
  console.log('\n[ERROR] Key is still a placeholder or empty.');
  console.log('Please provide NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  const start = Date.now();
  console.log('\n1. Probing database connectivity...');

  // Test query on users table
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, full_name, role')
    .limit(5);

  const latency = Date.now() - start;
  console.log(`Latency: ${latency}ms`);

  if (userError) {
    console.error('[FAIL] Query error:', userError);
  } else {
    console.log('[PASS] Connected to database!');
    console.log('Users query result:', users);
  }

  // Test insert
  console.log('\n2. Testing insert into users table...');
  const testId = crypto.randomUUID();
  const testPhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testEmail = `test_${Date.now()}@artsyproduction.in`;
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert([
      {
        id: testId,
        email: testEmail,
        phone: testPhone,
        full_name: 'Test Verification User',
        role: 'client',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select();

  if (insertError) {
    console.error('[FAIL] Insert error:', insertError);
  } else {
    console.log('[PASS] Insert succeeded:', insertData);

    // Clean up test user
    console.log('\n3. Cleaning up test user...');
    const { error: delError } = await supabase.from('users').delete().eq('id', testId);
    if (delError) console.warn('Clean up warning:', delError);
    else console.log('[PASS] Cleaned up test record.');
  }

  // Check tables
  console.log('\n4. Verifying core tables...');
  const coreTables = [
    { name: 'users', col: 'id' },
    { name: 'creator_profiles', col: 'id' },
    { name: 'projects', col: 'id' },
    { name: 'orders', col: 'id' },
    { name: 'payments', col: 'id' },
    { name: 'file_records', col: 'id' },
    { name: 'notification_delivery_log', col: 'id' },
    { name: 'otp_sessions', col: 'id' },
    { name: 'platform_config', col: 'key' },
    { name: 'services', col: 'id' },
    { name: 'pricing_rules', col: 'id' },
    { name: 'quotes', col: 'id' },
    { name: 'financial_ledger', col: 'id' },
    { name: 'invoice_records', col: 'id' },
    { name: 'credit_notes', col: 'id' },
    { name: 'activity_log', col: 'id' },
  ];

  for (const tbl of coreTables) {
    const { error } = await supabase.from(tbl.name).select(tbl.col).limit(1);
    if (error) {
      console.log(`  ✗ Table '${tbl.name}': ${error.message}`);
    } else {
      console.log(`  ✓ Table '${tbl.name}': EXISTS & ACCESSIBLE`);
    }
  }
}

run().catch(console.error);
