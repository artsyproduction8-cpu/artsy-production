-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 014: HARDWARE, SAMPLES & NDA PERSISTENCE
-- =============================================================================
-- Phase 3 & Phase 4: Creator Onboarding Workstation Hardware, Portfolio Samples,
-- and Permanent NDA Timestamp Persistence.

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS hardware_config TEXT,
  ADD COLUMN IF NOT EXISTS sample_url_1 TEXT,
  ADD COLUMN IF NOT EXISTS sample_url_2 TEXT,
  ADD COLUMN IF NOT EXISTS sample_url_3 TEXT,
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ;

ALTER TABLE public.creator_agreements
  ADD COLUMN IF NOT EXISTS agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_name TEXT;
