-- 🚀 Standalone KPI Management & Dashboard Module
-- Date: 28 April 2026

-- Create kpi_configs table
CREATE TABLE IF NOT EXISTS kpi_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL, -- 'B2C', 'Sales', 'PSE'
    kpi_name TEXT NOT NULL,
    type TEXT, -- 'Outcome', 'Process', 'Guardrail'
    data_key TEXT, -- mapping to metric (ex: win_rate, revenue)
    calculation_type TEXT DEFAULT 'sum', -- sum, avg, ratio, count
    owner_type TEXT DEFAULT 'role', -- role, individual
    is_percentage BOOLEAN DEFAULT false,
    target_value NUMERIC NOT NULL DEFAULT 0,
    threshold_green NUMERIC DEFAULT 80, -- Min % for Green
    threshold_yellow NUMERIC DEFAULT 60, -- Min % for Yellow
    threshold_red NUMERIC DEFAULT 0, -- Min % for Red
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON COLUMN kpi_configs.data_key IS 'Key used to map the KPI to the calculation engine in /api/kpi-actuals';
COMMENT ON COLUMN kpi_configs.calculation_type IS 'Method used to aggregate raw data: sum, avg, ratio, or count';
COMMENT ON COLUMN kpi_configs.owner_type IS 'Scope of the KPI: role-level or individual-level';

-- Initial Seed Data (Optional but recommended for quick start)
INSERT INTO kpi_configs (role, kpi_name, type, data_key, calculation_type, target_value, threshold_green, threshold_yellow, threshold_red, is_percentage, owner_type)
VALUES 
    -- ROLE LEVEL KPIs
    ('Sales', 'Total Revenue', 'Outcome', 'revenue', 'sum', 1000000000, 90, 70, 0, false, 'role'),
    ('Sales', 'Win Rate', 'Outcome', 'win_rate', 'ratio', 80, 80, 60, 0, true, 'role'),
    ('B2C', 'Leads Generated', 'Process', 'leads', 'sum', 500, 80, 50, 0, false, 'role'),
    ('B2C', 'Conversion Rate', 'Outcome', 'conversion_rate', 'avg', 15, 12, 8, 0, true, 'role'),
    ('PSE', 'Active Projects', 'Guardrail', 'active_projects', 'sum', 20, 80, 120, 150, false, 'role'),
    ('PSE', 'Response Rate', 'Process', 'response_rate', 'ratio', 95, 95, 85, 0, true, 'role'),

    -- INDIVIDUAL KPIs (Sales)
    ('Sales', 'Deal Count (HoB)', 'Outcome', 'deals', 'count', 10, 80, 50, 0, false, 'individual'),
    ('Sales', 'Deal Count (Enterprise Lead)', 'Outcome', 'deals', 'count', 20, 80, 50, 0, false, 'individual'),

    -- INDIVIDUAL KPIs (Marketing/B2C)
    ('B2C', 'Content Post (Annisa)', 'Process', 'content_posts', 'count', 30, 90, 70, 0, false, 'individual'),
    ('B2C', 'Lead Follow-up (Wina)', 'Process', 'follow_ups', 'count', 100, 90, 70, 0, false, 'individual'),
    ('B2C', 'Growth Strategy (Dwi)', 'Outcome', 'conversion_rate', 'avg', 20, 90, 70, 0, true, 'individual'),
    ('B2C', 'Learning Ops (Fariz)', 'Outcome', 'uat_pass_rate', 'ratio', 95, 95, 85, 0, true, 'individual')
ON CONFLICT DO NOTHING;

