-- =============================================================================
-- Migration: 005_tds_rate_fix.sql
-- Fix: TDS Rate Default in Schema (194J-Tech 2%)
-- =============================================================================

ALTER TABLE creator_payouts ALTER COLUMN tds_rate SET DEFAULT 0.0200;
UPDATE platform_config SET value = '0.02' WHERE key = 'tds_rate';
