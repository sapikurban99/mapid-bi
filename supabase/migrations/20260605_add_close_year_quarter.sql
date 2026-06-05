-- Migration: Add target Close Year and Close Quarter to kanban_projects and pse_leads
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS close_year TEXT;
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS close_quarter TEXT;

ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS close_year TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS close_quarter TEXT;
