
-- =============================================
-- MULTI-TENANT HR SAAS DATABASE SCHEMA
-- Core tables, enums, functions, and RLS
-- =============================================

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing', 'paused');
CREATE TYPE public.plan_interval AS ENUM ('monthly', 'yearly');
CREATE TYPE public.employment_status AS ENUM ('active', 'on_leave', 'terminated', 'suspended');
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'intern', 'temporary');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected', 'canceled');
CREATE TYPE public.candidate_status AS ENUM ('applied', 'screening', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn');
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'closed', 'on_hold');
CREATE TYPE public.review_status AS ENUM ('draft', 'in_progress', 'completed', 'acknowledged');
CREATE TYPE public.payroll_status AS ENUM ('draft', 'processing', 'completed', 'failed');
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company_admin', 'hr_manager', 'manager', 'employee');
CREATE TYPE public.audit_action AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import');
CREATE TYPE public.security_event_type AS ENUM ('login_success', 'login_failure', 'password_change', 'mfa_enabled', 'mfa_disabled', 'suspicious_activity', 'permission_denied', 'data_export');

-- =============================================
-- CORE TABLES
-- =============================================

-- Plans
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_employees INTEGER,
    max_storage_gb INTEGER DEFAULT 5,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Companies
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    website TEXT,
    industry TEXT,
    size_range TEXT,
    address JSONB DEFAULT '{}',
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'UTC',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    fiscal_year_start INTEGER DEFAULT 1,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_is_active ON public.companies(is_active);

-- Company Subscriptions
CREATE TABLE public.company_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status subscription_status NOT NULL DEFAULT 'trialing',
    billing_interval plan_interval NOT NULL DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_ends_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id)
);

CREATE INDEX idx_company_subscriptions_company ON public.company_subscriptions(company_id);
CREATE INDEX idx_company_subscriptions_status ON public.company_subscriptions(status);

-- Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en',
    metadata JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Company Users
CREATE TABLE public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'employee',
    is_primary BOOLEAN DEFAULT false,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_users_company ON public.company_users(company_id);
CREATE INDEX idx_company_users_user ON public.company_users(user_id);
CREATE INDEX idx_company_users_role ON public.company_users(role);

-- Departments
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    parent_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_id UUID,
    cost_center TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, code)
);

CREATE INDEX idx_departments_company ON public.departments(company_id);
CREATE INDEX idx_departments_parent ON public.departments(parent_id);

-- Employees
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    personal_email TEXT,
    date_of_birth DATE,
    gender TEXT,
    nationality TEXT,
    national_id TEXT,
    address JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    job_title TEXT,
    manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    employment_type employment_type NOT NULL DEFAULT 'full_time',
    employment_status employment_status NOT NULL DEFAULT 'active',
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    termination_date DATE,
    termination_reason TEXT,
    work_location TEXT,
    salary DECIMAL(12, 2),
    salary_currency TEXT DEFAULT 'USD',
    bank_details JSONB DEFAULT '{}',
    tax_info JSONB DEFAULT '{}',
    benefits JSONB DEFAULT '{}',
    skills TEXT[],
    certifications JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, employee_number),
    UNIQUE(company_id, email)
);

CREATE INDEX idx_employees_company ON public.employees(company_id);
CREATE INDEX idx_employees_user ON public.employees(user_id);
CREATE INDEX idx_employees_department ON public.employees(department_id);
CREATE INDEX idx_employees_manager ON public.employees(manager_id);
CREATE INDEX idx_employees_status ON public.employees(employment_status);
CREATE INDEX idx_employees_email ON public.employees(email);

-- Add manager_id FK to departments
ALTER TABLE public.departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Leave Types
CREATE TABLE public.leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    default_days DECIMAL(5, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    requires_document BOOLEAN DEFAULT false,
    max_consecutive_days INTEGER,
    min_notice_days INTEGER DEFAULT 0,
    accrual_rate DECIMAL(5, 2),
    carry_over_limit DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, code)
);

