-- Ensure platform email settings exist and default to Brevo
INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'email',
  jsonb_build_object(
    'provider', 'brevo',
    'from_name', '',
    'from_address', ''
  ),
  'Platform email sending configuration'
)
ON CONFLICT (key)
DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Create a secure cascade delete helper for companies (used by backend function)
-- NOTE: This deletes rows from ALL public tables that have a UUID company_id column.
CREATE OR REPLACE FUNCTION public.delete_company_cascade(_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  r record;
BEGIN
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = _company_id) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  -- Delete dependent rows from every table that has a UUID company_id column
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'company_id'
      AND c.udt_name = 'uuid'
      AND c.table_name <> 'companies'
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE company_id = $1', r.table_name)
      USING _company_id;
  END LOOP;

  -- Finally delete the company
  DELETE FROM public.companies WHERE id = _company_id;
END;
$$;