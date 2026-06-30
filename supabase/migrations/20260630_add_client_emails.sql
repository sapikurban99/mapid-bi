-- Table for individual raw emails
CREATE TABLE IF NOT EXISTS client_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  subject TEXT,
  from_addr TEXT,
  to_addr TEXT,
  email_date TIMESTAMPTZ,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying by client name
CREATE INDEX IF NOT EXISTS idx_client_emails_client ON client_emails(client_name);
CREATE INDEX IF NOT EXISTS idx_client_emails_date ON client_emails(email_date);

-- Apply the updated_at trigger (standard across all tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_emails_updated_at') THEN
    CREATE TRIGGER update_client_emails_updated_at 
    BEFORE UPDATE ON client_emails 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
