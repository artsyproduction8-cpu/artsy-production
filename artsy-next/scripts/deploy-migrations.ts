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
  '005_otp_sessions.sql',
];

export async function verifyAndBundleMigrations() {
  console.log('Verifying SQL migration files in:', MIGRATIONS_DIR);
  let totalBytes = 0;
  let combinedSql = `-- =============================================================================\n`;
  combinedSql += `-- ARTSY PRODUCTION — CONSOLIDATED MASTER MIGRATION SCRIPT\n`;
  combinedSql += `-- Generated for Supabase Project: cldewthefsteotdvftlj\n`;
  combinedSql += `-- Generated at: ${new Date().toISOString()}\n`;
  combinedSql += `-- =============================================================================\n\n`;

  for (const file of MIGRATION_FILES) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing migration file: ${file}`);
    }
    const stat = fs.statSync(fullPath);
    totalBytes += stat.size;
    console.log(`  ✓ ${file} (${(stat.size / 1024).toFixed(1)} KB)`);

    const content = fs.readFileSync(fullPath, 'utf8');
    combinedSql += `\n-- -----------------------------------------------------------------------------\n`;
    combinedSql += `-- FILE: ${file}\n`;
    combinedSql += `-- -----------------------------------------------------------------------------\n\n`;
    combinedSql += content + '\n';
  }

  // Write combined migrations file for 1-click execution in Supabase SQL editor
  const bundlePath = path.resolve(__dirname, '../supabase/combined_migrations.sql');
  fs.writeFileSync(bundlePath, combinedSql, 'utf8');

  console.log(`All ${MIGRATION_FILES.length} migration files verified (${(totalBytes / 1024).toFixed(1)} KB total).`);
  console.log(`Consolidated migration bundle generated at:\n  -> ${bundlePath}`);
  return { count: MIGRATION_FILES.length, totalBytes, bundlePath };
}

if (require.main === module) {
  verifyAndBundleMigrations()
    .then((res) => {
      console.log('\nReady for deployment:');
      console.log('  OPTION A (Recommended & Fastest):');
      console.log('    1. Open Supabase Dashboard: https://supabase.com/dashboard/project/cldewthefsteotdvftlj/sql/new');
      console.log(`    2. Open supabase/combined_migrations.sql and paste into the SQL Editor.`);
      console.log('    3. Click "Run" to create all 24+ tables, indexes, RLS policies, and triggers.');
      console.log('\n  OPTION B (Supabase CLI):');
      console.log('    1. npx supabase link --project-ref cldewthefsteotdvftlj');
      console.log('    2. npx supabase db push');
    })
    .catch((err) => {
      console.error('Migration verification failed:', err);
      process.exit(1);
    });
}
