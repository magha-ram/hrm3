-- Create is_active_company_admin function for edge functions to verify admin access
CREATE OR REPLACE FUNCTION public.is_active_company_admin(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.user_id = _user_id
    AND cu.company_id = _company_id
    AND cu.is_active = true
    AND cu.role = 'company_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;