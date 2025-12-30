import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { ModuleId } from '@/config/modules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Snowflake } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleGuardProps {
  moduleId: ModuleId;
  children: ReactNode;
}

export function ModuleGuard({ moduleId, children }: ModuleGuardProps) {
  const { isLoading } = useTenant();
  const { moduleAccess, isFrozen } = useModuleAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const access = moduleAccess.find(m => m.module.id === moduleId);

  if (!access) {
    return <Navigate to="/app/dashboard" replace />;
  }

  if (access.hasAccess) {
    return <>{children}</>;
  }

  // Show appropriate message based on reason
  if (access.reason === 'frozen') {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-blue-100 text-blue-600 w-fit mb-4">
              <Snowflake className="h-8 w-8" />
            </div>
            <CardTitle>Account Frozen</CardTitle>
            <CardDescription>
              Your company account is currently frozen. This module is read-only until the account is reactivated.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/app/settings/billing">
              <Button>Go to Billing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (access.reason === 'no_plan') {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-amber-100 text-amber-600 w-fit mb-4">
              <Crown className="h-8 w-8" />
            </div>
            <CardTitle>Upgrade Required</CardTitle>
            <CardDescription>
              The <strong>{access.module.name}</strong> module is not included in your current plan.
              Upgrade to access this feature.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/app/settings/billing">
              <Button>View Plans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (access.reason === 'no_role') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
}
