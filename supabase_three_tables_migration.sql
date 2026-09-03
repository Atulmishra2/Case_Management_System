-- ==============================================================================
-- Supabase 1-Click Migration Script for State, Family, and Revenue Tables
-- Copy and run this entire script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STATE CASES TABLE
CREATE TABLE IF NOT EXISTS public.statecases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    crime_year INTEGER NOT NULL DEFAULT 2026 CHECK (crime_year >= 1900 AND crime_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'state' NOT NULL,
    case_name TEXT,
    crime_number VARCHAR(100) NOT NULL,
    police_station TEXT NOT NULL,
    crime_section TEXT NOT NULL,
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    first_party TEXT NOT NULL DEFAULT 'State of U.P.',
    accused_name TEXT NOT NULL,
    party_name TEXT,
    court_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_number VARCHAR(30),
    next_hearing DATE,
    hearing_process TEXT,
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    remark TEXT,
    doc_link TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_statecases_case_number ON public.statecases (case_number);
CREATE INDEX IF NOT EXISTS idx_statecases_crime_number ON public.statecases (crime_number);
CREATE INDEX IF NOT EXISTS idx_statecases_police_station ON public.statecases (police_station);
CREATE INDEX IF NOT EXISTS idx_statecases_court_name ON public.statecases (court_name);
CREATE INDEX IF NOT EXISTS idx_statecases_status ON public.statecases (case_status);
CREATE INDEX IF NOT EXISTS idx_statecases_next_hearing ON public.statecases (next_hearing);

ALTER TABLE public.statecases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to statecases" ON public.statecases;
CREATE POLICY "Allow public read access to statecases" ON public.statecases FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon insert to statecases" ON public.statecases;
CREATE POLICY "Allow anon insert to statecases" ON public.statecases FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update to statecases" ON public.statecases;
CREATE POLICY "Allow anon update to statecases" ON public.statecases FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon delete to statecases" ON public.statecases;
CREATE POLICY "Allow anon delete to statecases" ON public.statecases FOR DELETE TO anon USING (true);

-- 2. FAMILY CASES TABLE
CREATE TABLE IF NOT EXISTS public.familycases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    case_year INTEGER NOT NULL DEFAULT 2026 CHECK (case_year >= 1900 AND case_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'family' NOT NULL,
    case_name TEXT,
    matter_type TEXT NOT NULL,
    petitioner TEXT NOT NULL,
    respondent TEXT NOT NULL,
    party_name TEXT,
    marriage_date DATE,
    maintenance_detail TEXT,
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    court_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_number VARCHAR(30),
    next_hearing DATE,
    hearing_process TEXT,
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    remark TEXT,
    doc_link TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_familycases_case_number ON public.familycases (case_number);
CREATE INDEX IF NOT EXISTS idx_familycases_matter_type ON public.familycases (matter_type);
CREATE INDEX IF NOT EXISTS idx_familycases_petitioner ON public.familycases (petitioner);
CREATE INDEX IF NOT EXISTS idx_familycases_respondent ON public.familycases (respondent);
CREATE INDEX IF NOT EXISTS idx_familycases_court_name ON public.familycases (court_name);
CREATE INDEX IF NOT EXISTS idx_familycases_status ON public.familycases (case_status);
CREATE INDEX IF NOT EXISTS idx_familycases_next_hearing ON public.familycases (next_hearing);

ALTER TABLE public.familycases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to familycases" ON public.familycases;
CREATE POLICY "Allow public read access to familycases" ON public.familycases FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon insert to familycases" ON public.familycases;
CREATE POLICY "Allow anon insert to familycases" ON public.familycases FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update to familycases" ON public.familycases;
CREATE POLICY "Allow anon update to familycases" ON public.familycases FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon delete to familycases" ON public.familycases;
CREATE POLICY "Allow anon delete to familycases" ON public.familycases FOR DELETE TO anon USING (true);

-- 3. REVENUE CASES TABLE
CREATE TABLE IF NOT EXISTS public.revenuecases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    case_year INTEGER NOT NULL DEFAULT 2026 CHECK (case_year >= 1900 AND case_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'revenue' NOT NULL,
    case_name TEXT,
    revenue_act_section TEXT NOT NULL,
    village_mauja TEXT NOT NULL,
    pargana_tehsil TEXT NOT NULL,
    gata_khata_no TEXT,
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    applicant TEXT NOT NULL,
    opposite_party TEXT NOT NULL,
    party_name TEXT,
    court_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_number VARCHAR(30),
    next_hearing DATE,
    hearing_process TEXT,
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    remark TEXT,
    doc_link TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revenuecases_case_number ON public.revenuecases (case_number);
CREATE INDEX IF NOT EXISTS idx_revenuecases_section ON public.revenuecases (revenue_act_section);
CREATE INDEX IF NOT EXISTS idx_revenuecases_village ON public.revenuecases (village_mauja);
CREATE INDEX IF NOT EXISTS idx_revenuecases_court ON public.revenuecases (court_name);
CREATE INDEX IF NOT EXISTS idx_revenuecases_status ON public.revenuecases (case_status);
CREATE INDEX IF NOT EXISTS idx_revenuecases_next_hearing ON public.revenuecases (next_hearing);

ALTER TABLE public.revenuecases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to revenuecases" ON public.revenuecases;
CREATE POLICY "Allow public read access to revenuecases" ON public.revenuecases FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon insert to revenuecases" ON public.revenuecases;
CREATE POLICY "Allow anon insert to revenuecases" ON public.revenuecases FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon update to revenuecases" ON public.revenuecases;
CREATE POLICY "Allow anon update to revenuecases" ON public.revenuecases FOR UPDATE TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon delete to revenuecases" ON public.revenuecases;
CREATE POLICY "Allow anon delete to revenuecases" ON public.revenuecases FOR DELETE TO anon USING (true);
