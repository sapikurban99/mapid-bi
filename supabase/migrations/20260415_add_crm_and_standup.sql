-- Migration: Add CRM fields to pse_leads table
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS pic_sales TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS forecasted_value NUMERIC DEFAULT 0;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS probability NUMERIC DEFAULT 0;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS demo_date TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS expected_close_date TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS last_interacted_on TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS proposal_link TEXT;

-- Migration: Create daily_standup table
CREATE TABLE IF NOT EXISTS daily_standup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  member_name TEXT NOT NULL,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'In Progress',
  notes TEXT,
  hambatan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_standup_date ON daily_standup(date);
CREATE INDEX IF NOT EXISTS idx_standup_member ON daily_standup(member_name);

-- Enable RLS (Row Level Security) - allow all for now (internal tool)
ALTER TABLE daily_standup ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all access" ON daily_standup FOR ALL USING (true) WITH CHECK (true);
