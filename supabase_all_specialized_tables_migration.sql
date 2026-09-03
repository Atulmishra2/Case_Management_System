-- ==============================================================================
-- MASTER MIGRATION: All Specialized Case Tables for Supabase
-- 1. State Cases (Criminal / State of U.P.)
-- 2. Family Cases (Matrimonial / Sec 125 / Divorce / DV)
-- 3. Revenue Cases (UP Revenue Code / Mutation / Partition / Demarcation)
-- 4. Misc Civil Cases (Appeals / Revisions / Injunctions / Applications)
-- 5. Misc Criminal Cases (Bails / Appeals / Revisions / Sec 156(3))
-- ==============================================================================

-- 1. STATE CASES TABLE
CREATE TABLE IF NOT EXISTS public.statecases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    crime_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    case_type TEXT NOT NULL DEFAULT 'state',
    case_name TEXT,
    police_station TEXT NOT NULL,
    crime_section TEXT NOT NULL,
    crime_number TEXT NOT NULL,
    filing_date DATE DEFAULT CURRENT_DATE,
    first_party TEXT NOT NULL DEFAULT 'State of U.P.',
    accused_name TEXT NOT NULL,
    party_name TEXT,
    court_name TEXT NOT NULL,
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

-- 2. FAMILY CASES TABLE
CREATE TABLE IF NOT EXISTS public.familycases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    case_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    case_type TEXT NOT NULL DEFAULT 'family',
    matter_type TEXT NOT NULL DEFAULT 'Maintenance (Sec 125 CrPC)',
    case_name TEXT,
    filing_date DATE DEFAULT CURRENT_DATE,
    petitioner TEXT NOT NULL,
    respondent TEXT NOT NULL,
    marriage_date DATE,
    maintenance_detail TEXT,
    court_name TEXT NOT NULL,
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

-- 3. REVENUE CASES TABLE
CREATE TABLE IF NOT EXISTS public.revenuecases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    case_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    case_type TEXT NOT NULL DEFAULT 'revenue',
    revenue_act_section TEXT NOT NULL DEFAULT 'Sec 34 (Mutation / दाखिल खारिज)',
    village_mauja TEXT,
    pargana_tehsil TEXT,
    gata_khata_no TEXT,
    case_name TEXT,
    filing_date DATE DEFAULT CURRENT_DATE,
    applicant TEXT NOT NULL,
    opposite_party TEXT NOT NULL,
    court_name TEXT NOT NULL,
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

-- 4. MISC CIVIL CASES TABLE
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

-- 5. MISC CRIMINAL CASES TABLE
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

-- 6. COMPLAINT CASES TABLE (Cheque Bounce Sec 138 NI Act, Sec 200 CrPC, Defamation)
CREATE TABLE IF NOT EXISTS public.complaintcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    case_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    case_type TEXT NOT NULL DEFAULT 'complaint',
    complaint_type TEXT NOT NULL DEFAULT 'Cheque Bounce (Sec 138 NI Act)',
    complainant TEXT NOT NULL,
    accused_name TEXT NOT NULL,
    section_act TEXT,
    police_station TEXT,
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

-- Enable RLS for all tables
ALTER TABLE public.statecases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.familycases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenuecases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misccivilcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misccriminalcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaintcases ENABLE ROW LEVEL SECURITY;

-- Set Public Access Policies
DROP POLICY IF EXISTS "Public access for statecases" ON public.statecases;
CREATE POLICY "Public access for statecases" ON public.statecases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for familycases" ON public.familycases;
CREATE POLICY "Public access for familycases" ON public.familycases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for revenuecases" ON public.revenuecases;
CREATE POLICY "Public access for revenuecases" ON public.revenuecases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for misccivilcases" ON public.misccivilcases;
CREATE POLICY "Public access for misccivilcases" ON public.misccivilcases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for misccriminalcases" ON public.misccriminalcases;
CREATE POLICY "Public access for misccriminalcases" ON public.misccriminalcases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for complaintcases" ON public.complaintcases;
CREATE POLICY "Public access for complaintcases" ON public.complaintcases FOR ALL USING (true) WITH CHECK (true);

-- Indexes for Case Number lookups
CREATE INDEX IF NOT EXISTS idx_statecases_case_number ON public.statecases(case_number);
CREATE INDEX IF NOT EXISTS idx_familycases_case_number ON public.familycases(case_number);
CREATE INDEX IF NOT EXISTS idx_revenuecases_case_number ON public.revenuecases(case_number);
CREATE INDEX IF NOT EXISTS idx_misccivilcases_case_number ON public.misccivilcases(case_number);
CREATE INDEX IF NOT EXISTS idx_misccriminalcases_case_number ON public.misccriminalcases(case_number);
CREATE INDEX IF NOT EXISTS idx_complaintcases_case_number ON public.complaintcases(case_number);

