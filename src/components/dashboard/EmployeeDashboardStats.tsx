import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Wallet, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';

interface PersonalStats {
  pendingLeaveRequests: number;
  upcomingLeave: { start_date: string; end_date: string; leave_type: string } | null;
  nextPayday: string | null;
  leaveBalances: { name: string; balance: number; color: string }[];
}

export function EmployeeDashboardStats() {
  const { companyId } = useTenant();
  const { user } = useAuth();
  const userId = user?.user_id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['employee-personal-stats', companyId, userId],
    queryFn: async (): Promise<PersonalStats> => {
      if (!companyId || !userId) {
        return { pendingLeaveRequests: 0, upcomingLeave: null, nextPayday: null, leaveBalances: [] };
      }

      // Get the employee's id
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .single();

      if (!employee) {
        return { pendingLeaveRequests: 0, upcomingLeave: null, nextPayday: null, leaveBalances: [] };
      }

      const today = new Date().toISOString().split('T')[0];

      // Get pending leave requests count
      const { count: pendingCount } = await supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', employee.id)
        .eq('company_id', companyId)
        .eq('status', 'pending');

      // Get upcoming approved leave
      const { data: upcomingLeaves } = await supabase
        .from('leave_requests')
        .select('start_date, end_date, leave_type:leave_types(name)')
        .eq('employee_id', employee.id)
        .eq('company_id', companyId)
        .eq('status', 'approved')
        .gte('start_date', today)
        .order('start_date', { ascending: true })
        .limit(1);

      // Get leave balances
      const { data: leaveTypes } = await supabase
        .from('leave_types')
        .select('id, name, default_days, color')
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Calculate used leave for each type
      const balances: { name: string; balance: number; color: string }[] = [];
      if (leaveTypes) {
        for (const lt of leaveTypes) {
          const { data: used } = await supabase
            .from('leave_requests')
            .select('total_days')
            .eq('employee_id', employee.id)
            .eq('company_id', companyId)
            .eq('leave_type_id', lt.id)
            .in('status', ['approved', 'pending']);

          const totalUsed = used?.reduce((sum, r) => sum + Number(r.total_days), 0) || 0;
          const balance = (lt.default_days || 0) - totalUsed;
          balances.push({ name: lt.name, balance, color: lt.color || '#3B82F6' });
        }
      }

      // Get next payroll run (estimated payday)
      const { data: nextPayroll } = await supabase
        .from('payroll_runs')
        .select('pay_date')
        .eq('company_id', companyId)
        .gte('pay_date', today)
        .order('pay_date', { ascending: true })
        .limit(1);

      const upcomingLeave = upcomingLeaves?.[0] ? {
        start_date: upcomingLeaves[0].start_date,
        end_date: upcomingLeaves[0].end_date,
        leave_type: (upcomingLeaves[0].leave_type as any)?.name || 'Leave',
      } : null;

      return {
        pendingLeaveRequests: pendingCount || 0,
        upcomingLeave,
        nextPayday: nextPayroll?.[0]?.pay_date || null,
        leaveBalances: balances.slice(0, 4), // Top 4 leave types
      };
    },
    enabled: !!companyId && !!userId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Leave Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Pending Requests</CardDescription>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaveRequests}</div>
            {stats.pendingLeaveRequests > 0 && (
              <Link to="/app/leave">
                <Button variant="link" className="p-0 h-auto text-xs">View requests →</Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Leave */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Upcoming Leave</CardDescription>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {stats.upcomingLeave ? (
              <div>
                <p className="text-sm font-medium">{stats.upcomingLeave.leave_type}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(stats.upcomingLeave.start_date), 'MMM d')} - {format(new Date(stats.upcomingLeave.end_date), 'MMM d')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming leave</p>
            )}
          </CardContent>
        </Card>

        {/* Next Payday */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Next Payday</CardDescription>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {stats.nextPayday ? (
              <div>
                <p className="text-2xl font-bold">{format(new Date(stats.nextPayday), 'd')}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(stats.nextPayday), 'MMMM yyyy')}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not scheduled</p>
            )}
          </CardContent>
        </Card>

        {/* Payslips Link */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>My Payslips</CardDescription>
            <FileCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <Link to="/app/payslips">
              <Button variant="outline" size="sm" className="w-full">View Payslips</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balances */}
      {stats.leaveBalances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Leave Balances</CardTitle>
              <Link to="/app/leave">
                <Button variant="ghost" size="sm">Request Leave</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.leaveBalances.map((lb) => (
                <div key={lb.name} className="text-center p-3 rounded-lg bg-muted/50">
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: lb.balance > 0 ? lb.color : undefined }}
                  >
                    {lb.balance}
                  </div>
                  <p className="text-xs text-muted-foreground">{lb.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
