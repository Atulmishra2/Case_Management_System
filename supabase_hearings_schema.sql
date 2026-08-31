-- ==============================================================================
-- Supabase SQL Schema for Hearings Table: "hearings"
-- Project: Case Management System
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "hearings" Table
CREATE TABLE IF NOT EXISTS public.hearings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case Reference
    case_number VARCHAR(100) NOT NULL, -- References case e.g. 'CIV-2026-001' or 'CR-2026-003'
    case_type VARCHAR(50) DEFAULT 'civil', -- 'civil', 'criminal', 'revenue', 'complaint'
    
    -- Hearing Information
    hearing_date DATE NOT NULL, -- Date on which this hearing occurred or will occur
    process TEXT NOT NULL, -- e.g. 'Notice Issued', 'Arguments Heard', 'Evidence Recorded', 'Bail Hearing'
    
    -- Additional Court Session Information
    judge_name TEXT,
    court_room VARCHAR(50),
    action_taken TEXT, -- Summary of court order or proceedings during this hearing
    next_hearing_date DATE, -- The subsequent hearing date fixed by the court
    remarks TEXT, -- Internal advocate/client remarks
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Fast Hearing History & Date Queries
-- ==============================================================================

-- Fast lookup of all hearings for a specific case
CREATE INDEX IF NOT EXISTS idx_hearings_case_number ON public.hearings (case_number);

-- Fast lookup of upcoming or past hearing dates
CREATE INDEX IF NOT EXISTS idx_hearings_hearing_date ON public.hearings (hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_next_hearing_date ON public.hearings (next_hearing_date);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" Field
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_hearings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hearings_updated_at ON public.hearings;

CREATE TRIGGER trigger_hearings_updated_at
BEFORE INSERT OR UPDATE ON public.hearings
FOR EACH ROW
EXECUTE FUNCTION public.handle_hearings_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to hearings"
ON public.hearings
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated full access
CREATE POLICY "Allow authenticated full access to hearings"
ON public.hearings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anon insert/update/delete for development
CREATE POLICY "Allow anon insert to hearings"
ON public.hearings
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update to hearings"
ON public.hearings
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon delete to hearings"
ON public.hearings
FOR DELETE
TO anon
USING (true);

-- ==============================================================================
-- 6. Initial Seed Data
-- ==============================================================================

INSERT INTO public.hearings (case_number, case_type, hearing_date, process, next_hearing_date, remarks)
VALUES 
    ('CIV-2026-001', 'civil', '2026-08-25', 'Written Statement Filed', '2026-09-15', 'Defendant filed response.'),
    ('CR-2026-003', 'criminal', '2026-08-20', 'Bail Application Submitted', '2026-09-20', 'Notice served to Public Prosecutor.'),
    ('CIV-2026-005', 'civil', '2026-08-30', 'Framing of Issues', '2026-10-02', 'Issues finalized by court.')
ON CONFLICT DO NOTHING;
