-- Create company_email_settings table for storing custom email configurations
CREATE TABLE IF NOT EXISTS public.company_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  use_platform_default BOOLEAN DEFAULT true,
  provider TEXT,
  from_email TEXT,
  from_name TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_secure BOOLEAN DEFAULT true,
  api_key TEXT,
  aws_region TEXT,
  aws_access_key_id TEXT,
  aws_secret_access_key TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  last_test_at TIMESTAMPTZ,
  last_test_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.company_email_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - company admins can manage their own settings
CREATE POLICY "company_email_settings_select" ON public.company_email_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_email_settings.company_id
      AND cu.user_id = auth.uid()
      AND cu.is_active = true
      AND cu.role IN ('company_admin', 'hr_manager')
    )
  );

CREATE POLICY "company_email_settings_insert" ON public.company_email_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_email_settings.company_id
      AND cu.user_id = auth.uid()
      AND cu.is_active = true
      AND cu.role = 'company_admin'
    )
  );

CREATE POLICY "company_email_settings_update" ON public.company_email_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_email_settings.company_id
      AND cu.user_id = auth.uid()
      AND cu.is_active = true
      AND cu.role = 'company_admin'
    )
  );

CREATE POLICY "company_email_settings_delete" ON public.company_email_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.company_id = company_email_settings.company_id
      AND cu.user_id = auth.uid()
      AND cu.is_active = true
      AND cu.role = 'company_admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_company_email_settings_updated_at
  BEFORE UPDATE ON public.company_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();