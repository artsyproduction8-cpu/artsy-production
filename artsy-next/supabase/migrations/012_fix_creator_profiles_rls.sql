-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 012: FIX CREATOR PROFILES RLS & SERVER AUTH
-- =============================================================================
-- Fixes PostgreSQL error 42P17 (infinite recursion detected in policy for relation "creator_profiles")
-- and ensures server-authorized requests can perform atomic insert/update/delete operations.

-- 1. Drop recursive policy on creator_profiles
DROP POLICY IF EXISTS "Creators can update own bio/skills/samples" ON public.creator_profiles;

-- 2. Re-create clean, non-recursive creator update policy
CREATE POLICY "Creators can update own bio/skills/samples" ON public.creator_profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. Allow server-authorized backend access to creator_profiles
DROP POLICY IF EXISTS "Allow server auth full access on creator_profiles" ON public.creator_profiles;
CREATE POLICY "Allow server auth full access on creator_profiles" 
    ON public.creator_profiles 
    FOR ALL 
    TO public 
    USING (is_server_authorized()) 
    WITH CHECK (is_server_authorized());
