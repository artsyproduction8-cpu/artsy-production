import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PRICING_MATRIX } from '../src/lib/pricing/catalog-matrix.ts';

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

async function syncServices() {
  console.log('========================================================');
  console.log(' SYNCHRONIZING SERVICES TABLE WITH CANONICAL MATRIX');
  console.log('========================================================\n');

  // Build canonical rows from DEFAULT_PRICING_MATRIX
  const rowsToInsert = [];
  let sortIndex = 1;

  for (const cat of DEFAULT_PRICING_MATRIX) {
    for (const prod of cat.products) {
      rowsToInsert.push({
        category: cat.id,
        sub_category: prod.id,
        name: prod.name,
        description: prod.description,
        duration_label: prod.duration,
        base_price: prod.basePrice * 100, // stored in paise per schema
        standard_delivery_days: 7,
        rush_4_5d_fee: prod.rushFee * 100,
        rush_48h_fee: prod.rushFee * 100,
        deliverables: prod.deliverables || [],
        is_active: prod.active,
        sort_order: sortIndex++,
        updated_at: new Date().toISOString(),
      });
    }
  }

  console.log(`Prepared ${rowsToInsert.length} canonical services from DEFAULT_PRICING_MATRIX.`);

  // Delete existing rows in services table
  const { error: delErr } = await sb.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) {
    console.warn('Warning deleting existing services:', delErr);
  }

  // Insert fresh canonical rows
  const { data: inserted, error: insErr } = await sb.from('services').insert(rowsToInsert).select();
  if (insErr) {
    console.error('Error inserting canonical services:', insErr);
  } else {
    console.log(`Successfully inserted ${inserted?.length || rowsToInsert.length} canonical services into Supabase.`);
  }

  // Verification
  const { data: verified } = await sb
    .from('services')
    .select('id, category, sub_category, name, base_price, duration_label')
    .order('sort_order', { ascending: true });

  console.log('\nVerified Database Services in Supabase:');
  verified?.forEach((s, idx) => {
    console.log(`  ${idx + 1}. [${s.category}] "${s.name}" (sub_category: "${s.sub_category}") -> ₹${(s.base_price / 100).toLocaleString('en-IN')}`);
  });
}

syncServices().catch(console.error);
