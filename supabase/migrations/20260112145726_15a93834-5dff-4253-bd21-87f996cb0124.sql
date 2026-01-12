-- Add missing tables for help guides
CREATE TABLE IF NOT EXISTS public.help_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  is_platform_guide BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.help_guide_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID REFERENCES public.help_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  screenshot_url TEXT,
  annotations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add missing column to time_entries
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS attendance_status TEXT;

-- Enable RLS
ALTER TABLE public.help_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_guide_steps ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for help guides (public read)
CREATE POLICY "Help guides are viewable by everyone" ON public.help_guides FOR SELECT USING (true);
CREATE POLICY "Help guide steps are viewable by everyone" ON public.help_guide_steps FOR SELECT USING (true);