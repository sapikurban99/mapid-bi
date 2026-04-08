-- 16. Social Scrape Logs
create table if not exists social_scrape_logs (
    id uuid primary key default uuid_generate_v4(),
    platform text not null, -- 'Instagram' or 'LinkedIn'
    status text not null,   -- 'Success' or 'Failed'
    details jsonb,          -- Full response or error message
    scraped_at timestamp with time zone default now()
);

-- Trigger for updated_at if we add it (optional here since we only insert)
-- But let's add it for consistency if we ever update logs
-- execute format('create trigger update_social_scrape_logs_updated_at before update on social_scrape_logs for each row execute function update_updated_at_column()');
