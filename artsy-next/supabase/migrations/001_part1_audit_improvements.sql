-- =============================================================================
-- ARTSY PRODUCTION — Part 1 Audit Migration
-- =============================================================================
-- Source: Artsy_Production_Part1_Finalized_Improvements.pdf
-- Date: 2026-09-22
-- 
-- This migration adds:
--   1. platform_config     — Admin-editable global settings
--   2. quotes              — Immutable price snapshots locked at checkout
--   3. pricing_rules       — Structured, versioned pricing rules
--   4. change_orders       — Scope-change tracking & billing
--   5. activity_log        — Append-only immutable audit trail
--   6. financial_ledger    — Double-entry money tracking
--   7. creator_agreements  — NDA/agreement acceptance records
--   8. Schema modifications to existing tables
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PLATFORM CONFIG — Admin-editable global settings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_config (
    key             TEXT PRIMARY KEY,
    value           JSONB NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES public.users(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial configuration values
INSERT INTO public.platform_config (key, value, description) VALUES
    ('creator_share_pct', '70', 'Creator share percentage of available-for-split amount'),
    ('artsy_share_pct', '30', 'Artsy share percentage of available-for-split amount'),
    ('gst_rate', '0.18', 'GST rate (18%)'),
    ('tds_rate', '0.02', 'TDS rate — 2% under Section 194J-Tech (Master Plan v2.1 Locked)'),
    ('included_revision_rounds', '1', 'Number of revision rounds included in base price (Master Plan v2.1 Locked)'),
    ('quote_validity_days', '7', 'Number of days a quote remains valid'),
    ('infra_allocation_per_project', '11500', 'Infrastructure allocation per project in paise (₹115)'),
    ('min_order_value', '200000', 'Minimum order value in paise (₹2,000)'),
    ('max_order_value', '50000000', 'Maximum order value in paise (₹5,00,000)'),
    ('gateway_fee_pct', '0.02', 'Payment gateway fee percentage (2%)'),
    ('gateway_fee_gst_pct', '0.18', 'GST on payment gateway fee (18%)'),
    ('change_order_expiry_hours', '48', 'Hours before a pending change order auto-expires'),
    ('raw_footage_retention_days', '15', 'Days to retain raw footage after project completion'),
    ('final_file_retention_days', '30', 'Days to retain final files after project completion')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. QUOTES — Immutable price snapshots
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quotes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES public.orders(id),
    service_id          UUID REFERENCES public.services(id),
    
    -- Snapshot of what the client selected
    requirements        JSONB NOT NULL,
    
    -- Price breakdown (all amounts in paise)
    base_price          INTEGER NOT NULL,
    adjustments         JSONB NOT NULL DEFAULT '[]',
    subtotal            INTEGER NOT NULL,
    
    -- Financial waterfall
    gst_rate            DECIMAL(5,4) DEFAULT 0.1800,
    gst_amount          INTEGER NOT NULL,
    gateway_fee_pct     DECIMAL(5,4) DEFAULT 0.0200,
    gateway_fee         INTEGER DEFAULT 0,
    gateway_fee_gst     INTEGER DEFAULT 0,
    infra_allocation    INTEGER DEFAULT 0,
    available_for_split INTEGER NOT NULL,
    
    -- Split
    creator_share_pct   DECIMAL(5,2) DEFAULT 70.00,
    creator_amount      INTEGER NOT NULL,
    artsy_share_pct     DECIMAL(5,2) DEFAULT 30.00,
    artsy_amount        INTEGER NOT NULL,
    
    -- Client-facing total
    total               INTEGER NOT NULL,
    
    -- Delivery
    estimated_delivery_days INTEGER,
    
    -- Admin review
    admin_reviewed      BOOLEAN DEFAULT FALSE,
    admin_id            UUID REFERENCES public.users(id),
    admin_notes         TEXT,
    
    -- Validity
    valid_until         TIMESTAMPTZ,
    status              TEXT CHECK (status IN (
        'draft', 'presented', 'accepted', 'expired', 'superseded'
    )) DEFAULT 'draft',
    
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes should be immutable once accepted — enforce via trigger
CREATE OR REPLACE FUNCTION public.prevent_quote_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'accepted' THEN
        RAISE EXCEPTION 'Cannot modify an accepted quote (id: %)', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quote_immutability_guard
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_quote_modification();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRICING RULES — Structured, versioned rules
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID REFERENCES public.services(id),
    rule_type       TEXT CHECK (rule_type IN (
        'duration_multiplier', 'complexity_multiplier',
        'variant_multiplier', 'rush_fee', 'format_fee',
        'minimum_price', 'maximum_price'
    )) NOT NULL,
    label           TEXT NOT NULL,
    condition       JSONB NOT NULL,
    adjustment      JSONB NOT NULL,
    priority        INTEGER DEFAULT 0,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      UUID REFERENCES public.users(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CHANGE ORDERS — Scope-change tracking & billing
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.change_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID REFERENCES public.projects(id) NOT NULL,
    order_id            UUID REFERENCES public.orders(id) NOT NULL,
    
    change_type         TEXT CHECK (change_type IN (
        'additional_footage', 'additional_format', 'additional_variant',
        'extra_duration', 'extra_revisions', 'creative_redirect', 'rush_upgrade'
    )) NOT NULL,
    description         TEXT NOT NULL,
    
    -- Scope snapshots
    original_scope      JSONB NOT NULL,
    requested_scope     JSONB NOT NULL,
    
    -- Pricing (all amounts in paise)
    additional_price    INTEGER NOT NULL,
    gst_amount          INTEGER DEFAULT 0,
    total_price         INTEGER NOT NULL,
    
    -- Decision
    status              TEXT CHECK (status IN (
        'draft', 'pending_client', 'accepted', 'declined',
        'expired', 'cancelled'
    )) DEFAULT 'draft',
    
    -- Payment link
    payment_id          UUID REFERENCES public.payments(id),
    
    -- Audit
    created_by          UUID REFERENCES public.users(id),
    client_responded_at TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ACTIVITY LOG — Immutable audit trail for refund evidence
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES public.projects(id) NOT NULL,
    user_id         UUID REFERENCES public.users(id),
    
    event_type      TEXT CHECK (event_type IN (
        'footage_download', 'footage_import_confirmed', 'project_started',
        'timeline_created', 'progress_milestone', 'draft_submitted',
        'qa_review', 'client_review', 'revision_requested', 'revision_submitted',
        'final_approved', 'admin_action', 'checkin', 'status_change',
        'assignment_accepted', 'assignment_declined', 'raw_footage_uploaded',
        'change_order_created', 'change_order_responded', 'refund_requested',
        'refund_processed', 'payout_initiated', 'payout_completed'
    )) NOT NULL,
    
    event_data      JSONB,
    ip_address      INET,
    user_agent      TEXT,
    
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log is append-only: block UPDATE and DELETE for all non-admin roles
CREATE OR REPLACE FUNCTION public.prevent_activity_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Activity log entries are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_log_no_update
    BEFORE UPDATE ON public.activity_log
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_activity_log_modification();

CREATE TRIGGER activity_log_no_delete
    BEFORE DELETE ON public.activity_log
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_activity_log_modification();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FINANCIAL LEDGER — Double-entry money tracking
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.financial_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES public.orders(id),
    project_id      UUID REFERENCES public.projects(id),
    
    entry_type      TEXT CHECK (entry_type IN (
        'client_payment', 'gst_liability', 'gateway_fee', 'infra_allocation',
        'creator_payout', 'artsy_revenue', 'refund', 'tds_deduction',
        'change_order_payment', 'refund_reversal'
    )) NOT NULL,
    
    -- All amounts in paise. Positive = credit, negative = debit.
    amount          INTEGER NOT NULL,
    currency        TEXT DEFAULT 'INR',
    
    reference_id    UUID,               -- FK to payments, payouts, change_orders, etc.
    reference_type  TEXT,               -- 'payment', 'payout', 'change_order', 'refund'
    notes           TEXT,
    
    created_by      UUID REFERENCES public.users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Financial ledger is also immutable (compensating entries, not edits)
CREATE OR REPLACE FUNCTION public.prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Financial ledger entries are immutable. Create a compensating entry instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER financial_ledger_no_update
    BEFORE UPDATE ON public.financial_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_ledger_modification();

CREATE TRIGGER financial_ledger_no_delete
    BEFORE DELETE ON public.financial_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_ledger_modification();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CREATOR AGREEMENTS — NDA/agreement tracking
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_agreements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id      UUID REFERENCES public.users(id) NOT NULL,
    agreement_type  TEXT CHECK (agreement_type IN (
        'nda', 'service_agreement', 'both'
    )) NOT NULL,
    version         TEXT NOT NULL DEFAULT '1.0',
    accepted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. SCHEMA MODIFICATIONS TO EXISTING TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Orders: Add refund tracking and work status evidence
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none'
        CHECK (refund_status IN ('none', 'requested', 'approved', 'processed', 'denied')),
    ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS work_status TEXT DEFAULT 'not_started'
        CHECK (work_status IN ('not_started', 'started', 'substantial_progress', 'completed')),
    ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id);

-- Projects: Add revision tracking
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS included_revisions INTEGER DEFAULT 2,
    ADD COLUMN IF NOT EXISTS current_revision_round INTEGER DEFAULT 0;

-- Services: Add pricing bounds and revision config
ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS included_revisions INTEGER DEFAULT 2,
    ADD COLUMN IF NOT EXISTS min_price INTEGER,
    ADD COLUMN IF NOT EXISTS max_price INTEGER;

-- Creator profiles: Add agreement tracking and extended onboarding status
ALTER TABLE public.creator_profiles
    ADD COLUMN IF NOT EXISTS agreement_accepted BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS agreement_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'registered'
        CHECK (onboarding_status IN (
            'registered', 'incomplete', 'pending_review',
            'approved', 'rejected', 'suspended', 'deactivated'
        ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ROW LEVEL SECURITY FOR NEW TABLES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_agreements ENABLE ROW LEVEL SECURITY;

-- Platform config: read by authenticated, write by admin
CREATE POLICY "Authenticated users can read config" ON public.platform_config
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage config" ON public.platform_config
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Quotes: clients see their own, admins see all
CREATE POLICY "Clients can view own quotes" ON public.quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = public.quotes.order_id
            AND public.orders.client_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all quotes" ON public.quotes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Pricing rules: public read (for configurator), admin write
CREATE POLICY "Anyone can view active pricing rules" ON public.pricing_rules
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage pricing rules" ON public.pricing_rules
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Change orders: client sees own, admin manages all
CREATE POLICY "Clients can view own change orders" ON public.change_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = public.change_orders.order_id
            AND public.orders.client_id = auth.uid()
        )
    );

CREATE POLICY "Clients can update pending change orders" ON public.change_orders
    FOR UPDATE USING (
        status = 'pending_client' AND
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = public.change_orders.order_id
            AND public.orders.client_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all change orders" ON public.change_orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Activity log: project participants can read, system/admin can write
CREATE POLICY "Project participants can view activity log" ON public.activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.orders o ON o.id = p.order_id
            WHERE p.id = public.activity_log.project_id
            AND (o.client_id = auth.uid() OR p.assigned_editor_id = auth.uid())
        )
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert activity log" ON public.activity_log
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
        OR auth.uid() = user_id
    );

-- Financial ledger: admin only
CREATE POLICY "Admins can view financial ledger" ON public.financial_ledger
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert financial ledger entries" ON public.financial_ledger
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- Creator agreements: creator sees own, admin sees all
CREATE POLICY "Creators can view own agreements" ON public.creator_agreements
    FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Creators can insert own agreements" ON public.creator_agreements
    FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Admins can manage all agreements" ON public.creator_agreements
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. INDEXES FOR NEW TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quotes_order_id ON public.quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_service_id ON public.quotes(service_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_service_id ON public.pricing_rules(service_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON public.pricing_rules(active);

CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON public.change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_order_id ON public.change_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON public.change_orders(status);

CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON public.activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_event_type ON public.activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_order_id ON public.financial_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_project_id ON public.financial_ledger(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_entry_type ON public.financial_ledger(entry_type);

CREATE INDEX IF NOT EXISTS idx_creator_agreements_creator_id ON public.creator_agreements(creator_id);

CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON public.orders(refund_status);
CREATE INDEX IF NOT EXISTS idx_orders_work_status ON public.orders(work_status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. UPDATED_AT TRIGGERS FOR NEW TABLES WITH THAT COLUMN
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER update_platform_config_updated_at
    BEFORE UPDATE ON public.platform_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
    BEFORE UPDATE ON public.pricing_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_change_orders_updated_at
    BEFORE UPDATE ON public.change_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
