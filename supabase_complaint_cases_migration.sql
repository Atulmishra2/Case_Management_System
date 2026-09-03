-- ==============================================================================
-- COMPLAINT CASES TABLE MIGRATION FOR SUPABASE
-- Handles: Sec 138 NI Act (Cheque Bounce), Private Criminal Complaints (Sec 200 CrPC / 223 BNSS),
-- Defamation (Sec 500 IPC), Domestic Harassment, Labour & Consumer Complaints
-- ==============================================================================

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.complaintcases ENABLE ROW LEVEL SECURITY;

-- Create Open Access Policy
DROP POLICY IF EXISTS Public access for complaintcases ON public.complaintcases;
CREATE POLICY Public access for complaintcases ON public.complaintcases
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Indexes for high-performance case number searching
CREATE INDEX IF NOT EXISTS idx_complaintcases_case_number ON public.complaintcases(case_number);
CREATE INDEX IF NOT EXISTS idx_complaintcases_client_name ON public.complaintcases(client_name);
CREATE INDEX IF NOT EXISTS idx_complaintcases_next_hearing ON public.complaintcases(next_hearing);
