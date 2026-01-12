-- Add max_companies column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS max_companies integer DEFAULT 1;