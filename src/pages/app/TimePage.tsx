import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Play, Square, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ModuleGate, WriteGate, RoleGate } from '@/components/PermissionGate';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  useTodayEntry, 
  useClockIn, 
  useClockOut, 
  useTimeSummary, 
  useMyTimeEntries,
  useTeamTimeEntries,
  useApproveTimeEntry 
} from '@/hooks/useTimeTracking';

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export default function TimePage() {
  const { isHROrAbove, isManager } = useUserRole();
  const { data: todayEntry, isLoading: todayLoading } = useTodayEntry();
  const { todayHours, weekHours, monthHours } = useTimeSummary();
  const { data: myEntries = [], isLoading: entriesLoading } = useMyTimeEntries();
  const { data: teamEntries = [], isLoading: teamLoading } = useTeamTimeEntries();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const approveEntry = useApproveTimeEntry();
  
  const [activeTab, setActiveTab] = useState('my');

  const isClockedIn = todayEntry?.clock_in && !todayEntry?.clock_out;

  const handleClockAction = () => {
    if (isClockedIn) {
      clockOut.mutate();
    } else {
      clockIn.mutate();
    }
  };

  const pendingApprovals = teamEntries.filter(e => !e.is_approved && e.total_hours);

  return (
    <ModuleGate module="time_tracking">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Time Tracking</h1>
            <p className="text-muted-foreground">Track your work hours and attendance</p>
          </div>
          <WriteGate>
            <Button 
              onClick={handleClockAction}
              disabled={clockIn.isPending || clockOut.isPending || todayLoading}
              variant={isClockedIn ? 'destructive' : 'default'}
              size="lg"
            >
              {(clockIn.isPending || clockOut.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isClockedIn ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </Button>
          </WriteGate>
        </div>

        {/* Current Status */}
        {todayEntry?.clock_in && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isClockedIn ? 'bg-green-500/20 text-green-600' : 'bg-muted'}`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isClockedIn ? 'Currently Working' : 'Completed for Today'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Clocked in at {format(new Date(todayEntry.clock_in), 'h:mm a')}
                      {todayEntry.clock_out && ` • Clocked out at ${format(new Date(todayEntry.clock_out), 'h:mm a')}`}
                    </p>
                  </div>
                </div>
                {todayEntry.total_hours && (
                  <div className="text-right">
                    <p className="text-2xl font-bold">{formatHours(todayEntry.total_hours)}</p>
                    <p className="text-xs text-muted-foreground">Today's total</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <TableHead>Hours</TableHead>
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
                              {entry.clock_in ? format(new Date(entry.clock_in), 'h:mm a') : '-'}
                            </TableCell>
                            <TableCell>
                              {entry.clock_out ? format(new Date(entry.clock_out), 'h:mm a') : '-'}
                            </TableCell>
                            <TableCell>
                              {entry.total_hours ? formatHours(entry.total_hours) : '-'}
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
                            <TableHead>Hours</TableHead>
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
                                {entry.total_hours ? formatHours(entry.total_hours) : '-'}
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
        </Tabs>
      </div>
    </ModuleGate>
  );
}
