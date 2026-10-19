-- Migration: 009_user_display_name_and_studio_details.sql
-- Description: Add display_name, studio_details to public.users and tracking_id to public.creator_profiles

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS studio_details JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.creator_profiles 
  ADD COLUMN IF NOT EXISTS tracking_id TEXT;
