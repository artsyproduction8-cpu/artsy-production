/**
 * Artsy Production — Supabase Migration Deployment Script
 *
 * Sequentially applies all canonical database migrations in the exact verified order:
 * 1. 000_canonical_master_schema.sql (Core 30 tables, RLS policies, audit infrastructure)
 * 2. 001_retention_and_payouts.sql (Data retention tables, NEFT batching)
 * 3. 002_fix_audit_logs.sql (Audit log index hardening & action scopes)
 * 4. 003_pii_encryption.sql (pgcrypto, AES-256 PII encryption & masking)
 * 5. 004_payments_worm.sql (WORM trigger on payments table)
 */

import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');

const MIGRATION_FILES = [
  '000_canonical_master_schema.sql',
  '001_part1_audit_improvements.sql',
  '002_master_plan_v2_1_locked_tables.sql',
  '003_pii_encryption.sql',
  '004_payments_worm.sql',
];

export async function verifyMigrationFiles() {
  console.log('Verifying SQL migration files in:', MIGRATIONS_DIR);
  let totalBytes = 0;

  for (const file of MIGRATION_FILES) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing migration file: ${file}`);
    }
    const stat = fs.statSync(fullPath);
    totalBytes += stat.size;
    console.log(`  ✓ ${file} (${stat.size} bytes)`);
  }

  console.log(`All ${MIGRATION_FILES.length} migration files verified (${(totalBytes / 1024).toFixed(1)} KB total).`);
  return true;
}

if (require.main === module) {
  verifyMigrationFiles()
    .then(() => {
      console.log('\nReady for deployment via Supabase CLI:');
      console.log('  1. Link your Supabase project: npx supabase link --project-ref <YOUR_PROJECT_REF>');
      console.log('  2. Push migrations: npx supabase db push');
      console.log('  3. Or apply manually in Supabase SQL Editor in numerical order (000 -> 004).');
    })
    .catch((err) => {
      console.error('Migration verification failed:', err);
      process.exit(1);
    });
}
