-- ==============================================================================
-- Complete Supabase SQL Schema for Case Management System
-- Tables Included:
--   1. civilcases    (Civil, Revenue, and Complaint Cases)
--   2. criminalcases (Criminal Cases with Police Station, Section, Crime No)
--   3. hearings      (Hearing Dates, Process Stages, and Status Updates)
--   4. courts        (Court Names and Locations for dynamic form dropdowns)
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE 1: "civilcases"
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.civilcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    case_year INTEGER NOT NULL CHECK (case_year >= 1900 AND case_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'civil' NOT NULL,
    case_name TEXT,
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    court_name TEXT NOT NULL,
    plaintiff TEXT NOT NULL,
    defendant TEXT NOT NULL,
    party_name TEXT,
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

CREATE INDEX IF NOT EXISTS idx_civilcases_case_number ON public.civilcases (case_number);
CREATE INDEX IF NOT EXISTS idx_civilcases_court_name ON public.civilcases (court_name);
CREATE INDEX IF NOT EXISTS idx_civilcases_status ON public.civilcases (case_status);
CREATE INDEX IF NOT EXISTS idx_civilcases_next_hearing ON public.civilcases (next_hearing);
CREATE INDEX IF NOT EXISTS idx_civilcases_plaintiff ON public.civilcases (plaintiff);
CREATE INDEX IF NOT EXISTS idx_civilcases_defendant ON public.civilcases (defendant);
CREATE INDEX IF NOT EXISTS idx_civilcases_client_name ON public.civilcases (client_name);

CREATE OR REPLACE FUNCTION public.handle_civilcases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.case_name IS NULL OR NEW.case_name = '' THEN
        NEW.case_name := NEW.plaintiff || ' vs ' || NEW.defendant;
    END IF;
    IF NEW.party_name IS NULL OR NEW.party_name = '' THEN
        NEW.party_name := NEW.defendant;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_civilcases_updated_at ON public.civilcases;
CREATE TRIGGER trigger_civilcases_updated_at
BEFORE INSERT OR UPDATE ON public.civilcases
FOR EACH ROW EXECUTE FUNCTION public.handle_civilcases_updated_at();

ALTER TABLE public.civilcases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read civilcases" ON public.civilcases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all civilcases" ON public.civilcases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert civilcases" ON public.civilcases FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update civilcases" ON public.civilcases FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete civilcases" ON public.civilcases FOR DELETE TO anon USING (true);

-- ==============================================================================
-- TABLE 2: "criminalcases"
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.criminalcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    crime_year INTEGER NOT NULL CHECK (crime_year >= 1900 AND crime_year <= 2100),
    case_type VARCHAR(50) DEFAULT 'criminal' NOT NULL,
    case_name TEXT,
    police_station TEXT NOT NULL,
    crime_section TEXT NOT NULL,
    crime_number VARCHAR(100) NOT NULL,
    filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
    victim_name TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_criminalcases_case_number ON public.criminalcases (case_number);
CREATE INDEX IF NOT EXISTS idx_criminalcases_crime_number ON public.criminalcases (crime_number);
CREATE INDEX IF NOT EXISTS idx_criminalcases_police_station ON public.criminalcases (police_station);
CREATE INDEX IF NOT EXISTS idx_criminalcases_court_name ON public.criminalcases (court_name);
CREATE INDEX IF NOT EXISTS idx_criminalcases_status ON public.criminalcases (case_status);
CREATE INDEX IF NOT EXISTS idx_criminalcases_next_hearing ON public.criminalcases (next_hearing);
CREATE INDEX IF NOT EXISTS idx_criminalcases_accused ON public.criminalcases (accused_name);
CREATE INDEX IF NOT EXISTS idx_criminalcases_victim ON public.criminalcases (victim_name);
CREATE INDEX IF NOT EXISTS idx_criminalcases_client ON public.criminalcases (client_name);

CREATE OR REPLACE FUNCTION public.handle_criminalcases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    IF NEW.case_name IS NULL OR NEW.case_name = '' THEN
        NEW.case_name := NEW.victim_name || ' vs ' || NEW.accused_name;
    END IF;
    IF NEW.party_name IS NULL OR NEW.party_name = '' THEN
        NEW.party_name := NEW.accused_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_criminalcases_updated_at ON public.criminalcases;
CREATE TRIGGER trigger_criminalcases_updated_at
BEFORE INSERT OR UPDATE ON public.criminalcases
FOR EACH ROW EXECUTE FUNCTION public.handle_criminalcases_updated_at();

ALTER TABLE public.criminalcases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read criminalcases" ON public.criminalcases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all criminalcases" ON public.criminalcases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert criminalcases" ON public.criminalcases FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update criminalcases" ON public.criminalcases FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete criminalcases" ON public.criminalcases FOR DELETE TO anon USING (true);

-- ==============================================================================
-- TABLE 3: "hearings"
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hearings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) NOT NULL,
    case_type VARCHAR(50) DEFAULT 'civil',
    hearing_date DATE NOT NULL,
    process TEXT NOT NULL,
    judge_name TEXT,
    court_room VARCHAR(50),
    action_taken TEXT,
    next_hearing_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hearings_case_number ON public.hearings (case_number);
