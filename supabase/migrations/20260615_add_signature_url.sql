-- Add signature_url to quotations (idempotent - safe to run even if column exists)
ALTER TABLE public.mapid_quotations ADD COLUMN IF NOT EXISTS signature_url TEXT;
