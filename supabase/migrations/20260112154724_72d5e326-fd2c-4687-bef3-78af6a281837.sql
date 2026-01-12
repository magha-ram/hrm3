-- Create is_platform_admin function
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.platform_admins 
        WHERE user_id = _user_id
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO anon, authenticated;