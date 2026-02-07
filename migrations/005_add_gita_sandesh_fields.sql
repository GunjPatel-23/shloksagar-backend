-- Migration: 005_add_gita_sandesh_fields.sql
-- Adds adhyay and shlok metadata to gita_sandesh

ALTER TABLE gita_sandesh
    ADD COLUMN IF NOT EXISTS adhyay_name TEXT,
    ADD COLUMN IF NOT EXISTS adhyay_number INTEGER,
    ADD COLUMN IF NOT EXISTS shlok_name TEXT;

-- Indexes to help queries by adhyay number
CREATE INDEX IF NOT EXISTS idx_sandesh_adhyay_number ON gita_sandesh(adhyay_number);
