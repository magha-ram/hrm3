import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Calendar, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { format, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import { useTeamTimeEntries } from '@/hooks/useTimeTracking';
import { useTeamLeaveRequests } from '@/hooks/useLeave';
import { PayrollEntryWithEmployee } from '@/hooks/usePayroll';

interface AttendanceData {
  employeeId: string;
  employeeName: string;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  unpaidLeaveDays: number;
  totalHours: number;
  hasIncompleteData: boolean;
}

interface Props {
  periodStart: string;
  periodEnd: string;
  entries: PayrollEntryWithEmployee[];
}

export function PayrollAttendanceSummary({ periodStart, periodEnd, entries }: Props) {
  const { data: timeEntries, isLoading: loadingTime } = useTeamTimeEntries(periodStart, periodEnd);
  const { data: leaveRequests, isLoading: loadingLeave } = useTeamLeaveRequests();

  // Calculate working days in period
  const workingDays = useMemo(() => {
    const start = parseISO(periodStart);
    const end = parseISO(periodEnd);
    const days = eachDayOfInterval({ start, end });
    return days.filter(day => !isWeekend(day)).length;
  }, [periodStart, periodEnd]);

  // Calculate attendance summary per employee
  const attendanceData = useMemo((): AttendanceData[] => {
    if (!entries || !timeEntries) return [];

    return entries.map(entry => {
      const employee = entry.employee;
      if (!employee) return null;

      // Get time entries for this employee
      const empTimeEntries = timeEntries.filter(te => te.employee_id === entry.employee_id);
      
      // Get approved unpaid leave for this employee in this period
      const unpaidLeaves = leaveRequests?.filter(lr => 
        lr.employee_id === entry.employee_id &&
        lr.status === 'approved' &&
        (lr.leave_type as any)?.is_paid === false &&
        lr.start_date >= periodStart &&
        lr.end_date <= periodEnd
      ) || [];

      const unpaidLeaveDays = unpaidLeaves.reduce((sum, lr) => sum + lr.total_days, 0);

      // Calculate attendance metrics
      const daysPresent = empTimeEntries.filter(e => e.total_hours && e.total_hours > 0).length;
      const daysLate = empTimeEntries.filter(e => (e.late_minutes || 0) > 0).length;
      const totalHours = empTimeEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
      const daysAbsent = Math.max(0, workingDays - daysPresent - unpaidLeaveDays);

      // Check if attendance data seems incomplete
      const hasIncompleteData = daysPresent < workingDays * 0.5 && daysAbsent > workingDays * 0.3;

      return {
        employeeId: entry.employee_id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        daysPresent,
        daysAbsent,
        daysLate,
        unpaidLeaveDays,
        totalHours: Math.round(totalHours * 10) / 10,
        hasIncompleteData,
      };
    }).filter(Boolean) as AttendanceData[];
  }, [entries, timeEntries, leaveRequests, workingDays, periodStart, periodEnd]);

  // Check for warnings
  const warnings = useMemo(() => {
    const issues: string[] = [];
    
    const incompleteCount = attendanceData.filter(a => a.hasIncompleteData).length;
    if (incompleteCount > 0) {
      issues.push(`${incompleteCount} employee${incompleteCount > 1 ? 's' : ''} may have incomplete attendance data`);
    }

    const unpaidLeaveEmployees = attendanceData.filter(a => a.unpaidLeaveDays > 0).length;
    if (unpaidLeaveEmployees > 0) {
      issues.push(`${unpaidLeaveEmployees} employee${unpaidLeaveEmployees > 1 ? 's' : ''} have unpaid leave that may affect pay`);
    }

    return issues;
  }, [attendanceData]);

  const isLoading = loadingTime || loadingLeave;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (attendanceData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attendance Summary
        </CardTitle>
        <CardDescription>
          Attendance data for payroll period ({format(parseISO(periodStart), 'MMM d')} - {format(parseISO(periodEnd), 'MMM d, yyyy')})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention Required</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-1">
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold">{workingDays}</p>
            <p className="text-xs text-muted-foreground">Working Days</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold">{attendanceData.length}</p>
            <p className="text-xs text-muted-foreground">Employees</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold text-amber-600">
              {attendanceData.reduce((sum, a) => sum + a.unpaidLeaveDays, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Unpaid Leave Days</p>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="max-h-[300px] overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Unpaid Leave</TableHead>
                <TableHead className="text-center">Hours</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map(data => (
                <TableRow key={data.employeeId} className={data.hasIncompleteData ? 'bg-amber-50/50' : ''}>
                  <TableCell className="font-medium">{data.employeeName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {data.daysPresent}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {data.daysLate > 0 ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {data.daysLate}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.daysAbsent > 0 ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {data.daysAbsent}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.unpaidLeaveDays > 0 ? (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {data.unpaidLeaveDays}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{data.totalHours}h</TableCell>
                  <TableCell className="text-center">
                    {data.hasIncompleteData ? (
                      <span title="Incomplete data">
                        <XCircle className="h-4 w-4 text-amber-500 mx-auto" />
                      </span>
                    ) : (
                      <span title="Data complete">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
