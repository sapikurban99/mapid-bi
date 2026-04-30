ALTER TABLE kpi_configs ADD COLUMN IF NOT EXISTS owner_name TEXT;
COMMENT ON COLUMN kpi_configs.owner_name IS 'The name of the individual owner if owner_type is individual';
