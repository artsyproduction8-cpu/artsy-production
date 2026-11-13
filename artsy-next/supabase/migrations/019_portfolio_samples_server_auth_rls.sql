-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 019: SERVER AUTH RLS FOR PORTFOLIO SAMPLES
-- =============================================================================
-- Description:
-- Grants explicit server-authorized insertion, update, and delete access on
-- public.portfolio_samples matching Migration 016 & 017 standard.
-- =============================================================================

-- 1. Grant table level operations
GRANT ALL ON public.portfolio_samples TO anon, authenticated, service_role;

DO $$
BEGIN
  -- 2. Drop legacy permissive or restrictive policies
  DROP POLICY IF EXISTS "Admins full manage portfolio samples" ON public.portfolio_samples;
  DROP POLICY IF EXISTS "Allow server auth full access on portfolio_samples" ON public.portfolio_samples;

  -- 3. Create canonical server-auth policy
  CREATE POLICY "Allow server auth full access on portfolio_samples"
    ON public.portfolio_samples
    FOR ALL
    TO public
    USING (public.is_server_authorized() OR public.is_admin())
    WITH CHECK (public.is_server_authorized() OR public.is_admin());
END $$;

