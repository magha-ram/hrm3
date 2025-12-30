import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { AppRole, hasMinimumRole, canManageUsers, canManageHR, canViewReports } from '@/types/auth';

interface TenantContextValue {
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  role: AppRole | null;
  employeeId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  canManageUsers: boolean;
  canManageHR: boolean;
  canViewReports: boolean;
  hasModule: (module: string) => boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, currentCompanyId, currentRole } = useAuth();

  const currentCompany = useMemo(() => {
    if (!user?.companies || !currentCompanyId) return null;
    return user.companies.find(c => c.company_id === currentCompanyId) || null;
  }, [user?.companies, currentCompanyId]);

  const value = useMemo<TenantContextValue>(() => ({
    companyId: currentCompanyId,
    companyName: currentCompany?.company_name || null,
    companySlug: currentCompany?.company_slug || null,
    role: currentRole,
    employeeId: user?.current_employee_id || null,
    isOwner: currentRole === 'super_admin',
    isAdmin: hasMinimumRole(currentRole, 'company_admin'),
    isHR: hasMinimumRole(currentRole, 'hr_manager'),
    isManager: hasMinimumRole(currentRole, 'manager'),
    canManageUsers: canManageUsers(currentRole),
    canManageHR: canManageHR(currentRole),
    canViewReports: canViewReports(currentRole),
    // Module access would typically be fetched from backend
    hasModule: (module: string) => true, // Placeholder - implement with actual plan check
  }), [currentCompanyId, currentCompany, currentRole, user?.current_employee_id]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};
