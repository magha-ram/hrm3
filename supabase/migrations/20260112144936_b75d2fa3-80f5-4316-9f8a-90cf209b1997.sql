-- Add missing notes column to company_creation_links (if not added yet)
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS notes text;

-- Add missing columns to email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS triggered_from text;

-- Create expense_categories table if not exists
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    max_amount numeric(12,2),
    requires_receipt boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_id, code)
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view expense categories" ON public.expense_categories;
CREATE POLICY "Company members can view expense categories" ON public.expense_categories
    FOR SELECT USING (is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "HR can manage expense categories" ON public.expense_categories;
CREATE POLICY "HR can manage expense categories" ON public.expense_categories
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create work_schedules table
CREATE TABLE IF NOT EXISTS public.work_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    is_default boolean DEFAULT false,
    work_days jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
    start_time time DEFAULT '09:00',
    end_time time DEFAULT '17:00',
    break_duration_minutes integer DEFAULT 60,
    timezone text DEFAULT 'UTC',
    holidays jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view schedules" ON public.work_schedules
    FOR SELECT USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "HR can manage schedules" ON public.work_schedules
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create shift_patterns table if not exists
CREATE TABLE IF NOT EXISTS public.shift_patterns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    start_time time NOT NULL,
    end_time time NOT NULL,
    break_duration_minutes integer DEFAULT 60,
    is_night_shift boolean DEFAULT false,
    color text DEFAULT '#3B82F6',
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.shift_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view shifts" ON public.shift_patterns;
CREATE POLICY "Company members can view shifts" ON public.shift_patterns
    FOR SELECT USING (is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "HR can manage shifts" ON public.shift_patterns;
CREATE POLICY "HR can manage shifts" ON public.shift_patterns
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create shift_assignments table if not exists
CREATE TABLE IF NOT EXISTS public.shift_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    shift_pattern_id uuid REFERENCES public.shift_patterns(id) ON DELETE CASCADE NOT NULL,
    start_date date NOT NULL,
    end_date date,
    is_recurring boolean DEFAULT false,
    recurrence_pattern jsonb,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view own assignments" ON public.shift_assignments;
CREATE POLICY "Employees can view own assignments" ON public.shift_assignments
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "HR can manage assignments" ON public.shift_assignments;
CREATE POLICY "HR can manage assignments" ON public.shift_assignments
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create job_postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    department_id uuid REFERENCES public.departments(id),
    location text,
    employment_type text DEFAULT 'full_time',
    salary_range_min numeric(12,2),
    salary_range_max numeric(12,2),
    currency text DEFAULT 'USD',
    requirements text,
    responsibilities text,
    benefits text,
    status text DEFAULT 'draft',
    published_at timestamptz,
    closes_at timestamptz,
    is_remote boolean DEFAULT false,
    experience_level text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published jobs" ON public.job_postings
    FOR SELECT USING (status = 'published');

CREATE POLICY "HR can manage job postings" ON public.job_postings
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    job_posting_id uuid REFERENCES public.job_postings(id),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    resume_url text,
    cover_letter text,
    source text,
    status text DEFAULT 'new',
    rating numeric(3,2),
    notes text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage candidates" ON public.candidates
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));