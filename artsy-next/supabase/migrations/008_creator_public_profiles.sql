-- Migration: 008_creator_public_profiles.sql
-- Description: Extend creator_profiles with public fields, create portfolio_samples table, extend orders, and create public view.

-- 1.1 Extend creator_profiles table
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_specialty TEXT,
  ADD COLUMN IF NOT EXISTS public_bio TEXT,
  ADD COLUMN IF NOT EXISTS public_display_name TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
  ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_projects_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_accepting_work BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS creator_tier TEXT CHECK (creator_tier IN ('rising_talent', 'standard', 'senior')) DEFAULT 'rising_talent';

-- 1.2 Create portfolio_samples table
CREATE TABLE IF NOT EXISTS public.portfolio_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_creator ON public.portfolio_samples(creator_id, approval_status);

-- 1.3 Extend orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS preferred_creator_id UUID REFERENCES public.creator_profiles(id),
  ADD COLUMN IF NOT EXISTS preferred_creator_assigned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preferred_creator_rejection_reason TEXT;

-- 1.4 Create public view for creator listing
CREATE OR REPLACE VIEW public.creators_public_view AS
SELECT
  id,
  public_display_name,
  public_specialty,
  public_bio,
  years_of_experience,
  avg_rating,
  total_projects_completed,
  is_accepting_work,
  creator_tier
FROM public.creator_profiles
WHERE is_public = TRUE
  AND approval_status = 'approved'
  AND is_suspended = FALSE;

-- 1.5 RLS policies
ALTER TABLE public.portfolio_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved portfolio samples" ON public.portfolio_samples;
CREATE POLICY "Anyone can view approved portfolio samples"
  ON public.portfolio_samples
  FOR SELECT
  USING (approval_status = 'approved');

DROP POLICY IF EXISTS "Creators can insert their own samples" ON public.portfolio_samples;
CREATE POLICY "Creators can insert their own samples"
  ON public.portfolio_samples
  FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM creator_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins full manage portfolio samples" ON public.portfolio_samples;
CREATE POLICY "Admins full manage portfolio samples"
  ON public.portfolio_samples
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 1.6: Grant permissions to access table and view
GRANT ALL ON public.portfolio_samples TO anon, authenticated, service_role;
GRANT SELECT ON public.creators_public_view TO anon, authenticated, service_role;
