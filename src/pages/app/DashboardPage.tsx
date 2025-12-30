import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Briefcase, BarChart3, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useModuleAccess } from '@/hooks/useModuleAccess';

export default function DashboardPage() {
  const { companyName, role, isTrialing, trialDaysRemaining, isFrozen } = useTenant();
  const { accessibleModules } = useModuleAccess();

  const stats = [
    { label: 'Total Employees', value: '--', icon: Users, color: 'text-blue-500' },
    { label: 'Pending Leave', value: '--', icon: Calendar, color: 'text-green-500' },
    { label: 'Open Positions', value: '--', icon: Briefcase, color: 'text-purple-500' },
    { label: 'Pending Reviews', value: '--', icon: BarChart3, color: 'text-orange-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to {companyName}'s HR Portal
          {isTrialing && trialDaysRemaining !== null && (
            <span className="ml-2 text-primary">
              • {trialDaysRemaining} days left in trial
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
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
      </div>
    </div>
  );
}