CREATE INDEX idx_leave_types_company ON public.leave_types(company_id);

-- Leave Requests
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_half_day BOOLEAN DEFAULT false,
    end_half_day BOOLEAN DEFAULT false,
    total_days DECIMAL(5, 2) NOT NULL,
    reason TEXT,
    status leave_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.employees(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    document_urls TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_leave_requests_company ON public.leave_requests(company_id);
CREATE INDEX idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

-- Time Entries
CREATE TABLE public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    break_minutes INTEGER DEFAULT 0,
    total_hours DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    location JSONB DEFAULT '{}',
    notes TEXT,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.employees(id),
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_entries_company ON public.time_entries(company_id);
CREATE INDEX idx_time_entries_employee ON public.time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON public.time_entries(date);

-- Document Types
CREATE TABLE public.document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    has_expiry BOOLEAN DEFAULT false,
    reminder_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, code)
);

CREATE INDEX idx_document_types_company ON public.document_types(company_id);

-- Employee Documents
CREATE TABLE public.employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES public.document_types(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.employees(id),
    verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employee_documents_company ON public.employee_documents(company_id);
CREATE INDEX idx_employee_documents_employee ON public.employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON public.employee_documents(document_type_id);
CREATE INDEX idx_employee_documents_expiry ON public.employee_documents(expiry_date);

-- Jobs
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    employment_type employment_type NOT NULL DEFAULT 'full_time',
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    salary_currency TEXT DEFAULT 'USD',
    show_salary BOOLEAN DEFAULT false,
    status job_status NOT NULL DEFAULT 'draft',
    hiring_manager_id UUID REFERENCES public.employees(id),
    openings INTEGER DEFAULT 1,
    published_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, slug)
);

