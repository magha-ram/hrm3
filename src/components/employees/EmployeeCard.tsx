import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Eye, Pencil, Trash2, Mail, Phone, Loader2 } from 'lucide-react';
import { WriteGate, PermGate } from '@/components/PermissionGate';
import { usePermission } from '@/contexts/PermissionContext';
import { type Employee } from '@/hooks/useEmployees';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmployeeCardProps {
  employee: Employee & { department?: { name: string } | null };
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  on_leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
];

export function EmployeeCard({ employee, onView, onEdit, onDelete }: EmployeeCardProps) {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('employees')
        .update({ employment_status: newStatus as 'active' | 'on_leave' | 'terminated' | 'suspended' })
        .eq('id', employee.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status');
      console.error(error);
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'terminated') {
      setPendingStatus(newStatus);
      setShowTerminateConfirm(true);
    } else {
      updateStatus.mutate(newStatus);
    }
  };

  const confirmTerminate = () => {
    if (pendingStatus) {
      updateStatus.mutate(pendingStatus);
    }
    setShowTerminateConfirm(false);
    setPendingStatus(null);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {employee.first_name[0]}{employee.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{employee.first_name} {employee.last_name}</h3>
                <p className="text-sm text-muted-foreground">{employee.job_title || 'No title'}</p>
              </div>
            </div>
            
            {can('employees', 'read') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(employee)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <PermGate module="employees" action="update">
                    <WriteGate>
                      <DropdownMenuItem onClick={() => onEdit(employee)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </WriteGate>
                  </PermGate>
                  <PermGate module="employees" action="delete">
                    <WriteGate>
                      <DropdownMenuItem 
                        onClick={() => onDelete(employee.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </WriteGate>
                  </PermGate>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{employee.phone}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs">
              {(employee as any).department?.name || 'No Department'}
            </Badge>
            
            <PermGate module="employees" action="update">
              <WriteGate fallback={
                <Badge className={statusColors[employee.employment_status] || ''} variant="secondary">
                  {employee.employment_status.replace('_', ' ')}
                </Badge>
              }>
                <Select 
                  value={employee.employment_status} 
                  onValueChange={handleStatusChange}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="h-7 w-[110px] text-xs">
                    {updateStatus.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.value === 'terminated' ? 'text-destructive' : ''}>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </WriteGate>
            </PermGate>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showTerminateConfirm} onOpenChange={setShowTerminateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Termination</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {employee.first_name} {employee.last_name} as terminated?
              This action can be reversed later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTerminate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}