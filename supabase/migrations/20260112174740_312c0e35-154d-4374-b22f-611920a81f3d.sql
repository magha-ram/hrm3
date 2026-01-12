-- Allow platform admins to view all platform admins
CREATE POLICY "platform_admins_select_all_for_platform_admins" ON public.platform_admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.is_active = true
    )
  );

-- Allow platform admins to view all companies
CREATE POLICY "companies_select_for_platform_admins" ON public.companies
  FOR SELECT USING (
    public.is_platform_admin(auth.uid())
  );

-- Allow platform admins to update companies
CREATE POLICY "companies_update_for_platform_admins" ON public.companies
  FOR UPDATE USING (
    public.is_platform_admin(auth.uid())
  );

-- Allow platform admins to view all profiles (for listing admin details)
CREATE POLICY "profiles_select_for_platform_admins" ON public.profiles
  FOR SELECT USING (
    public.is_platform_admin(auth.uid())
  );

-- Allow platform admins to manage plans
CREATE POLICY "plans_all_for_platform_admins" ON public.plans
  FOR ALL USING (
    public.is_platform_admin(auth.uid())
  );

-- Allow platform admins to manage platform_admins
CREATE POLICY "platform_admins_manage_for_owners" ON public.platform_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
      AND pa.is_active = true
      AND pa.role = 'owner'
    )
  );