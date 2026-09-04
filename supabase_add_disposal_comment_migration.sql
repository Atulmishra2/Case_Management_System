-- ==============================================================================
-- Migration: Add disposal_comment column to all case tables
-- Project: Case Management System
-- Database: PostgreSQL / Supabase
-- ==============================================================================

-- 1. Civil Cases Table
ALTER TABLE public.civilcases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;

-- 2. State Cases Table (Criminal / State of U.P.)
ALTER TABLE public.statecases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;

-- 3. Legacy Criminal Cases Table
ALTER TABLE public.criminalcases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;

-- 4. Family Cases Table (Matrimonial / Maintenance 125)
ALTER TABLE public.familycases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;

-- 5. Revenue Cases Table (Land / Tehsil)
ALTER TABLE public.revenuecases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;

-- 6. Misc Civil Cases Table (Injunctions / Appeals / Revisions)
ALTER TABLE public.misccivilcases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;

-- 7. Misc Criminal Cases Table (Bails / Sec 156(3) / Revisions)
ALTER TABLE public.misccriminalcases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;

-- 8. Complaint Cases Table (Sec 138 NI Act / Sec 200 CrPC)
ALTER TABLE public.complaintcases 
ADD COLUMN IF NOT EXISTS disposal_comment TEXT;
