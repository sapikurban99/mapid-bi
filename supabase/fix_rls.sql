-- ============================================================
-- FIX RLS: Allow anon key access to all BI dashboard tables
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- OPTION A: Disable RLS entirely (simplest for internal dashboards)
-- OPTION B: Keep RLS but add permissive policies for anon
-- 
-- Choose ONE option below and run it.
-- ============================================================

-- ================================
-- OPTION A: DISABLE RLS (Recommended for internal tools)
-- ================================

ALTER TABLE revenue DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE socials DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_growth DISABLE ROW LEVEL SECURITY;
ALTER TABLE trends DISABLE ROW LEVEL SECURITY;
ALTER TABLE docs DISABLE ROW LEVEL SECURITY;
ALTER TABLE academy DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE pse_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE pse_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE pse_partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_scrape_logs DISABLE ROW LEVEL SECURITY;


-- ================================
-- OPTION B: Keep RLS + Add permissive policies for anon role
-- (Use this if you want RLS on but still allow dashboard access)
-- Uncomment below if you prefer this approach:
-- ================================

/*
-- Revenue
CREATE POLICY "Allow anon full access" ON revenue FOR ALL USING (true) WITH CHECK (true);

-- Projects
CREATE POLICY "Allow anon full access" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Pipeline
CREATE POLICY "Allow anon full access" ON pipeline FOR ALL USING (true) WITH CHECK (true);

-- Campaigns
CREATE POLICY "Allow anon full access" ON campaigns FOR ALL USING (true) WITH CHECK (true);

-- Socials
CREATE POLICY "Allow anon full access" ON socials FOR ALL USING (true) WITH CHECK (true);

-- User Growth
CREATE POLICY "Allow anon full access" ON user_growth FOR ALL USING (true) WITH CHECK (true);

-- Trends
CREATE POLICY "Allow anon full access" ON trends FOR ALL USING (true) WITH CHECK (true);

-- Docs
CREATE POLICY "Allow anon full access" ON docs FOR ALL USING (true) WITH CHECK (true);

-- Academy
CREATE POLICY "Allow anon full access" ON academy FOR ALL USING (true) WITH CHECK (true);

-- Budget
CREATE POLICY "Allow anon full access" ON budget FOR ALL USING (true) WITH CHECK (true);

-- Admin Config
CREATE POLICY "Allow anon full access" ON admin_config FOR ALL USING (true) WITH CHECK (true);

-- PSE Members
CREATE POLICY "Allow anon full access" ON pse_members FOR ALL USING (true) WITH CHECK (true);

-- Kanban Projects
CREATE POLICY "Allow anon full access" ON kanban_projects FOR ALL USING (true) WITH CHECK (true);

-- PSE Leads
CREATE POLICY "Allow anon full access" ON pse_leads FOR ALL USING (true) WITH CHECK (true);

-- PSE Partners
CREATE POLICY "Allow anon full access" ON pse_partners FOR ALL USING (true) WITH CHECK (true);

-- Social Scrape Logs
CREATE POLICY "Allow anon full access" ON social_scrape_logs FOR ALL USING (true) WITH CHECK (true);
*/
