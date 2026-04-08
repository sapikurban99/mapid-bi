-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Revenue
create table if not exists revenue (
    id uuid primary key default uuid_generate_v4(),
    category text,
    sub_product text,
    quarter text,
    target numeric default 0,
    actual numeric default 0,
    achievement_pct numeric default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. Projects (Business Projects)
create table if not exists projects (
    id uuid primary key default uuid_generate_v4(),
    name text,
    phase text,
    progress numeric default 0,
    issue text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3. Pipeline
create table if not exists pipeline (
    id uuid primary key default uuid_generate_v4(),
    client text,
    industry text,
    stage text,
    value_idr numeric default 0,
    action text,
    eta text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 4. Campaigns
create table if not exists campaigns (
    id uuid primary key default uuid_generate_v4(),
    campaign_name text,
    period text,
    status text,
    leads integer default 0,
    participants integer default 0,
    conversion_pct numeric default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 5. Socials
create table if not exists socials (
    id uuid primary key default uuid_generate_v4(),
    month text,
    week text,
    platform text,
    metric text,
    value numeric default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 6. User Growth
create table if not exists user_growth (
    id uuid primary key default uuid_generate_v4(),
    month text,
    week text,
    new_regist integer default 0,
    active_geo_users integer default 0,
    conversion_rate numeric default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 7. Trends
create table if not exists trends (
    id uuid primary key default uuid_generate_v4(),
    timeframe text, -- usually 'month' or 'label'
    label text,
    revenue_m numeric default 0,
    dealsizeavg_m numeric default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 8. Docs
create table if not exists docs (
    id uuid primary key default uuid_generate_v4(),
    title text,
    category text,
    format text,
    link text,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 9. Academy
create table if not exists academy (
    id uuid primary key default uuid_generate_v4(),
    program text,
    batch text,
    registrants integer default 0,
    converted integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 10. Budget
create table if not exists budget (
    id uuid primary key default uuid_generate_v4(),
    date date,
    category text,
    amount numeric default 0,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 11. PSE Members
create table if not exists pse_members (
    id uuid primary key default uuid_generate_v4(),
    name text,
    max_capacity integer default 15,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 12. Kanban Projects
create table if not exists kanban_projects (
    id uuid primary key default uuid_generate_v4(),
    client text,
    project_name text,
    pse_id uuid references pse_members(id) on delete set null,
    stage text default 'Backlog',
    progress_pct numeric default 0,
    priority text default 'Medium',
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 13. PSE Leads
create table if not exists pse_leads (
    id uuid primary key default uuid_generate_v4(),
    lead_name text,
    pse_id uuid references pse_members(id) on delete set null,
    is_closed boolean default false,
    stage text default 'Lead Generation',
    progress numeric default 0,
    priority text default 'Medium',
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 14. PSE Partners
create table if not exists pse_partners (
    id uuid primary key default uuid_generate_v4(),
    partner_name text,
    pse_id uuid references pse_members(id) on delete set null,
    is_active boolean default true,
    type text default 'Technology',
    stage text default 'Lead Generation',
    progress numeric default 0,
    priority text default 'Medium',
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 15. Admin Config
create table if not exists admin_config (
    key text primary key,
    data jsonb,
    updated_at timestamp with time zone default now()
);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $func$
begin
    new.updated_at = now();
    return new;
end;
$func$ language plpgsql;

-- Apply update_updated_at_column to all tables
do $do$
declare
    t text;
begin
    for t in select table_name from information_schema.tables where table_schema = 'public' and table_name != 'admin_config'
    loop
        execute format('drop trigger if exists update_%I_updated_at on %I', t, t);
        execute format('create trigger update_%I_updated_at before update on %I for each row execute function update_updated_at_column()', t, t);
    end loop;
end;
$do$;
