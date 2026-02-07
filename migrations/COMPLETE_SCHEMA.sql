-- ═══════════════════════════════════════════════════════════════════
-- ShlokSagar Complete Database Schema
-- Run this entire script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- Migration: 000_init_schema.sql
-- ═══════════════════════════════════════════════════════════════════


-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════
-- USERS & AUTHENTICATION
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    google_id TEXT UNIQUE,
    auth_method TEXT NOT NULL CHECK (auth_method IN ('google', 'email_otp')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);

-- ═══════════════════════════════════════════════════════════════════
-- CATEGORIES
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL,
    name_hi TEXT,
    name_gu TEXT,
    image TEXT,
    description_en TEXT,
    description_hi TEXT,
    description_gu TEXT,
    visible BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- DEVOTIONAL CONTENT (Text-first)
-- ═══════════════════════════════════════════════════════════════════

-- Bhajan, Aarti, Chalisa, Stotra
CREATE TABLE IF NOT EXISTS devotional_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en TEXT,
    title_hi TEXT,
    title_gu TEXT,
    content_en TEXT,
    content_hi TEXT,
    content_gu TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('bhajan', 'aarti', 'chalisa', 'stotra')),
    slug TEXT UNIQUE NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bhagavad Gita Shlok
CREATE TABLE IF NOT EXISTS gita_shlok (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    shlok_sanskrit TEXT NOT NULL,
    transliteration TEXT,
    meaning_en TEXT,
    meaning_hi TEXT,
    meaning_gu TEXT,
    slug TEXT UNIQUE NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chapter, verse)
);

