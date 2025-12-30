import { useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrentCompany } from './useCompany';
import { HR_MODULES, ModuleConfig, ModuleId } from '@/config/modules';
import { hasMinimumRole, AppRole } from '@/types/auth';

export interface ModuleAccess {
  module: ModuleConfig;
  hasAccess: boolean;
  reason: 'ok' | 'no_role' | 'no_plan' | 'frozen';
}

export function useModuleAccess() {
  const { role, companyId } = useTenant();
  const { data: company } = useCurrentCompany();

  const isFrozen = company ? !company.is_active : false;
  const planModules = company?.subscription?.features?.modules || [];

  const hasModuleInPlan = (moduleId: ModuleId): boolean => {
    if (planModules === 'all') return true;
    if (Array.isArray(planModules)) {
      return planModules.includes(moduleId);
    }
    return false;
  };

  const moduleAccess = useMemo<ModuleAccess[]>(() => {
    return HR_MODULES.map((module) => {
      // Check if company is frozen
      if (isFrozen) {
        return { module, hasAccess: false, reason: 'frozen' as const };
      }

      // Check role access
      if (!hasMinimumRole(role, module.minRole)) {
        return { module, hasAccess: false, reason: 'no_role' as const };
      }

      // Check plan access (if module requires a plan)
      if (module.planRequired && !hasModuleInPlan(module.planRequired)) {
        return { module, hasAccess: false, reason: 'no_plan' as const };
      }

      return { module, hasAccess: true, reason: 'ok' as const };
    });
  }, [role, isFrozen, planModules]);

  const accessibleModules = moduleAccess.filter((m) => m.hasAccess);
  const restrictedModules = moduleAccess.filter((m) => !m.hasAccess);

  const canAccessModule = (moduleId: ModuleId): boolean => {
    const access = moduleAccess.find((m) => m.module.id === moduleId);
    return access?.hasAccess || false;
  };

  return {
    moduleAccess,
    accessibleModules,
    restrictedModules,
    canAccessModule,
    isFrozen,
    planModules,
  };
}
