-- Migration: Revamp Daily Standup Table
-- 1. Add link column to daily_standup table
ALTER TABLE daily_standup ADD COLUMN IF NOT EXISTS link TEXT;

-- 2. Create daily_standup_general table for daily shared resources (Links & Notes)
CREATE TABLE IF NOT EXISTS daily_standup_general (
  date DATE PRIMARY KEY,
  general_links JSONB DEFAULT '[]'::jsonb,
  general_notes TEXT DEFAULT '',
  member_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure member_links column exists if table already existed
ALTER TABLE daily_standup_general ADD COLUMN IF NOT EXISTS member_links JSONB DEFAULT '{}'::jsonb;

-- Enable RLS (Row Level Security) - allow all for now (internal tool)
ALTER TABLE daily_standup_general ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON daily_standup_general;
CREATE POLICY "Allow all access" ON daily_standup_general FOR ALL USING (true) WITH CHECK (true);
