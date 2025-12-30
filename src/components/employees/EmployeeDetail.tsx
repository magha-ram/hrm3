import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type { Employee } from '@/hooks/useEmployees';

interface EmployeeDetailProps {
  employee: Employee & {
    department?: { id: string; name: string } | null;
    manager?: { id: string; first_name: string; last_name: string } | null;
  };
}

export function EmployeeDetail({ employee }: EmployeeDetailProps) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
    terminated: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">
            {employee.first_name[0]}{employee.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-semibold">
            {employee.first_name} {employee.last_name}
          </h3>
          <p className="text-muted-foreground">{employee.job_title || 'No title'}</p>
          <div className="flex gap-2 mt-1">
            <Badge className={statusColors[employee.employment_status]} variant="secondary">
              {employee.employment_status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {employee.employment_type.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Employee Number</label>
          <p className="mt-1">{employee.employee_number}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Work Email</label>
          <p className="mt-1">{employee.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Phone</label>
          <p className="mt-1">{employee.phone || '-'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Personal Email</label>
          <p className="mt-1">{employee.personal_email || '-'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Department</label>
          <p className="mt-1">{employee.department?.name || '-'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Manager</label>
          <p className="mt-1">
            {employee.manager 
              ? `${employee.manager.first_name} ${employee.manager.last_name}` 
              : '-'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
          <p className="mt-1">{format(new Date(employee.hire_date), 'MMM d, yyyy')}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Work Location</label>
          <p className="mt-1">{employee.work_location || '-'}</p>
        </div>
      </div>

      {employee.date_of_birth && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
              <p className="mt-1">{format(new Date(employee.date_of_birth), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gender</label>
              <p className="mt-1">{employee.gender || '-'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
