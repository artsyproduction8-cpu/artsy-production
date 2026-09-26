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
