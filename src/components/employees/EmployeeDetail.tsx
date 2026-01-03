import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Edit2, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Employee } from '@/hooks/useEmployees';
import { EducationSection } from './EducationSection';
import { ExperienceSection } from './ExperienceSection';
import { SalarySection } from './SalarySection';
import { LeaveBalanceCard } from '@/components/leave/LeaveBalanceCard';
import { useEmployeeLeaveBalances } from '@/hooks/useLeaveBalances';
import { useCurrentEmployeeShift, useEmployeeShiftAssignments } from '@/hooks/useShifts';
import { EmergencyContactSection, type EmergencyContact } from './EmergencyContactSection';
import { BankDetailsSection, type BankDetails } from './BankDetailsSection';
import { ShiftAssignmentDialog } from './ShiftAssignmentDialog';
import { PromotionDialog } from './PromotionDialog';
import { DAY_LABELS, type DayOfWeek } from '@/types/shifts';
import { useLatestEmploymentHistory } from '@/hooks/useEmploymentHistory';
import { useSalaryHistory } from '@/hooks/useSalaryHistory';

interface EmployeeDetailProps {
  employee: Employee & {
    department?: { id: string; name: string } | null;
    manager?: { id: string; first_name: string; last_name: string } | null;
  };
  canEdit?: boolean;
}

export function EmployeeDetail({ employee, canEdit = false }: EmployeeDetailProps) {
  const { data: leaveBalances, isLoading: loadingBalances } = useEmployeeLeaveBalances(employee.id);
  const { data: currentShift } = useCurrentEmployeeShift(employee.id);
  const { data: shiftHistory } = useEmployeeShiftAssignments(employee.id);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  
  // Get employment and salary history for promotion/increment dates
  const { lastPromotion } = useLatestEmploymentHistory(employee.id);
  const { data: salaryHistory } = useSalaryHistory(employee.id);
  
  // Find last increment from salary history
  const lastIncrement = salaryHistory?.find(s => 
    s.reason === 'Annual Increment' || s.reason === 'Promotion' || s.reason === 'Salary Adjustment'
  );
  
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
    terminated: 'bg-red-100 text-red-800',
    suspended: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Header */}
      <div className="flex items-start justify-between">
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
        
        {canEdit && (
          <Button variant="outline" onClick={() => setPromotionDialogOpen(true)}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Promote
          </Button>
        )}
      </div>
      
      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Calendar className="h-3 w-3" />
            Hire Date
          </div>
          <p className="font-medium text-sm">{format(new Date(employee.hire_date), 'MMM d, yyyy')}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <TrendingUp className="h-3 w-3" />
            Last Promotion
          </div>
          <p className="font-medium text-sm">
            {lastPromotion ? format(new Date(lastPromotion.effective_from), 'MMM d, yyyy') : 'N/A'}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="h-3 w-3" />
            Last Increment
          </div>
          <p className="font-medium text-sm">
            {lastIncrement ? format(new Date(lastIncrement.effective_from), 'MMM d, yyyy') : 'N/A'}
          </p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Clock className="h-3 w-3" />
            Current Shift
          </div>
          <p className="font-medium text-sm">{currentShift?.shift?.name || 'Not assigned'}</p>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="shift">Shift</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-4">
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

          {/* Emergency Contact - Read Only */}
          {employee.emergency_contact && Object.keys(employee.emergency_contact).length > 0 && (
            <>
              <Separator />
              <EmergencyContactSection
                value={employee.emergency_contact as EmergencyContact}
                onChange={() => {}}
                disabled
              />
            </>
          )}

          {/* Bank Details - Read Only */}
          {employee.bank_details && Object.keys(employee.bank_details).length > 0 && (
            <BankDetailsSection
              value={employee.bank_details as BankDetails}
              onChange={() => {}}
              disabled
            />
          )}
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <SalarySection employeeId={employee.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="shift" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Current Shift
              </CardTitle>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setShiftDialogOpen(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Change Shift
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {currentShift ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{currentShift.shift.name}</span>
                    {currentShift.is_temporary && (
                      <Badge variant="outline">Temporary</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(`2000-01-01T${currentShift.shift.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${currentShift.shift.end_time}`), 'h:mm a')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Break: {currentShift.shift.break_duration_minutes} min | Grace: {currentShift.shift.grace_period_minutes} min
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {(currentShift.shift.applicable_days as DayOfWeek[]).map((day) => (
                      <Badge key={day} variant="secondary" className="text-xs">
                        {DAY_LABELS[day]}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Effective since {format(new Date(currentShift.effective_from), 'MMM d, yyyy')}
                    {currentShift.effective_to && ` until ${format(new Date(currentShift.effective_to), 'MMM d, yyyy')}`}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No shift assigned</p>
              )}
            </CardContent>
          </Card>

          {shiftHistory && shiftHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Shift History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shiftHistory.slice(1).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm">{assignment.shift.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(assignment.effective_from), 'MMM d, yyyy')}
                          {assignment.effective_to && ` - ${format(new Date(assignment.effective_to), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      {assignment.is_temporary && (
                        <Badge variant="outline" className="text-xs">Temporary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <ShiftAssignmentDialog
            open={shiftDialogOpen}
            onOpenChange={setShiftDialogOpen}
            employeeId={employee.id}
            employeeName={`${employee.first_name} ${employee.last_name}`}
          />
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <LeaveBalanceCard 
            balances={leaveBalances} 
            isLoading={loadingBalances}
            title={`${employee.first_name}'s Leave Balances`}
          />
        </TabsContent>

        <TabsContent value="education" className="mt-4">
          <EducationSection employeeId={employee.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="experience" className="mt-4">
          <ExperienceSection employeeId={employee.id} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
      
      <PromotionDialog
        open={promotionDialogOpen}
        onOpenChange={setPromotionDialogOpen}
        employee={employee}
      />
    </div>
  );
}
