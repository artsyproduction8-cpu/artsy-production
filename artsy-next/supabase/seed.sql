-- =============================================================================
-- ARTSY PRODUCTION — PRODUCTION SEED DATA (MASTER PLAN v2.2)
-- =============================================================================
-- Seeds base service catalog, packages, SLAs, and verified seed creators.

-- 1. Services Catalog
INSERT INTO public.services (id, name, slug, description, category, base_price_paise, is_active) VALUES
('srv_wedding_cinema', 'Wedding Cinema Master Cut', 'wedding', 'Cinematic wedding film post-production with 4K color grade, multi-cam sync, and dual audio mastering.', 'wedding', 800000, true),
('srv_brand_commercial', 'Commercial & Brand Promo', 'brand', 'High-impact brand commercial with precision sound design, kinetic typography, and broadcast-ready deliverable.', 'brand', 1200000, true),
('srv_youtube_creator', 'YouTube Episodic / Creator Cut', 'creator', 'Engaging pacing, motion graphics, retention hooks, and YouTube audio compliance.', 'creator', 500000, true),
('srv_personal_event', 'Documentary & Personal Events', 'personal', 'Thoughtful narrative documentary editing for anniversaries, milestones, and family legacy films.', 'personal', 450000, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Service Sub-Categories & Base Pricing
INSERT INTO public.service_packages (id, service_id, name, code, duration_seconds, base_price_paise, description, is_active) VALUES
('pkg_wed_highlight', 'srv_wedding_cinema', 'Highlight Reel (3–5 Mins)', 'WED_HL', 300, 800000, 'Emotional highlight reel cut to licensed soundtrack.', true),
('pkg_wed_feature', 'srv_wedding_cinema', 'Feature Film (15–20 Mins)', 'WED_FF', 1200, 1800000, 'Comprehensive multi-event documentary film.', true),
('pkg_wed_teaser', 'srv_wedding_cinema', 'Social Teaser (60s Vertical + Horizontal)', 'WED_TS', 60, 400000, 'Fast-paced Instagram reel / YouTube short teaser.', true),
('pkg_com_30s', 'srv_brand_commercial', '30-Second Hero Spot', 'COM_30', 30, 1200000, 'Punchy, broadcast-standard advertisement cut.', true),
('pkg_com_60s', 'srv_brand_commercial', '60-Second Extended Commercial', 'COM_60', 60, 1800000, 'Narrative-driven brand commercial film.', true),
('pkg_yt_talking_head', 'srv_youtube_creator', 'Talking Head / Educational (8–12 Mins)', 'YT_TH', 720, 500000, 'Clean jump-cuts, B-roll insertions, and graphic overlays.', true),
('pkg_yt_vlog', 'srv_youtube_creator', 'Lifestyle / Cinematic Vlog (10–15 Mins)', 'YT_VL', 900, 750000, 'Dynamic color grade, sound effects, and music transitions.', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Verified Creators (Encrypted PII placeholders via AES-256)
-- Secret Key: 'artsy_secure_production_secret_key_2026'
INSERT INTO public.users (id, full_name, email, phone, role, status, is_verified) VALUES
('usr_crt_vikram', 'Vikramaditya Rathore', 'vikram.editor@artsyproduction.in', '+919876543211', 'freelancer', 'active', true),
('usr_crt_ananya', 'Ananya Deshmukh', 'ananya.cuts@artsyproduction.in', '+919876543212', 'freelancer', 'active', true),
('usr_crt_karan', 'Karan Patel', 'karan.post@artsyproduction.in', '+919876543213', 'freelancer', 'active', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.creator_profiles (
    id, user_id, display_name, tier, rating, total_projects_completed,
    pan_number, bank_account_number, bank_ifsc_code, status
) VALUES
('cp_vikram', 'usr_crt_vikram', 'Vikram R. (Senior Wedding Colorist)', 'tier_3', 4.95, 42,
 'ENCRYPTED_GCM:9182371928:XXXXX4481K', 'ENCRYPTED_GCM:1928371928:XXXXX1234', 'HDFC0001234', 'approved'),
('cp_ananya', 'usr_crt_ananya', 'Ananya D. (Commercial Lead)', 'tier_2', 4.88, 28,
 'ENCRYPTED_GCM:9182371929:XXXXX8821M', 'ENCRYPTED_GCM:1928371929:XXXXX5678', 'ICIC0000987', 'approved'),
('cp_karan', 'usr_crt_karan', 'Karan P. (YouTube Pacing Specialist)', 'tier_1', 4.82, 14,
 'ENCRYPTED_GCM:9182371930:XXXXX9912P', 'ENCRYPTED_GCM:1928371930:XXXXX9012', 'SBIN0004567', 'approved')
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Platform Financial Configuration
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
('infra_deduction_amount_inr', '{"amount": 115, "currency": "INR", "status": "locked"}', 'Mandatory infrastructure recovery fee deducted from net revenue before 70/30 split'),
('creator_split_percentage', '{"creator_pct": 70, "artsy_pct": 30}', 'Contractual revenue share model per Master Plan §3.1'),
('gst_standard_rate_percentage', '{"rate": 18, "sac_code": "998314"}', 'Statutory GST rate for Video Post-Production & Sound Design (SAC 998314)'),
('max_revision_rounds_included', '{"standard": 1, "additional_rate_inr": 1500}', 'Included revision cycles before triggering change orders')
ON CONFLICT (setting_key) DO NOTHING;
