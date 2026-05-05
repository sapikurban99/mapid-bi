-- Migration to add CRM Blast support
-- Date: 5 May 2026

CREATE TABLE IF NOT EXISTS public.wa_blast_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    group_name TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.wa_blast_contacts ENABLE ROW LEVEL SECURITY;

-- Create policy for all access
CREATE POLICY "Allow all access to wa_blast_contacts" ON public.wa_blast_contacts
    FOR ALL USING (true) WITH CHECK (true);
