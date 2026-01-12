-- =====================================================
-- PERMISSION SYSTEM TABLES AND FUNCTIONS
-- =====================================================

-- Create permissions reference table
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  action text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module, action)
);

-- Create role_permissions table (default permissions per role per company)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  is_granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, role, permission_id)
);

-- Create user_permissions table (user-specific overrides)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted boolean NOT NULL, -- true = explicit grant, false = explicit deny
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions table policies (readable by all authenticated users)
CREATE POLICY "permissions_select_authenticated" ON public.permissions
  FOR SELECT TO authenticated USING (true);

-- Role permissions policies
CREATE POLICY "role_permissions_select_member" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "role_permissions_manage_admin" ON public.role_permissions
  FOR ALL TO authenticated
  USING (is_company_admin(auth.uid(), company_id));

-- User permissions policies
CREATE POLICY "user_permissions_select_member" ON public.user_permissions
  FOR SELECT TO authenticated
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "user_permissions_manage_admin" ON public.user_permissions
  FOR ALL TO authenticated
  USING (is_company_admin(auth.uid(), company_id));

-- =====================================================
-- SEED DEFAULT PERMISSIONS
-- =====================================================
INSERT INTO public.permissions (module, action, name, description) VALUES
  -- Dashboard
  ('dashboard', 'read', 'View Dashboard', 'Access to view the dashboard'),
  
  -- Employees
  ('employees', 'read', 'View Employees', 'View employee directory'),
  ('employees', 'create', 'Create Employees', 'Add new employees'),
  ('employees', 'update', 'Update Employees', 'Edit employee details'),
  ('employees', 'delete', 'Delete Employees', 'Remove employees'),
  ('employees', 'export', 'Export Employees', 'Export employee data'),
  
  -- Departments
  ('departments', 'read', 'View Departments', 'View departments'),
  ('departments', 'create', 'Create Departments', 'Add new departments'),
  ('departments', 'update', 'Update Departments', 'Edit departments'),
  ('departments', 'delete', 'Delete Departments', 'Remove departments'),
  
  -- Leave
  ('leave', 'read', 'View Leave', 'View leave requests'),
  ('leave', 'create', 'Request Leave', 'Submit leave requests'),
  ('leave', 'update', 'Update Leave', 'Edit leave requests'),
  ('leave', 'delete', 'Delete Leave', 'Cancel leave requests'),
  ('leave', 'approve', 'Approve Leave', 'Approve or reject leave requests'),
  
  -- Time Tracking
  ('time_tracking', 'read', 'View Time Entries', 'View time entries'),
  ('time_tracking', 'create', 'Create Time Entries', 'Log time entries'),
  ('time_tracking', 'update', 'Update Time Entries', 'Edit time entries'),
  ('time_tracking', 'delete', 'Delete Time Entries', 'Remove time entries'),
  ('time_tracking', 'approve', 'Approve Time', 'Approve time entries'),
  
  -- Documents
  ('documents', 'read', 'View Documents', 'View documents'),
  ('documents', 'create', 'Upload Documents', 'Upload new documents'),
  ('documents', 'update', 'Update Documents', 'Edit documents'),
  ('documents', 'delete', 'Delete Documents', 'Remove documents'),
  ('documents', 'verify', 'Verify Documents', 'Verify document authenticity'),
  
  -- Recruitment
  ('recruitment', 'read', 'View Recruitment', 'View jobs and candidates'),
  ('recruitment', 'create', 'Create Jobs', 'Post new job openings'),
  ('recruitment', 'update', 'Update Recruitment', 'Edit jobs and candidates'),
  ('recruitment', 'delete', 'Delete Recruitment', 'Remove jobs and candidates'),
  
  -- Performance
  ('performance', 'read', 'View Performance', 'View reviews and goals'),
  ('performance', 'create', 'Create Reviews', 'Create performance reviews'),
  ('performance', 'update', 'Update Performance', 'Edit reviews and goals'),
  ('performance', 'delete', 'Delete Performance', 'Remove reviews and goals'),
  
  -- Payroll
  ('payroll', 'read', 'View Payroll', 'View payroll information'),
  ('payroll', 'create', 'Create Payroll', 'Create payroll runs'),
  ('payroll', 'update', 'Update Payroll', 'Edit payroll details'),
  ('payroll', 'delete', 'Delete Payroll', 'Remove payroll runs'),
  ('payroll', 'process', 'Process Payroll', 'Process and finalize payroll'),
  ('payroll', 'lock', 'Lock Payroll', 'Lock payroll periods'),
  
  -- Expenses
  ('expenses', 'read', 'View Expenses', 'View expense claims'),
  ('expenses', 'create', 'Submit Expenses', 'Submit expense claims'),
  ('expenses', 'update', 'Update Expenses', 'Edit expense claims'),
  ('expenses', 'delete', 'Delete Expenses', 'Remove expense claims'),
  ('expenses', 'approve', 'Approve Expenses', 'Approve expense claims'),
  
  -- Compliance
  ('compliance', 'read', 'View Compliance', 'View compliance data'),
  ('compliance', 'manage', 'Manage Compliance', 'Manage compliance settings'),
  
  -- Audit
  ('audit', 'read', 'View Audit Logs', 'View audit trail'),
  ('audit', 'export', 'Export Audit Logs', 'Export audit data'),
  
  -- Settings
  ('settings', 'read', 'View Settings', 'View company settings'),
  ('settings', 'manage', 'Manage Settings', 'Change company settings'),
  
  -- Users
  ('users', 'read', 'View Users', 'View user accounts'),
  ('users', 'create', 'Invite Users', 'Invite new users'),
  ('users', 'update', 'Update Users', 'Edit user roles'),
  ('users', 'delete', 'Remove Users', 'Remove user access'),
  
  -- Shifts
  ('shifts', 'read', 'View Shifts', 'View shift schedules'),
  ('shifts', 'create', 'Create Shifts', 'Create shift assignments'),
  ('shifts', 'update', 'Update Shifts', 'Edit shift schedules'),
  ('shifts', 'delete', 'Delete Shifts', 'Remove shifts'),
  
  -- Attendance
  ('attendance', 'read', 'View Attendance', 'View attendance records'),
  ('attendance', 'create', 'Record Attendance', 'Log attendance'),
  ('attendance', 'update', 'Update Attendance', 'Edit attendance records'),
  ('attendance', 'lock', 'Lock Attendance', 'Lock attendance periods'),
  
  -- My Team
  ('my_team', 'read', 'View My Team', 'View direct reports'),
  ('my_team', 'manage', 'Manage My Team', 'Manage team settings')
