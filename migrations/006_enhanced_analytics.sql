-- Add video play tracking and enhance analytics
-- Run this in Supabase SQL Editor

-- Video Play Events table
CREATE TABLE IF NOT EXISTS video_play_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    video_id UUID NOT NULL,
    play_duration_seconds INTEGER, -- How long they watched
    completed BOOLEAN DEFAULT false, -- Did they watch till end
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_video_play_events_created ON video_play_events(created_at);
CREATE INDEX IF NOT EXISTS idx_video_play_events_video ON video_play_events(video_id);

-- Enable RLS
ALTER TABLE video_play_events ENABLE ROW LEVEL SECURITY;

-- Function to get video play stats
CREATE OR REPLACE FUNCTION get_video_play_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    date DATE,
    total_plays BIGINT,
    unique_viewers BIGINT,
    avg_duration_seconds NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_plays,
        COUNT(DISTINCT session_id) as unique_viewers,
        AVG(play_duration_seconds)::NUMERIC as avg_duration_seconds
    FROM video_play_events
    WHERE created_at >= start_date AND created_at <= end_date
    GROUP BY DATE(created_at)
    ORDER BY date DESC;
$$;

-- Function to get top videos
CREATE OR REPLACE FUNCTION get_top_videos(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    video_id UUID,
    play_count BIGINT,
    unique_viewers BIGINT,
    avg_duration NUMERIC,
    completion_rate NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        vpe.video_id,
        COUNT(*) as play_count,
        COUNT(DISTINCT vpe.session_id) as unique_viewers,
        AVG(vpe.play_duration_seconds)::NUMERIC as avg_duration,
        (COUNT(*) FILTER (WHERE vpe.completed = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100) as completion_rate
    FROM video_play_events vpe
    WHERE vpe.created_at >= start_date AND vpe.created_at <= end_date
    GROUP BY vpe.video_id
    ORDER BY play_count DESC
    LIMIT limit_count;
$$;

-- Update get_top_pages to include page_title
DROP FUNCTION IF EXISTS get_top_pages(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER);

CREATE OR REPLACE FUNCTION get_top_pages(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    path TEXT,
    page_title TEXT,
    view_count BIGINT,
    unique_visitors BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        pv.path,
        MAX(pv.page_title) as page_title,
        COUNT(*) as view_count,
        COUNT(DISTINCT pv.session_id) as unique_visitors
    FROM page_views pv
    WHERE pv.created_at >= start_date AND pv.created_at <= end_date
    GROUP BY pv.path
    ORDER BY view_count DESC
    LIMIT limit_count;
$$;

-- Function to get hourly traffic distribution
CREATE OR REPLACE FUNCTION get_hourly_traffic(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    hour INTEGER,
    visit_count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        EXTRACT(HOUR FROM created_at)::INTEGER as hour,
        COUNT(*) as visit_count
    FROM page_views
    WHERE created_at >= start_date AND created_at <= end_date
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour;
$$;

-- Function to get device/browser stats (from user agent)
CREATE OR REPLACE FUNCTION get_user_agent_stats(
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    device_type TEXT,
    count BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        CASE 
            WHEN user_agent ILIKE '%mobile%' OR user_agent ILIKE '%android%' THEN 'Mobile'
            WHEN user_agent ILIKE '%tablet%' OR user_agent ILIKE '%ipad%' THEN 'Tablet'
            ELSE 'Desktop'
        END as device_type,
        COUNT(*) as count
    FROM site_visits
    WHERE created_at >= start_date AND created_at <= end_date
    GROUP BY device_type
    ORDER BY count DESC;
$$;

-- Migration complete
SELECT 'Analytics enhancement migration completed successfully!' as status;
