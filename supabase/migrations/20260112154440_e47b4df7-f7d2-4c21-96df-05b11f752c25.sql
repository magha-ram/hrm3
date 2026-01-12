CREATE OR REPLACE FUNCTION public.get_user_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_profile record;
    v_companies jsonb;
    v_current_company_id uuid;
    v_current_role app_role;
    v_current_employee_id uuid;
    v_current_employee jsonb;
    v_is_platform_admin boolean;
    v_platform_admin_role text;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get profile
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
    
    -- Get all companies for user
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'company_id', cu.company_id,
        'company_name', c.name,
        'company_slug', c.slug,
        'logo_url', c.logo_url,
        'role', cu.role,
        'is_primary', cu.is_primary,
        'is_frozen', NOT c.is_active
    )), '[]'::jsonb)
    INTO v_companies
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = v_user_id AND cu.is_active = true;

    -- Get primary company
    SELECT cu.company_id, cu.role INTO v_current_company_id, v_current_role
    FROM public.company_users cu
    WHERE cu.user_id = v_user_id AND cu.is_active = true AND cu.is_primary = true
    LIMIT 1;

    -- Fallback to first available company
    IF v_current_company_id IS NULL THEN
        SELECT cu.company_id, cu.role INTO v_current_company_id, v_current_role
        FROM public.company_users cu
        WHERE cu.user_id = v_user_id AND cu.is_active = true
        LIMIT 1;
    END IF;

    -- Initialize employee variables as NULL
    v_current_employee_id := NULL;
    v_current_employee := NULL;

    -- Get current employee if company exists
    IF v_current_company_id IS NOT NULL THEN
        SELECT e.id, jsonb_build_object(
            'id', e.id,
            'first_name', e.first_name,
            'last_name', e.last_name,
            'employee_number', e.employee_number,
            'job_title', e.job_title,
            'department_id', e.department_id,
            'manager_id', e.manager_id,
            'employment_status', e.employment_status
        )
        INTO v_current_employee_id, v_current_employee
        FROM public.employees e
        WHERE e.user_id = v_user_id AND e.company_id = v_current_company_id
        LIMIT 1;
    END IF;

    -- Check platform admin status
    SELECT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = v_user_id)
    INTO v_is_platform_admin;

    IF v_is_platform_admin THEN
        SELECT role INTO v_platform_admin_role FROM public.platform_admins WHERE user_id = v_user_id;
    END IF;

    -- Return the context
    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'email', v_profile.email,
        'first_name', v_profile.first_name,
        'last_name', v_profile.last_name,
        'avatar_url', v_profile.avatar_url,
        'max_companies', COALESCE(v_profile.max_companies, 1),
        'current_company_id', v_current_company_id,
        'current_role', v_current_role,
        'current_employee_id', v_current_employee_id,
        'current_employee', v_current_employee,
        'companies', v_companies,
        'is_platform_admin', v_is_platform_admin,
        'platform_admin_role', v_platform_admin_role
    );
END;
$$;