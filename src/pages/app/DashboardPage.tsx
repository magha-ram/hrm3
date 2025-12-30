import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Building2, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { companyName, role, isTrialing, trialDaysRemaining, isFrozen, planName } = useTenant();
  const { accessibleModules } = useModuleAccess();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();

  const statItems = [
    { 
      label: 'Total Employees', 
      value: statsLoading ? null : (stats?.totalEmployees ?? 0), 
      icon: Users, 
      color: 'text-blue-500' 
    },
    { 
      label: 'Pending Leave', 
      value: statsLoading ? null : (stats?.pendingLeave ?? 0), 
      icon: Calendar, 
      color: 'text-green-500' 
    },
    { 
      label: 'Active Departments', 
      value: statsLoading ? null : (stats?.activeDepartments ?? 0), 
      icon: Building2, 
      color: 'text-purple-500' 
    },
    { 
      label: 'Open Positions', 
      value: statsLoading ? null : (stats?.openPositions ?? 0), 
      icon: Briefcase, 
      color: 'text-orange-500' 
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to {companyName || 'your'}'s HR Portal
          {isTrialing && trialDaysRemaining !== null && (
            <span className="ml-2 text-primary">
              • {trialDaysRemaining} days left in trial
            </span>
          )}
          {planName && (
            <span className="ml-2 text-muted-foreground">
              • {planName} Plan
            </span>
          )}
        </p>
      </div>

      {/* Frozen Notice */}
      {isFrozen && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive">Account Frozen</CardTitle>
            <CardDescription>
              Your company account is currently frozen. All data is read-only until the account is reactivated.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Error */}
      {statsError && (
        <Card className="border-amber-500 bg-amber-500/10">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700">
              Unable to load some dashboard statistics. Please refresh the page.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {stat.value === null ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        {accessibleModules.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No modules available. Contact your administrator for access.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {accessibleModules.slice(0, 8).map(({ module }) => (
              <Link key={module.id} to={module.path}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <module.icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-medium">{module.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">{module.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
