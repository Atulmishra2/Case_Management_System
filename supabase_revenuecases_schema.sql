-- ==============================================================================
-- Supabase SQL Schema for Revenue Cases Table: "revenuecases"
-- Project: Case Management System
-- Description: Land, Revenue Courts (UP Revenue Code: Sec 34, 24, 116, 67, 80)
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "revenuecases" Table
CREATE TABLE IF NOT EXISTS public.revenuecases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case Identification
    case_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'REV-2026-020', 'Case No. T2026...'
    case_year INTEGER NOT NULL DEFAULT 2026 CHECK (case_year >= 1900 AND case_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'revenue' NOT NULL,
    case_name TEXT, -- e.g. 'Ram Prasad vs Gaon Sabha'
    
    -- Revenue Specific Details
    revenue_act_section TEXT NOT NULL,  -- e.g. 'Sec 34 (Mutation / दाखिल खारिज)', 'Sec 24 (Demarcation / पत्थरगड्डी)', 'Sec 116 (Partition / बटवारा)', 'Sec 67 (Eviction of Gaon Sabha Land)', 'Sec 80 (Non-Agri)', 'Sec 144 (Declaration)'
    village_mauja TEXT NOT NULL,        -- Village / Mauja (मौजा / ग्राम)
    pargana_tehsil TEXT NOT NULL,       -- Tehsil / Pargana (तहसील)
    gata_khata_no TEXT,                 -- Gata / Khasra No. & Khatauni No. (गाटा सं० / खतौनी)
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Parties
    applicant TEXT NOT NULL,            -- Applicant / Plaintiff (वादी)
    opposite_party TEXT NOT NULL,       -- Opposite Party / Gaon Sabha / State (प्रतिवादी / गाँव सभा)
    party_name TEXT,                    -- Reference party (Opposite Party)
    
    -- Court & Client Representation
    court_name TEXT NOT NULL,           -- SDM Court, Tehsildar Court, Naib Tehsildar, Board of Revenue
    client_name TEXT NOT NULL,          -- Client represented
    client_number VARCHAR(30),          -- Mobile number for updates
    
    -- Hearing & Disposal Tracking
    next_hearing DATE,
    hearing_process TEXT,               -- Stage e.g. 'Notice to Parties / Munadi', 'Lekhpal Spot Report', 'Objections', 'Arguments', 'Order'
    case_status VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- 'Pending', 'Order Passed', 'Parwana Amaldaramad', 'Stayed', 'Disposed'
    remark TEXT,                        -- Land area, co-sharers details, boundary notes
    doc_link TEXT,                      -- Khatauni, Site Map, Order Sheet link (Drive/PDF URL)
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Optimized Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_revenuecases_case_number ON public.revenuecases (case_number);
CREATE INDEX IF NOT EXISTS idx_revenuecases_section ON public.revenuecases (revenue_act_section);
CREATE INDEX IF NOT EXISTS idx_revenuecases_village ON public.revenuecases (village_mauja);
CREATE INDEX IF NOT EXISTS idx_revenuecases_court ON public.revenuecases (court_name);
CREATE INDEX IF NOT EXISTS idx_revenuecases_status ON public.revenuecases (case_status);
CREATE INDEX IF NOT EXISTS idx_revenuecases_next_hearing ON public.revenuecases (next_hearing);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" & "case_name"
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_revenuecases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.case_name IS NULL OR NEW.case_name = '' THEN
        NEW.case_name := NEW.applicant || ' vs ' || NEW.opposite_party;
    END IF;
    IF NEW.party_name IS NULL OR NEW.party_name = '' THEN
        NEW.party_name := NEW.opposite_party;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_revenuecases_updated_at ON public.revenuecases;

CREATE TRIGGER trigger_revenuecases_updated_at
BEFORE INSERT OR UPDATE ON public.revenuecases
FOR EACH ROW
EXECUTE FUNCTION public.handle_revenuecases_updated_at();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.revenuecases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to revenuecases"
ON public.revenuecases FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow anon insert to revenuecases"
ON public.revenuecases FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update to revenuecases"
ON public.revenuecases FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete to revenuecases"
ON public.revenuecases FOR DELETE TO anon USING (true);
