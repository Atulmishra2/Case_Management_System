-- ==============================================================================
-- Supabase SQL Schema for State Cases Table: "statecases"
-- Project: Case Management System
-- Description: State Criminal Cases (First Party defaulted to "State of U.P.")
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "statecases" Table
CREATE TABLE IF NOT EXISTS public.statecases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case Identification
    case_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'ST-2026-001', 'Sess. Case 104/2026'
    crime_year INTEGER NOT NULL DEFAULT 2026 CHECK (crime_year >= 1900 AND crime_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'state' NOT NULL,
    case_name TEXT, -- e.g. 'State of U.P. vs Ramesh Kumar & Ors.'
    
    -- Crime / FIR & Police Station
    crime_number VARCHAR(100) NOT NULL, -- FIR / Crime No. e.g. '142/2026'
    police_station TEXT NOT NULL,       -- Police Station / Thana
    crime_section TEXT NOT NULL,        -- Sections e.g. 'IPC 302, 307', 'BNS 103'
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Party Details (First Party defaulted to State of U.P.)
    first_party TEXT NOT NULL DEFAULT 'State of U.P.',
    accused_name TEXT NOT NULL,         -- Accused Name(s) e.g. 'Ramesh Kumar & 2 Ors.'
    party_name TEXT,                    -- Reference to primary party (Accused)
    
    -- Court & Client Representation
    court_name TEXT NOT NULL,           -- Sessions Court, CJM, ACJM, etc.
    client_name TEXT NOT NULL,          -- Client represented (Accused / Complainant)
    client_number VARCHAR(30),          -- Mobile number for updates
    
    -- Hearing & Disposal Tracking
    next_hearing DATE,
    hearing_process TEXT,               -- Stage e.g. 'Bail Hearing', 'Framing of Charges', 'Evidence'
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- 'Pending', 'Bail Granted', 'Acquitted', 'Convicted', 'Disposed'
    remark TEXT,                        -- Co-accused, custody notes, bail surety details
    doc_link TEXT,                      -- Document / Order Sheet link (Drive/PDF URL)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Optimized Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_statecases_case_number ON public.statecases (case_number);
CREATE INDEX IF NOT EXISTS idx_statecases_crime_number ON public.statecases (crime_number);
CREATE INDEX IF NOT EXISTS idx_statecases_police_station ON public.statecases (police_station);
CREATE INDEX IF NOT EXISTS idx_statecases_court_name ON public.statecases (court_name);
CREATE INDEX IF NOT EXISTS idx_statecases_status ON public.statecases (case_status);
CREATE INDEX IF NOT EXISTS idx_statecases_next_hearing ON public.statecases (next_hearing);
CREATE INDEX IF NOT EXISTS idx_statecases_accused ON public.statecases (accused_name);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" & "case_name"
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_statecases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.first_party IS NULL OR NEW.first_party = '' THEN
        NEW.first_party := 'State of U.P.';
    END IF;
    IF NEW.case_name IS NULL OR NEW.case_name = '' THEN
        NEW.case_name := NEW.first_party || ' vs ' || NEW.accused_name;
    END IF;
    IF NEW.party_name IS NULL OR NEW.party_name = '' THEN
        NEW.party_name := NEW.accused_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_statecases_updated_at ON public.statecases;

CREATE TRIGGER trigger_statecases_updated_at
BEFORE INSERT OR UPDATE ON public.statecases
FOR EACH ROW
EXECUTE FUNCTION public.handle_statecases_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.statecases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to statecases"
ON public.statecases FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert to statecases"
ON public.statecases FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update to statecases"
ON public.statecases FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete to statecases"
ON public.statecases FOR DELETE TO anon USING (true);
