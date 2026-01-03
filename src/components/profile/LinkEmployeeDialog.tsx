import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Link2, Loader2, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LinkEmployeeDialogProps {
  userId: string;
  onSuccess?: () => void;
}

export function LinkEmployeeDialog({ userId, onSuccess }: LinkEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const { companyId, role } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isHROrAdmin = role && ['super_admin', 'company_admin', 'hr_manager'].includes(role);
  const isSelfLinking = userId === user?.user_id;

  // Fetch unlinked employees
  const { data: unlinkedEmployees, isLoading, error } = useQuery({
    queryKey: ['unlinked-employees', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, employee_number')
        .eq('company_id', companyId)
        .is('user_id', null)
        .eq('employment_status', 'active')
        .order('first_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && open,
  });

  // Check for matching employee by email (for self-linking)
  const { data: matchingEmployee } = useQuery({
    queryKey: ['matching-employee', companyId, user?.email],
    queryFn: async () => {
      if (!companyId || !user?.email) return null;

      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, employee_number')
        .eq('company_id', companyId)
        .eq('email', user.email)
        .is('user_id', null)
        .eq('employment_status', 'active')
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!companyId && isSelfLinking && open,
  });

  const linkMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      if (!companyId) {
        throw new Error('No company context');
      }

      const { data, error } = await supabase.rpc('link_user_to_employee', {
        _user_id: userId,
        _employee_id: employeeId,
        _company_id: companyId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['my-employee-record'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-employees'] });
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      queryClient.invalidateQueries({ queryKey: ['my-team'] });
      toast.success('Account successfully linked to employee record');
      setOpen(false);
      setSelectedEmployeeId('');
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Link error:', error);
      toast.error(error.message || 'Failed to link account');
    },
  });

  const handleLink = () => {
    const employeeToLink = selectedEmployeeId || (matchingEmployee?.id);
    if (employeeToLink) {
      linkMutation.mutate(employeeToLink);
    }
  };

  // Auto-select matching employee for self-linking
  const effectiveSelectedEmployee = selectedEmployeeId || matchingEmployee?.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Link2 className="h-4 w-4" />
          Link to Employee Record
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Link to Employee Record
          </DialogTitle>
          <DialogDescription>
            {isSelfLinking 
              ? 'Link your user account to an existing employee record to access salary information, payslips, and attendance data.'
              : 'Select an employee record to link to this user account.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load employees: {(error as Error).message}
              </AlertDescription>
            </Alert>
          )}

          {/* Self-linking: Show matching employee first */}
          {isSelfLinking && matchingEmployee && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Found a matching employee record with your email:
                <div className="mt-2 font-medium">
                  {matchingEmployee.first_name} {matchingEmployee.last_name} 
                  <span className="ml-2 text-sm font-normal opacity-75">
                    ({matchingEmployee.employee_number})
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>
              {matchingEmployee && isSelfLinking ? 'Or select a different employee' : 'Select Employee'}
            </Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading employees...
              </div>
            ) : unlinkedEmployees && unlinkedEmployees.length > 0 ? (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee record" />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex flex-col">
                        <span>{emp.first_name} {emp.last_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {emp.employee_number} • {emp.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : !matchingEmployee ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No unlinked employee records found. 
                  {isSelfLinking 
                    ? ' Please contact your HR administrator to create or link your employee record.'
                    : ' All employees are already linked to user accounts.'
                  }
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          {!isHROrAdmin && isSelfLinking && !matchingEmployee && unlinkedEmployees && unlinkedEmployees.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you're unsure which record is yours, please contact your HR administrator for assistance.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!effectiveSelectedEmployee || linkMutation.isPending}
          >
            {linkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {matchingEmployee && !selectedEmployeeId ? 'Link Matching Record' : 'Link Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
