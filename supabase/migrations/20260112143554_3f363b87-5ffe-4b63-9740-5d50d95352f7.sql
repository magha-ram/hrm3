-- Add missing columns to company_creation_links
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS enable_trial boolean DEFAULT true;

-- Add missing columns to trusted_devices
ALTER TABLE public.trusted_devices ADD COLUMN IF NOT EXISTS first_seen_at timestamptz DEFAULT now();
ALTER TABLE public.trusted_devices ADD COLUMN IF NOT EXISTS is_trusted boolean DEFAULT true;

-- Add missing columns to company_domains
ALTER TABLE public.company_domains ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.company_domains ADD COLUMN IF NOT EXISTS verification_token text;

-- Create company_email_templates table
CREATE TABLE IF NOT EXISTS public.company_email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    template_type text NOT NULL,
    display_name text NOT NULL,
    description text,
    is_enabled boolean DEFAULT true,
    subject text NOT NULL,
    body_html text,
    body_text text,
    variables jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_id, template_type)
);

ALTER TABLE public.company_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage email templates" ON public.company_email_templates
    FOR ALL USING (is_company_admin(auth.uid(), company_id));

-- Create impersonation_logs table
CREATE TABLE IF NOT EXISTS public.impersonation_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid REFERENCES auth.users(id) NOT NULL,
    target_user_id uuid REFERENCES auth.users(id) NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
    action text NOT NULL,
    reason text,
    metadata jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.impersonation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view impersonation logs" ON public.impersonation_logs
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

CREATE POLICY "Platform admins can insert impersonation logs" ON public.impersonation_logs
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- Create candidate_auth_config table
CREATE TABLE IF NOT EXISTS public.candidate_auth_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    auth_enabled boolean DEFAULT false,
    require_login_to_apply boolean DEFAULT false,
    magic_link_enabled boolean DEFAULT true,
    password_enabled boolean DEFAULT false,
    session_duration_hours integer DEFAULT 24,
    allow_application_tracking boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.candidate_auth_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage candidate auth config" ON public.candidate_auth_config
    FOR ALL USING (is_company_admin(auth.uid(), company_id));

-- Create candidate_users table
CREATE TABLE IF NOT EXISTS public.candidate_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    email text NOT NULL,
    password_hash text,
    first_name text,
    last_name text,
    phone text,
    is_verified boolean DEFAULT false,
    verification_token text,
    verification_expires_at timestamptz,
    last_login_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_id, email)
);

ALTER TABLE public.candidate_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage candidate users" ON public.candidate_users
    FOR ALL USING (is_company_admin(auth.uid(), company_id));

-- Create get_user_context RPC function
CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_profile record;
    v_companies jsonb;
    v_current_company_id uuid;
    v_current_role app_role;
    v_current_employee record;
    v_is_platform_admin boolean;
    v_platform_admin_role text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
    
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'company_id', cu.company_id,
        'company_name', c.name,
        'company_slug', c.slug,
        'logo_url', c.logo_url,
        'role', cu.role,
        'is_primary', cu.is_primary,
        'is_frozen', NOT c.is_active
    )), '[]'::jsonb)
    INTO v_companies
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = v_user_id AND cu.is_active = true;

    SELECT cu.company_id, cu.role INTO v_current_company_id, v_current_role
    FROM public.company_users cu
    WHERE cu.user_id = v_user_id AND cu.is_active = true AND cu.is_primary = true
    LIMIT 1;

    IF v_current_company_id IS NULL THEN
        SELECT cu.company_id, cu.role INTO v_current_company_id, v_current_role
        FROM public.company_users cu
        WHERE cu.user_id = v_user_id AND cu.is_active = true
        LIMIT 1;
    END IF;

    IF v_current_company_id IS NOT NULL THEN
        SELECT * INTO v_current_employee
        FROM public.employees
        WHERE user_id = v_user_id AND company_id = v_current_company_id
        LIMIT 1;
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = v_user_id)
    INTO v_is_platform_admin;

    IF v_is_platform_admin THEN
        SELECT role INTO v_platform_admin_role FROM public.platform_admins WHERE user_id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'email', v_profile.email,
        'first_name', v_profile.first_name,
        'last_name', v_profile.last_name,
        'avatar_url', v_profile.avatar_url,
        'max_companies', COALESCE(v_profile.max_companies, 1),
        'current_company_id', v_current_company_id,
        'current_role', v_current_role,
        'current_employee_id', v_current_employee.id,
        'current_employee', CASE WHEN v_current_employee.id IS NOT NULL THEN jsonb_build_object(
            'id', v_current_employee.id,
            'first_name', v_current_employee.first_name,
            'last_name', v_current_employee.last_name,
            'employee_number', v_current_employee.employee_number,
            'job_title', v_current_employee.job_title,
            'department_id', v_current_employee.department_id,
            'manager_id', v_current_employee.manager_id,
            'employment_status', v_current_employee.employment_status
        ) ELSE NULL END,
        'companies', v_companies,
        'is_platform_admin', v_is_platform_admin,
        'platform_admin_role', v_platform_admin_role
    );
