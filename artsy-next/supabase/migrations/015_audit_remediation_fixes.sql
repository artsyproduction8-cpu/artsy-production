-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 015: AUDIT REMEDIATION & WORM RLS FIXES
-- =============================================================================
-- Remediates:
-- 1. DE-2: Fix RLS policies on invoice_records and credit_notes (orders.user_id -> orders.client_id)
-- 2. DE-3: Update is_admin() function to include 'super_admin' role
-- 3. DE-1: Idempotently ensure order_timeline and user_audit_events tables exist with RLS
-- =============================================================================

-- 1. FIX RLS POLICIES ON INVOICE_RECORDS (Fix undefined column user_id)
DROP POLICY IF EXISTS "Clients can view their own invoice records" ON public.invoice_records;
CREATE POLICY "Clients can view their own invoice records"
    ON public.invoice_records FOR SELECT
    USING (auth.uid() IN (SELECT client_id FROM public.orders WHERE id = invoice_records.order_id));

-- 2. FIX RLS POLICIES ON CREDIT_NOTES (Fix undefined column user_id)
DROP POLICY IF EXISTS "Clients can view their own credit notes" ON public.credit_notes;
CREATE POLICY "Clients can view their own credit notes"
    ON public.credit_notes FOR SELECT
    USING (auth.uid() IN (SELECT client_id FROM public.orders WHERE id = credit_notes.order_id));

-- 3. UPDATE IS_ADMIN FUNCTION TO INCLUDE SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ENSURE ORDER_TIMELINE TABLE EXISTS WITH RLS & SERVER AUTH
CREATE TABLE IF NOT EXISTS public.order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.users(id),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id 
  ON public.order_timeline(order_id, created_at DESC);

ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_timeline' AND policyname = 'Allow server auth full access on order_timeline'
  ) THEN
    CREATE POLICY "Allow server auth full access on order_timeline" 
      ON public.order_timeline
      FOR ALL 
      TO public 
      USING (is_server_authorized())
      WITH CHECK (is_server_authorized());
  END IF;
END $$;

-- 5. ENSURE USER_AUDIT_EVENTS TABLE EXISTS WITH RLS & SERVER AUTH
CREATE TABLE IF NOT EXISTS public.user_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.users(id),
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_audit_events_user_id 
  ON public.user_audit_events(user_id, created_at DESC);

ALTER TABLE public.user_audit_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_audit_events' AND policyname = 'Allow server auth full access on user_audit_events'
  ) THEN
    CREATE POLICY "Allow server auth full access on user_audit_events" 
      ON public.user_audit_events
      FOR ALL 
      TO public 
      USING (is_server_authorized())
      WITH CHECK (is_server_authorized());
  END IF;
END $$;

-- 6. GRANT PERMISSIONS
GRANT ALL ON public.order_timeline TO anon, authenticated, service_role;
GRANT ALL ON public.user_audit_events TO anon, authenticated, service_role;