ON CONFLICT (module, action) DO NOTHING;

-- =====================================================
-- RPC FUNCTIONS FOR PERMISSION MANAGEMENT
-- =====================================================

-- Get user permissions (with role fallback and overrides)
CREATE OR REPLACE FUNCTION public.get_user_permissions(
  p_user_id uuid,
  p_company_id uuid
)
RETURNS TABLE (
  permission_id uuid,
  module text,
  action text,
  name text,
  has_permission boolean,
  source text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
  v_is_super_admin boolean;
BEGIN
  -- Get user's role in the company
  SELECT role INTO v_user_role
  FROM public.company_users
  WHERE user_id = p_user_id AND company_id = p_company_id AND is_active = true;
  
  v_is_super_admin := (v_user_role = 'super_admin');
  
  RETURN QUERY
  SELECT 
    p.id AS permission_id,
    p.module,
    p.action,
    p.name,
    CASE
      -- Super admin always has all permissions
      WHEN v_is_super_admin THEN true
      -- Check for explicit user override
      WHEN up.granted IS NOT NULL THEN up.granted
      -- Fall back to role permission
      WHEN rp.is_granted IS NOT NULL THEN rp.is_granted
      -- Default based on role for backwards compatibility
      WHEN v_user_role IN ('company_admin', 'super_admin') THEN true
      WHEN v_user_role = 'hr_manager' AND p.module IN ('employees', 'leave', 'time_tracking', 'documents', 'recruitment', 'performance', 'departments', 'dashboard', 'my_team') THEN true
      WHEN v_user_role = 'manager' AND p.module IN ('dashboard', 'leave', 'my_team') AND p.action = 'read' THEN true
      WHEN v_user_role = 'manager' AND p.module = 'leave' AND p.action = 'approve' THEN true
      WHEN v_user_role = 'employee' AND p.module IN ('dashboard', 'leave', 'time_tracking', 'documents', 'expenses') AND p.action IN ('read', 'create') THEN true
      ELSE false
    END AS has_permission,
    CASE
      WHEN v_is_super_admin THEN 'super_admin'
      WHEN up.granted = true THEN 'explicit_allow'
      WHEN up.granted = false THEN 'explicit_deny'
      WHEN rp.is_granted IS NOT NULL THEN 'role'
      ELSE 'none'
    END AS source
  FROM public.permissions p
  LEFT JOIN public.role_permissions rp 
    ON rp.permission_id = p.id 
    AND rp.company_id = p_company_id 
    AND rp.role = v_user_role
  LEFT JOIN public.user_permissions up 
    ON up.permission_id = p.id 
    AND up.company_id = p_company_id 
    AND up.user_id = p_user_id
  ORDER BY p.module, p.action;
END;
$$;

-- Get role permissions
CREATE OR REPLACE FUNCTION public.get_role_permissions(
  p_company_id uuid,
  p_role text
)
RETURNS TABLE (
  permission_id uuid,
  module text,
  action text,
  name text,
  is_granted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS permission_id,
    p.module,
    p.action,
    p.name,
    COALESCE(rp.is_granted, 
      CASE
        WHEN p_role IN ('company_admin', 'super_admin') THEN true
        WHEN p_role = 'hr_manager' AND p.module IN ('employees', 'leave', 'time_tracking', 'documents', 'recruitment', 'performance', 'departments', 'dashboard', 'my_team') THEN true
        WHEN p_role = 'manager' AND p.module IN ('dashboard', 'leave', 'my_team') AND p.action = 'read' THEN true
        WHEN p_role = 'manager' AND p.module = 'leave' AND p.action = 'approve' THEN true
        WHEN p_role = 'employee' AND p.module IN ('dashboard', 'leave', 'time_tracking', 'documents', 'expenses') AND p.action IN ('read', 'create') THEN true
        ELSE false
      END
    ) AS is_granted
  FROM public.permissions p
  LEFT JOIN public.role_permissions rp 
    ON rp.permission_id = p.id 
    AND rp.company_id = p_company_id 
    AND rp.role = p_role
  ORDER BY p.module, p.action;
END;
$$;

-- Set role permission
CREATE OR REPLACE FUNCTION public.set_role_permission(
  p_company_id uuid,
  p_role text,
  p_module text,
  p_action text,
  p_grant boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permission_id uuid;
BEGIN
  -- Get permission ID
  SELECT id INTO v_permission_id
  FROM public.permissions
  WHERE module = p_module AND action = p_action;
  
  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %.%', p_module, p_action;
  END IF;
  
  -- Upsert role permission
  INSERT INTO public.role_permissions (company_id, role, permission_id, is_granted)
  VALUES (p_company_id, p_role, v_permission_id, p_grant)
  ON CONFLICT (company_id, role, permission_id) 
  DO UPDATE SET is_granted = p_grant, updated_at = now();
END;
$$;

-- Set user permission override
CREATE OR REPLACE FUNCTION public.set_user_permission(
  p_company_id uuid,
  p_target_user_id uuid,
  p_module text,
  p_action text,
  p_granted boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permission_id uuid;
BEGIN
  -- Get permission ID
  SELECT id INTO v_permission_id
  FROM public.permissions
  WHERE module = p_module AND action = p_action;
  
  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION 'Permission not found: %.%', p_module, p_action;
  END IF;
  
  -- If null, remove the override
  IF p_granted IS NULL THEN
    DELETE FROM public.user_permissions
    WHERE company_id = p_company_id 
      AND user_id = p_target_user_id 
      AND permission_id = v_permission_id;
  ELSE
    -- Upsert user permission
    INSERT INTO public.user_permissions (company_id, user_id, permission_id, granted)
    VALUES (p_company_id, p_target_user_id, v_permission_id, p_granted)
    ON CONFLICT (company_id, user_id, permission_id) 
    DO UPDATE SET granted = p_granted, updated_at = now();
  END IF;
END;
$$;

-- Batch set user permissions
CREATE OR REPLACE FUNCTION public.set_user_permissions_batch(
  p_company_id uuid,
  p_target_user_id uuid,
  p_permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_perm record;
  v_permission_id uuid;
BEGIN
  FOR v_perm IN SELECT * FROM jsonb_to_recordset(p_permissions) 
    AS x(module text, action text, granted boolean)
  LOOP
    -- Get permission ID
    SELECT id INTO v_permission_id
    FROM public.permissions
    WHERE module = v_perm.module AND action = v_perm.action;
    
    IF v_permission_id IS NOT NULL THEN
      -- Upsert user permission
      INSERT INTO public.user_permissions (company_id, user_id, permission_id, granted)
      VALUES (p_company_id, p_target_user_id, v_permission_id, v_perm.granted)
      ON CONFLICT (company_id, user_id, permission_id) 
      DO UPDATE SET granted = v_perm.granted, updated_at = now();
    END IF;
  END LOOP;
END;
$$;

-- Initialize company permissions (copy default role permissions)
CREATE OR REPLACE FUNCTION public.initialize_company_permissions(
  p_company_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a no-op since we use dynamic defaults in get_user_permissions
  -- But companies can customize by inserting into role_permissions
  NULL;
END;
$$;

-- Reset role permissions to defaults
CREATE OR REPLACE FUNCTION public.reset_role_permissions_to_defaults(
  p_company_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all custom role permissions for this company
  DELETE FROM public.role_permissions WHERE company_id = p_company_id;
END;
$$;