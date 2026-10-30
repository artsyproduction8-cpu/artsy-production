-- =============================================================================
-- Migration 016: Server Auth RLS Policies & Orders/Payments Reconciliation
-- Target Database: Supabase PostgreSQL (Mumbai)
-- Description:
-- 1. Updates public.is_admin() to grant full access when is_server_authorized() is true.
-- 2. Adds explicit server-auth RLS policies on orders, payments, financial_events, projects, credit_notes.
-- 3. Reconciles Order ARTSY-MVUXETK5-511006 with live captured Razorpay payment pay_Tu7ABY2ZohQWyL.
-- 4. Cancels superseded duplicate order ARTSY-MVUXCSBO-2C94BB.
-- =============================================================================

-- 1. ENHANCE public.is_admin() TO INCLUDE SERVER AUTHORIZATION
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_server_authorized() THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. EXPLICIT SERVER-AUTH RLS POLICIES FOR ALL CORE COMMERCE TABLES

-- 2.1 ORDERS TABLE
DROP POLICY IF EXISTS "Allow server auth full access on orders" ON public.orders;
CREATE POLICY "Allow server auth full access on orders" 
  ON public.orders
  FOR ALL 
  TO public 
  USING (is_server_authorized())
  WITH CHECK (is_server_authorized());

-- 2.2 PAYMENTS TABLE (WORM insert permitted; triggers block update/delete)
DROP POLICY IF EXISTS "Allow server auth full access on payments" ON public.payments;
CREATE POLICY "Allow server auth full access on payments" 
  ON public.payments
  FOR ALL 
  TO public 
  USING (is_server_authorized())
  WITH CHECK (is_server_authorized());

-- 2.3 FINANCIAL EVENTS TABLE
DROP POLICY IF EXISTS "Allow server auth full access on financial_events" ON public.financial_events;
CREATE POLICY "Allow server auth full access on financial_events" 
  ON public.financial_events
  FOR ALL 
  TO public 
  USING (is_server_authorized())
  WITH CHECK (is_server_authorized());

-- 2.4 PROJECTS TABLE
DROP POLICY IF EXISTS "Allow server auth full access on projects" ON public.projects;
CREATE POLICY "Allow server auth full access on projects" 
  ON public.projects
  FOR ALL 
  TO public 
  USING (is_server_authorized())
  WITH CHECK (is_server_authorized());

-- 2.5 CREDIT NOTES TABLE
DROP POLICY IF EXISTS "Allow server auth full access on credit_notes" ON public.credit_notes;
CREATE POLICY "Allow server auth full access on credit_notes" 
  ON public.credit_notes
  FOR ALL 
  TO public 
  USING (is_server_authorized())
  WITH CHECK (is_server_authorized());

-- 3. RECONCILE CLIENT ORDER & IMMUTABLE PAYMENT RECORDS (Order ARTSY-MVUXETK5-511006)
DO $$
DECLARE
  v_order_id UUID := '52c4c2c7-8800-488f-8690-71d639194643';
  v_dup_order_id UUID := 'f9e7de34-426e-4691-8f61-3838ab098ef2';
  v_payment_id TEXT := 'pay_Tu7ABY2ZohQWyL';
  v_rzp_order_id TEXT := 'order_Tu76KTls2D5flM';
BEGIN
  -- Mark the paid order as 'paid'
  UPDATE public.orders
  SET 
    status = 'paid',
    razorpay_payment_id = v_payment_id,
    paid_at = '2026-10-30T12:09:45.000Z',
    updated_at = NOW()
  WHERE id = v_order_id;

  -- Update project title to accurately reflect Birthday Reel
  UPDATE public.projects
  SET 
    title = 'Personal • Birthday Reel',
    updated_at = NOW()
  WHERE order_id = v_order_id;

  -- Idempotently insert into immutable payments ledger
  IF NOT EXISTS (SELECT 1 FROM public.payments WHERE gateway_payment_id = v_payment_id) THEN
    INSERT INTO public.payments (
      order_id,
      amount,
      currency,
      gateway,
      gateway_payment_id,
      gateway_order_id,
      payment_method,
      status,
      captured_at,
      created_at
    ) VALUES (
      v_order_id,
      100000,
      'INR',
      'razorpay',
      v_payment_id,
      v_rzp_order_id,
      'card',
      'captured',
      '2026-10-30T12:09:45.000Z',
      NOW()
    );
  END IF;

  -- Cancel the duplicate abandoned pending order
  UPDATE public.orders
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancellation_reason = 'Superseded by order ARTSY-MVUXETK5-511006',
    updated_at = NOW()
  WHERE id = v_dup_order_id AND status = 'payment_pending';
END $$;

