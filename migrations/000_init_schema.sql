
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

-- Allow public read access
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read content" ON devotional_content FOR SELECT USING (status = 'published');
CREATE POLICY "Public read gita" ON gita_shlok FOR SELECT USING (true);
CREATE POLICY "Public read sandesh" ON gita_sandesh FOR SELECT USING (true);
CREATE POLICY "Public read quotes" ON quotes FOR SELECT USING (true);
CREATE POLICY "Public read wallpapers" ON wallpapers FOR SELECT USING (true);
CREATE POLICY "Public read videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Public read gita_sandesh" ON gita_sandesh FOR SELECT USING (true);
CREATE POLICY "Public read quotes" ON quotes FOR SELECT USING (true);
CREATE POLICY "Public read wallpapers" ON wallpapers FOR SELECT USING (true);
CREATE POLICY "Public read videos" ON videos FOR SELECT USING (true);
CREATE POLICY "Public read content" ON devotional_content FOR SELECT USING (true);

-- Allow full access for service rule (backend) - implicitly true but good to be explicit if needed, 
-- though service role bypasses RLS. We can add a policy for authenticated users if we had them.