CREATE INDEX idx_jobs_company ON public.jobs(company_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_department ON public.jobs(department_id);

-- Candidates
CREATE TABLE public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    source TEXT,
    referral_employee_id UUID REFERENCES public.employees(id),
    status candidate_status NOT NULL DEFAULT 'applied',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes JSONB DEFAULT '[]',
    interview_notes JSONB DEFAULT '[]',
    rejected_reason TEXT,
    hired_employee_id UUID REFERENCES public.employees(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_company ON public.candidates(company_id);
CREATE INDEX idx_candidates_job ON public.candidates(job_id);
CREATE INDEX idx_candidates_status ON public.candidates(status);
CREATE INDEX idx_candidates_email ON public.candidates(email);

-- Performance Reviews
CREATE TABLE public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_type TEXT DEFAULT 'annual',
    status review_status NOT NULL DEFAULT 'draft',
    goals JSONB DEFAULT '[]',
    competencies JSONB DEFAULT '[]',
    self_assessment TEXT,
    manager_assessment TEXT,
    overall_rating DECIMAL(3, 2) CHECK (overall_rating >= 1 AND overall_rating <= 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    development_plan TEXT,
    employee_comments TEXT,
    acknowledged_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    next_review_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_review_period CHECK (review_period_end >= review_period_start)
);

CREATE INDEX idx_performance_reviews_company ON public.performance_reviews(company_id);
CREATE INDEX idx_performance_reviews_employee ON public.performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_reviewer ON public.performance_reviews(reviewer_id);
CREATE INDEX idx_performance_reviews_status ON public.performance_reviews(status);

-- Payroll Runs
CREATE TABLE public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    status payroll_status NOT NULL DEFAULT 'draft',
    total_gross DECIMAL(14, 2) DEFAULT 0,
    total_deductions DECIMAL(14, 2) DEFAULT 0,
    total_net DECIMAL(14, 2) DEFAULT 0,
    total_employer_cost DECIMAL(14, 2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    processed_by UUID REFERENCES public.employees(id),
    processed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.employees(id),
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_payroll_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_payroll_runs_company ON public.payroll_runs(company_id);
CREATE INDEX idx_payroll_runs_status ON public.payroll_runs(status);
CREATE INDEX idx_payroll_runs_period ON public.payroll_runs(period_start, period_end);

-- Payroll Entries
CREATE TABLE public.payroll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    overtime_pay DECIMAL(12, 2) DEFAULT 0,
    bonuses DECIMAL(12, 2) DEFAULT 0,
    commissions DECIMAL(12, 2) DEFAULT 0,
    allowances JSONB DEFAULT '{}',
    gross_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_deductions DECIMAL(12, 2) DEFAULT 0,
    benefits_deductions DECIMAL(12, 2) DEFAULT 0,
    other_deductions JSONB DEFAULT '{}',
    total_deductions DECIMAL(12, 2) DEFAULT 0,
    net_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
    employer_contributions JSONB DEFAULT '{}',
    total_employer_cost DECIMAL(12, 2) DEFAULT 0,
    hours_worked DECIMAL(6, 2),
    overtime_hours DECIMAL(6, 2),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(payroll_run_id, employee_id)
);

CREATE INDEX idx_payroll_entries_company ON public.payroll_entries(company_id);
CREATE INDEX idx_payroll_entries_payroll_run ON public.payroll_entries(payroll_run_id);
CREATE INDEX idx_payroll_entries_employee ON public.payroll_entries(employee_id);

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- Security Events
CREATE TABLE public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type security_event_type NOT NULL,
    severity TEXT DEFAULT 'info',
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_company ON public.security_events(company_id);
CREATE INDEX idx_security_events_user ON public.security_events(user_id);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_created ON public.security_events(created_at);

-- Support Access
CREATE TABLE public.support_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    support_user_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    access_level TEXT DEFAULT 'read_only',
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    access_log JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_access_company ON public.support_access(company_id);
CREATE INDEX idx_support_access_expires ON public.support_access(expires_at);

-- Platform Settings
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform Admins
CREATE TABLE public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_users
        WHERE user_id = _user_id
          AND company_id = _company_id
          AND role = _role
          AND is_active = true
    )
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_users
        WHERE user_id = _user_id
          AND company_id = _company_id
          AND is_active = true
    )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_users
        WHERE user_id = _user_id
          AND company_id = _company_id
          AND role IN ('super_admin', 'company_admin')
          AND is_active = true
    )
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_above(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_users
        WHERE user_id = _user_id
          AND company_id = _company_id
          AND role IN ('super_admin', 'company_admin', 'hr_manager')
          AND is_active = true
    )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_subscriptions_updated_at BEFORE UPDATE ON public.company_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_users_updated_at BEFORE UPDATE ON public.company_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON public.leave_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_document_types_updated_at BEFORE UPDATE ON public.document_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payroll_entries_updated_at BEFORE UPDATE ON public.payroll_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_access_updated_at BEFORE UPDATE ON public.support_access FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_admins_updated_at BEFORE UPDATE ON public.platform_admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Plans: Public read
CREATE POLICY "plans_select_public" ON public.plans FOR SELECT USING (is_active = true);

-- Profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Companies
CREATE POLICY "companies_select_member" ON public.companies FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), id));
CREATE POLICY "companies_insert_authenticated" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "companies_update_admin" ON public.companies FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), id));

-- Company Subscriptions
CREATE POLICY "subscriptions_select_admin" ON public.company_subscriptions FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "subscriptions_insert_admin" ON public.company_subscriptions FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "subscriptions_update_admin" ON public.company_subscriptions FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Company Users
CREATE POLICY "company_users_select_member" ON public.company_users FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "company_users_insert_admin" ON public.company_users FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "company_users_update_admin" ON public.company_users FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "company_users_delete_admin" ON public.company_users FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "company_users_insert_first" ON public.company_users FOR INSERT TO authenticated 
    WITH CHECK (user_id = auth.uid() AND role IN ('super_admin', 'company_admin') AND NOT EXISTS (SELECT 1 FROM public.company_users cu2 WHERE cu2.company_id = company_users.company_id));

