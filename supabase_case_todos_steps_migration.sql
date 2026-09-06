-- ==============================================================================
-- Migration: Add multi-step task support & Certified Copy No. to "case_todos"
-- Project: Case Management System
-- ==============================================================================

ALTER TABLE public.case_todos 
ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.case_todos 
ADD COLUMN IF NOT EXISTS copy_number VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_case_todos_copy_number ON public.case_todos (copy_number);

COMMENT ON COLUMN public.case_todos.steps IS 'Stores JSON array of sub-step objects: [{"id": 1, "name": "Apply", "completed": false, "date": null}]';
COMMENT ON COLUMN public.case_todos.copy_number IS 'Certified Copy Application / Folio Number e.g. 12344/12';
