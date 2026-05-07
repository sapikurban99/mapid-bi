-- Migration: Create b2b_agendas table
CREATE TABLE IF NOT EXISTS public.b2b_agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  attachment_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - allow all for now (internal tool)
ALTER TABLE public.b2b_agendas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access" ON public.b2b_agendas;
CREATE POLICY "Allow all access" ON public.b2b_agendas FOR ALL USING (true) WITH CHECK (true);
