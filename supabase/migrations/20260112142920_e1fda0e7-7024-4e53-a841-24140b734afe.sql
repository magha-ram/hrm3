
-- Add remaining missing columns and tables

-- Add missing columns to attendance_summaries
ALTER TABLE public.attendance_summaries ADD COLUMN IF NOT EXISTS days_present INTEGER DEFAULT 0;
ALTER TABLE public.attendance_summaries ADD COLUMN IF NOT EXISTS full_day_absents INTEGER DEFAULT 0;
ALTER TABLE public.attendance_summaries ADD COLUMN IF NOT EXISTS days_late INTEGER DEFAULT 0;
ALTER TABLE public.attendance_summaries ADD COLUMN IF NOT EXISTS total_working_hours DECIMAL(8, 2) DEFAULT 0;
ALTER TABLE public.attendance_summaries ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE public.attendance_summaries ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;

-- Add missing columns to companies (payroll related)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pf_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pf_employee_rate DECIMAL(5, 2) DEFAULT 12;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pf_employer_rate DECIMAL(5, 2) DEFAULT 12;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS esi_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS esi_employee_rate DECIMAL(5, 2) DEFAULT 0.75;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS esi_employer_rate DECIMAL(5, 2) DEFAULT 3.25;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS professional_tax_enabled BOOLEAN DEFAULT false;

-- Add missing columns to plans (trial related)
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_default_days INTEGER DEFAULT 14;

-- Add missing columns to employee_documents
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Company creation links table
CREATE TABLE IF NOT EXISTS public.company_creation_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    plan_id UUID REFERENCES public.plans(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    used_by_company_id UUID REFERENCES public.companies(id),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_creation_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_creation_links_select_admin" ON public.company_creation_links FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "company_creation_links_insert_admin" ON public.company_creation_links FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "company_creation_links_update_admin" ON public.company_creation_links FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "company_creation_links_delete_admin" ON public.company_creation_links FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true));

-- Employee shift assignments table
CREATE TABLE IF NOT EXISTS public.employee_shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_shift_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_shift_assignments_select" ON public.employee_shift_assignments FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "employee_shift_assignments_insert" ON public.employee_shift_assignments FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "employee_shift_assignments_update" ON public.employee_shift_assignments FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "employee_shift_assignments_delete" ON public.employee_shift_assignments FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

CREATE INDEX IF NOT EXISTS idx_employee_shift_assignments_company ON public.employee_shift_assignments(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_shift_assignments_employee ON public.employee_shift_assignments(employee_id);

-- Shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 60,
    grace_period_minutes INTEGER DEFAULT 15,
    is_night_shift BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    color TEXT DEFAULT '#3B82F6',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, code)
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shifts_select" ON public.shifts FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "shifts_insert" ON public.shifts FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "shifts_update" ON public.shifts FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "shifts_delete" ON public.shifts FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

CREATE INDEX IF NOT EXISTS idx_shifts_company ON public.shifts(company_id);

-- Add FK reference from shift assignments to shifts
ALTER TABLE public.employee_shift_assignments DROP CONSTRAINT IF EXISTS employee_shift_assignments_shift_id_fkey;
ALTER TABLE public.employee_shift_assignments ADD CONSTRAINT employee_shift_assignments_shift_id_fkey 
    FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE CASCADE;

-- Triggers for new tables
CREATE TRIGGER update_company_creation_links_updated_at BEFORE UPDATE ON public.company_creation_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_shift_assignments_updated_at BEFORE UPDATE ON public.employee_shift_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
