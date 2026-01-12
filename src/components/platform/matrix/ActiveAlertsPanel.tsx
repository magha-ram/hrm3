import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { useAlertHistory, useAcknowledgeAlert, useResolveAlert } from '@/hooks/useAlertRules';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function ActiveAlertsPanel() {
  const { data: alerts, isLoading } = useAlertHistory({ unresolvedOnly: true, limit: 20 });
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleResolve = () => {
    if (!resolvingAlert) return;
    resolveAlert.mutate(
      { alertId: resolvingAlert, notes: resolutionNotes },
      {
        onSuccess: () => {
          setResolvingAlert(null);
          setResolutionNotes('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalAlerts = alerts?.filter(a => a.severity === 'critical') || [];
  const warningAlerts = alerts?.filter(a => a.severity === 'warning') || [];
  const infoAlerts = alerts?.filter(a => a.severity === 'info') || [];

  const sortedAlerts = [...criticalAlerts, ...warningAlerts, ...infoAlerts];

  return (
    <>
      <Card className={cn(
        criticalAlerts.length > 0 && 'border-red-500',
        criticalAlerts.length === 0 && warningAlerts.length > 0 && 'border-yellow-500'
      )}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className={cn(
              'h-5 w-5',
              criticalAlerts.length > 0 ? 'text-red-500' :
              warningAlerts.length > 0 ? 'text-yellow-500' : 'text-muted-foreground'
            )} />
            Active Alerts
            {sortedAlerts.length > 0 && (
              <Badge variant="destructive">{sortedAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {sortedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
              <p className="text-lg font-medium">All Systems Operational</p>
              <p className="text-sm text-muted-foreground">No active alerts at this time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    alert.severity === 'critical' && 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50',
                    alert.severity === 'warning' && 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/50',
                    alert.severity === 'info' && 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'warning' ? 'secondary' : 'outline'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {alert.module}
                        </span>
                        {alert.is_acknowledged && (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm mb-2">{alert.message}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                        </span>
                        <span>
                          Value: {alert.metric_value} (threshold: {alert.threshold})
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {!alert.is_acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert.mutate(alert.id)}
                          disabled={acknowledgeAlert.isPending}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ack
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setResolvingAlert(alert.id)}
                      >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Resolve Dialog */}
      <Dialog open={!!resolvingAlert} onOpenChange={() => setResolvingAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Resolution Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Describe how this alert was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolvingAlert(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleResolve}
              disabled={resolveAlert.isPending}
            >
              {resolveAlert.isPending ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
