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
