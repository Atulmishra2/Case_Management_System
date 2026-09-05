-- ==============================================================================
-- Supabase SQL Schema for Court Helpers & Staff Directory: "court_helpers"
-- Project: Case Management System
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "court_helpers" Table
CREATE TABLE IF NOT EXISTS public.court_helpers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    court TEXT NOT NULL,
    position TEXT NOT NULL,
    mobile VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Fast Lookups & Filter Performance
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_court_helpers_name ON public.court_helpers (name);
CREATE INDEX IF NOT EXISTS idx_court_helpers_court ON public.court_helpers (court);
CREATE INDEX IF NOT EXISTS idx_court_helpers_position ON public.court_helpers (position);
CREATE INDEX IF NOT EXISTS idx_court_helpers_mobile ON public.court_helpers (mobile);
CREATE INDEX IF NOT EXISTS idx_court_helpers_created_at ON public.court_helpers (created_at DESC);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" Field
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_court_helpers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_court_helpers_updated_at ON public.court_helpers;

CREATE TRIGGER trigger_court_helpers_updated_at
BEFORE INSERT OR UPDATE ON public.court_helpers
FOR EACH ROW
EXECUTE FUNCTION public.handle_court_helpers_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.court_helpers ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for directory search & staff lookup)
CREATE POLICY "Allow public read court_helpers"
ON public.court_helpers
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow public & authenticated insert
CREATE POLICY "Allow insert court_helpers"
ON public.court_helpers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow public & authenticated update
CREATE POLICY "Allow update court_helpers"
ON public.court_helpers
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow public & authenticated delete
CREATE POLICY "Allow delete court_helpers"
ON public.court_helpers
FOR DELETE
TO anon, authenticated
USING (true);
