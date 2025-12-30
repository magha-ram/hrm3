import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { AppRole, hasMinimumRole } from '@/types/auth';

interface UseRequireAuthOptions {
  redirectTo?: string;
  requiredRole?: AppRole;
  requireCompany?: boolean;
}

export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const { 
    redirectTo = '/auth', 
    requiredRole,
    requireCompany = false 
  } = options;
  
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, currentRole, currentCompanyId, isPlatformAdmin } = useAuth();
  const { isImpersonating, effectiveCompanyId } = useImpersonation();

  // When impersonating, use the effective company ID instead of the user's actual company
  const activeCompanyId = isImpersonating ? effectiveCompanyId : currentCompanyId;
  // When impersonating, treat as admin role for access purposes
  const activeRole = isImpersonating && isPlatformAdmin ? 'company_admin' as AppRole : currentRole;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }

    // Allow impersonating platform admins to access company pages
    if (requireCompany && !activeCompanyId) {
      // Only redirect to onboarding if not impersonating
      if (!isImpersonating) {
        navigate('/onboarding', { replace: true });
      }
      return;
    }

    if (requiredRole && !hasMinimumRole(activeRole, requiredRole)) {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, activeRole, activeCompanyId, navigate, redirectTo, requiredRole, requireCompany, isImpersonating]);

  return { 
    isLoading, 
    isAuthenticated, 
    currentRole: activeRole, 
    currentCompanyId: activeCompanyId 
  };
};
