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
