-- =============================================================================
-- ARTSY PRODUCTION — CANONICAL MASTER SCHEMA (V2.0 LOCKED)
-- =============================================================================
-- Document Version: 2.0 (Post-Audit, Decision-Locked)
-- Source: Artsy Production — Master Plan (Reviewed & Finalized).md
-- Stack: Supabase (Postgres + Auth), Next.js App Router, Razorpay, Bunny Stream, B2
--
-- CORE PRINCIPLES:
-- 1. All monetary values stored as INTEGER in paise (1 INR = 100 paise).
-- 2. Immutable audit tables: financial_events, payments, quotes, audit_logs,
--    consent_records, ai_decision_log (strictly append-only).
-- 3. Webhook idempotency via webhook_events UNIQUE(gateway, event_id).
-- 4. 32 project statuses and 14 order statuses.
-- 5. Full DPDP compliance (consent records, right-to-erasure soft deletes).
-- 6. Zero-trust Row Level Security (RLS) enabled on every single table.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS & ROLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email               TEXT UNIQUE NOT NULL,
    phone               TEXT UNIQUE NOT NULL,
    full_name           TEXT NOT NULL,
    role                TEXT NOT NULL CHECK (role IN ('client', 'freelancer', 'admin')),
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'banned')),
    avatar_url          TEXT,
    consent_given_at    TIMESTAMPTZ,
    consent_version     TEXT,
    deleted_at          TIMESTAMPTZ, -- DPDP soft delete / anonymization marker
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATOR PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id                      UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    bio                     TEXT,
    skills                  TEXT[] DEFAULT '{}',
    software                TEXT[] DEFAULT '{}',
    experience_years        INTEGER DEFAULT 0,
    languages               TEXT[] DEFAULT '{}',
    portfolio_url           TEXT,
    sample_links            TEXT[] DEFAULT '{}',
    approval_status         TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
    rejection_reason        TEXT,
    approved_by             UUID REFERENCES public.users(id),
    approved_at             TIMESTAMPTZ,
    is_suspended            BOOLEAN DEFAULT FALSE,
    suspended_reason        TEXT,
    suspended_at            TIMESTAMPTZ,
    total_projects_completed INTEGER DEFAULT 0,
    active_projects_count   INTEGER DEFAULT 0, -- Max concurrent limit = 3
    -- Encrypted sensitive payment details (separate columns, not generic JSONB)
    bank_account_name       TEXT,
    bank_account_number     TEXT,
    bank_ifsc_code          TEXT,
    pan_number              TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SERVICES CATALOG
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.services (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category                TEXT NOT NULL CHECK (category IN ('wedding', 'brand', 'corporate', 'personal')),
    sub_category            TEXT NOT NULL,
    name                    TEXT NOT NULL,
    description             TEXT,
    duration_label          TEXT,
    base_price              INTEGER NOT NULL, -- in paise
    standard_delivery_days  INTEGER NOT NULL DEFAULT 7,
    rush_4_5d_fee           INTEGER DEFAULT 0, -- in paise
    rush_48h_fee            INTEGER DEFAULT 0, -- in paise
    deliverables            TEXT[] DEFAULT '{}',
    requirements_schema     JSONB DEFAULT '{}',
    is_active               BOOLEAN DEFAULT TRUE,
    sort_order              INTEGER DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PRICING RULES (Normalized, Structured Rules)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID REFERENCES public.services(id) ON DELETE CASCADE,
    rule_type       TEXT NOT NULL CHECK (rule_type IN (
        'extra_camera', 'rush_delivery_4_5d', 'rush_delivery_48h',
        'output_4k', 'raw_4k', 'extra_footage',
        'retention_extension_30d', 'retention_extension_90d',
        'extra_revision_round'
    )),
    name            TEXT NOT NULL,
    description     TEXT,
    condition       JSONB DEFAULT '{}',
    price_paise     INTEGER NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. QUOTES (Immutable Price Snapshots, 7-Day Validity)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quotes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id               UUID REFERENCES public.users(id),
    service_id              UUID REFERENCES public.services(id),
    requirements            JSONB NOT NULL DEFAULT '{}',
    base_price              INTEGER NOT NULL, -- in paise
    add_ons                 JSONB NOT NULL DEFAULT '[]',
    subtotal                INTEGER NOT NULL, -- in paise
    gst_rate                DECIMAL(5,4) DEFAULT 0.1800,
    gst_amount              INTEGER NOT NULL, -- in paise
    gateway_fee_pct         DECIMAL(5,4) DEFAULT 0.0200,
    gateway_fee             INTEGER NOT NULL DEFAULT 0, -- in paise
    net_revenue             INTEGER NOT NULL, -- in paise (available for split)
    creator_share_pct       DECIMAL(5,2) DEFAULT 70.00,
    creator_amount          INTEGER NOT NULL, -- in paise
    artsy_share_pct         DECIMAL(5,2) DEFAULT 30.00,
    artsy_amount            INTEGER NOT NULL, -- in paise
    total_price             INTEGER NOT NULL, -- in paise (client gross total)
    estimated_delivery_days INTEGER,
    admin_reviewed          BOOLEAN DEFAULT FALSE,
    admin_id                UUID REFERENCES public.users(id),
    admin_notes             TEXT,
    valid_until             TIMESTAMPTZ NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_approval', 'approved', 'presented', 'accepted', 'expired', 'rejected'
    )),
    created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ORDERS (14 Statuses, Financial Records)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number            TEXT UNIQUE NOT NULL,
    client_id               UUID REFERENCES public.users(id) NOT NULL,
    quote_id                UUID REFERENCES public.quotes(id),
    service_id              UUID REFERENCES public.services(id),
    status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'pending_price_approval',
        'quoted',
        'payment_pending',
        'payment_failed',
        'payment_processing',
        'paid',
        'partially_paid',
        'cancelled',
        'refund_initiated',
        'refunded',
        'disputed',
        'chargeback',
        'completed'
    )),
    currency                TEXT NOT NULL DEFAULT 'INR',
    gross_amount            INTEGER NOT NULL, -- in paise
    gst_amount              INTEGER NOT NULL, -- in paise
    gateway_fee             INTEGER NOT NULL DEFAULT 0, -- in paise
    net_amount              INTEGER NOT NULL, -- in paise
    razorpay_order_id       TEXT UNIQUE,
    razorpay_payment_id     TEXT,
    invoice_number          TEXT UNIQUE,
    invoice_url             TEXT,
    requirements_snapshot   JSONB NOT NULL DEFAULT '{}',
    paid_at                 TIMESTAMPTZ,
    cancelled_at            TIMESTAMPTZ,
    cancellation_reason     TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PAYMENTS (Immutable Financial Records)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID REFERENCES public.orders(id) NOT NULL,
    amount                  INTEGER NOT NULL, -- in paise
    currency                TEXT NOT NULL DEFAULT 'INR',
    gateway                 TEXT NOT NULL DEFAULT 'razorpay',
    gateway_payment_id      TEXT UNIQUE NOT NULL,
    gateway_order_id        TEXT,
    gateway_signature       TEXT,
    payment_method          TEXT,
    status                  TEXT NOT NULL CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
    gateway_response        JSONB,
    captured_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. PROJECTS (32 Status State Machine)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_number          TEXT UNIQUE NOT NULL,
    order_id                UUID UNIQUE REFERENCES public.orders(id) NOT NULL,
    client_id               UUID REFERENCES public.users(id) NOT NULL,
    assigned_creator_id     UUID REFERENCES public.users(id),
    title                   TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'awaiting_upload' CHECK (status IN (
        'draft',
        'quoted',
        'pending_price_approval',
        'payment_pending',
        'payment_failed',
        'paid',
        'awaiting_upload',
        'upload_processing',
        'upload_complete',
        'pending_assignment',
        'creator_proposed',
        'creator_assigned',
        'in_progress',
        'escalated',
        'reassignment_needed',
        'submitted',
        'qa_review',
        'revision_needed',
        'client_review',
        'client_revision_requested',
        'change_order_needed',
        'auto_approved',
        'approved',
        'final_delivery',
        'completed',
        'retention_active',
        'archived',
        'cancelled',
        'refunded',
        'disputed',
        'stale',
        'on_hold'
    )),
    priority                INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    current_revision_round  INTEGER DEFAULT 0,
    max_free_revisions      INTEGER DEFAULT 1,
    internal_deadline       TIMESTAMPTZ,
    client_deadline         TIMESTAMPTZ,
    raw_footage_b2_prefix   TEXT,
    raw_footage_total_bytes BIGINT DEFAULT 0,
    bunny_stream_video_id   TEXT,
    final_download_url      TEXT,
    retention_raw_delete_at TIMESTAMPTZ,
    retention_final_delete_at TIMESTAMPTZ,
    raw_soft_deleted_at     TIMESTAMPTZ,
    raw_hard_deleted_at     TIMESTAMPTZ,
    final_soft_deleted_at   TIMESTAMPTZ,
    final_hard_deleted_at   TIMESTAMPTZ,
    auto_approve_at         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. ASSIGNMENTS (Creator Assignment & 24h Acceptance Tracking)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID REFERENCES public.projects(id) NOT NULL,
    creator_id          UUID REFERENCES public.users(id) NOT NULL,
    status              TEXT NOT NULL DEFAULT 'offered' CHECK (status IN (
        'offered', 'accepted', 'declined', 'timeout', 'reassigned', 'cancelled'
    )),
    offered_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at          TIMESTAMPTZ NOT NULL, -- 24h acceptance window
    responded_at        TIMESTAMPTZ,
    decline_reason      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. ACCESS GRANTS (B2 Storage Access Tracking with Expiry)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.access_grants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID REFERENCES public.projects(id) NOT NULL,
    user_id             UUID REFERENCES public.users(id) NOT NULL,
    access_type         TEXT NOT NULL CHECK (access_type IN ('raw_upload', 'raw_download', 'final_download')),
    b2_key_id           TEXT,
    token_hash          TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. REVISIONS (Timestamped Frame/Timecode Comments)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.revisions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID REFERENCES public.projects(id) NOT NULL,
    round_number        INTEGER NOT NULL,
    author_id           UUID REFERENCES public.users(id) NOT NULL,
    timecode_seconds    NUMERIC(10,2),
    comment             TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested', 'in_progress', 'addressed', 'rejected'
    )),
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. CHANGE ORDERS (Scope Creep & Extra Revision Billing)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.change_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID REFERENCES public.projects(id) NOT NULL,
    order_id            UUID REFERENCES public.orders(id) NOT NULL,
    change_type         TEXT NOT NULL CHECK (change_type IN (
        'extra_revision', 'additional_format', 'extra_footage', 'creative_redirect', 'rush_upgrade'
    )),
    description         TEXT NOT NULL,
    additional_price    INTEGER NOT NULL, -- in paise
    gst_amount          INTEGER NOT NULL, -- in paise
    total_price         INTEGER NOT NULL, -- in paise
    status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_approval', 'accepted', 'declined', 'expired', 'paid'
    )),
    expires_at          TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    created_by          UUID REFERENCES public.users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. CREATOR PAYOUTS (TDS 1% & Manual NEFT Tracking)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creator_payouts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID REFERENCES public.projects(id) NOT NULL,
    creator_id          UUID REFERENCES public.users(id) NOT NULL,
    gross_amount        INTEGER NOT NULL, -- in paise (70% share)
    tds_rate            DECIMAL(5,4) DEFAULT 0.0100, -- 1% under Section 194C
    tds_amount          INTEGER NOT NULL, -- in paise
    net_payout          INTEGER NOT NULL, -- in paise
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'
    )),
    neft_utr_reference  TEXT,
    approved_by         UUID REFERENCES public.users(id),
    approved_at         TIMESTAMPTZ,
    processed_at        TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. REFUND ENTRIES (Compensating Ledger for Refunds)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.refund_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES public.orders(id) NOT NULL,
    amount              INTEGER NOT NULL, -- in paise
    reason              TEXT NOT NULL,
    razorpay_refund_id  TEXT,
    status              TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'processed', 'failed')),
    initiated_by        UUID REFERENCES public.users(id),
    credit_note_number  TEXT,
    credit_note_url     TEXT,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. FINANCIAL EVENTS (Immutable Ledger Event Log)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.financial_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID REFERENCES public.orders(id),
    project_id          UUID REFERENCES public.projects(id),
    event_type          TEXT NOT NULL CHECK (event_type IN (
        'client_payment',
        'gateway_fee',
        'gst_liability',
        'creator_payable',
        'tds_withheld',
        'creator_payout',
        'payout_failed',
        'client_refund',
        'refund_gateway_recovery',
        'change_order_payment'
    )),
    amount              INTEGER NOT NULL, -- in paise (positive credit, negative debit)
    currency            TEXT DEFAULT 'INR',
    reference_id        UUID,
    reference_table     TEXT,
    metadata            JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. WEBHOOK EVENTS (Idempotent Webhook Processing)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gateway             TEXT NOT NULL, -- e.g. 'razorpay'
    event_id            TEXT NOT NULL,
    event_type          TEXT NOT NULL,
    payload             JSONB NOT NULL,
    processed_at        TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'ignored')),
    error_message       TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_gateway_event UNIQUE(gateway, event_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. NOTIFICATIONS (In-App Notification Center, 44 Events)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES public.users(id) NOT NULL,
    event_number        INTEGER CHECK (event_number BETWEEN 1 AND 44),
    title               TEXT NOT NULL,
    message             TEXT NOT NULL,
    action_url          TEXT,
    read                BOOLEAN DEFAULT FALSE,
    read_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. NOTIFICATION DELIVERY LOG (WhatsApp Cloud API / SMS / Email Log)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id     UUID REFERENCES public.notifications(id),
    channel             TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email', 'in_app')),
    recipient           TEXT NOT NULL,
    event_number        INTEGER CHECK (event_number BETWEEN 1 AND 44),
    provider_message_id TEXT,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    error_message       TEXT,
    retry_count         INTEGER DEFAULT 0,
    delivered_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. CONSENT RECORDS (DPDP Compliance Tracking)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.consent_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES public.users(id) NOT NULL,
    consent_version     TEXT NOT NULL,
    consent_type        TEXT NOT NULL, -- e.g. 'terms_of_service', 'privacy_policy', 'creator_nda'
    ip_address          INET,
    user_agent          TEXT,
    granted_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 20. DATA DELETION REQUESTS (DPDP Right to Erasure)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES public.users(id) NOT NULL,
    status              TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
        'requested', 'otp_verified', 'approved', 'anonymized', 'rejected'
    )),
    reason              TEXT,
    otp_verified_at     TIMESTAMPTZ,
    anonymized_at       TIMESTAMPTZ,
    admin_notes         TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 21. AUDIT LOGS (Admin Security & Operations Trail)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id            UUID REFERENCES public.users(id),
    action              TEXT NOT NULL,
    target_table        TEXT NOT NULL,
    target_id           UUID,
    old_values          JSONB,
    new_values          JSONB,
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 22. AI DECISION LOG (Training Ground Truth for V3)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_decision_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name        TEXT NOT NULL CHECK (feature_name IN ('pricing_quote', 'creator_matching', 'qa_check', 'revision_tagging')),
    order_id            UUID REFERENCES public.orders(id),
    project_id          UUID REFERENCES public.projects(id),
    input_payload       JSONB NOT NULL,
    recommended_output  JSONB NOT NULL,
    confidence_score    NUMERIC(5,4),
    actual_admin_action JSONB,
    was_overridden      BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 23. FILE RECORDS (Granular File Asset Tracking for B2 & Bunny)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.file_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID REFERENCES public.projects(id) NOT NULL,
    file_type           TEXT NOT NULL CHECK (file_type IN (
        'raw_footage', 'proxy', 'preview_hls', 'final_master', 'invoice_pdf', 'credit_note_pdf'
    )),
    storage_provider    TEXT NOT NULL CHECK (storage_provider IN ('b2', 'bunny', 'supabase')),
    b2_key              TEXT,
    bunny_video_id      TEXT,
    file_name           TEXT NOT NULL,
    file_size_bytes     BIGINT NOT NULL,
    mime_type           TEXT,
    sha256_hash         TEXT,
    retention_delete_at TIMESTAMPTZ,
    is_soft_deleted     BOOLEAN DEFAULT FALSE,
    is_hard_deleted     BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 24. PLATFORM CONFIG (Admin Global Configuration)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_config (
    key                 TEXT PRIMARY KEY,
    value               JSONB NOT NULL,
    description         TEXT,
    updated_by          UUID REFERENCES public.users(id),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Platform Defaults
INSERT INTO public.platform_config (key, value, description) VALUES
    ('creator_share_pct', '70', 'Creator share percentage of available-for-split amount'),
    ('artsy_share_pct', '30', 'Artsy share percentage of available-for-split amount'),
    ('gst_rate', '0.18', 'GST rate (18% SAC 999613)'),
    ('tds_rate', '0.01', 'TDS rate under Section 194C (1%)'),
    ('quote_validity_days', '7', 'Quote expiration validity in days'),
    ('client_auto_approve_days', '7', 'Client preview review auto-approval timeout'),
    ('creator_accept_timeout_hours', '24', 'Hours creator has to accept or decline job offer'),
    ('raw_footage_retention_days', '15', 'Days to retain raw footage on B2 before soft deletion'),
    ('final_video_retention_days', '30', 'Days to retain final master before soft deletion'),
    ('max_concurrent_creator_jobs', '3', 'Maximum concurrent active projects per creator'),
    ('gateway_fee_pct', '0.02', 'Razorpay gateway percentage fee (2%)'),
    ('gateway_fee_gst_pct', '0.18', 'GST on payment gateway fee (18%)')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 25. IMMUTABILITY GUARDS (Triggers Enforcing Append-Only Tables)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_immutable_record()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Table % is strictly immutable. UPDATE and DELETE operations are forbidden.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Apply immutability trigger to financial_events
DROP TRIGGER IF EXISTS trg_immutable_financial_events ON public.financial_events;
CREATE TRIGGER trg_immutable_financial_events
    BEFORE UPDATE OR DELETE ON public.financial_events
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_record();

-- Apply immutability trigger to audit_logs
DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON public.audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_record();

-- Apply immutability trigger to consent_records
DROP TRIGGER IF EXISTS trg_immutable_consent_records ON public.consent_records;
CREATE TRIGGER trg_immutable_consent_records
    BEFORE UPDATE OR DELETE ON public.consent_records
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_record();

-- Apply immutability trigger to ai_decision_log
DROP TRIGGER IF EXISTS trg_immutable_ai_decision_log ON public.ai_decision_log;
CREATE TRIGGER trg_immutable_ai_decision_log
    BEFORE UPDATE OR DELETE ON public.ai_decision_log
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_record();

-- Apply immutability trigger to payments (WORM enforcement)
DROP TRIGGER IF EXISTS trg_immutable_payments ON public.payments;
CREATE TRIGGER trg_immutable_payments
    BEFORE UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_record();

-- Accepted quotes become immutable
CREATE OR REPLACE FUNCTION public.enforce_quote_acceptance_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'accepted' THEN
        RAISE EXCEPTION 'Accepted quote % cannot be modified.', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_immutability_guard ON public.quotes;
CREATE TRIGGER trg_quote_immutability_guard
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.enforce_quote_acceptance_immutability();

-- ─────────────────────────────────────────────────────────────────────────────
-- 26. CRITICAL OPERATIONAL INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_approval ON public.creator_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_services_category_active ON public.services(category, is_active);
CREATE INDEX IF NOT EXISTS idx_quotes_client_status ON public.quotes(client_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_client_status ON public.orders(client_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_creator ON public.projects(assigned_creator_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_creator ON public.assignments(project_id, creator_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_expires_at ON public.assignments(expires_at) WHERE status = 'offered';
CREATE INDEX IF NOT EXISTS idx_access_grants_expires ON public.access_grants(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator_status ON public.creator_payouts(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_events_order ON public.financial_events(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_file_records_retention ON public.file_records(retention_delete_at) WHERE is_hard_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 27. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own non-role fields" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins full access on users" ON public.users
    FOR ALL USING (public.is_admin());

-- Creator profiles policies
CREATE POLICY "Public/Client can view approved creator profiles basic" ON public.creator_profiles
    FOR SELECT USING (approval_status = 'approved' OR auth.uid() = id OR public.is_admin());

CREATE POLICY "Creators can update own bio/skills/samples" ON public.creator_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Creator cannot approve self or change suspension
        AND approval_status = (SELECT approval_status FROM public.creator_profiles WHERE id = auth.uid())
        AND is_suspended = (SELECT is_suspended FROM public.creator_profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins full access on creator profiles" ON public.creator_profiles
    FOR ALL USING (public.is_admin());

-- Services & pricing rules: public read, admin manage
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage services" ON public.services
    FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view active pricing rules" ON public.pricing_rules
    FOR SELECT USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins manage pricing rules" ON public.pricing_rules
    FOR ALL USING (public.is_admin());

-- Quotes: client views own, admin manages
CREATE POLICY "Clients view own quotes" ON public.quotes
    FOR SELECT USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Clients can insert own quote drafts" ON public.quotes
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins manage quotes" ON public.quotes
    FOR ALL USING (public.is_admin());

-- Orders: client views own, admin manages
CREATE POLICY "Clients view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Admins manage orders" ON public.orders
    FOR ALL USING (public.is_admin());

-- Payments: client views own order payments, admin manages
CREATE POLICY "Clients view own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.client_id = auth.uid())
        OR public.is_admin()
    );

CREATE POLICY "Admins manage payments" ON public.payments
    FOR ALL USING (public.is_admin());

-- Projects: client views own, creator views assigned, admin manages
CREATE POLICY "Clients view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = assigned_creator_id OR public.is_admin());

CREATE POLICY "Admins manage projects" ON public.projects
    FOR ALL USING (public.is_admin());

-- Assignments: creator views own offered/accepted, admin manages
CREATE POLICY "Creators view own assignments" ON public.assignments
    FOR SELECT USING (auth.uid() = creator_id OR public.is_admin());

CREATE POLICY "Creators can respond to own assignments" ON public.assignments
    FOR UPDATE USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins manage assignments" ON public.assignments
    FOR ALL USING (public.is_admin());

-- Revisions: client views/adds on own project, creator views, admin manages
CREATE POLICY "Project members view revisions" ON public.revisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = revisions.project_id
            AND (projects.client_id = auth.uid() OR projects.assigned_creator_id = auth.uid())
        ) OR public.is_admin()
    );

CREATE POLICY "Clients add revisions on own project" ON public.revisions
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (SELECT 1 FROM public.projects WHERE projects.id = revisions.project_id AND projects.client_id = auth.uid())
    );

CREATE POLICY "Admins manage revisions" ON public.revisions
    FOR ALL USING (public.is_admin());

-- Creator payouts: creator views own, admin manages (no creator write)
CREATE POLICY "Creators view own payouts" ON public.creator_payouts
    FOR SELECT USING (auth.uid() = creator_id OR public.is_admin());

CREATE POLICY "Admins manage payouts" ON public.creator_payouts
    FOR ALL USING (public.is_admin());

-- Notifications: user views own
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users update own notification read state" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DPDP consent: users insert and view own
CREATE POLICY "Users view own consent" ON public.consent_records
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users record own consent" ON public.consent_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DPDP deletion requests: users insert and view own
CREATE POLICY "Users view own deletion requests" ON public.data_deletion_requests
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users submit deletion request" ON public.data_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Platform config: anyone reads, admin writes
CREATE POLICY "Anyone can read platform config" ON public.platform_config
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage platform config" ON public.platform_config
    FOR ALL USING (public.is_admin());

-- Financial events, audit logs, webhook events: Admin/service-role read only
CREATE POLICY "Admins view financial events" ON public.financial_events
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins view webhook events" ON public.webhook_events
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins view delivery logs" ON public.notification_delivery_log
    FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins view file records" ON public.file_records
    FOR SELECT USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 28. INITIAL CATALOG SEED (Matching Master Plan Section 2)
-- ─────────────────────────────────────────────────────────────────────────────

-- Wedding Services (Section 2.2)
INSERT INTO public.services (category, sub_category, name, description, duration_label, base_price, standard_delivery_days, rush_4_5d_fee, sort_order) VALUES
    ('wedding', 'Highlight', 'Wedding Highlight', 'Cinematic highlight film covering key ceremonial and emotional moments.', '3-5 min', 400000, 7, 200000, 1),
    ('wedding', 'Teaser', 'Wedding Teaser', 'Snappy, high-energy wedding teaser ready for quick social sharing.', '45-60 sec', 200000, 7, 200000, 2),
    ('wedding', 'Bundle', 'Highlight + Teaser + Reel', 'Complete wedding package: full highlight film, teaser, and vertical reel.', '3-5 min + 45-60s + 30-60s', 800000, 7, 200000, 3),
    ('wedding', 'Reel', 'Wedding Reel', 'Vertical 9:16 reel formatted for Instagram and YouTube Shorts.', '30-60 sec', 150000, 7, 200000, 4),
    ('wedding', 'Cinematic Story', 'Cinematic Story', 'Extended cinematic documentary storytelling covering the complete wedding celebration.', '10-15 min', 800000, 7, 200000, 5),
    ('wedding', 'Cinematic Bundle', 'Cinematic Story + Teaser + Reel', 'The ultimate wedding documentary experience with short-form companion assets.', '10-15 min + 45-60s + 30-60s', 1000000, 7, 200000, 6)
ON CONFLICT DO NOTHING;

-- Brand Services (Section 2.3)
INSERT INTO public.services (category, sub_category, name, description, duration_label, base_price, standard_delivery_days, rush_4_5d_fee, rush_48h_fee, sort_order) VALUES
    ('brand', 'Product Video', 'Product Video', 'Crisp, high-conversion product demonstration video.', 'Max 2 min', 300000, 7, 100000, 200000, 10),
    ('brand', 'Brand Video', 'Brand Video', 'Compelling brand narrative establishing tone, mission, and visual style.', 'Max 2 min', 300000, 7, 100000, 200000, 11),
    ('brand', 'Fashion/Apparel', 'Fashion / Apparel Video', 'Dynamic, stylish video tailored for fashion lines and apparel showcases.', 'Max 2 min', 300000, 7, 100000, 200000, 12),
    ('brand', 'Ad Film', 'Digital Ad Film', 'Conversion-optimized advertisement film crafted for paid media campaigns.', 'Max 2 min', 1000000, 7, 100000, 200000, 13),
    ('brand', 'Explainer', 'Explainer Video', 'Informative, engaging explainer breaking down products or software workflows.', 'Max 2 min', 800000, 7, 100000, 200000, 14)
ON CONFLICT DO NOTHING;

-- Corporate Services (Section 2.4)
INSERT INTO public.services (category, sub_category, name, description, duration_label, base_price, standard_delivery_days, rush_4_5d_fee, rush_48h_fee, sort_order) VALUES
    ('corporate', 'Event Highlight', 'Corporate Event Highlight', 'Polished recap capturing summits, annual days, conferences, or launches.', '3-5 min', 1200000, 7, 100000, 200000, 20),
    ('corporate', 'Corporate Film', 'Corporate Film', 'High-production institutional film for stakeholders and investor relations.', '5-10 min', 1500000, 7, 100000, 200000, 21),
    ('corporate', 'Testimonial', 'Customer Testimonial', 'Authentic customer or partner interview story with professional audio mixing.', '2-4 min', 1000000, 7, 100000, 200000, 22),
    ('corporate', 'Training Video', 'Training Video', 'Clear, chapterized educational video for employee onboarding and skills training.', '5-10 min', 800000, 7, 100000, 200000, 23)
ON CONFLICT DO NOTHING;

-- Personal Services (Section 2.5)
INSERT INTO public.services (category, sub_category, name, description, duration_label, base_price, standard_delivery_days, rush_4_5d_fee, rush_48h_fee, sort_order) VALUES
    ('personal', 'Birthday Highlight', 'Birthday Highlight', 'Memorable highlight reel celebrating birthdays and family milestones.', '3-5 min', 300000, 7, 100000, 200000, 30),
    ('personal', 'Engagement Highlight', 'Engagement Highlight', 'Cinematic story of rings, promises, and engagement celebrations.', '3-5 min', 350000, 7, 100000, 200000, 31),
    ('personal', 'Baby Shower Highlight', 'Baby Shower Highlight', 'Heartfelt celebration video preserving precious baby shower moments.', '3-5 min', 300000, 7, 100000, 200000, 32),
    ('personal', 'Maternity Reel', 'Maternity Reel', 'Elegant portrait reel celebrating motherhood.', '30-60 sec', 100000, 7, 100000, 200000, 33)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 29. LEADS & CONTACT CAPTURE (Phase 1 Marketing Site)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    email               TEXT NOT NULL,
    phone               TEXT NOT NULL,
    category            TEXT NOT NULL CHECK (category IN ('wedding', 'brand', 'corporate', 'personal', 'other')),
    message             TEXT,
    project_budget      TEXT,
    status              TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead" ON public.leads
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins manage leads" ON public.leads
    FOR ALL USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_leads_created_status ON public.leads(status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 30. SUPABASE AUTH USER SYNC TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        phone,
        full_name,
        role,
        status,
        avatar_url,
        consent_given_at,
        consent_version
    ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Client'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
        'active',
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        COALESCE(NEW.raw_user_meta_data->>'consent_version', 'v2.0')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public.users.email END,
        phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.users.phone END,
        full_name = CASE WHEN EXCLUDED.full_name <> '' AND EXCLUDED.full_name <> 'Client' THEN EXCLUDED.full_name ELSE public.users.full_name END,
        updated_at = NOW();

    -- If registered role is freelancer, ensure creator profile row exists
    IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'freelancer' THEN
        INSERT INTO public.creator_profiles (id, approval_status)
        VALUES (NEW.id, 'pending')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 31. AUTOMATED UPDATED_AT TIMESTAMP TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I;
            CREATE TRIGGER set_updated_at_%I
            BEFORE UPDATE ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 32. PRICING RULES SEED (Add-ons, Extensions, Revisions)
-- ─────────────────────────────────────────────────────────────────────────────

-- Seed category add-on rules
DO $$
DECLARE
    svc RECORD;
BEGIN
    -- Wedding Add-ons (Section 2.2)
    FOR svc IN SELECT id FROM public.services WHERE category = 'wedding' LOOP
        INSERT INTO public.pricing_rules (service_id, rule_type, name, description, price_paise) VALUES
            (svc.id, 'extra_camera', 'Additional Camera Coverage', 'Extra camera angle / operator per camera', 80000),
            (svc.id, 'rush_delivery_4_5d', 'Rush Delivery (4-5 Days)', 'Expedited turnaround in 4-5 working days', 200000),
            (svc.id, 'extra_revision_round', 'Additional Revision Round', 'Extra structured client revision round beyond 1 free', 100000)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Brand Add-ons (Section 2.3)
    FOR svc IN SELECT id FROM public.services WHERE category = 'brand' LOOP
        INSERT INTO public.pricing_rules (service_id, rule_type, name, description, price_paise) VALUES
            (svc.id, 'extra_camera', 'Additional Camera Angle', 'Multi-camera sync and processing', 50000),
            (svc.id, 'output_4k', '4K Master Output', 'Ultra HD 4K render master', 50000),
            (svc.id, 'raw_4k', '4K Raw Footage Ingest', 'High-bitrate 4K raw footage processing', 50000),
            (svc.id, 'rush_delivery_4_5d', 'Rush Delivery (4-5 Days)', 'Priority queue delivery in 4-5 days', 100000),
            (svc.id, 'rush_delivery_48h', 'Express Rush Delivery (48 Hours)', 'Emergency turnaround within 48 hours', 200000)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Corporate Add-ons (Section 2.4)
    FOR svc IN SELECT id FROM public.services WHERE category = 'corporate' LOOP
        INSERT INTO public.pricing_rules (service_id, rule_type, name, description, price_paise) VALUES
            (svc.id, 'extra_camera', 'Additional Camera Angle', 'Additional keynote or conference camera', 50000),
            (svc.id, 'output_4k', '4K Master Output', 'Ultra HD 4K corporate deliverable', 50000),
            (svc.id, 'raw_4k', '4K Raw Footage Ingest', 'High-capacity raw footage handling', 50000),
            (svc.id, 'rush_delivery_4_5d', 'Rush Delivery (4-5 Days)', 'Priority turnaround', 100000),
            (svc.id, 'rush_delivery_48h', 'Express Rush Delivery (48 Hours)', 'Emergency executive rush', 200000)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- Personal Add-ons (Section 2.5)
    FOR svc IN SELECT id FROM public.services WHERE category = 'personal' LOOP
        INSERT INTO public.pricing_rules (service_id, rule_type, name, description, price_paise) VALUES
            (svc.id, 'extra_camera', 'Additional Camera Angle', 'Extra family or event camera coverage', 80000),
            (svc.id, 'rush_delivery_4_5d', 'Rush Delivery (4-5 Days)', 'Priority delivery', 100000),
            (svc.id, 'rush_delivery_48h', 'Express Rush Delivery (48 Hours)', 'Weekend / immediate rush delivery', 200000)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;
