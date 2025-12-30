import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  CreditCard, 
  Calendar,
  Mail,
  Globe,
  MapPin,
  Briefcase,
  HardDrive,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';

export default function PlatformCompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch company details
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['platform-company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch subscription
  const { data: subscription, isLoading: isLoadingSub } = useQuery({
    queryKey: ['platform-company-subscription', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_subscriptions')
        .select('*, plans(name, price_monthly, max_employees, max_storage_gb)')
        .eq('company_id', companyId!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['platform-company-users', companyId],
    queryFn: async () => {
      const { data: companyUsers, error } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for these users
      const userIds = companyUsers.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      return companyUsers.map(cu => ({
        ...cu,
        profile: profiles?.find(p => p.id === cu.user_id),
      }));
    },
    enabled: !!companyId,
  });

  // Fetch employee count
  const { data: employeeCount } = useQuery({
    queryKey: ['platform-company-employees', companyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId!)
        .neq('employment_status', 'terminated');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!companyId,
  });

  // Fetch available plans
  const { data: plans } = useQuery({
    queryKey: ['platform-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
  });

  // Toggle company active status
  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !company?.is_active })
        .eq('id', companyId!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(company?.is_active ? 'Company frozen' : 'Company unfrozen');
      queryClient.invalidateQueries({ queryKey: ['platform-company', companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Change plan
  const changePlanMutation = useMutation({
    mutationFn: async (newPlanId: string) => {
      if (subscription) {
        const { error } = await supabase
          .from('company_subscriptions')
          .update({ plan_id: newPlanId })
          .eq('id', subscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('company_subscriptions')
          .insert({
            company_id: companyId!,
            plan_id: newPlanId,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Plan updated');
      queryClient.invalidateQueries({ queryKey: ['platform-company-subscription', companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Extend trial
  const extendTrialMutation = useMutation({
    mutationFn: async (days: number) => {
      if (!subscription) return;

      const newEndDate = new Date(subscription.trial_ends_at || subscription.current_period_end);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from('company_subscriptions')
        .update({
          trial_ends_at: newEndDate.toISOString(),
          current_period_end: newEndDate.toISOString(),
          status: 'trialing',
        })
        .eq('id', subscription.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trial extended');
      queryClient.invalidateQueries({ queryKey: ['platform-company-subscription', companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trialing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'company_admin':
        return 'default';
      case 'hr_manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoadingCompany) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Company not found</p>
        <Button variant="outline" onClick={() => navigate('/platform/companies')} className="mt-4">
          Back to Companies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/platform/companies')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{company.name}</h2>
            <p className="text-muted-foreground">{company.slug}</p>
          </div>
          <Badge variant={company.is_active ? 'default' : 'secondary'}>
            {company.is_active ? 'Active' : 'Frozen'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toggleActiveMutation.mutate()}
            disabled={toggleActiveMutation.isPending}
          >
            {company.is_active ? 'Freeze Company' : 'Unfreeze Company'}
          </Button>
        </div>
      </div>

      {/* Company Info & Subscription */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                Industry
              </div>
              <div>{company.industry || '-'}</div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Size Range
              </div>
              <div>{company.size_range || '-'}</div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <div>{company.email || '-'}</div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                Website
              </div>
              <div>{company.website || '-'}</div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created
              </div>
              <div>{format(new Date(company.created_at), 'MMM d, yyyy')}</div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingSub ? (
              <Skeleton className="h-32" />
            ) : subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <Select
                    value={subscription.plan_id}
                    onValueChange={(value) => changePlanMutation.mutate(value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Period End</span>
                  <span>{format(new Date(subscription.current_period_end), 'MMM d, yyyy')}</span>
                </div>

                {subscription.trial_ends_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trial Ends</span>
                    <span>{format(new Date(subscription.trial_ends_at), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {subscription.status === 'trialing' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => extendTrialMutation.mutate(7)}>
                      +7 days
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => extendTrialMutation.mutate(14)}>
                      +14 days
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No subscription</p>
                <Select onValueChange={(value) => changePlanMutation.mutate(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assign a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeCount}
              {subscription?.plans?.max_employees && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {subscription.plans.max_employees}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              -
              {subscription?.plans?.max_storage_gb && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {subscription.plans.max_storage_gb} GB
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>All users with access to this company</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {user.profile?.first_name && user.profile?.last_name
                            ? `${user.profile.first_name} ${user.profile.last_name}`
                            : 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.joined_at ? format(new Date(user.joined_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
