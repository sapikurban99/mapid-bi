-- Migration to add Campaign Date range support for Calendar view
-- Date: 6 May 2026

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
