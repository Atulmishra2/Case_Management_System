-- ==============================================================================
-- Supabase SQL Schema for Civil Cases Table: "civilcases"
-- Project: Case Management System
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "civilcases" Table
CREATE TABLE IF NOT EXISTS public.civilcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case Identification (Case Number is Unique)
    case_number VARCHAR(100) UNIQUE NOT NULL,
    case_year INTEGER NOT NULL CHECK (case_year >= 1900 AND case_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'civil' NOT NULL,
    case_name TEXT, -- Formatted case title, e.g. "Plaintiff vs Defendant"
    
    -- Filing & Court Information
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    court_name TEXT NOT NULL,
    
    -- Party Details
    plaintiff TEXT NOT NULL,
    defendant TEXT NOT NULL,
    party_name TEXT, -- Secondary reference (e.g. Defendant or Client representative)
    
    -- Client Contact Details
    client_name TEXT NOT NULL,
    client_number VARCHAR(30),
    
    -- Hearing & Process Tracking
    next_hearing DATE,
    hearing_process TEXT, -- Stage/Status of hearing e.g. 'Evidence', 'Arguments', 'Notice'
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- 'Pending', 'Disposed', 'Stayed', 'Transferred'
    remark TEXT, -- Disposal note or case remarks e.g. 'Disposed on merits', 'Settled by compromise'
    doc_link TEXT, -- Document or Order Sheet link (Drive/PDF URL)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Optimized Performance & Fast Searches
-- ==============================================================================

-- Fast lookup by case number (Search bar & Update tab lookup)
CREATE INDEX IF NOT EXISTS idx_civilcases_case_number ON public.civilcases (case_number);

-- Fast lookup by court and status
CREATE INDEX IF NOT EXISTS idx_civilcases_court_name ON public.civilcases (court_name);
CREATE INDEX IF NOT EXISTS idx_civilcases_status ON public.civilcases (case_status);

-- Fast calendar/hearing date sorting
CREATE INDEX IF NOT EXISTS idx_civilcases_next_hearing ON public.civilcases (next_hearing);

-- Fast search on plaintiff, defendant, and client name
CREATE INDEX IF NOT EXISTS idx_civilcases_plaintiff ON public.civilcases (plaintiff);
CREATE INDEX IF NOT EXISTS idx_civilcases_defendant ON public.civilcases (defendant);
CREATE INDEX IF NOT EXISTS idx_civilcases_client_name ON public.civilcases (client_name);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" Field
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_civilcases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    -- Automatically compute case_name if not provided
    IF NEW.case_name IS NULL OR NEW.case_name = '' THEN
        NEW.case_name := NEW.plaintiff || ' vs ' || NEW.defendant;
    END IF;
    -- Automatically set party_name to defendant if not provided
    IF NEW.party_name IS NULL OR NEW.party_name = '' THEN
        NEW.party_name := NEW.defendant;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_civilcases_updated_at ON public.civilcases;

CREATE TRIGGER trigger_civilcases_updated_at
BEFORE INSERT OR UPDATE ON public.civilcases
FOR EACH ROW
EXECUTE FUNCTION public.handle_civilcases_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.civilcases ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for Dashboard & Guest Search)
CREATE POLICY "Allow public read access to civilcases"
ON public.civilcases
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users / service role full access (insert/update/delete)
CREATE POLICY "Allow authenticated full access to civilcases"
ON public.civilcases
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon insert/update/delete if using direct client key during development
CREATE POLICY "Allow anon insert to civilcases"
ON public.civilcases
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update to civilcases"
ON public.civilcases
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon delete to civilcases"
ON public.civilcases
FOR DELETE
TO anon
USING (true);

-- ==============================================================================
-- 6. Sample Initial Data (Matches Dashboard Demo Records)
-- ==============================================================================

INSERT INTO public.civilcases (case_number, case_year, case_type, case_name, filing_date, plaintiff, defendant, court_name, client_name, client_number, next_hearing, case_status)
VALUES 
    ('CIV-2026-001', 2026, 'civil', 'Atul vs Mishra', '2026-08-20', 'Atul', 'Mishra', 'District Court', 'Atul', '9876543210', '2026-09-15', 'Pending'),
    ('CIV-2026-002', 2026, 'civil', 'XYZ vs ABC', '2026-08-22', 'XYZ', 'ABC', 'High Court', 'XYZ', '9876543211', NULL, 'Pending'),
    ('CIV-2026-005', 2026, 'civil', 'Client vs Opponent', '2026-08-28', 'Client', 'Opponent', 'District Court', 'Client', '9876543212', '2026-10-02', 'Pending')
ON CONFLICT (case_number) DO UPDATE SET
    plaintiff = EXCLUDED.plaintiff,
    defendant = EXCLUDED.defendant,
    court_name = EXCLUDED.court_name,
    client_name = EXCLUDED.client_name,
    client_number = EXCLUDED.client_number,
    next_hearing = EXCLUDED.next_hearing,
    updated_at = timezone('utc'::text, now());
