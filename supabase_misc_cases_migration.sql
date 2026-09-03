-- ==============================================================================
-- SUPABASE MIGRATION: Misc Civil Cases & Misc Criminal Cases Tables
-- ==============================================================================

-- 1. MISC CIVIL CASES TABLE (Applications, Appeals, Revisions, Injunctions)
CREATE TABLE IF NOT EXISTS public.misccivilcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    case_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    case_type TEXT NOT NULL DEFAULT 'misc_civil',
    original_case_number TEXT,
    proceeding_type TEXT NOT NULL DEFAULT 'Misc Application',
    applicant TEXT NOT NULL,
    opposite_party TEXT NOT NULL,
    case_name TEXT,
    court_name TEXT NOT NULL,
    filing_date DATE DEFAULT CURRENT_DATE,
    client_name TEXT NOT NULL,
    client_number TEXT,
    next_hearing DATE,
    hearing_process TEXT,
    case_status TEXT NOT NULL DEFAULT 'Pending',
    remark TEXT,
    doc_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. MISC CRIMINAL CASES TABLE (Bail Applications, Appeals, Revisions, 156(3) CrPC)
CREATE TABLE IF NOT EXISTS public.misccriminalcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    crime_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    case_type TEXT NOT NULL DEFAULT 'misc_criminal',
    original_case_number TEXT,
    proceeding_type TEXT NOT NULL DEFAULT 'Bail Application (Sec 439 CrPC)',
    applicant TEXT NOT NULL,
    opposite_party TEXT NOT NULL DEFAULT 'State of U.P.',
    police_station TEXT,
    crime_section TEXT,
    case_name TEXT,
    court_name TEXT NOT NULL,
    filing_date DATE DEFAULT CURRENT_DATE,
    client_name TEXT NOT NULL,
    client_number TEXT,
    next_hearing DATE,
    hearing_process TEXT,
    case_status TEXT NOT NULL DEFAULT 'Pending',
    remark TEXT,
    doc_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.misccivilcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misccriminalcases ENABLE ROW LEVEL SECURITY;

-- Allow Public Access (matching existing schema setup)
DROP POLICY IF EXISTS "Public access for misccivilcases" ON public.misccivilcases;
CREATE POLICY "Public access for misccivilcases" ON public.misccivilcases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for misccriminalcases" ON public.misccriminalcases;
CREATE POLICY "Public access for misccriminalcases" ON public.misccriminalcases FOR ALL USING (true) WITH CHECK (true);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_misccivilcases_case_number ON public.misccivilcases(case_number);
CREATE INDEX IF NOT EXISTS idx_misccivilcases_original_case ON public.misccivilcases(original_case_number);
CREATE INDEX IF NOT EXISTS idx_misccriminalcases_case_number ON public.misccriminalcases(case_number);
CREATE INDEX IF NOT EXISTS idx_misccriminalcases_original_case ON public.misccriminalcases(original_case_number);
