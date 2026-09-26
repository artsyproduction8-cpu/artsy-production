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
