import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useCurrentCompany } from '@/hooks/useCompany';
import { AppRole, hasMinimumRole, canManageUsers, canManageHR, canViewReports } from '@/types/auth';
import { ModuleId } from '@/config/modules';

interface TenantContextValue {
  // Company info
  companyId: string | null;
  companyName: string | null;
  companySlug: string | null;
  companyLogoUrl: string | null;
  
  // User role
  role: AppRole | null;
  employeeId: string | null;
  
  // Role checks
  isOwner: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  canManageUsers: boolean;
  canManageHR: boolean;
  canViewReports: boolean;
  
  // Company state
  isFrozen: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number | null;
  
  // Plan info
  planName: string | null;
  planModules: ModuleId[] | 'all';
  hasModule: (module: ModuleId) => boolean;
  
  // Loading state
  isLoading: boolean;
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
  const { user, currentCompanyId, currentRole, isLoading: authLoading } = useAuth();
  const { data: company, isLoading: companyLoading } = useCurrentCompany();

  const currentCompany = useMemo(() => {
    if (!user?.companies || !currentCompanyId) return null;
    return user.companies.find(c => c.company_id === currentCompanyId) || null;
  }, [user?.companies, currentCompanyId]);

  const planModules = useMemo((): ModuleId[] | 'all' => {
    const modules = company?.subscription?.features?.modules;
    if (modules === 'all') return 'all';
    if (Array.isArray(modules)) return modules as ModuleId[];
    return [];
  }, [company?.subscription?.features?.modules]);

  const hasModule = (module: ModuleId): boolean => {
    if (planModules === 'all') return true;
    return planModules.includes(module);
  };

  const trialDaysRemaining = useMemo((): number | null => {
    if (!company?.subscription?.trial_ends_at) return null;
    const trialEnd = new Date(company.subscription.trial_ends_at);
    const now = new Date();
    const diffDays = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [company?.subscription?.trial_ends_at]);

  const value = useMemo<TenantContextValue>(() => ({
    // Company info
    companyId: currentCompanyId,
    companyName: currentCompany?.company_name || company?.name || null,
    companySlug: currentCompany?.company_slug || company?.slug || null,
    companyLogoUrl: company?.logo_url || null,
    
    // User role
    role: currentRole,
    employeeId: user?.current_employee_id || null,
    
    // Role checks
    isOwner: currentRole === 'super_admin',
    isAdmin: hasMinimumRole(currentRole, 'company_admin'),
    isHR: hasMinimumRole(currentRole, 'hr_manager'),
    isManager: hasMinimumRole(currentRole, 'manager'),
    canManageUsers: canManageUsers(currentRole),
    canManageHR: canManageHR(currentRole),
    canViewReports: canViewReports(currentRole),
    
    // Company state
    isFrozen: company ? !company.is_active : false,
    isTrialing: company?.subscription?.status === 'trialing',
    trialDaysRemaining,
    
    // Plan info
    planName: company?.subscription?.plan_name || null,
    planModules,
    hasModule,
    
    // Loading
    isLoading: authLoading || companyLoading,
  }), [
    currentCompanyId, 
    currentCompany, 
    company, 
    currentRole, 
    user?.current_employee_id,
    planModules,
    trialDaysRemaining,
    authLoading,
    companyLoading,
  ]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};
