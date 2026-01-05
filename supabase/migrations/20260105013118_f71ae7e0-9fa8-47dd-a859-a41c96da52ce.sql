-- Drop the partially created tables if they exist
DROP TABLE IF EXISTS public.help_guide_steps CASCADE;
DROP TABLE IF EXISTS public.help_guides CASCADE;

-- Create help_guides table
CREATE TABLE public.help_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  module TEXT,
  category TEXT,
  roles TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_platform_guide BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create help_guide_steps table
CREATE TABLE public.help_guide_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES public.help_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  screenshot_url TEXT,
  annotations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_guide_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_guides
CREATE POLICY "Users can view active guides for their company or platform guides"
ON public.help_guides FOR SELECT
USING (
  is_active = true AND (
    is_platform_guide = true OR
    company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
  )
);

CREATE POLICY "HR and Admin can manage company guides"
ON public.help_guides FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid() 
    AND role::text IN ('admin', 'hr_manager')
  )
);

-- RLS Policies for help_guide_steps
CREATE POLICY "Users can view steps for visible guides"
ON public.help_guide_steps FOR SELECT
USING (
  guide_id IN (
    SELECT id FROM public.help_guides 
    WHERE is_active = true AND (
      is_platform_guide = true OR
      company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
    )
  )
);

CREATE POLICY "HR and Admin can manage guide steps"
ON public.help_guide_steps FOR ALL
USING (
  guide_id IN (
    SELECT hg.id FROM public.help_guides hg
    WHERE hg.company_id IN (
      SELECT company_id FROM public.company_users 
      WHERE user_id = auth.uid() 
      AND role::text IN ('admin', 'hr_manager')
    )
  )
);

-- Create indexes
CREATE INDEX idx_help_guides_company ON public.help_guides(company_id);
CREATE INDEX idx_help_guides_module ON public.help_guides(module);
CREATE INDEX idx_help_guide_steps_guide ON public.help_guide_steps(guide_id);

-- Create storage bucket for help guide screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('help-guides', 'help-guides', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view help guide screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'help-guides');

CREATE POLICY "HR and Admin can upload help guide screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'help-guides' AND
  auth.uid() IN (
    SELECT user_id FROM public.company_users 
    WHERE role::text IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "HR and Admin can update help guide screenshots"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'help-guides' AND
  auth.uid() IN (
    SELECT user_id FROM public.company_users 
    WHERE role::text IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "HR and Admin can delete help guide screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'help-guides' AND
  auth.uid() IN (
    SELECT user_id FROM public.company_users 
    WHERE role::text IN ('admin', 'hr_manager')
  )
);