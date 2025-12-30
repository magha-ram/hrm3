import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WriteGate, RoleGate } from '@/components/PermissionGate';

export default function LeavePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Request and manage time off</p>
        </div>
        <WriteGate>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </WriteGate>
      </div>

      <Tabs defaultValue="my-leave" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-leave">My Leave</TabsTrigger>
          <RoleGate role="manager">
            <TabsTrigger value="team">Team Requests</TabsTrigger>
          </RoleGate>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="my-leave">
          <Card>
            <CardHeader>
              <CardTitle>My Leave Requests</CardTitle>
              <CardDescription>View and manage your leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No leave requests found.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <RoleGate role="manager">
            <Card>
              <CardHeader>
                <CardTitle>Team Leave Requests</CardTitle>
                <CardDescription>Approve or reject leave requests from your team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>No pending requests from your team.</p>
                </div>
              </CardContent>
            </Card>
          </RoleGate>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Leave Calendar</CardTitle>
              <CardDescription>View team availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Calendar view coming soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
