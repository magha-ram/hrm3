
-- Add missing tables and columns for full schema compatibility

-- Multi-company requests table
CREATE TABLE public.multi_company_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_count INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.multi_company_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "multi_company_requests_select" ON public.multi_company_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "multi_company_requests_insert" ON public.multi_company_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "multi_company_requests_update" ON public.multi_company_requests FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Trial extension requests table
CREATE TABLE public.trial_extension_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_days INTEGER NOT NULL DEFAULT 7,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_extension_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trial_extension_requests_select" ON public.trial_extension_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_company_admin(auth.uid(), company_id));
CREATE POLICY "trial_extension_requests_insert" ON public.trial_extension_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "trial_extension_requests_update" ON public.trial_extension_requests FOR UPDATE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

-- Attendance summaries table
CREATE TABLE public.attendance_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    late_days INTEGER DEFAULT 0,
    half_days INTEGER DEFAULT 0,
    overtime_hours DECIMAL(6, 2) DEFAULT 0,
    total_hours DECIMAL(8, 2) DEFAULT 0,
    unpaid_leave_days DECIMAL(5, 2) DEFAULT 0,
    paid_leave_days DECIMAL(5, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(company_id, employee_id, period_start, period_end)
);

ALTER TABLE public.attendance_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_summaries_select" ON public.attendance_summaries FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "attendance_summaries_insert" ON public.attendance_summaries FOR INSERT TO authenticated WITH CHECK (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "attendance_summaries_update" ON public.attendance_summaries FOR UPDATE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));
CREATE POLICY "attendance_summaries_delete" ON public.attendance_summaries FOR DELETE TO authenticated USING (public.is_company_admin(auth.uid(), company_id));

CREATE INDEX idx_attendance_summaries_company ON public.attendance_summaries(company_id);
CREATE INDEX idx_attendance_summaries_employee ON public.attendance_summaries(employee_id);
CREATE INDEX idx_attendance_summaries_period ON public.attendance_summaries(period_start, period_end);

-- Leave request days table
CREATE TABLE public.leave_request_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    leave_request_id UUID NOT NULL REFERENCES public.leave_requests(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day_type TEXT NOT NULL DEFAULT 'full',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(leave_request_id, date)
);

ALTER TABLE public.leave_request_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_request_days_select" ON public.leave_request_days FOR SELECT TO authenticated USING (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "leave_request_days_insert" ON public.leave_request_days FOR INSERT TO authenticated WITH CHECK (public.is_company_member(auth.uid(), company_id));
CREATE POLICY "leave_request_days_delete" ON public.leave_request_days FOR DELETE TO authenticated USING (public.is_hr_or_above(auth.uid(), company_id));

CREATE INDEX idx_leave_request_days_request ON public.leave_request_days(leave_request_id);
CREATE INDEX idx_leave_request_days_date ON public.leave_request_days(date);

-- Add missing columns to time_entries
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;

-- Add missing columns to document_types
ALTER TABLE public.document_types ADD COLUMN IF NOT EXISTS allowed_for_employee_upload BOOLEAN DEFAULT false;
ALTER TABLE public.document_types ADD COLUMN IF NOT EXISTS allowed_mime_types TEXT[];
ALTER TABLE public.document_types ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10;

-- Add missing columns to employee_documents
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true;
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE public.employee_documents ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES public.employee_documents(id) ON DELETE SET NULL;

-- Create triggers for new tables
CREATE TRIGGER update_multi_company_requests_updated_at BEFORE UPDATE ON public.multi_company_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trial_extension_requests_updated_at BEFORE UPDATE ON public.trial_extension_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_summaries_updated_at BEFORE UPDATE ON public.attendance_summaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
