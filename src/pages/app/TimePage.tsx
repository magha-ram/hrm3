import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Square } from 'lucide-react';

export default function TimePage() {
  const { isFrozen } = useTenant();
  const canEdit = !isFrozen;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground">Track your work hours and attendance</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline">
              <Play className="h-4 w-4 mr-2" />
              Clock In
            </Button>
            <Button variant="outline">
              <Square className="h-4 w-4 mr-2" />
              Clock Out
            </Button>
          </div>
        )}
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-2xl">0h 0m</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Week</CardDescription>
            <CardTitle className="text-2xl">0h 0m</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">0h 0m</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>Your recent time entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No time entries recorded yet.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
