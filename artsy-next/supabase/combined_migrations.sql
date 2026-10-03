-- =============================================================================
-- ARTSY PRODUCTION — CONSOLIDATED MASTER MIGRATION SCRIPT
-- Generated for Supabase Project: cldewthefsteotdvftlj
-- Generated at: 2026-09-27T10:39:59.596Z
-- =============================================================================


-- -----------------------------------------------------------------------------
-- FILE: 000_canonical_master_schema.sql
-- -----------------------------------------------------------------------------

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
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    tds_rate            DECIMAL(5,4) DEFAULT 0.0200, -- 2% under Section 194J-Tech
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
    ('tds_rate', '0.02', 'TDS rate under Section 194J-Tech (2%)'),
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


-- -----------------------------------------------------------------------------
-- FILE: 001_part1_audit_improvements.sql
-- -----------------------------------------------------------------------------

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


-- -----------------------------------------------------------------------------
-- FILE: 002_master_plan_v2_1_locked_tables.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- ARTSY PRODUCTION — Master Plan v2.1 Locked Tables & WORM Statutory Triggers
-- =============================================================================
-- Document Reference: Master Plan v2.1, Section 4 (Financial & Invoicing Architecture)
-- Principles Enforced:
--   Principle 2: Money is INTEGER (paise)
--   Principle 3: Immutable tables stay immutable (no UPDATE, no DELETE)
--   Principle 11: Invoice vault is WORM (preserved for 72 months per Section 36 CGST Act)
--   Principle 12: RLS on every table
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. GENERIC IMMUTABLE WORM TRIGGER FUNCTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_immutable_worm_record()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'WORM_VIOLATION: Immutable statutory table records cannot be modified or deleted. Operation (%) denied.', TG_OP;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INVOICE RECORDS (Rule 46 CGST Tax Invoices)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoice_records (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID NOT NULL REFERENCES public.orders(id),
    invoice_number          TEXT UNIQUE NOT NULL, -- e.g. INV-ORD101-2026
    invoice_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    sac_code                TEXT NOT NULL DEFAULT '999613',
    place_of_supply_state   TEXT NOT NULL,
    place_of_supply_code    TEXT NOT NULL,
    is_inter_state          BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Monetary Values in PAISE (INTEGER)
    taxable_amount_paise    BIGINT NOT NULL,
    cgst_paise              BIGINT NOT NULL DEFAULT 0,
    sgst_paise              BIGINT NOT NULL DEFAULT 0,
    igst_paise              BIGINT NOT NULL DEFAULT 0,
    total_amount_paise      BIGINT NOT NULL,
    
    -- Entity & Client Snapshots
    client_name             TEXT NOT NULL,
    client_phone            TEXT NOT NULL,
    client_email            TEXT NOT NULL,
    client_gstin            TEXT,
    client_address          TEXT,
    
    -- Statutory Compliance Markers
    statutory_retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months'),
    invoice_pdf_b2_url      TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.invoice_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own invoice records"
    ON public.invoice_records FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.orders WHERE id = invoice_records.order_id));

CREATE POLICY "Admins have full read access to invoice records"
    ON public.invoice_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- WORM Lock Triggers
DROP TRIGGER IF EXISTS trg_invoice_records_worm_update ON public.invoice_records;
CREATE TRIGGER trg_invoice_records_worm_update
    BEFORE UPDATE ON public.invoice_records
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_worm_record();

DROP TRIGGER IF EXISTS trg_invoice_records_worm_delete ON public.invoice_records;
CREATE TRIGGER trg_invoice_records_worm_delete
    BEFORE DELETE ON public.invoice_records
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_worm_record();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CREDIT NOTES (Section 34 CGST Act)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.credit_notes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id                UUID NOT NULL REFERENCES public.orders(id),
    original_invoice_id     UUID REFERENCES public.invoice_records(id),
    credit_note_number      TEXT UNIQUE NOT NULL, -- e.g. CN-ORD101-2026
    credit_note_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    original_invoice_number TEXT NOT NULL,
    sac_code                TEXT NOT NULL DEFAULT '999613',
    
    -- Reversal Amounts in PAISE (INTEGER)
    taxable_refund_paise    BIGINT NOT NULL,
    cgst_reversed_paise     BIGINT NOT NULL DEFAULT 0,
    sgst_reversed_paise     BIGINT NOT NULL DEFAULT 0,
    igst_reversed_paise     BIGINT NOT NULL DEFAULT 0,
    total_refund_paise      BIGINT NOT NULL,
    
    reason                  TEXT NOT NULL,
    statutory_retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months'),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own credit notes"
    ON public.credit_notes FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM public.orders WHERE id = credit_notes.order_id));

CREATE POLICY "Admins have full read access to credit notes"
    ON public.credit_notes FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- WORM Lock Triggers
DROP TRIGGER IF EXISTS trg_credit_notes_worm_update ON public.credit_notes;
CREATE TRIGGER trg_credit_notes_worm_update
    BEFORE UPDATE ON public.credit_notes
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_worm_record();

