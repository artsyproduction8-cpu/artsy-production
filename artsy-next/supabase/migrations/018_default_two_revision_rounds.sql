-- =============================================================================
-- Migration 018: Default 2 Included Revision Rounds & Dynamic Change Order Sizing
-- =============================================================================

-- 1. Ensure max_free_revisions defaults to 2 for all newly created projects
ALTER TABLE public.projects 
    ALTER COLUMN max_free_revisions SET DEFAULT 2;

-- 2. Upgrade any legacy or active projects with max_free_revisions = 1 to 2 included rounds
UPDATE public.projects 
SET max_free_revisions = 2,
    updated_at = NOW()
WHERE max_free_revisions < 2 OR max_free_revisions IS NULL;

-- 3. Ensure change_orders table has appropriate index for fast lookup by project_id and status
CREATE INDEX IF NOT EXISTS idx_change_orders_project_status 
ON public.change_orders (project_id, status);

