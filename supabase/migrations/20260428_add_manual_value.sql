ALTER TABLE kpi_configs ADD COLUMN IF NOT EXISTS manual_actual_value NUMERIC DEFAULT 0;
COMMENT ON COLUMN kpi_configs.manual_actual_value IS 'Manually entered actual value for KPIs that are not automated';
