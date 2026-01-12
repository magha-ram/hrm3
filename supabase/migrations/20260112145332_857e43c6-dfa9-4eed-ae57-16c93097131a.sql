-- Add missing columns to goals table to match frontend expectations
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_date TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS progress_notes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS last_progress_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES public.review_cycles(id);

-- Add missing columns to impersonation_logs
ALTER TABLE public.impersonation_logs ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.impersonation_logs ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Add missing columns to salary_history to match frontend
ALTER TABLE public.salary_history ADD COLUMN IF NOT EXISTS effective_from TEXT;
ALTER TABLE public.salary_history ADD COLUMN IF NOT EXISTS effective_to TEXT;
ALTER TABLE public.salary_history ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add missing columns to employment_history to match frontend
ALTER TABLE public.employment_history ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.employment_history ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);
ALTER TABLE public.employment_history ADD COLUMN IF NOT EXISTS effective_from TEXT;
ALTER TABLE public.employment_history ADD COLUMN IF NOT EXISTS effective_to TEXT;
ALTER TABLE public.employment_history ADD COLUMN IF NOT EXISTS change_type TEXT;
ALTER TABLE public.employment_history ADD COLUMN IF NOT EXISTS created_by UUID;