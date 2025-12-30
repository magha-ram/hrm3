import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [companiesRes, subscriptionsRes, platformAdminsRes] = await Promise.all([
        supabase.from('companies').select('id, is_active', { count: 'exact' }),
        supabase.from('company_subscriptions').select('id, status', { count: 'exact' }),
        supabase.from('platform_admins').select('id, is_active', { count: 'exact' }),
      ]);

      const activeCompanies = companiesRes.data?.filter(c => c.is_active).length || 0;
      const totalCompanies = companiesRes.count || 0;
      const activeSubscriptions = subscriptionsRes.data?.filter(s => s.status === 'active' || s.status === 'trialing').length || 0;
      const platformAdmins = platformAdminsRes.data?.filter(p => p.is_active).length || 0;

      return {
        totalCompanies,
        activeCompanies,
        activeSubscriptions,
        platformAdmins,
      };
    },
  });

  const { data: recentCompanies, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['recent-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug, created_at, is_active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Platform Overview</h2>
        <p className="text-muted-foreground">Monitor and manage your SaaS platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalCompanies}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeCompanies} active
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  Paid & trialing
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.platformAdmins}</div>
                <p className="text-xs text-muted-foreground">
                  Active administrators
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Companies */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Companies</CardTitle>
          <CardDescription>Latest companies registered on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecent ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentCompanies?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No companies yet</p>
          ) : (
            <div className="space-y-3">
              {recentCompanies?.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium text-foreground">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.slug}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        company.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {company.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(company.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
