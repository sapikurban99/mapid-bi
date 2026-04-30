-- Reset and Seed with Final Operational Structure
TRUNCATE TABLE kpi_configs;

INSERT INTO kpi_configs (role, kpi_name, type, data_key, calculation_type, target_value, threshold_green, threshold_yellow, threshold_red, is_percentage, owner_type)
VALUES 
    -- 🔵 B2C (Marketing) - Growth
    ('B2C', 'B2C Revenue', 'Outcome', 'revenue', 'sum', 500000000, 90, 70, 0, false, 'role'),
    ('B2C', 'Total Leads Generated', 'Process', 'leads', 'sum', 1000, 80, 60, 0, false, 'role'),
    ('B2C', 'Conversion (Lead to Paid)', 'Outcome', 'conversion_rate', 'avg', 10, 10, 5, 0, true, 'role'),
    
    -- 🔵 B2C (Marketing) - Activation (Wina)
    ('B2C', 'WA Response Rate (Wina)', 'Process', 'response_rate', 'ratio', 95, 90, 80, 0, true, 'individual'),
    ('B2C', 'Qualified Leads', 'Outcome', 'leads', 'sum', 200, 80, 60, 0, false, 'individual'),

    -- 🔵 B2C (Marketing) - Learning Ops (Fariz)
    ('B2C', 'Academy Enrollment', 'Outcome', 'academy_enrollment', 'sum', 150, 90, 70, 0, false, 'individual'),
    ('B2C', 'Class Completion Rate', 'Outcome', 'academy_completion', 'ratio', 85, 80, 60, 0, true, 'individual'),

    -- 🔵 B2C (Marketing) - Creative (Annisa)
    ('B2C', 'Content Conversion', 'Outcome', 'manual', 'sum', 50, 80, 50, 0, false, 'individual'),

    -- 🟠 SALES (B2B Front)
    ('Sales', 'Sales Revenue', 'Outcome', 'revenue', 'sum', 1500000000, 90, 70, 0, false, 'role'),
    ('Sales', 'Win Rate %', 'Outcome', 'win_rate', 'ratio', 30, 30, 20, 0, true, 'role'),
    ('Sales', 'Pipeline Value', 'Process', 'pipeline_value', 'sum', 5000000000, 80, 60, 0, false, 'role'),

    -- 🔴 PSE (B2B Back)
    ('PSE', 'Demo Handled', 'Process', 'demo_count', 'count', 20, 90, 70, 0, false, 'role'),
    ('PSE', 'On-time Delivery Speed', 'Outcome', 'delivery_speed', 'ratio', 90, 90, 80, 0, true, 'role'),
    ('PSE', 'UAT First-pass Success', 'Guardrail', 'uat_pass_rate', 'ratio', 95, 95, 85, 0, true, 'role');

