-- ==============================================================================
-- Supabase SQL Schema for Case To-Do & Deadlines Table: "case_todos"
-- Project: Case Management System
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the "case_todos" Table
CREATE TABLE IF NOT EXISTS public.case_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Case Linkage
    case_number VARCHAR(100) NOT NULL, -- References case e.g. 'CIV-2026-001' or 'CR-2026-003'
    case_name TEXT, -- Party names or case title
    
    -- Task Details
    task_title TEXT NOT NULL, -- e.g. 'Draft Written Statement', 'File Bail Application', 'Collect Certified Copy'
    hearing_date DATE, -- The scheduled court appearance date
    deadline_date DATE NOT NULL, -- The task deadline date (on or before hearing)
    
    -- Priority & Status
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'normal'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. Indexes for Fast Queries
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_case_todos_case_number ON public.case_todos (case_number);
CREATE INDEX IF NOT EXISTS idx_case_todos_deadline_date ON public.case_todos (deadline_date);
CREATE INDEX IF NOT EXISTS idx_case_todos_status ON public.case_todos (status);
CREATE INDEX IF NOT EXISTS idx_case_todos_priority ON public.case_todos (priority);

-- ==============================================================================
-- 4. Auto-update Trigger for "updated_at" Field
-- ==============================================================================

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

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

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
