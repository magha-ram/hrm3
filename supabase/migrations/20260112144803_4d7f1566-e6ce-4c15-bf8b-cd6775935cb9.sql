-- Create salary_history table
CREATE TABLE IF NOT EXISTS public.salary_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    effective_date date NOT NULL,
    base_salary numeric(12,2),
    currency text DEFAULT 'USD',
    salary_type text DEFAULT 'monthly',
    salary_currency text DEFAULT 'USD',
    reason text,
    notes text,
    approved_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.salary_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own salary" ON public.salary_history
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR can manage salary" ON public.salary_history
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create employment_history table
CREATE TABLE IF NOT EXISTS public.employment_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL,
    event_date date NOT NULL,
    old_value jsonb,
    new_value jsonb,
    notes text,
    processed_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.employment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own history" ON public.employment_history
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR can manage history" ON public.employment_history
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Add missing columns to email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS message_id text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS error_code text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS triggered_by text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS queued_at timestamptz;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Create review_cycles table if not exists
CREATE TABLE IF NOT EXISTS public.review_cycles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    cycle_type text DEFAULT 'annual',
    start_date date NOT NULL,
    end_date date,
    status text DEFAULT 'draft',
    settings jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.review_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view cycles" ON public.review_cycles;
CREATE POLICY "Company members can view cycles" ON public.review_cycles
    FOR SELECT USING (is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "HR can manage cycles" ON public.review_cycles;
CREATE POLICY "HR can manage cycles" ON public.review_cycles
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create performance_reviews table if not exists
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    reviewer_id uuid REFERENCES public.employees(id),
    cycle_id uuid REFERENCES public.review_cycles(id),
    review_type text DEFAULT 'annual',
    status text DEFAULT 'draft',
    overall_rating numeric(3,2),
    self_assessment jsonb,
    manager_assessment jsonb,
    goals_achieved jsonb,
    strengths text,
    improvements text,
    comments text,
    submitted_at timestamptz,
    completed_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view own reviews" ON public.performance_reviews;
CREATE POLICY "Employees can view own reviews" ON public.performance_reviews
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "HR can manage reviews" ON public.performance_reviews;
CREATE POLICY "HR can manage reviews" ON public.performance_reviews
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create employee_goals table if not exists
CREATE TABLE IF NOT EXISTS public.employee_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    priority text DEFAULT 'medium',
    status text DEFAULT 'not_started',
    target_date date,
    progress integer DEFAULT 0,
    weight numeric(5,2) DEFAULT 1,
    metrics jsonb,
    parent_goal_id uuid REFERENCES public.employee_goals(id),
    review_cycle_id uuid REFERENCES public.review_cycles(id),
    created_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employee_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view own goals" ON public.employee_goals;
CREATE POLICY "Employees can view own goals" ON public.employee_goals
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "HR can manage goals" ON public.employee_goals;
CREATE POLICY "HR can manage goals" ON public.employee_goals
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));