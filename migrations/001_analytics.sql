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
    SELECT 
        DATE(sv.created_at) as date,
        COUNT(DISTINCT sv.session_id) as unique_visits,
        (
            SELECT COUNT(*) 
            FROM page_views pv 
            WHERE DATE(pv.created_at) = DATE(sv.created_at)
            AND pv.created_at >= start_date 
            AND pv.created_at <= end_date
        ) as total_page_views
    FROM site_visits sv
    WHERE sv.created_at >= start_date AND sv.created_at <= end_date
    GROUP BY DATE(sv.created_at)
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
)
returns table (
  path text,
  count bigint
)
language sql
security definer
as $$
  select
    path,
    count(*) as count
  from public.analytics_events
  where created_at >= start_date and created_at <= end_date
    and event_type = 'page_view'
  group by path
  order by count desc
  limit limit_count;
$$;
