-- Create table for public profiles
CREATE TABLE IF NOT EXISTS public.mapid_public_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    theme_color TEXT DEFAULT '#000000',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for public links
CREATE TABLE IF NOT EXISTS public.mapid_public_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.mapid_public_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add some default data for MAPID
INSERT INTO public.mapid_public_profiles (username, display_name, bio, avatar_url, theme_color)
VALUES ('mapid', 'MAPID', 'PT Multi Areal Planing Indonesia - Location Intelligence & B2B Solutions', 'https://mapid.co.id/favicon.ico', '#10b981')
ON CONFLICT (username) DO NOTHING;
