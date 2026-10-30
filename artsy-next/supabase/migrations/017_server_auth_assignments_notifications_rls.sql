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

DO $$
BEGIN
  -- 2. assignments policies
  DROP POLICY IF EXISTS "Allow server auth insert assignments" ON public.assignments;
  CREATE POLICY "Allow server auth insert assignments" ON public.assignments
  FOR INSERT WITH CHECK (public.is_server_authorized() OR public.is_admin());

  DROP POLICY IF EXISTS "Allow server auth update assignments" ON public.assignments;
  CREATE POLICY "Allow server auth update assignments" ON public.assignments
  FOR UPDATE USING (public.is_server_authorized() OR public.is_admin())
  WITH CHECK (public.is_server_authorized() OR public.is_admin());

  DROP POLICY IF EXISTS "Allow server auth select assignments" ON public.assignments;
  CREATE POLICY "Allow server auth select assignments" ON public.assignments
  FOR SELECT USING (public.is_server_authorized() OR public.is_admin() OR auth.uid() = creator_id);

  -- 3. notifications policies
  DROP POLICY IF EXISTS "Allow server auth insert notifications" ON public.notifications;
  CREATE POLICY "Allow server auth insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_server_authorized() OR public.is_admin());

  DROP POLICY IF EXISTS "Allow server auth update notifications" ON public.notifications;
  CREATE POLICY "Allow server auth update notifications" ON public.notifications
  FOR UPDATE USING (public.is_server_authorized() OR public.is_admin() OR auth.uid() = user_id)
  WITH CHECK (public.is_server_authorized() OR public.is_admin() OR auth.uid() = user_id);

  DROP POLICY IF EXISTS "Allow server auth select notifications" ON public.notifications;
  CREATE POLICY "Allow server auth select notifications" ON public.notifications
  FOR SELECT USING (public.is_server_authorized() OR public.is_admin() OR auth.uid() = user_id);
END $$;
