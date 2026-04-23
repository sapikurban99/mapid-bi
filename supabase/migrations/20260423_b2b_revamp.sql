-- Migration: Add CRM fields to kanban_projects and pse_partners, and link leads to partners
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS pic_sales TEXT;
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS forecasted_value NUMERIC DEFAULT 0;
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS next_step TEXT;

ALTER TABLE pse_partners ADD COLUMN IF NOT EXISTS pic_partner TEXT;
ALTER TABLE pse_partners ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE pse_partners ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE pse_partners ADD COLUMN IF NOT EXISTS next_step TEXT;

ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS close_date DATE;
ALTER TABLE kanban_projects ADD COLUMN IF NOT EXISTS probability NUMERIC DEFAULT 0;

-- Ensure leads has probability and PIC Sales
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS pic_sales TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS forecasted_value NUMERIC DEFAULT 0;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS probability NUMERIC DEFAULT 0;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS demo_date DATE;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS last_interacted_on DATE;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS proposal_link TEXT;
ALTER TABLE pse_leads ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES pse_partners(id) ON DELETE SET NULL;
