-- Migration: Add account column to contents table
ALTER TABLE public.contents ADD COLUMN IF NOT EXISTS account TEXT;
