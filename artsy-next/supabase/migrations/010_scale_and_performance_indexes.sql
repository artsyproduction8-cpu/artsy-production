-- =============================================================================
-- ARTSY PRODUCTION — MIGRATION 010: SCALE & PERFORMANCE INDEXES (100K+ USERS)
-- =============================================================================
-- Solves sequential scans and unindexed foreign keys identified in the 
-- Ultimate Scalability & Performance Audit.

-- 1. CRITICAL QUERY PERFORMANCE INDEXES
-- 1.1 Orders Client Dashboard & History (Eliminates Sort / Seq Scan)
CREATE INDEX IF NOT EXISTS idx_orders_client_created_at 
  ON public.orders(client_id, created_at DESC);

-- 1.2 Public Portfolio Samples (Eliminates Seq Scan on is_visible & creator_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_portfolio_samples_visible_company 
  ON public.portfolio_samples(is_visible, display_order ASC) 
  WHERE creator_id IS NULL;

-- 1.3 Admin Vetting Submissions (Eliminates Seq Scan on status = 'pending')
CREATE INDEX IF NOT EXISTS idx_creator_submissions_status_submitted 
  ON public.creator_submissions(status, submitted_at DESC);

-- 1.4 General Creator Submissions Lookup by Creator
CREATE INDEX IF NOT EXISTS idx_creator_submissions_creator_id 
  ON public.creator_submissions(creator_id);


-- 2. MISSING FOREIGN KEY INDEXES (100K+ Multi-Table Join & Cascade Scalability)
-- 2.1 Payments -> Orders
CREATE INDEX IF NOT EXISTS idx_payments_order_id 
  ON public.payments(order_id);

-- 2.2 Projects -> Orders
CREATE INDEX IF NOT EXISTS idx_projects_order_id 
  ON public.projects(order_id);

-- 2.3 Assignments -> Creator Profiles (as leading key)
CREATE INDEX IF NOT EXISTS idx_assignments_creator_id 
  ON public.assignments(creator_id, status);

-- 2.4 Revisions -> Projects & Authors
CREATE INDEX IF NOT EXISTS idx_revisions_project_id 
  ON public.revisions(project_id);
CREATE INDEX IF NOT EXISTS idx_revisions_author_id 
  ON public.revisions(author_id);

-- 2.5 Review Comments -> Revisions
CREATE INDEX IF NOT EXISTS idx_review_comments_revision_id 
  ON public.review_comments(revision_id);

-- 2.6 File Records -> Projects & Uploaders
CREATE INDEX IF NOT EXISTS idx_file_records_project_id 
  ON public.file_records(project_id);
CREATE INDEX IF NOT EXISTS idx_file_records_uploaded_by 
  ON public.file_records(uploaded_by);

-- 2.7 Creator Payouts -> Projects & Orders
CREATE INDEX IF NOT EXISTS idx_creator_payouts_project_id 
  ON public.creator_payouts(project_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_order_id 
  ON public.creator_payouts(order_id);

-- 2.8 Orders -> Preferred Creator & Quotes
CREATE INDEX IF NOT EXISTS idx_orders_preferred_creator_id 
  ON public.orders(preferred_creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_quote_id 
  ON public.orders(quote_id);

-- 2.9 Creator Profiles -> Approver
CREATE INDEX IF NOT EXISTS idx_creator_profiles_approved_by 
  ON public.creator_profiles(approved_by);

-- 2.10 Portfolio Samples -> Approver
CREATE INDEX IF NOT EXISTS idx_portfolio_samples_approved_by 
  ON public.portfolio_samples(approved_by);
