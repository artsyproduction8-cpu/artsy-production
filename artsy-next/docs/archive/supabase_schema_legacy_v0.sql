-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for secure random UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (Supabase auth.users is extended)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('client', 'freelancer', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'banned')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Creator profiles (freelancer specific details)
CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    bio TEXT,
    skills TEXT[], -- Array of skill strings
    software TEXT[], -- Array of software strings
    hourly_rate DECIMAL(10,2),
    monthly_earnings DECIMAL(12,2) DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    portfolio_url TEXT,
    resume_url TEXT,
    bank_account_info JSONB, -- Encrypted sensitive info
    pan_card TEXT,
    upi_id TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents TEXT[], -- URLs to verification docs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Services catalog
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- e.g., 'Wedding Vertical', 'Brand & UGC Vertical'
    base_price DECIMAL(10,2) NOT NULL,
    price_per_second DECIMAL(8,2),
    min_duration INTEGER, -- in seconds
    max_duration INTEGER, -- in seconds
    deliverables TEXT[], -- Array of deliverable descriptions
    requirements JSONB, -- Dynamic requirements schema
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders (client bookings)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'disputed')),
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    requirements JSONB, -- Client submitted requirements
    special_instructions TEXT,
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL, -- 'razorpay', 'upi', 'card', 'netbanking'
    payment_id TEXT, -- Gateway payment ID
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    gateway_response JSONB, -- Full gateway response
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Projects (active work)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'ingest', 'editing', 'color', 'qa', 'delivery', 'completed', 'cancelled')),
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    assigned_editor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    raw_footage_url TEXT, -- Google Drive/Bunny Stream link
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project requirements (detailed specs)
CREATE TABLE IF NOT EXISTS public.project_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    aspect_ratio TEXT, -- e.g., '16:9', '9:16', '1:1'
    resolution TEXT, -- e.g., '4K', 'HD', 'SD'
    frame_rate INTEGER, -- e.g., 24, 30, 60
    color_grading TEXT, -- e.g., 'Log', 'Rec709', 'ACES'
    audio_requirements JSONB,
    text_overlays JSONB,
    music_preferences JSONB,
    reference_videos TEXT[], -- URLs to reference videos
    brand_guidelines TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project check-ins (daily updates)
CREATE TABLE IF NOT EXISTS public.project_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    editor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status_update TEXT,
    hours_worked DECIMAL(4,2),
    screenshots TEXT[], -- URLs to progress screenshots
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project reviews (timestamped comments)
CREATE TABLE IF NOT EXISTS public.project_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- client or editor
    review_type TEXT NOT NULL CHECK (review_type IN ('client', 'editor', 'qa')),
    timestamp_seconds INTEGER NOT NULL, -- Video timestamp in seconds
    comment TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Payouts (to freelancers)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    editor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    tds_amount DECIMAL(10,2) DEFAULT 0, -- Tax deducted at source
    net_amount DECIMAL(10,2) GENERATED ALWAYS AS (amount - tds_amount) STORED,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    payment_method TEXT DEFAULT 'neft', -- 'neft', 'upi', 'impps'
    transaction_id TEXT, -- Bank transaction ID
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invoices (for clients)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    related_id UUID, -- Generic ID for related entity
    related_type TEXT, -- e.g., 'order', 'project', 'payment'
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at column
DO $$
DECLARE
    tables CURSOR FOR
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'creator_profiles', 'services', 'orders', 'payments', 'projects',
                         'project_requirements', 'project_checkins', 'project_reviews', 'payouts',
                         'invoices', 'notifications');
BEGIN
    FOR table_record IN tables LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;',
            table_record.tablename, table_record.tablename
        );
        EXECUTE format(
            'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
            table_record.tablename, table_record.tablename
        );
    END LOOP;
END $$;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Creator profiles policies
CREATE POLICY "Freelancers can view own profile" ON public.creator_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Freelancers can update own profile" ON public.creator_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.creator_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.creator_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Services policies
CREATE POLICY "Anyone can view active services" ON public.services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all services" ON public.services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (
        auth.uid() = client_id OR
        EXISTS (
            SELECT 1 FROM public.projects WHERE orders.id = order_id AND assigned_editor_id = auth.uid()
        )
    );

CREATE POLICY "Clients can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders WHERE payments.order_id = id AND
            (client_id = auth.uid() OR assigned_editor_id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Projects policies
CREATE POLICY "Users can view assigned projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders WHERE id = order_id AND
            (client_id = auth.uid() OR assigned_editor_id = auth.uid())
        )
    );

CREATE POLICY "Freelancers can update assigned projects" ON public.projects
    FOR UPDATE USING (assigned_editor_id = auth.uid())
    WITH CHECK (assigned_editor_id = auth.uid());

CREATE POLICY "Admins can manage all projects" ON public.projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Project requirements policies
CREATE POLICY "Users can view project requirements" ON public.project_requirements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND
            EXISTS (
                SELECT 1 FROM public.orders WHERE order_id = project_id AND
                (client_id = auth.uid() OR assigned_editor_id = auth.uid())
            )
        )
    );

CREATE POLICY "Clients can create requirements" ON public.project_requirements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND
            EXISTS (
                SELECT 1 FROM public.orders WHERE order_id = project_id AND client_id = auth.uid()
            )
        )
    );

CREATE POLICY "Assigned editors can update requirements" ON public.project_requirements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND assigned_editor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND assigned_editor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all requirements" ON public.project_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Project checkins policies
CREATE POLICY "Users can view project checkins" ON public.project_checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND
            EXISTS (
                SELECT 1 FROM public.orders WHERE order_id = project_id AND
                (client_id = auth.uid() OR assigned_editor_id = auth.uid())
            )
        )
    );

