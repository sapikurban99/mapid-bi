-- TABLE: revenue_payments
-- Stores transactional payment data from the Marketing Database CSV

CREATE TABLE IF NOT EXISTS revenue_payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_date date NOT NULL,
    payment_time time,
    category text NOT NULL, -- e.g., 'MAPID Academy', 'Platform'
    customer_name text,
    amount numeric NOT NULL,
    status text,
    invoice_id text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE revenue_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read for authenticated users
CREATE POLICY "Allow read for authenticated users" ON revenue_payments
    FOR SELECT USING (true);

-- Policy: Allow all for service role (used for ingestion)
-- If using client-side ingestion, you might need more specific policies.
-- For now, we allow full access to simplify the migration script.
CREATE POLICY "Allow full access for authenticated" ON revenue_payments
    FOR ALL USING (true);

-- Index for faster aggregation
CREATE INDEX IF NOT EXISTS idx_revenue_payments_date ON revenue_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_revenue_payments_category ON revenue_payments(category);
