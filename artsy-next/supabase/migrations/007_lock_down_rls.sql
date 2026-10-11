-- Migration: 007_lock_down_rls.sql
-- Description: Locks down Row Level Security and revokes public/anon access to all sensitive tables.

-- Step 1: Enable RLS on all tables (idempotent)
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.file_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.platform_config ENABLE ROW LEVEL SECURITY;

-- Step 2: DROP all existing permissive policies on sensitive tables that allow anon access
DROP POLICY IF EXISTS "Allow public read" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authentication" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous read" ON public.orders;
DROP POLICY IF EXISTS "Allow public read" ON public.orders;
DROP POLICY IF EXISTS "Allow public read" ON public.projects;
DROP POLICY IF EXISTS "Allow public read" ON public.creator_profiles;
DROP POLICY IF EXISTS "Allow public read" ON public.file_records;
DROP POLICY IF EXISTS "Allow public read" ON public.creator_payouts;
DROP POLICY IF EXISTS "Allow public read" ON public.financial_events;

-- Step 3: Revoke anon and authenticated direct access to public schema tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Step 4: Ensure service_role retains full access for server-side Next.js operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
