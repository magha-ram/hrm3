import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  Briefcase, 
  BarChart3, 
  DollarSign,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Owner',
  company_admin: 'Admin',
  hr_manager: 'HR Manager',
  manager: 'Manager',
  employee: 'Employee',
};

export default function Dashboard() {
  const { isLoading } = useRequireAuth({ requireCompany: true });
  const { user, signOut, switchCompany } = useAuth();
  const { companyName, role, isAdmin, isHR, canViewReports } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const modules = [
    { 
      name: 'Employees', 
      description: 'Manage employee records', 
      icon: Users, 
      href: '/employees',
      visible: true 
    },
    { 
      name: 'Departments', 
      description: 'Organize team structure', 
      icon: Building2, 
      href: '/departments',
      visible: true 
    },
    { 
      name: 'Leave Management', 
      description: 'Handle time-off requests', 
      icon: Calendar, 
      href: '/leave',
      visible: true 
    },
    { 
      name: 'Time Tracking', 
      description: 'Track work hours', 
      icon: Clock, 
      href: '/time',
      visible: true 
    },
    { 
      name: 'Documents', 
      description: 'Store employee documents', 
      icon: FileText, 
      href: '/documents',
      visible: isHR 
    },
    { 
      name: 'Recruitment', 
      description: 'Manage job postings', 
      icon: Briefcase, 
      href: '/recruitment',
      visible: isHR 
    },
    { 
      name: 'Performance', 
      description: 'Track performance reviews', 
      icon: BarChart3, 
      href: '/performance',
      visible: canViewReports 
    },
    { 
      name: 'Payroll', 
      description: 'Process payroll runs', 
      icon: DollarSign, 
      href: '/payroll',
      visible: isAdmin 
    },
  ];

  const visibleModules = modules.filter(m => m.visible);

  const getInitials = () => {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    return (first + last).toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">{companyName}</span>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              {role ? ROLE_LABELS[role] || role : 'Member'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Company Switcher */}
            {user?.companies && user.companies.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    Switch Company
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Your Companies</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.companies.map((company) => (
                    <DropdownMenuItem
                      key={company.company_id}
                      onClick={() => switchCompany(company.company_id)}
                      className={company.is_primary ? 'bg-muted' : ''}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      {company.company_name}
                      {company.is_primary && (
                        <Badge variant="outline" className="ml-2">Current</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.first_name} {user?.last_name}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user?.first_name || 'there'}!</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your HR dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Employees</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Leave Requests</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Open Positions</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Reviews</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Module Grid */}
        <h2 className="text-xl font-semibold mb-4">HR Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleModules.map((module) => (
            <Card 
              key={module.name} 
              className="hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <module.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{module.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
