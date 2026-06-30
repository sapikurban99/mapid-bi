-- Email updates table for n8n email scraping results
CREATE TABLE IF NOT EXISTS email_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  project_id UUID REFERENCES kanban_projects(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES pse_leads(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  email_count INTEGER DEFAULT 0,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_updates_client ON email_updates(client_name);
CREATE INDEX IF NOT EXISTS idx_email_updates_project ON email_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_email_updates_lead ON email_updates(lead_id);
