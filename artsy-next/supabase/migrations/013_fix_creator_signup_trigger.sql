-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 013: FIX CREATOR SIGNUP TRIGGER
-- =============================================================================
-- Invariant: A creator profile MUST only be created when the freelancer explicitly
-- submits the onboarding form via /api/freelancer/onboard.
-- Creating a premature pending row on initial signup bypasses the onboarding form.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, phone, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Client'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public.users.email END,
        phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.users.phone END,
        full_name = CASE WHEN EXCLUDED.full_name <> '' AND EXCLUDED.full_name <> 'Client' THEN EXCLUDED.full_name ELSE public.users.full_name END,
        updated_at = NOW();

    -- Strict Invariant: DO NOT create a creator_profiles row here.
    -- The creator profile row is created ONLY upon explicit form submission
    -- via /api/freelancer/onboard with completed talent details.

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove any default that automatically marks creator profiles as 'registered'
ALTER TABLE IF EXISTS public.creator_profiles 
    ALTER COLUMN onboarding_status DROP DEFAULT;

-- Ensure users.onboarded defaults strictly to FALSE
ALTER TABLE IF EXISTS public.users 
    ALTER COLUMN onboarded SET DEFAULT false;
