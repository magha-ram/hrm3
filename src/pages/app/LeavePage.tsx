import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Plus, Calendar, Loader2, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WriteGate, RoleGate } from '@/components/PermissionGate';
import { ModuleGuard } from '@/components/ModuleGuard';
import { useMyLeaveRequests, usePendingLeaveRequests, useApproveLeaveRequest, useRejectLeaveRequest, useCancelLeaveRequest } from '@/hooks/useLeave';
import { useMyLeaveBalances, useAllEmployeeLeaveBalances } from '@/hooks/useLeaveBalances';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';
import { LeaveBalanceCard } from '@/components/leave/LeaveBalanceCard';
import { LeaveBalanceTable } from '@/components/leave/LeaveBalanceTable';
import { TeamLeaveRequestRow } from '@/components/leave/TeamLeaveRequestRow';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-800',
};

export default function LeavePage() {
  const { data: myRequests, isLoading: loadingMy } = useMyLeaveRequests();
  const { data: pendingRequests, isLoading: loadingPending } = usePendingLeaveRequests();
  const { data: myBalances, isLoading: loadingBalances } = useMyLeaveBalances();
  const { data: allBalances, isLoading: loadingAllBalances } = useAllEmployeeLeaveBalances();
  const approveRequest = useApproveLeaveRequest();
  const rejectRequest = useRejectLeaveRequest();
  const cancelRequest = useCancelLeaveRequest();
  
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <ModuleGuard moduleId="leave">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Request and manage time off</p>
        </div>
        <WriteGate>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Leave Request</DialogTitle>
              </DialogHeader>
              <LeaveRequestForm onSuccess={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>
        </WriteGate>
      </div>

      <Tabs defaultValue="my-leave" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-leave">My Leave</TabsTrigger>
          <RoleGate role="manager">
            <TabsTrigger value="team">
              Team Requests
              {pendingRequests && pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
          </RoleGate>
          <RoleGate role="hr_manager">
            <TabsTrigger value="balances">All Balances</TabsTrigger>
          </RoleGate>
        </TabsList>

        <TabsContent value="my-leave" className="space-y-4">
          {/* Leave Balance Card */}
          <LeaveBalanceCard balances={myBalances} isLoading={loadingBalances} />

          <Card>
            <CardHeader>
              <CardTitle>My Leave Requests</CardTitle>
              <CardDescription>View and manage your leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMy ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : !myRequests?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No leave requests found.</p>
                </div>
              ) : (
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <Badge style={{ backgroundColor: (req as any).leave_type?.color }} variant="secondary">
                              {(req as any).leave_type?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{req.total_days}</TableCell>
                          <TableCell><Badge className={statusColors[req.status]}>{req.status}</Badge></TableCell>
                          <TableCell>
                            {req.review_notes ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-sm font-medium mb-1">Manager's notes:</p>
                                  <p className="text-sm">{req.review_notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {req.status === 'pending' && (
                              <WriteGate>
                                <Button variant="ghost" size="sm" onClick={() => cancelRequest.mutate(req.id)}>Cancel</Button>
                              </WriteGate>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <RoleGate role="manager">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Review and approve team leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPending ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : !pendingRequests?.length ? (
                  <div className="text-center py-12 text-muted-foreground"><p>No pending requests.</p></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((req) => (
                        <TeamLeaveRequestRow
                          key={req.id}
                          request={{
                            id: req.id,
                            start_date: req.start_date,
                            end_date: req.end_date,
                            total_days: req.total_days,
                            reason: req.reason,
                            employee: (req as any).employee,
                            leave_type: (req as any).leave_type,
                          }}
                          onApprove={(id) => approveRequest.mutate({ id })}
                          onReject={(id, reason) => rejectRequest.mutate({ id, review_notes: reason })}
                          isApproving={approveRequest.isPending}
                          isRejecting={rejectRequest.isPending}
                        />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </RoleGate>
        </TabsContent>

        <TabsContent value="balances">
          <RoleGate role="hr_manager">
            <LeaveBalanceTable data={allBalances} isLoading={loadingAllBalances} />
          </RoleGate>
        </TabsContent>
      </Tabs>
      </div>
    </ModuleGuard>
  );
}
