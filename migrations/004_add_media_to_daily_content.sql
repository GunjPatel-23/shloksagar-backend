-- Add media support to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add media support to gita_sandesh table
ALTER TABLE gita_sandesh ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE gita_sandesh ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_has_media ON quotes(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sandesh_has_media ON gita_sandesh(image_url) WHERE image_url IS NOT NULL;
