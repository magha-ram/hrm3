export type AppRole = 'super_admin' | 'company_admin' | 'hr_manager' | 'manager' | 'employee';

export type PlatformAdminRole = 'owner' | 'admin' | 'support';

export interface UserCompany {
  company_id: string;
  company_name: string;
  company_slug: string;
  logo_url: string | null;
  role: AppRole;
  is_primary: boolean;
}

export interface UserContext {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  current_company_id: string | null;
  current_role: AppRole | null;
  current_employee_id: string | null;
  companies: UserCompany[] | null;
  is_platform_admin: boolean;
  platform_admin_role: PlatformAdminRole | null;
}

export interface AuthState {
  user: UserContext | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentCompanyId: string | null;
  currentRole: AppRole | null;
  isPlatformAdmin: boolean;
  platformAdminRole: PlatformAdminRole | null;
}

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  super_admin: 5,
  company_admin: 4,
  hr_manager: 3,
  manager: 2,
  employee: 1,
};

export const hasMinimumRole = (userRole: AppRole | null, requiredRole: AppRole): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const canManageUsers = (role: AppRole | null): boolean => {
  return hasMinimumRole(role, 'company_admin');
};

export const canManageHR = (role: AppRole | null): boolean => {
  return hasMinimumRole(role, 'hr_manager');
};

export const canViewReports = (role: AppRole | null): boolean => {
  return hasMinimumRole(role, 'manager');
};
