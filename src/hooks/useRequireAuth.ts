import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const { isAuthenticated, isLoading, currentRole, currentCompanyId } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/auth', { replace: true });
      return;
    }

    if (requireCompany && !currentCompanyId) {
      navigate('/onboarding', { replace: true });
      return;
    }

    if (requiredRole && !hasMinimumRole(currentRole, requiredRole)) {
      navigate('/unauthorized', { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, currentRole, currentCompanyId, navigate, redirectTo, requiredRole, requireCompany]);

  return { isLoading, isAuthenticated, currentRole, currentCompanyId };
};