DROP TRIGGER IF EXISTS trg_credit_notes_worm_delete ON public.credit_notes;
CREATE TRIGGER trg_credit_notes_worm_delete
    BEFORE DELETE ON public.credit_notes
    FOR EACH ROW EXECUTE FUNCTION public.enforce_immutable_worm_record();


-- -----------------------------------------------------------------------------
-- FILE: 003_pii_encryption.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 003: PII & BANKING ENCRYPTION (DPDP ACT, 2023)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Encryption Helper Functions
CREATE OR REPLACE FUNCTION public.encrypt_pii(plaintext TEXT, secret_key TEXT)
RETURNS TEXT AS $$
BEGIN
    IF plaintext IS NULL OR plaintext = '' THEN
        RETURN NULL;
    END IF;
    RETURN encode(pgp_sym_encrypt(plaintext, secret_key, 'compress-algo=1, cipher-algo=aes256'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_pii(ciphertext TEXT, secret_key TEXT)
RETURNS TEXT AS $$
BEGIN
    IF ciphertext IS NULL OR ciphertext = '' THEN
        RETURN NULL;
    END IF;
    BEGIN
        RETURN pgp_sym_decrypt(decode(ciphertext, 'base64'), secret_key);
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL; -- Return null if key is invalid or ciphertext unreadable
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Masking Helper Functions (Rule of Least Privilege)
CREATE OR REPLACE FUNCTION public.mask_pan(pan TEXT)
RETURNS TEXT AS $$
BEGIN
    IF pan IS NULL OR length(pan) < 10 THEN
        RETURN 'XXXXX0000X';
    END IF;
    -- Returns format: XXXXX1234F
    RETURN 'XXXXX' || substring(pan FROM 6 FOR 4) || substring(pan FROM 10 FOR 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.mask_account(acc TEXT)
RETURNS TEXT AS $$
BEGIN
    IF acc IS NULL OR length(acc) < 4 THEN
        RETURN 'XXXX0000';
    END IF;
    -- Returns format: XXXXXXXXX1234
    RETURN repeat('X', GREATEST(length(acc) - 4, 4)) || substring(acc FROM length(acc) - 3 FOR 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Comments & Audit Annotation
COMMENT ON FUNCTION public.encrypt_pii IS 'Encrypts sensitive financial PII (PAN, Account) using AES-256';
COMMENT ON FUNCTION public.decrypt_pii IS 'Decrypts sensitive financial PII for authorized audit disclosure';


-- -----------------------------------------------------------------------------
-- FILE: 004_payments_worm.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 004: IMMUTABLE WORM TRIGGER FOR PAYMENTS TABLE
-- =============================================================================
-- Master Plan v2.1 Principle 3 & Financial Ledger Audit Item #8
-- Enforces Write-Once-Read-Many (WORM) immutability on public.payments.
-- Financial records cannot be mutated, overridden, or deleted by any user or service role.
-- Any corrections or cancellations MUST be recorded as append-only Credit Notes.

CREATE OR REPLACE FUNCTION public.fn_block_payments_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ERROR: payments table is immutable. Cannot UPDATE or DELETE recorded transactions (ID: %). Financial ledger requires append-only credit notes.', OLD.id
        USING ERRCODE = '23514'; -- check_violation
END;
$$ LANGUAGE plpgsql;

-- 1. Prevent UPDATE mutations on payments
DROP TRIGGER IF EXISTS trg_block_payments_update ON public.payments;
CREATE TRIGGER trg_block_payments_update
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_block_payments_mutation();

-- 2. Prevent DELETE mutations on payments
DROP TRIGGER IF EXISTS trg_block_payments_delete ON public.payments;
CREATE TRIGGER trg_block_payments_delete
    BEFORE DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_block_payments_mutation();

COMMENT ON TRIGGER trg_block_payments_update ON public.payments IS 'WORM enforcement: Blocks all updates to captured payment records';
COMMENT ON TRIGGER trg_block_payments_delete ON public.payments IS 'WORM enforcement: Blocks all deletions of captured payment records';


-- -----------------------------------------------------------------------------
-- FILE: 005_otp_sessions.sql
-- -----------------------------------------------------------------------------

-- =============================================================================
-- ARTSY PRODUCTION — OTP Sessions Table (for hashed OTP storage with expiry)
-- =============================================================================
-- Required by: /api/auth/otp (send + verify actions)
-- Security: OTP codes are never stored in plaintext. Only SHA-256 hashes
-- with a per-environment salt (PII_ENCRYPTION_KEY) are persisted.

CREATE TABLE IF NOT EXISTS public.otp_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           TEXT NOT NULL,
    otp_hash        TEXT NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    verified        BOOLEAN DEFAULT FALSE,
    ip_address      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookup during verification
CREATE INDEX IF NOT EXISTS idx_otp_sessions_phone_hash
  ON public.otp_sessions(phone, otp_hash, verified)
  WHERE verified = FALSE;

-- Auto-cleanup: delete expired OTP sessions older than 1 hour
-- (This can be called by a cron or done manually)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_sessions
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE public.otp_sessions ENABLE ROW LEVEL SECURITY;

-- Only server-side (service role) should access this table
CREATE POLICY "Server only access" ON public.otp_sessions
  FOR ALL USING (false);

