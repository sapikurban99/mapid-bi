-- Migration: Quotation builder tables for B2B sales team
-- Stores invoice/quotation header + line items, supporting catalog + custom entries

CREATE TABLE IF NOT EXISTS public.mapid_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_address TEXT,
    customer_country TEXT DEFAULT 'Indonesia',
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location TEXT DEFAULT 'Bandung',
    discount NUMERIC DEFAULT 0,
    ppn_percentage NUMERIC DEFAULT 11,
    biaya_lain_lain NUMERIC DEFAULT 0,
    keterangan TEXT,
    signatory_name TEXT DEFAULT 'Bagus Imam Darmawan',
    signatory_title TEXT DEFAULT 'Direktur Utama PT.Multi Areal Planing Indonesia',
    signature_url TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT mapid_quotations_status_check CHECK (status IN ('draft', 'sent', 'accepted', 'rejected'))
);

CREATE TABLE IF NOT EXISTS public.mapid_quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID REFERENCES public.mapid_quotations(id) ON DELETE CASCADE,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    qty NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'Package',
    unit_price NUMERIC NOT NULL DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON public.mapid_quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON public.mapid_quotations(quote_date DESC);
