-- ==============================================================================
-- Supabase SQL Schema for Family Cases Table: "familycases"
-- Project: Case Management System
-- Description: Matrimonial, Maintenance (125 CrPC), Domestic Violence & Custody
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "familycases" Table
CREATE TABLE IF NOT EXISTS public.familycases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case Identification
    case_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'FC-2026-015', 'Matrimonial Suit 45/2026'
    case_year INTEGER NOT NULL DEFAULT 2026 CHECK (case_year >= 1900 AND case_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'family' NOT NULL,
    case_name TEXT, -- e.g. 'Pooja Sharma vs Rahul Sharma'
    
    -- Family Court Specific Details
    matter_type TEXT NOT NULL,          -- e.g. 'Maintenance (Sec 125 CrPC)', 'Divorce (Sec 13 HMA)', 'Domestic Violence (DV Act)', 'Conjugal Rights (Sec 9 HMA)', 'Child Custody'
    petitioner TEXT NOT NULL,           -- Applicant / Petitioner (Wife / Husband)
    respondent TEXT NOT NULL,           -- Opposite Party (Husband / Wife / In-laws)
    party_name TEXT,                    -- Reference party (Respondent)
    marriage_date DATE,                 -- Date of Marriage (Optional)
    maintenance_detail TEXT,            -- Interim/Final maintenance amount claimed or granted
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Court & Client Information
    court_name TEXT NOT NULL,           -- Principal Judge Family Court, Additional Principal Judge, Magistrate
    client_name TEXT NOT NULL,          -- Client represented
    client_number VARCHAR(30),          -- Client Mobile Number
    
    -- Hearing & Process Tracking
    next_hearing DATE,
    hearing_process TEXT,               -- Stage e.g. 'Counseling / Mediation', 'Written Statement', 'Petitioner Evidence', 'Arguments'
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- 'Pending', 'In Mediation', 'Settled', 'Decree Passed', 'Disposed'
    remark TEXT,                        -- Children details, custody notes, mediation summary
    doc_link TEXT,                      -- Document / Order Sheet link (Drive/PDF URL)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Optimized Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_familycases_case_number ON public.familycases (case_number);
CREATE INDEX IF NOT EXISTS idx_familycases_matter_type ON public.familycases (matter_type);
CREATE INDEX IF NOT EXISTS idx_familycases_petitioner ON public.familycases (petitioner);
CREATE INDEX IF NOT EXISTS idx_familycases_respondent ON public.familycases (respondent);
CREATE INDEX IF NOT EXISTS idx_familycases_court_name ON public.familycases (court_name);
CREATE INDEX IF NOT EXISTS idx_familycases_status ON public.familycases (case_status);
CREATE INDEX IF NOT EXISTS idx_familycases_next_hearing ON public.familycases (next_hearing);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" & "case_name"
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_familycases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.case_name IS NULL OR NEW.case_name = '' THEN
        NEW.case_name := NEW.petitioner || ' vs ' || NEW.respondent;
    END IF;
    IF NEW.party_name IS NULL OR NEW.party_name = '' THEN
        NEW.party_name := NEW.respondent;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_familycases_updated_at ON public.familycases;

CREATE TRIGGER trigger_familycases_updated_at
BEFORE INSERT OR UPDATE ON public.familycases
FOR EACH ROW
EXECUTE FUNCTION public.handle_familycases_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.familycases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to familycases"
ON public.familycases FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert to familycases"
ON public.familycases FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update to familycases"
ON public.familycases FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete to familycases"
ON public.familycases FOR DELETE TO anon USING (true);