-- Departments
CREATE POLICY "departments_select_member" ON public.departments FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "departments_insert_hr" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "departments_update_hr" ON public.departments FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "departments_delete_admin" ON public.departments FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Employees
CREATE POLICY "employees_select_member" ON public.employees FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "employees_insert_hr" ON public.employees FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "employees_update_hr" ON public.employees FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "employees_delete_admin" ON public.employees FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Leave Types
CREATE POLICY "leave_types_select_member" ON public.leave_types FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "leave_types_insert_hr" ON public.leave_types FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "leave_types_update_hr" ON public.leave_types FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "leave_types_delete_admin" ON public.leave_types FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Leave Requests
CREATE POLICY "leave_requests_select_member" ON public.leave_requests FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "leave_requests_insert_hr" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "leave_requests_update_hr" ON public.leave_requests FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "leave_requests_delete_hr" ON public.leave_requests FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

-- Time Entries
CREATE POLICY "time_entries_select_member" ON public.time_entries FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "time_entries_insert_hr" ON public.time_entries FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "time_entries_update_hr" ON public.time_entries FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "time_entries_delete_hr" ON public.time_entries FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

-- Document Types
CREATE POLICY "document_types_select_member" ON public.document_types FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "document_types_insert_hr" ON public.document_types FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "document_types_update_hr" ON public.document_types FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "document_types_delete_admin" ON public.document_types FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Employee Documents
CREATE POLICY "employee_documents_select_member" ON public.employee_documents FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "employee_documents_insert_hr" ON public.employee_documents FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "employee_documents_update_hr" ON public.employee_documents FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "employee_documents_delete_hr" ON public.employee_documents FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

-- Jobs
CREATE POLICY "jobs_select_public" ON public.jobs FOR SELECT USING (status = 'open' OR (auth.uid() IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
CREATE POLICY "jobs_insert_hr" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "jobs_update_hr" ON public.jobs FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "jobs_delete_hr" ON public.jobs FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

-- Candidates
CREATE POLICY "candidates_select_hr" ON public.candidates FOR SELECT TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "candidates_insert_public" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "candidates_update_hr" ON public.candidates FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "candidates_delete_hr" ON public.candidates FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

-- Performance Reviews
CREATE POLICY "performance_reviews_select_member" ON public.performance_reviews FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "performance_reviews_insert_hr" ON public.performance_reviews FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "performance_reviews_update_hr" ON public.performance_reviews FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "performance_reviews_delete_admin" ON public.performance_reviews FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Payroll Runs
CREATE POLICY "payroll_runs_select_admin" ON public.payroll_runs FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "payroll_runs_insert_admin" ON public.payroll_runs FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "payroll_runs_update_admin" ON public.payroll_runs FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "payroll_runs_delete_admin" ON public.payroll_runs FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Payroll Entries
CREATE POLICY "payroll_entries_select_admin" ON public.payroll_entries FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "payroll_entries_insert_admin" ON public.payroll_entries FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "payroll_entries_update_admin" ON public.payroll_entries FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "payroll_entries_delete_admin" ON public.payroll_entries FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Audit Logs
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Security Events
CREATE POLICY "security_events_select_admin" ON public.security_events FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "security_events_insert_authenticated" ON public.security_events FOR INSERT TO authenticated WITH CHECK (true);

-- Support Access
CREATE POLICY "support_access_select_admin" ON public.support_access FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "support_access_insert_admin" ON public.support_access FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "support_access_update_admin" ON public.support_access FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Platform Settings (read only for health checks)
CREATE POLICY "platform_settings_select_public" ON public.platform_settings FOR SELECT USING (true);

-- Platform Admins
CREATE POLICY "platform_admins_select_own" ON public.platform_admins FOR SELECT TO authenticated USING (user_id = auth.uid());