CREATE POLICY "Assigned editors can create checkins" ON public.project_checkins
    FOR INSERT WITH CHECK (
        editor_id = auth.uid()
    );

CREATE POLICY "Assigned editors can update own checkins" ON public.project_checkins
    FOR UPDATE USING (editor_id = auth.uid())
    WITH CHECK (editor_id = auth.uid());

CREATE POLICY "Admins can manage all checkins" ON public.project_checkins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Project reviews policies
CREATE POLICY "Users can view project reviews" ON public.project_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND
            EXISTS (
                SELECT 1 FROM public.orders WHERE order_id = project_id AND
                (client_id = auth.uid() OR assigned_editor_id = auth.uid())
            )
        )
    );

CREATE POLICY "Clients can create reviews" ON public.project_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND
            EXISTS (
                SELECT 1 FROM public.orders WHERE order_id = project_id AND client_id = auth.uid()
            )
        )
    );

CREATE POLICY "Assigned editors can create reviews" ON public.project_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND assigned_editor_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own reviews" ON public.project_reviews
    FOR UPDATE USING (reviewer_id = auth.uid())
    WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Admins can manage all reviews" ON public.project_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payouts policies
CREATE POLICY "Users can view own payouts" ON public.payouts
    FOR SELECT USING (
        editor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects WHERE project_id = id AND
            EXISTS (
                SELECT 1 FROM public.orders WHERE order_id = project_id AND client_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage all payouts" ON public.payouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders WHERE invoices.order_id = id AND client_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all invoices" ON public.invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert sample services
INSERT INTO public.services (name, description, category, base_price, price_per_second, min_duration, max_duration, deliverables, requirements, is_active, is_featured, sort_order) VALUES
(
    'Talking-Head Reels',
    'Professional talking-head videos for personal branding, interviews, and educational content',
    'Brand & UGC Vertical',
    2500.00,
    15.00,
    15, -- 15 seconds minimum
    180, -- 3 minutes maximum
    ARRAY['1080p MP4', 'Vertical 9:16 version', 'Subtitles file', 'Thumbnail'],
    '{"questions": [{"id": "tone", "question": "What tone should the video have?", "type": "select", "options": ["Professional", "Casual", "Energetic", "Inspirational"]}, {"id": "purpose", "question": "What is the main purpose of this video?", "type": "select", "options": ["Personal Branding", "Product Demo", "Educational", "Testimonial", "Social Media"]}]}',
    true,
    true,
    1
),
(
    'Wedding Highlights',
    'Cinematic wedding highlight films capturing the essence of your special day',
    'Wedding Vertical',
    15000.00,
    50.00,
    60, -- 1 minute minimum
    300, -- 5 minutes maximum
    ARRAY['4K DCI Master', 'YouTube 16:9 version', 'Instagram 9:16 version', 'DVD/USB delivery'],
    '{"questions": [{"id": "wedding_date", "question": "Wedding date", "type": "date"}, {"id": "coverage_hours", "question": "Hours of coverage needed", "type": "number", "min": 4, "max": 12}, {"id": "highlights_length", "question": "Desired highlights length", "type": "select", "options": ["3-5 minutes", "5-8 minutes", "8-12 minutes"]}]}',
    true,
    true,
    2
),
(
    'UGC Ad Creatives',
    'High-converting user-generated content style advertisements for brands',
    'Brand & UGC Vertical',
    3500.00,
    25.00,
    15, -- 15 seconds minimum
    60, -- 1 minute maximum
    ARRAY['Vertical 9:16', 'Square 1:1', 'Horizontal 16:9', 'All platforms bundle'],
    '{"questions": [{"id": "product_type", "question": "What type of product are you advertising?", "type": "text"}, {"id": "target_audience", "question": "Who is your target audience?", "type": "text"}, {"id": "platforms", "question": "Where will these ads run?", "type": "multiselect", "options": ["Facebook/Instagram", "TikTok", "YouTube Shorts", "Google Ads"]}]}',
    true,
    false,
    3
),
(
    'Product Showcase 3D',
    '3D product visualization and animation for e-commerce and marketing',
    'Product & Tech Vertical',
    8000.00,
    40.00,
    15, -- 15 seconds minimum
    120, -- 2 minutes maximum
    ARRAY['4K 3D Render', 'Product rotation video', 'Exploded view animation', 'Multiple angle shots'],
    '{"questions": [{"id": "product_files", "question": "Do you have 3D model files?", "type": "yesno"}, {"id": "background", "question": "Preferred background setting", "type": "select", "options": ["White Studio", "Lifestyle", "Custom"]}, {"id": "animation_type", "question": "Type of animation needed", "type": "select", "options": ["Product Rotation", "Feature Highlight", "Exploded View", "Lifestyle Context"]}]}',
    true,
    false,
    4
),
(
    '4K Color Grading',
    'Professional color grading and correction for film and video projects',
    'Post-Production Vertical',
    4000.00,
    20.00,
    60, -- 1 minute minimum
    600, -- 10 minutes maximum
    ARRAY['Color graded master', 'LUT package', 'Before/after comparison', 'Delivery in multiple formats'],
    '{"questions": [{"id": "source_format", "question": "Source footage format", "type": "select", "options": ["Log", "RAW", "RAW", "Rec709"]}, {"id": "look_reference", "question": "Do you have color reference?", "type": "yesno"}, {"id": "delivery_format", "question": "Delivery format required", "type": "select", "options": ["Rec709", "Log", "DCIP3", "HDR10"]}]}',
    true,
    false,
    5
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_rating ON public.creator_profiles(rating);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_projects_order_id ON public.projects(order_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_editor ON public.projects(assigned_editor_id);
CREATE INDEX IF NOT EXISTS idx_project_reviews_project_id ON public.project_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_payouts_editor_id ON public.payouts(editor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);