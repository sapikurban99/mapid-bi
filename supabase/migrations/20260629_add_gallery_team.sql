-- Add team column to docs for gallery foldering (B2B, B2C, PSE)
ALTER TABLE docs ADD COLUMN IF NOT EXISTS team TEXT DEFAULT '';
