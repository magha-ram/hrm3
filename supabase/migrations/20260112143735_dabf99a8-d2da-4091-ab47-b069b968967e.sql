-- Add missing columns to company_creation_links
ALTER TABLE public.company_creation_links ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 14;

-- Add missing columns to candidate_auth_config
ALTER TABLE public.candidate_auth_config ADD COLUMN IF NOT EXISTS social_login_enabled boolean DEFAULT false;
ALTER TABLE public.candidate_auth_config ADD COLUMN IF NOT EXISTS google_enabled boolean DEFAULT false;
ALTER TABLE public.candidate_auth_config ADD COLUMN IF NOT EXISTS linkedin_enabled boolean DEFAULT false;
ALTER TABLE public.candidate_auth_config ADD COLUMN IF NOT EXISTS auth_methods jsonb DEFAULT '["magic_link"]';

-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    key text NOT NULL,
    value jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(company_id, key)
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view settings" ON public.company_settings
    FOR SELECT USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Company admins can manage settings" ON public.company_settings
    FOR ALL USING (is_company_admin(auth.uid(), company_id));

-- Create generate_employee_number RPC function
CREATE OR REPLACE FUNCTION public.generate_employee_number(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prefix text;
    v_next_number integer;
    v_employee_number text;
BEGIN
    SELECT COALESCE(value->>'prefix', 'EMP') INTO v_prefix
    FROM public.company_settings
    WHERE company_id = p_company_id AND key = 'employee_number_settings';

    SELECT COALESCE(MAX(NULLIF(regexp_replace(employee_number, '[^0-9]', '', 'g'), '')::integer), 0) + 1
    INTO v_next_number
    FROM public.employees
    WHERE company_id = p_company_id;

    v_employee_number := v_prefix || LPAD(v_next_number::text, 4, '0');
    RETURN v_employee_number;
END;
$$;

-- Create initialize_company_settings RPC function
CREATE OR REPLACE FUNCTION public.initialize_company_settings(p_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.company_settings (company_id, key, value)
    VALUES
        (p_company_id, 'general', '{}'),
        (p_company_id, 'employee_number_settings', '{"prefix": "EMP", "start_number": 1}'),
        (p_company_id, 'leave_settings', '{}'),
        (p_company_id, 'payroll_settings', '{}')
    ON CONFLICT (company_id, key) DO NOTHING;
    RETURN true;
END;
$$;

-- Create trigger for company_settings updated_at
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to company_email_templates for EmailTemplate interface
ALTER TABLE public.company_email_templates ADD COLUMN IF NOT EXISTS sender_email text;
ALTER TABLE public.company_email_templates ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.company_email_templates ADD COLUMN IF NOT EXISTS subject_template text;
ALTER TABLE public.company_email_templates ADD COLUMN IF NOT EXISTS html_template text;
ALTER TABLE public.company_email_templates ADD COLUMN IF NOT EXISTS plain_text_template text;