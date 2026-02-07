import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export const Tables = {
    USERS: 'users',
    OTP_CODES: 'otp_codes',
    CATEGORIES: 'categories',
    DEVOTIONAL_CONTENT: 'devotional_content',
    CONTENT: 'devotional_content', // Alias for DEVOTIONAL_CONTENT
    GITA_SHLOK: 'gita_shlok',
    GITA_SANDESH: 'gita_sandesh',
    QUOTES: 'quotes',
    WALLPAPERS: 'wallpapers',
    VIDEOS: 'videos',
    FESTIVALS: 'festivals',
    SITE_VISITS: 'site_visits',
    PAGE_VIEWS: 'page_views',
    CATEGORY_INTEREST: 'category_interest',
    CONTENT_TYPE_INTEREST: 'content_type_interest',
    LANGUAGE_PREFERENCE: 'language_preference',
    DOWNLOAD_EVENTS: 'download_events',
    ANALYTICS: 'analytics', // Generic analytics table if needed
    ADS: 'ads',
    AD_PACKAGES: 'ad_packages',
    AD_IMPRESSIONS: 'ad_impressions',
    AD_CLICKS: 'ad_clicks',
};

