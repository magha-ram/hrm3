-- Add missing columns to company_creation_links
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS used_at timestamptz;
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS used_by_company_id uuid REFERENCES public.companies(id);

-- Add missing columns to document_expiry_notifications
ALTER TABLE public.document_expiry_notifications ADD COLUMN IF NOT EXISTS days_until_expiry integer;
ALTER TABLE public.document_expiry_notifications ADD COLUMN IF NOT EXISTS sent_to text;

-- Add missing columns to email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS template_type text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS recipient_email text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS recipient_name text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS cc_emails text[];
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS bcc_emails text[];
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS reply_to text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS html_body text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS text_body text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS bounce_type text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS complaint_type text;

-- Create employee_education table
CREATE TABLE IF NOT EXISTS public.employee_education (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    institution text NOT NULL,
    degree text,
    field_of_study text,
    start_date date,
    end_date date,
    is_current boolean DEFAULT false,
    grade text,
    description text,
    certificate_url text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employee_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own education" ON public.employee_education
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR can manage education" ON public.employee_education
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create employee_experience table
CREATE TABLE IF NOT EXISTS public.employee_experience (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    company_name text NOT NULL,
    job_title text NOT NULL,
    start_date date,
    end_date date,
    is_current boolean DEFAULT false,
    location text,
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employee_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own experience" ON public.employee_experience
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR can manage experience" ON public.employee_experience
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create employee_emergency_contacts table
CREATE TABLE IF NOT EXISTS public.employee_emergency_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    relationship text,
    phone text,
    email text,
    address text,
    is_primary boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.employee_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own contacts" ON public.employee_emergency_contacts
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR can manage contacts" ON public.employee_emergency_contacts
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create triggers
CREATE TRIGGER update_employee_education_updated_at
    BEFORE UPDATE ON public.employee_education
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_experience_updated_at
    BEFORE UPDATE ON public.employee_experience
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_emergency_contacts_updated_at
    BEFORE UPDATE ON public.employee_emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();