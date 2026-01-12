-- Add missing columns to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_restrictions jsonb DEFAULT '{}';

-- Add expenses module support by ensuring features column can hold it
COMMENT ON COLUMN public.plans.features IS 'Plan features including modules array (employees, directory, leave, time_tracking, shifts, documents, recruitment, performance, payroll, expenses, compliance, audit, integrations, my_team), sso, api, audit flags';