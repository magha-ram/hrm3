-- ===========================================
-- COMPREHENSIVE FIX FOR PLATFORM OPERATIONS
-- ===========================================

-- 1. Create security definer functions for platform admin checks
CREATE OR REPLACE FUNCTION public.is_active_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_platform_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND is_active = true AND role = 'owner'
  )
$$;

-- 2. Update is_active_company_admin to include super_admin role
CREATE OR REPLACE FUNCTION public.is_active_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.user_id = _user_id
    AND cu.company_id = _company_id
    AND cu.is_active = true
    AND cu.role IN ('company_admin', 'super_admin')
  );
END;
$$;

-- 3. Drop existing platform_admins policies that cause recursion
DROP POLICY IF EXISTS "platform_admins_select_all_for_platform_admins" ON public.platform_admins;
DROP POLICY IF EXISTS "platform_admins_manage_for_owners" ON public.platform_admins;
DROP POLICY IF EXISTS "platform_admins_select_own" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform owners can manage platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "platform_admins_select" ON public.platform_admins;
DROP POLICY IF EXISTS "platform_admins_manage" ON public.platform_admins;

-- 4. Create new non-recursive platform_admins policies
CREATE POLICY "platform_admins_select_policy" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_active_platform_admin(auth.uid()));

CREATE POLICY "platform_admins_insert_policy" ON public.platform_admins
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_owner(auth.uid()));

CREATE POLICY "platform_admins_update_policy" ON public.platform_admins
  FOR UPDATE TO authenticated
  USING (public.is_platform_owner(auth.uid()));

CREATE POLICY "platform_admins_delete_policy" ON public.platform_admins
  FOR DELETE TO authenticated
  USING (public.is_platform_owner(auth.uid()));

-- 5. Drop and recreate company_subscriptions policies for platform admins
DROP POLICY IF EXISTS "subscriptions_platform_admin_select" ON public.company_subscriptions;
DROP POLICY IF EXISTS "subscriptions_platform_admin_insert" ON public.company_subscriptions;
DROP POLICY IF EXISTS "subscriptions_platform_admin_update" ON public.company_subscriptions;
DROP POLICY IF EXISTS "subscriptions_platform_admin_delete" ON public.company_subscriptions;

CREATE POLICY "subscriptions_platform_admin_select" ON public.company_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));

CREATE POLICY "subscriptions_platform_admin_insert" ON public.company_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_active_platform_admin(auth.uid()));

CREATE POLICY "subscriptions_platform_admin_update" ON public.company_subscriptions
  FOR UPDATE TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));

CREATE POLICY "subscriptions_platform_admin_delete" ON public.company_subscriptions
  FOR DELETE TO authenticated
  USING (public.is_platform_owner(auth.uid()));

-- 6. Fix trial_extension_requests - rename column and add policies
ALTER TABLE public.trial_extension_requests 
  RENAME COLUMN user_id TO requested_by;

-- Drop existing policies if any
DROP POLICY IF EXISTS "trial_extension_requests_platform_select" ON public.trial_extension_requests;
DROP POLICY IF EXISTS "trial_extension_requests_platform_update" ON public.trial_extension_requests;

-- Create platform admin policies for trial_extension_requests
CREATE POLICY "trial_extension_requests_platform_select" ON public.trial_extension_requests
  FOR SELECT TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));

CREATE POLICY "trial_extension_requests_platform_update" ON public.trial_extension_requests
  FOR UPDATE TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));

-- 7. Add platform admin access to companies table
DROP POLICY IF EXISTS "companies_platform_admin_all" ON public.companies;
DROP POLICY IF EXISTS "Platform admins can view all companies" ON public.companies;

CREATE POLICY "companies_platform_admin_all" ON public.companies
  FOR ALL TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));

-- 8. Add platform admin access to company_users table
DROP POLICY IF EXISTS "company_users_platform_admin_select" ON public.company_users;

CREATE POLICY "company_users_platform_admin_select" ON public.company_users
  FOR SELECT TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));

-- 9. Add platform admin access to profiles table
DROP POLICY IF EXISTS "profiles_platform_admin_select" ON public.profiles;
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;

CREATE POLICY "profiles_platform_admin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));

-- 10. Add platform admin access to plans table
DROP POLICY IF EXISTS "plans_platform_admin_all" ON public.plans;
DROP POLICY IF EXISTS "Platform admins can manage plans" ON public.plans;

CREATE POLICY "plans_platform_admin_all" ON public.plans
  FOR ALL TO authenticated
  USING (public.is_active_platform_admin(auth.uid()));