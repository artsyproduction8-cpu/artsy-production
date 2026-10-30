-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 017: SERVER AUTH POLICIES FOR ASSIGNMENTS & NOTIFICATIONS
-- =============================================================================
-- Grants explicit server-authorized insertion and modification access on
-- public.assignments and public.notifications so that automated creator job offers,
-- acceptance/decline state machines, and in-app notifications persist reliably.
-- =============================================================================

-- 1. Grant table level operations
GRANT ALL ON public.assignments TO anon, authenticated, service_role;
GRANT ALL ON public.notifications TO anon, authenticated, service_role;

-- 2. Grant execute permissions on helper functions to prevent 42501 permission denied
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role, public;
GRANT EXECUTE ON FUNCTION public.is_server_authorized() TO anon, authenticated, service_role, public;

DO $$
BEGIN
  -- 3. assignments policies (Matching Migration 016 server-auth standard)
  DROP POLICY IF EXISTS "Allow server auth insert assignments" ON public.assignments;
  DROP POLICY IF EXISTS "Allow server auth update assignments" ON public.assignments;
  DROP POLICY IF EXISTS "Allow server auth select assignments" ON public.assignments;
  DROP POLICY IF EXISTS "Allow server auth full access on assignments" ON public.assignments;

  CREATE POLICY "Allow server auth full access on assignments"
    ON public.assignments
    FOR ALL
    TO public
    USING (public.is_server_authorized())
    WITH CHECK (public.is_server_authorized());

  -- 4. notifications policies (Matching Migration 016 server-auth standard)
  DROP POLICY IF EXISTS "Allow server auth insert notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Allow server auth update notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Allow server auth select notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Allow server auth full access on notifications" ON public.notifications;

  CREATE POLICY "Allow server auth full access on notifications"
    ON public.notifications
    FOR ALL
    TO public
    USING (public.is_server_authorized())
    WITH CHECK (public.is_server_authorized());
END $$;
