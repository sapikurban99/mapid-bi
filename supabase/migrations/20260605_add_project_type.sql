-- Migration: Add project_type column to B2B kanban tables
-- Enables workload weighting: data=1x, dev=3x, survey=3x

ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'data';
ALTER TABLE pse_leads      ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'data';
ALTER TABLE pse_partners   ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'data';

-- Constraints for valid values
ALTER TABLE kanban_projects ADD CONSTRAINT kanban_projects_project_type_check
    CHECK (project_type IN ('data', 'dev', 'survey'));
ALTER TABLE pse_leads ADD CONSTRAINT pse_leads_project_type_check
    CHECK (project_type IN ('data', 'dev', 'survey'));
ALTER TABLE pse_partners ADD CONSTRAINT pse_partners_project_type_check
    CHECK (project_type IN ('data', 'dev', 'survey'));

-- Update existing rows: carry over from priority field where applicable
UPDATE kanban_projects SET project_type = 'data' WHERE project_type IS NULL;
UPDATE pse_leads      SET project_type = 'data' WHERE project_type IS NULL;
UPDATE pse_partners   SET project_type = 'data' WHERE project_type IS NULL;