CREATE INDEX IF NOT EXISTS idx_hearings_hearing_date ON public.hearings (hearing_date);
CREATE INDEX IF NOT EXISTS idx_hearings_next_hearing_date ON public.hearings (next_hearing_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hearings_case_date_unique ON public.hearings (case_number, hearing_date);

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
FOR EACH ROW EXECUTE FUNCTION public.handle_hearings_updated_at();

ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read hearings" ON public.hearings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all hearings" ON public.hearings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert hearings" ON public.hearings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update hearings" ON public.hearings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete hearings" ON public.hearings FOR DELETE TO anon USING (true);

-- ==============================================================================
-- TABLE 4: "courts"
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_name TEXT UNIQUE NOT NULL,
    court_type VARCHAR(50) DEFAULT 'District Court',
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courts_court_name ON public.courts (court_name);

CREATE OR REPLACE FUNCTION public.handle_courts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_courts_updated_at ON public.courts;
CREATE TRIGGER trigger_courts_updated_at
BEFORE INSERT OR UPDATE ON public.courts
FOR EACH ROW EXECUTE FUNCTION public.handle_courts_updated_at();

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read courts" ON public.courts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow auth all courts" ON public.courts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert courts" ON public.courts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update courts" ON public.courts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete courts" ON public.courts FOR DELETE TO anon USING (true);

-- ==============================================================================
-- Initial Seed Data
-- ==============================================================================
INSERT INTO public.civilcases (case_number, case_year, case_type, case_name, filing_date, plaintiff, defendant, court_name, client_name, client_number, next_hearing, case_status)
VALUES 
    ('CIV-2026-001', 2026, 'civil', 'Atul vs Mishra', '2026-08-20', 'Atul', 'Mishra', 'District Court', 'Atul', '9876543210', '2026-09-15', 'Pending'),
    ('CIV-2026-002', 2026, 'civil', 'XYZ vs ABC', '2026-08-22', 'XYZ', 'ABC', 'High Court', 'XYZ', '9876543211', NULL, 'Pending'),
    ('CIV-2026-005', 2026, 'civil', 'Client vs Opponent', '2026-08-28', 'Client', 'Opponent', 'District Court', 'Client', '9876543212', '2026-10-02', 'Pending')
ON CONFLICT (case_number) DO NOTHING;

INSERT INTO public.criminalcases (case_number, crime_year, case_type, case_name, police_station, crime_section, crime_number, filing_date, victim_name, accused_name, court_name, client_name, client_number, next_hearing, case_status)
VALUES 
    ('CR-2026-003', 2026, 'criminal', 'State vs Ram', 'Central Police Station', 'IPC 302', 'CR-402', '2026-08-10', 'State', 'Ram', 'District Court', 'State', '9876543213', '2026-09-20', 'Pending'),
    ('CR-2026-006', 2026, 'criminal', 'State vs Kumar', 'North Police Station', 'IPC 379', 'CR-510', '2026-08-18', 'State', 'Kumar', 'High Court', 'State', '9876543215', '2026-10-12', 'Pending')
ON CONFLICT (case_number) DO NOTHING;

INSERT INTO public.hearings (case_number, case_type, hearing_date, process, next_hearing_date, remarks)
VALUES 
    ('CIV-2026-001', 'civil', '2026-08-25', 'Written Statement Filed', '2026-09-15', 'Defendant filed response.'),
    ('CR-2026-003', 'criminal', '2026-08-20', 'Bail Application Submitted', '2026-09-20', 'Notice served to Public Prosecutor.'),
    ('CIV-2026-005', 'civil', '2026-08-30', 'Framing of Issues', '2026-10-02', 'Issues finalized by court.')
ON CONFLICT DO NOTHING;

INSERT INTO public.courts (court_name, court_type, location)
VALUES 
    ('District Court', 'District Court', 'Main Civil Lines'),
    ('High Court', 'High Court', 'State Capital'),
    ('Supreme Court', 'Supreme Court', 'New Delhi'),
    ('Family Court', 'Family Court', 'City Center'),
    ('Labour Court', 'Tribunal', 'Industrial Area'),
    ('Consumer Court', 'Tribunal', 'District Complex')
ON CONFLICT (court_name) DO NOTHING;

-- ==============================================================================
-- 5. "case_todos" Table for Task & Hearing Deadline Tracker
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.case_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(100) NOT NULL,
    case_name TEXT,
    task_title TEXT NOT NULL,
    hearing_date DATE,
    deadline_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_todos_case_number ON public.case_todos (case_number);
CREATE INDEX IF NOT EXISTS idx_case_todos_deadline_date ON public.case_todos (deadline_date);
CREATE INDEX IF NOT EXISTS idx_case_todos_status ON public.case_todos (status);
CREATE INDEX IF NOT EXISTS idx_case_todos_priority ON public.case_todos (priority);

CREATE OR REPLACE FUNCTION public.handle_case_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_case_todos_updated_at ON public.case_todos;

CREATE TRIGGER trigger_case_todos_updated_at
BEFORE INSERT OR UPDATE ON public.case_todos
FOR EACH ROW
EXECUTE FUNCTION public.handle_case_todos_updated_at();

ALTER TABLE public.case_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to case_todos"
ON public.case_todos FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated full access to case_todos"
ON public.case_todos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon insert to case_todos"
ON public.case_todos FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update to case_todos"
ON public.case_todos FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete to case_todos"
ON public.case_todos FOR DELETE TO anon USING (true);

