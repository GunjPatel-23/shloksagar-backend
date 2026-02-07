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

CREATE POLICY "Public read ad_packages" ON ad_packages FOR SELECT USING (true);
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
