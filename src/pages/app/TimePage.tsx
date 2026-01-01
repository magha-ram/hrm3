import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Play, Square, CheckCircle2, Loader2, Calendar, AlertCircle, Coffee, MapPin, Timer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WriteGate } from '@/components/PermissionGate';
import { ModuleGuard } from '@/components/ModuleGuard';
import { useUserRole } from '@/hooks/useUserRole';
import { useTenant } from '@/contexts/TenantContext';
import { TimeCorrectionDialog } from '@/components/time/TimeCorrectionDialog';
import { 
  useTodayEntry, 
  useClockIn, 
  useClockOut, 
  useTimeSummary, 
  useMyTimeEntries,
  useTeamTimeEntries,
  useApproveTimeEntry,
  useActiveBreak,
  useStartBreak,
  useEndBreak,
  useTotalBreakDuration,
  getClockStatus,
  ClockStatus,
  GeoLocation
} from '@/hooks/useTimeTracking';
import { AttendanceReportCard } from '@/components/attendance/AttendanceReportCard';
import { WorkScheduleConfiguration } from '@/components/settings/WorkScheduleConfiguration';

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function formatElapsedTime(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - start) / 1000);
  
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function LocationBadge({ location }: { location: GeoLocation | null }) {
  if (!location) return null;
  
  const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a 
            href={mapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <MapPin className="h-3 w-3" />
            View
          </a>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lat: {location.latitude.toFixed(4)}</p>
          <p>Lng: {location.longitude.toFixed(4)}</p>
          {location.accuracy && <p>Accuracy: ±{Math.round(location.accuracy)}m</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function getStatusConfig(status: ClockStatus) {
  switch (status) {
    case 'clocked_in':
      return {
        label: 'Currently Working',
        color: 'bg-green-500/20 text-green-600',
        borderColor: 'border-green-500/50 bg-green-500/5',
        buttonLabel: 'Clock Out',
        buttonVariant: 'destructive' as const,
        buttonIcon: Square,
      };
    case 'on_break':
      return {
        label: 'On Break',
        color: 'bg-amber-500/20 text-amber-600',
        borderColor: 'border-amber-500/50 bg-amber-500/5',
        buttonLabel: 'Clock Out',
        buttonVariant: 'destructive' as const,
        buttonIcon: Square,
      };
    case 'clocked_out':
      return {
        label: 'Completed for Today',
        color: 'bg-blue-500/20 text-blue-600',
        borderColor: 'border-blue-500/50 bg-blue-500/5',
        buttonLabel: 'Day Complete',
        buttonVariant: 'secondary' as const,
        buttonIcon: CheckCircle2,
      };
    default:
      return {
        label: 'Not Started',
        color: 'bg-muted text-muted-foreground',
        borderColor: '',
        buttonLabel: 'Clock In',
        buttonVariant: 'default' as const,
        buttonIcon: Play,
      };
  }
}

export default function TimePage() {
  const { employeeId } = useTenant();
  const { isHROrAbove, isManager } = useUserRole();
  const { data: todayEntry, isLoading: todayLoading } = useTodayEntry();
  const { data: activeBreak } = useActiveBreak();
  const { todayHours, weekHours, monthHours, weekOvertime } = useTimeSummary();
  const { totalMinutes: breakMinutes, breakCount } = useTotalBreakDuration();
  const { data: myEntries = [], isLoading: entriesLoading } = useMyTimeEntries();
  const { data: teamEntries = [], isLoading: teamLoading } = useTeamTimeEntries();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();
  const approveEntry = useApproveTimeEntry();
  
  const [activeTab, setActiveTab] = useState('my');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [breakElapsed, setBreakElapsed] = useState('00:00');

  const clockStatus = getClockStatus(todayEntry, activeBreak);
  const statusConfig = getStatusConfig(clockStatus);
  const hasEmployeeRecord = !!employeeId;
  const isActionDisabled = clockIn.isPending || clockOut.isPending || todayLoading || !hasEmployeeRecord;
  const isBreakDisabled = startBreak.isPending || endBreak.isPending || !hasEmployeeRecord;

  // Live timer effect for work time
  useEffect(() => {
    if ((clockStatus !== 'clocked_in' && clockStatus !== 'on_break') || !todayEntry?.clock_in) {
      setElapsedTime('00:00:00');
      return;
    }

    setElapsedTime(formatElapsedTime(todayEntry.clock_in));

    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(todayEntry.clock_in!));
    }, 1000);

    return () => clearInterval(interval);
  }, [clockStatus, todayEntry?.clock_in]);

  // Live timer for active break
  useEffect(() => {
    if (!activeBreak?.break_start) {
      setBreakElapsed('00:00');
      return;
    }

    const updateBreakTime = () => {
      const start = new Date(activeBreak.break_start).getTime();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = elapsed % 60;
      setBreakElapsed(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateBreakTime();
    const interval = setInterval(updateBreakTime, 1000);
    return () => clearInterval(interval);
  }, [activeBreak?.break_start]);

  const handleClockAction = () => {
    if (clockStatus === 'clocked_out') return;
    
    if (clockStatus === 'clocked_in' || clockStatus === 'on_break') {
      clockOut.mutate();
    } else {
      clockIn.mutate();
    }
  };

  const handleBreakAction = () => {
    if (clockStatus === 'on_break') {
      endBreak.mutate();
    } else {
      startBreak.mutate();
    }
  };

  const pendingApprovals = teamEntries.filter(e => !e.is_approved && e.total_hours);

  return (
    <ModuleGuard moduleId="time_tracking">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Time Tracking</h1>
            <p className="text-muted-foreground">Track your work hours and attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <WriteGate>
              <TimeCorrectionDialog />
            </WriteGate>
            
            {/* Break Button - Only show when clocked in */}
            {(clockStatus === 'clocked_in' || clockStatus === 'on_break') && (
              <WriteGate>
                <Button
                  onClick={handleBreakAction}
                  disabled={isBreakDisabled}
                  variant={clockStatus === 'on_break' ? 'default' : 'outline'}
                  size="lg"
                >
                  {(startBreak.isPending || endBreak.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Coffee className="h-4 w-4 mr-2" />
                  )}
                  {clockStatus === 'on_break' ? 'End Break' : 'Start Break'}
                </Button>
              </WriteGate>
            )}

            <WriteGate>
              <Button 
                onClick={handleClockAction}
                disabled={isActionDisabled || clockStatus === 'clocked_out'}
                variant={statusConfig.buttonVariant}
                size="lg"
              >
                {(clockIn.isPending || clockOut.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <statusConfig.buttonIcon className="h-4 w-4 mr-2" />
                )}
                {statusConfig.buttonLabel}
              </Button>
            </WriteGate>
          </div>
        </div>

        {/* No Employee Record Warning */}
        {!hasEmployeeRecord && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Employee Record Found</AlertTitle>
            <AlertDescription>
              Your user account is not linked to an employee record. Please contact your HR administrator.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Status Card */}
        <Card className={statusConfig.borderColor}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${statusConfig.color}`}>
                  {clockStatus === 'on_break' ? <Coffee className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">{statusConfig.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {todayEntry?.clock_in ? (
                      <>
                        Clocked in at {format(new Date(todayEntry.clock_in), 'h:mm a')}
                        {todayEntry.clock_out && ` • Clocked out at ${format(new Date(todayEntry.clock_out), 'h:mm a')}`}
                      </>
                    ) : (
                      'No activity recorded today'
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {clockStatus === 'on_break' ? (
                  <>
                    <p className="text-2xl font-bold font-mono text-amber-600">{breakElapsed}</p>
                    <p className="text-xs text-muted-foreground">Break time</p>
                  </>
                ) : (clockStatus === 'clocked_in') ? (
                  <>
                    <p className="text-2xl font-bold font-mono text-green-600">{elapsedTime}</p>
                    <p className="text-xs text-muted-foreground">Time elapsed</p>
                  </>
                ) : todayEntry?.total_hours ? (
                  <>
                    <p className="text-2xl font-bold">{formatHours(todayEntry.total_hours)}</p>
                    <p className="text-xs text-muted-foreground">Today's total</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">--:--</p>
                    <p className="text-xs text-muted-foreground">Not started</p>
                  </>
                )}
              </div>
            </div>

            {/* Break Summary - Show when there are breaks */}
            {breakCount > 0 && (
              <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  <span>{breakCount} break{breakCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  <span>Total: {formatMinutes(breakMinutes)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today</CardDescription>
              <CardTitle className="text-2xl">{formatHours(todayHours)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-2xl">{formatHours(weekHours)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Month</CardDescription>
              <CardTitle className="text-2xl">{formatHours(monthHours)}</CardTitle>
            </CardHeader>
          </Card>
          <Card className={weekOvertime > 0 ? 'border-orange-500/50' : ''}>
            <CardHeader className="pb-2">
              <CardDescription>Week Overtime</CardDescription>
              <CardTitle className={`text-2xl ${weekOvertime > 0 ? 'text-orange-600' : ''}`}>
                {formatHours(weekOvertime)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my">My Time Entries</TabsTrigger>
            {(isHROrAbove || isManager) && (
              <TabsTrigger value="team">
                Team Entries
                {pendingApprovals.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingApprovals.length}</Badge>
                )}
              </TabsTrigger>
            )}
            {isHROrAbove && (
              <>
                <TabsTrigger value="reports">Reports</TabsTrigger>
                <TabsTrigger value="settings">Schedule</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="my" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>My Time Entries</CardTitle>
                <CardDescription>Your recent time entries</CardDescription>
              </CardHeader>
              <CardContent>
                {entriesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : myEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No time entries recorded yet.</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Break</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myEntries.slice(0, 20).map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {format(new Date(entry.date), 'EEE, MMM d')}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span>{entry.clock_in ? format(new Date(entry.clock_in), 'h:mm a') : '-'}</span>
                                {entry.clock_in_location && (
                                  <LocationBadge location={entry.clock_in_location as unknown as GeoLocation} />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span>{entry.clock_out ? format(new Date(entry.clock_out), 'h:mm a') : '-'}</span>
                                {entry.clock_out_location && (
                                  <LocationBadge location={entry.clock_out_location as unknown as GeoLocation} />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {entry.break_minutes ? `${entry.break_minutes}m` : '-'}
                            </TableCell>
                            <TableCell>
                              {entry.total_hours ? formatHours(entry.total_hours) : '-'}
                            </TableCell>
                            <TableCell>
                              {entry.overtime_hours && entry.overtime_hours > 0 ? (
                                <Badge variant="outline" className="text-orange-600 border-orange-500/50">
                                  +{formatHours(entry.overtime_hours)}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              {entry.is_approved ? (
                                <Badge variant="default" className="bg-green-500/10 text-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : entry.total_hours ? (
                                <Badge variant="secondary">Pending</Badge>
                              ) : (
                                <Badge variant="outline">In Progress</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {(isHROrAbove || isManager) && (
            <TabsContent value="team" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Time Entries</CardTitle>
                  <CardDescription>Review and approve team time entries</CardDescription>
                </CardHeader>
                <CardContent>
                  {teamLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : teamEntries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No team time entries found.</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Clock In</TableHead>
                            <TableHead>Hours</TableHead>
                            <TableHead>Overtime</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamEntries.slice(0, 30).map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-medium">
                                {(entry.employee as any)?.first_name} {(entry.employee as any)?.last_name}
                              </TableCell>
                              <TableCell>
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span>{entry.clock_in ? format(new Date(entry.clock_in), 'h:mm a') : '-'}</span>
                                  {entry.clock_in_location && (
                                    <LocationBadge location={entry.clock_in_location as unknown as GeoLocation} />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {entry.total_hours ? formatHours(entry.total_hours) : '-'}
                              </TableCell>
                              <TableCell>
                                {entry.overtime_hours && entry.overtime_hours > 0 ? (
                                  <Badge variant="outline" className="text-orange-600 border-orange-500/50">
                                    +{formatHours(entry.overtime_hours)}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell>
                                {entry.is_approved ? (
                                  <Badge variant="default" className="bg-green-500/10 text-green-600">
                                    Approved
                                  </Badge>
                                ) : entry.total_hours ? (
                                  <Badge variant="secondary">Pending</Badge>
                                ) : (
                                  <Badge variant="outline">In Progress</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {!entry.is_approved && entry.total_hours && (
                                  <WriteGate>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => approveEntry.mutate(entry.id)}
                                      disabled={approveEntry.isPending}
                                    >
                                      Approve
                                    </Button>
                                  </WriteGate>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isHROrAbove && (
            <TabsContent value="reports" className="mt-4">
              <AttendanceReportCard />
            </TabsContent>
          )}

          {isHROrAbove && (
            <TabsContent value="settings" className="mt-4">
              <WorkScheduleConfiguration />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ModuleGuard>
  );
}