-- ═══════════════════════════════════════════════════════════════════
-- DAILY CONTENT
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS gita_sandesh (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    content_en TEXT,
    content_hi TEXT,
    content_gu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    content_en TEXT,
    content_hi TEXT,
    content_gu TEXT,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- FESTIVALS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS festivals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    image_url TEXT,
    video_url TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- MEDIA (Images & Videos)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallpapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en TEXT,
    title_hi TEXT,
    title_gu TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description_en TEXT,
    description_hi TEXT,
    description_gu TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_content_category ON devotional_content(category_id);
CREATE INDEX IF NOT EXISTS idx_content_slug ON devotional_content(slug);
CREATE INDEX IF NOT EXISTS idx_content_type ON devotional_content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_status ON devotional_content(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_gita_chapter_verse ON gita_shlok(chapter, verse);
CREATE INDEX IF NOT EXISTS idx_gita_slug ON gita_shlok(slug);
CREATE INDEX IF NOT EXISTS idx_sandesh_date ON gita_sandesh(date);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);
CREATE INDEX IF NOT EXISTS idx_festivals_dates ON festivals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_festivals_active ON festivals(active);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (Public read, admin write via service role)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotional_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE gita_shlok ENABLE ROW LEVEL SECURITY;
ALTER TABLE gita_sandesh ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallpapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read content" ON devotional_content;
CREATE POLICY "Public read content" ON devotional_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read gita" ON gita_shlok;
CREATE POLICY "Public read gita" ON gita_shlok FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read sandesh" ON gita_sandesh;
CREATE POLICY "Public read sandesh" ON gita_sandesh FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read quotes" ON quotes;
CREATE POLICY "Public read quotes" ON quotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read wallpapers" ON wallpapers;
CREATE POLICY "Public read wallpapers" ON wallpapers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read videos" ON videos;
CREATE POLICY "Public read videos" ON videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read festivals" ON festivals;
CREATE POLICY "Public read festivals" ON festivals FOR SELECT USING (active = true);


-- Allow full access for service rule (backend) - implicitly true but good to be explicit if needed, 
-- though service role bypasses RLS. We can add a policy for authenticated users if we had them.



-- ═══════════════════════════════════════════════════════════════════
-- Migration: 001_analytics.sql
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- ANALYTICS TABLES
-- ═══════════════════════════════════════════════════════════════════

-- Site Visits (unique sessions per day)
CREATE TABLE IF NOT EXISTS site_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_agent TEXT,
    ip_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page Views (every page load)
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    path TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Category Interest
CREATE TABLE IF NOT EXISTS category_interest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Type Interest
CREATE TABLE IF NOT EXISTS content_type_interest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'bhajan', 'aarti', 'chalisa', 'stotra', 'gita_shlok', 'quote', 'gita_sandesh', 'wallpaper', 'video'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Language Preference
CREATE TABLE IF NOT EXISTS language_preference (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('hindi', 'gujarati', 'english')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Download Events (images & videos)
CREATE TABLE IF NOT EXISTS download_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('wallpaper', 'video')),
    resource_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- ANALYTICS INDEXES
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_site_visits_created ON site_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_site_visits_session ON site_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_category_interest_created ON category_interest(created_at);
CREATE INDEX IF NOT EXISTS idx_content_type_interest_created ON content_type_interest(created_at);
CREATE INDEX IF NOT EXISTS idx_language_preference_created ON language_preference(created_at);
CREATE INDEX IF NOT EXISTS idx_download_events_created ON download_events(created_at);
CREATE INDEX IF NOT EXISTS idx_download_events_user ON download_events(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- ANALYTICS RLS (Service role will insert)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_type_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_events ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- ANALYTICS HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════

-- Get site visit stats for date range
CREATE OR REPLACE FUNCTION get_site_visits_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    date DATE,
    unique_visits BIGINT,
    total_page_views BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH daily_visits AS (
        SELECT 
            DATE(created_at) as visit_date,
            COUNT(DISTINCT session_id) as unique_visits
        FROM site_visits
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY DATE(created_at)
    ),
    daily_page_views AS (
        SELECT 
            DATE(created_at) as view_date,
            COUNT(*) as total_page_views
        FROM page_views
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY DATE(created_at)
    )
    SELECT 
        dv.visit_date as date,
        dv.unique_visits,
        COALESCE(dpv.total_page_views, 0) as total_page_views
    FROM daily_visits dv
    LEFT JOIN daily_page_views dpv ON dv.visit_date = dpv.view_date
    ORDER BY date DESC;
$$;

-- Get top pages
CREATE OR REPLACE FUNCTION get_top_pages(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    path TEXT,
    views BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        path,
        COUNT(*) as views
    FROM page_views
    WHERE created_at >= start_date AND created_at <= end_date
    GROUP BY path
    ORDER BY views DESC
    LIMIT limit_count;
$$;

-- Get category interest stats
CREATE OR REPLACE FUNCTION get_category_interest_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    interest_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        ci.category_id,
        c.name_en as category_name,
        COUNT(*) as interest_count
    FROM category_interest ci
    JOIN categories c ON c.id = ci.category_id
    WHERE ci.created_at >= start_date AND ci.created_at <= end_date
    GROUP BY ci.category_id, c.name_en
    ORDER BY interest_count DESC;
$$;

-- Get content type interest stats
CREATE OR REPLACE FUNCTION get_content_type_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    content_type TEXT,
    interest_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        content_type,
        COUNT(*) as interest_count
    FROM content_type_interest
    WHERE created_at >= start_date AND created_at <= end_date
    GROUP BY content_type
    ORDER BY interest_count DESC;
$$;

-- Get language preference stats
CREATE OR REPLACE FUNCTION get_language_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    language TEXT,
    preference_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        language,
        COUNT(*) as preference_count
    FROM language_preference
    WHERE created_at >= start_date AND created_at <= end_date
    GROUP BY language
    ORDER BY preference_count DESC;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- Migration: 002_ads_monetization.sql
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- ADS & MONETIZATION SYSTEM
-- ═══════════════════════════════════════════════════════════════════

-- Ad Packages (Impression-based pricing)
CREATE TABLE IF NOT EXISTS ad_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    impressions INTEGER NOT NULL,
    price_inr INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default packages
INSERT INTO ad_packages (name, impressions, price_inr) VALUES
    ('5K Package', 5000, 300),
    ('10K Package', 10000, 500),
    ('25K Package', 25000, 1000),
    ('50K Package', 50000, 1800),
    ('100K Package', 100000, 3000)
ON CONFLICT DO NOTHING;

-- Ads
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    redirect_url TEXT NOT NULL,
    package_id UUID REFERENCES ad_packages(id) ON DELETE SET NULL,
    total_impressions INTEGER NOT NULL,
    used_impressions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Impressions (tracking every ad show)
CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    page_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad Clicks (tracking clicks for advertiser analytics)
CREATE TABLE IF NOT EXISTS ad_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    page_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- ADS INDEXES
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created ON ad_impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad ON ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created ON ad_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_ad ON ad_clicks(ad_id);

-- ═══════════════════════════════════════════════════════════════════
-- ADS RLS
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE ad_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ad_packages" ON ad_packages;
CREATE POLICY "Public read ad_packages" ON ad_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read ads" ON ads;
CREATE POLICY "Public read ads" ON ads FOR SELECT USING (status = 'active');

-- ═══════════════════════════════════════════════════════════════════
-- WEIGHTED AD ROTATION FUNCTION
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_weighted_ad()
RETURNS TABLE (
    id UUID,
    advertiser_name TEXT,
    image_url TEXT,
    redirect_url TEXT,
    remaining_impressions INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH active_ads AS (
        SELECT 
            a.id,
            a.advertiser_name,
            a.image_url,
            a.redirect_url,
            (a.total_impressions - a.used_impressions) as remaining_impressions,
            RANDOM() * (a.total_impressions - a.used_impressions) as weighted_random
        FROM ads a
        WHERE a.status = 'active' 
        AND a.used_impressions < a.total_impressions
    )
    SELECT 
        id,
        advertiser_name,
        image_url,
        redirect_url,
        remaining_impressions
    FROM active_ads
    ORDER BY weighted_random DESC
    LIMIT 1;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- AUTO-COMPLETE ADS TRIGGER
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_complete_ads()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
    IF NEW.used_impressions >= NEW.total_impressions THEN
        NEW.status = 'completed';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_complete_ads
    BEFORE UPDATE ON ads
    FOR EACH ROW
    EXECUTE FUNCTION auto_complete_ads();

-- ═══════════════════════════════════════════════════════════════════
-- INCREMENT AD IMPRESSION FUNCTION
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_ad_impression(ad_uuid UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
    UPDATE ads 
    SET used_impressions = used_impressions + 1,
        updated_at = NOW()
    WHERE id = ad_uuid;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- GET AD PERFORMANCE STATS
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_ad_performance(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    ad_id UUID,
    advertiser_name TEXT,
    total_impressions INTEGER,
    used_impressions INTEGER,
    remaining_impressions INTEGER,
    clicks BIGINT,
    ctr NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        a.id as ad_id,
        a.advertiser_name,
        a.total_impressions,
        a.used_impressions,
        (a.total_impressions - a.used_impressions) as remaining_impressions,
        COALESCE(c.click_count, 0) as clicks,
        CASE 
            WHEN a.used_impressions > 0 THEN 
                ROUND((COALESCE(c.click_count, 0)::NUMERIC / a.used_impressions::NUMERIC) * 100, 2)
            ELSE 0
        END as ctr
    FROM ads a
    LEFT JOIN (
        SELECT ad_id, COUNT(*) as click_count
        FROM ad_clicks
        WHERE created_at >= start_date AND created_at <= end_date
        GROUP BY ad_id
    ) c ON c.ad_id = a.id
    ORDER BY a.created_at DESC;
$$;



-- ═══════════════════════════════════════════════════════════════════
-- Migration: 002_admin_users.sql
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- ADMIN USERS & AUTHENTICATION
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);

-- Enable RLS
DROP POLICY IF EXISTS "Admins can read admins" ON admins;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin records (service role bypasses this)
CREATE POLICY "Admins can read admins" ON admins FOR SELECT USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- Migration: 003_contact_messages.sql
-- ═══════════════════════════════════════════════════════════════════

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;