END;
$$;

-- Create set_primary_company RPC function
CREATE OR REPLACE FUNCTION public.set_primary_company(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.company_users SET is_primary = false WHERE user_id = auth.uid();
    UPDATE public.company_users SET is_primary = true WHERE user_id = auth.uid() AND company_id = p_company_id;
    RETURN true;
END;
$$;

-- Create get_company_primary_domain RPC function
CREATE OR REPLACE FUNCTION public.get_company_primary_domain(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_domain text;
BEGIN
    SELECT custom_domain INTO v_domain
    FROM public.company_domains
    WHERE company_id = p_company_id AND is_primary = true AND is_verified = true
    LIMIT 1;
    RETURN v_domain;
END;
$$;

-- Create generate_attendance_summary RPC function
CREATE OR REPLACE FUNCTION public.generate_attendance_summary(
    p_company_id uuid,
    p_employee_id uuid,
    p_month integer,
    p_year integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_summary_id uuid;
    v_start_date date;
    v_end_date date;
    v_working_days integer := 0;
    v_present_days integer := 0;
    v_absent_days integer := 0;
    v_late_days integer := 0;
    v_half_days integer := 0;
    v_overtime_hours numeric := 0;
    v_total_hours numeric := 0;
BEGIN
    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;

    SELECT COUNT(*) INTO v_present_days
    FROM public.time_entries
    WHERE company_id = p_company_id AND employee_id = p_employee_id
    AND date BETWEEN v_start_date AND v_end_date;

    SELECT COALESCE(SUM(total_hours), 0) INTO v_total_hours
    FROM public.time_entries
    WHERE company_id = p_company_id AND employee_id = p_employee_id
    AND date BETWEEN v_start_date AND v_end_date;

    INSERT INTO public.attendance_summaries (
        company_id, employee_id, month, year,
        working_days, days_present, absent_days, days_late,
        half_days, overtime_hours, total_hours_worked
    ) VALUES (
        p_company_id, p_employee_id, p_month, p_year,
        22, v_present_days, 22 - v_present_days, v_late_days,
        v_half_days, v_overtime_hours, v_total_hours
    )
    ON CONFLICT (company_id, employee_id, month, year) DO UPDATE SET
        days_present = EXCLUDED.days_present,
        absent_days = EXCLUDED.absent_days,
        total_hours_worked = EXCLUDED.total_hours_worked,
        updated_at = now()
    RETURNING id INTO v_summary_id;

    RETURN v_summary_id;
END;
$$;

-- Create calculate_payroll_from_attendance RPC function
CREATE OR REPLACE FUNCTION public.calculate_payroll_from_attendance(
    p_company_id uuid,
    p_payroll_run_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN true;
END;
$$;

-- Create lock_attendance_for_payroll RPC function
CREATE OR REPLACE FUNCTION public.lock_attendance_for_payroll(
    p_company_id uuid,
    p_month integer,
    p_year integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.attendance_summaries
    SET is_locked = true
    WHERE company_id = p_company_id AND month = p_month AND year = p_year;
    RETURN true;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_company_email_templates_updated_at
    BEFORE UPDATE ON public.company_email_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_auth_config_updated_at
    BEFORE UPDATE ON public.candidate_auth_config
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_users_updated_at
    BEFORE UPDATE ON public.candidate_users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();