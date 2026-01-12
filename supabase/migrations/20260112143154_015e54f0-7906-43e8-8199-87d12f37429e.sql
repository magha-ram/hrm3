
-- Add all remaining missing tables and columns

-- Add missing columns to company_creation_links
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS name TEXT;

-- Add missing columns to employee_shift_assignments
ALTER TABLE public.employee_shift_assignments ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;

-- Add missing column to attendance_summaries
ALTER TABLE public.attendance_summaries ADD COLUMN IF NOT EXISTS total_working_days INTEGER DEFAULT 0;

-- Add force_password_change to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- Trusted devices table
CREATE TABLE IF NOT EXISTS public.trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    browser TEXT,
    os TEXT,
    ip_address INET,
    location JSONB DEFAULT '{}',
    is_current BOOLEAN DEFAULT false,
    last_used_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trusted_devices_select_own" ON public.trusted_devices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "trusted_devices_insert_own" ON public.trusted_devices FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "trusted_devices_update_own" ON public.trusted_devices FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "trusted_devices_delete_own" ON public.trusted_devices FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Company domains table
CREATE TABLE IF NOT EXISTS public.company_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    subdomain TEXT UNIQUE,
    custom_domain TEXT UNIQUE,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    dns_verified_at TIMESTAMPTZ,
    ssl_verified_at TIMESTAMPTZ,
    hosting_provider TEXT DEFAULT 'vercel',
    vercel_status TEXT,
    vercel_verified BOOLEAN DEFAULT false,
    vercel_error TEXT,
    dns_records JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_domains_select" ON public.company_domains FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "company_domains_insert" ON public.company_domains FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "company_domains_update" ON public.company_domains FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "company_domains_delete" ON public.company_domains FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

CREATE INDEX IF NOT EXISTS idx_company_domains_company ON public.company_domains(company_id);

-- Subdomain change requests table
CREATE TABLE IF NOT EXISTS public.subdomain_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    current_subdomain TEXT,
    requested_subdomain TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subdomain_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subdomain_change_requests_select" ON public.subdomain_change_requests FOR SELECT TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "subdomain_change_requests_insert" ON public.subdomain_change_requests FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    category TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);

-- User notification settings table
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    leave_notifications BOOLEAN DEFAULT true,
    payroll_notifications BOOLEAN DEFAULT true,
    document_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_notification_settings_select_own" ON public.user_notification_settings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "user_notification_settings_insert_own" ON public.user_notification_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_notification_settings_update_own" ON public.user_notification_settings FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_select" ON public.email_templates FOR SELECT TO authenticated USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "email_templates_insert" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "email_templates_update" ON public.email_templates FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "email_templates_delete" ON public.email_templates FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    from_email TEXT,
    subject TEXT NOT NULL,
    body TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT,
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_select" ON public.email_logs FOR SELECT TO authenticated USING (company_id IS NULL OR public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "email_logs_insert" ON public.email_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_email_logs_company ON public.email_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- Create enum for interview type if not exists
DO $$ BEGIN
    CREATE TYPE public.interview_type AS ENUM ('phone', 'video', 'in_person', 'technical', 'panel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Interviews table
CREATE TABLE IF NOT EXISTS public.interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    interview_type interview_type NOT NULL DEFAULT 'video',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,
    meeting_url TEXT,
    interviewer_ids UUID[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    feedback JSONB DEFAULT '{}',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    recommendation TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interviews_select" ON public.interviews FOR SELECT TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "interviews_insert" ON public.interviews FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "interviews_update" ON public.interviews FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "interviews_delete" ON public.interviews FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

CREATE INDEX IF NOT EXISTS idx_interviews_company ON public.interviews(company_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON public.interviews(candidate_id);

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    target_value DECIMAL(12, 2),
    current_value DECIMAL(12, 2) DEFAULT 0,
    unit TEXT,
    start_date DATE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'not_started',
    priority TEXT DEFAULT 'medium',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    parent_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_select" ON public.goals FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "goals_insert" ON public.goals FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "goals_update" ON public.goals FOR UPDATE TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "goals_delete" ON public.goals FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

CREATE INDEX IF NOT EXISTS idx_goals_company ON public.goals(company_id);
CREATE INDEX IF NOT EXISTS idx_goals_employee ON public.goals(employee_id);

-- Triggers for new tables
CREATE TRIGGER update_trusted_devices_updated_at BEFORE UPDATE ON public.trusted_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_domains_updated_at BEFORE UPDATE ON public.company_domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subdomain_change_requests_updated_at BEFORE UPDATE ON public.subdomain_change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_notification_settings_updated_at BEFORE UPDATE ON public.user_notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
