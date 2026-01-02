import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
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
import { toast } from 'sonner';
import { Link2, Loader2, UserPlus } from 'lucide-react';

interface LinkEmployeeDialogProps {
  userId: string;
  onSuccess?: () => void;
}

export function LinkEmployeeDialog({ userId, onSuccess }: LinkEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const { companyId } = useTenant();
  const queryClient = useQueryClient();

  // Fetch unlinked employees
  const { data: unlinkedEmployees, isLoading } = useQuery({
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

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !selectedEmployeeId) {
        throw new Error('Missing required data');
      }

      const { data, error } = await supabase.rpc('link_user_to_employee', {
        _user_id: userId,
        _employee_id: selectedEmployeeId,
        _company_id: companyId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-employee-record'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-employees'] });
      toast.success('Account linked to employee record');
      setOpen(false);
      setSelectedEmployeeId('');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to link account');
    },
  });

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
            Select an existing employee record to link to your user account. This will give you access to your salary information, payslips, and attendance data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Employee</Label>
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
            ) : (
              <p className="text-sm text-muted-foreground">
                No unlinked employee records found. Contact your HR administrator.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => linkMutation.mutate()}
            disabled={!selectedEmployeeId || linkMutation.isPending}
          >
            {linkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Link Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
