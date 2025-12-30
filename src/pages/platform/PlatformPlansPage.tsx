import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Check, X } from 'lucide-react';

export default function PlatformPlansPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['platform-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const parseFeatures = (features: any) => {
    if (!features) return { modules: [], other: {} };
    const { modules, ...other } = features;
    return { 
      modules: modules === 'all' ? ['All modules'] : (Array.isArray(modules) ? modules : []),
      other 
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Subscription Plans</h2>
        <p className="text-muted-foreground">View and manage available subscription plans</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
          <CardDescription>
            Plans available to companies on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : plans?.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No plans configured</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Max Employees</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => {
                  const { modules } = parseFeatures(plan.features);
                  
                  return (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground">{plan.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(plan.price_monthly)}</TableCell>
                      <TableCell>{formatPrice(plan.price_yearly)}</TableCell>
                      <TableCell>
                        {plan.max_employees ? plan.max_employees : 'Unlimited'}
                      </TableCell>
                      <TableCell>
                        {plan.max_storage_gb ? `${plan.max_storage_gb} GB` : 'Unlimited'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {modules.length === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : modules.slice(0, 3).map((module: string) => (
                            <Badge key={module} variant="outline" className="text-xs">
                              {module}
                            </Badge>
                          ))}
                          {modules.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{modules.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
