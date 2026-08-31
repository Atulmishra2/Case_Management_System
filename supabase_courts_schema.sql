-- ==============================================================================
-- Supabase SQL Schema for Courts Table: "courts"
-- Project: Case Management System
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "courts" Table
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_name TEXT UNIQUE NOT NULL,
    court_type VARCHAR(50) DEFAULT 'District Court', -- 'Supreme Court', 'High Court', 'District Court', 'Family Court', 'Tribunal'
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Fast Lookups
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_courts_court_name ON public.courts (court_name);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" Field
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_courts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_courts_updated_at ON public.courts;

CREATE TRIGGER trigger_courts_updated_at
BEFORE INSERT OR UPDATE ON public.courts
FOR EACH ROW
EXECUTE FUNCTION public.handle_courts_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for Dashboard dropdowns & management)
CREATE POLICY "Allow public read courts"
ON public.courts
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated full access
CREATE POLICY "Allow auth all courts"
ON public.courts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon insert/update/delete for development
CREATE POLICY "Allow anon insert courts"
ON public.courts
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update courts"
ON public.courts
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon delete courts"
ON public.courts
FOR DELETE
TO anon
USING (true);

-- ==============================================================================
-- 6. Initial Seed Data
-- ==============================================================================

INSERT INTO public.courts (court_name, court_type, location)
VALUES 
    ('District Court', 'District Court', 'Main Civil Lines'),
    ('High Court', 'High Court', 'State Capital'),
    ('Supreme Court', 'Supreme Court', 'New Delhi'),
    ('Family Court', 'Family Court', 'City Center'),
    ('Labour Court', 'Tribunal', 'Industrial Area'),
    ('Consumer Court', 'Tribunal', 'District Complex')
ON CONFLICT (court_name) DO NOTHING;
