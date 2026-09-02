-- ==============================================================================
-- Supabase SQL Schema for Criminal Cases Table: "criminalcases"
-- Project: Case Management System
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "criminalcases" Table
CREATE TABLE IF NOT EXISTS public.criminalcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case Identification (Case Number is Unique)
    case_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'CR-2026-003'
    crime_year INTEGER NOT NULL CHECK (crime_year >= 1900 AND crime_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'criminal' NOT NULL,
    case_name TEXT, -- e.g. 'State vs Ram' or 'Victim vs Accused'
    
    -- Police Station & Offense Info
    police_station TEXT NOT NULL,
    crime_section TEXT NOT NULL, -- e.g. 'IPC 302', 'IPC 379', 'CrPC 144'
    crime_number VARCHAR(100) NOT NULL, -- FIR / Crime Number, e.g. 'CR-402'
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Party Details
    victim_name TEXT NOT NULL,
    accused_name TEXT NOT NULL,
    party_name TEXT, -- Reference to primary party (usually Accused)
    
    -- Court & Client Information
    court_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_number VARCHAR(30),
    
    -- Hearing & Status
    next_hearing DATE,
    hearing_process TEXT, -- e.g. 'Bail Hearing', 'Framing of Charges', 'Evidence'
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- 'Pending', 'Bail Granted', 'Convicted', 'Acquitted'
    remark TEXT, -- Disposal note or case remarks e.g. 'Disposed on merits', 'Bail granted'
    doc_link TEXT, -- Document or Order Sheet link (Drive/PDF URL)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Fast Lookups & Searches
-- ==============================================================================

-- Fast lookup by case number (Search bar & Update tab)
CREATE INDEX IF NOT EXISTS idx_criminalcases_case_number ON public.criminalcases (case_number);
CREATE INDEX IF NOT EXISTS idx_criminalcases_crime_number ON public.criminalcases (crime_number);
CREATE INDEX IF NOT EXISTS idx_criminalcases_police_station ON public.criminalcases (police_station);
CREATE INDEX IF NOT EXISTS idx_criminalcases_court_name ON public.criminalcases (court_name);
CREATE INDEX IF NOT EXISTS idx_criminalcases_status ON public.criminalcases (case_status);
CREATE INDEX IF NOT EXISTS idx_criminalcases_next_hearing ON public.criminalcases (next_hearing);
CREATE INDEX IF NOT EXISTS idx_criminalcases_accused ON public.criminalcases (accused_name);
CREATE INDEX IF NOT EXISTS idx_criminalcases_victim ON public.criminalcases (victim_name);
CREATE INDEX IF NOT EXISTS idx_criminalcases_client ON public.criminalcases (client_name);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" Field & Default Case Title
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_criminalcases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    -- Automatically format case_name if not provided
    IF NEW.case_name IS NULL OR NEW.case_name = '' THEN
        NEW.case_name := NEW.victim_name || ' vs ' || NEW.accused_name;
    END IF;
    -- Automatically set party_name if not provided
    IF NEW.party_name IS NULL OR NEW.party_name = '' THEN
        NEW.party_name := NEW.accused_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_criminalcases_updated_at ON public.criminalcases;

CREATE TRIGGER trigger_criminalcases_updated_at
BEFORE INSERT OR UPDATE ON public.criminalcases
FOR EACH ROW
EXECUTE FUNCTION public.handle_criminalcases_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.criminalcases ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for Dashboard & Guest Search)
CREATE POLICY "Allow public read access to criminalcases"
ON public.criminalcases
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated full access to criminalcases"
ON public.criminalcases
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon inserts / updates / deletes for development
CREATE POLICY "Allow anon insert to criminalcases"
ON public.criminalcases
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update to criminalcases"
ON public.criminalcases
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon delete to criminalcases"
ON public.criminalcases
FOR DELETE
TO anon
USING (true);

-- ==============================================================================
-- 6. Initial Seed Data (Matches Dashboard Demo Records)
-- ==============================================================================

INSERT INTO public.criminalcases (case_number, crime_year, case_type, case_name, police_station, crime_section, crime_number, filing_date, victim_name, accused_name, court_name, client_name, client_number, next_hearing, case_status)
VALUES 
    ('CR-2026-003', 2026, 'criminal', 'State vs Ram', 'Central Police Station', 'IPC 302', 'CR-402', '2026-08-10', 'State', 'Ram', 'District Court', 'State', '9876543213', '2026-09-20', 'Pending'),
    ('CR-2026-006', 2026, 'criminal', 'State vs Kumar', 'North Police Station', 'IPC 379', 'CR-510', '2026-08-18', 'State', 'Kumar', 'High Court', 'State', '9876543215', '2026-10-12', 'Pending')
ON CONFLICT (case_number) DO UPDATE SET
    police_station = EXCLUDED.police_station,
    crime_section = EXCLUDED.crime_section,
    crime_number = EXCLUDED.crime_number,
    court_name = EXCLUDED.court_name,
    client_name = EXCLUDED.client_name,
    client_number = EXCLUDED.client_number,
    next_hearing = EXCLUDED.next_hearing,
    updated_at = timezone('utc'::text, now());
