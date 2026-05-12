-- Migration: Create contents table for B2C Activity Tracking
CREATE TABLE IF NOT EXISTS public.contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform TEXT,
  content_type TEXT,
  date DATE,
  status TEXT,
  pic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - allow all access for internal dashboard
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.contents;
CREATE POLICY "Allow all access" ON public.contents FOR ALL USING (true) WITH CHECK (true);
