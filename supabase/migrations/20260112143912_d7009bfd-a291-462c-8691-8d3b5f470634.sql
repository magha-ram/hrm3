-- Add missing column to company_creation_links
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS uses integer DEFAULT 0;

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    category text NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'USD',
    description text,
    receipt_url text,
    status text DEFAULT 'pending',
    submitted_at timestamptz DEFAULT now(),
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own expenses" ON public.expenses
    FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "HR can manage expenses" ON public.expenses
    FOR ALL USING (is_hr_or_above(auth.uid(), company_id));

-- Create document_expiry_notifications table
CREATE TABLE IF NOT EXISTS public.document_expiry_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    notification_type text NOT NULL,
    sent_at timestamptz,
    acknowledged_at timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.document_expiry_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view notifications" ON public.document_expiry_notifications
    FOR SELECT USING (is_company_member(auth.uid(), company_id));

-- Create RPC functions
CREATE OR REPLACE FUNCTION public.get_expiring_documents(p_company_id uuid, p_days_ahead integer DEFAULT 30)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN '[]'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_expired_documents(p_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN '[]'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_document_limits(p_company_id uuid, p_employee_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN jsonb_build_object('max_storage_mb', 1024, 'max_per_employee', 50, 'current_storage_bytes', 0, 'current_count', 0, 'can_upload', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_document(p_document_id uuid, p_verified_by uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.employee_documents SET verified_at = now(), verified_by = p_verified_by WHERE id = p_document_id;
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_branding_for_domain(p_domain text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_company record;
BEGIN
    SELECT c.* INTO v_company FROM public.companies c
    JOIN public.company_domains cd ON cd.company_id = c.id
    WHERE cd.custom_domain = p_domain AND cd.is_verified = true LIMIT 1;
    IF v_company IS NULL THEN RETURN NULL; END IF;
    RETURN jsonb_build_object('company_id', v_company.id, 'name', v_company.name, 'logo_url', v_company.logo_url);
END;
$$;