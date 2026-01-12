import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusIndicator } from './StatusIndicator';
import { MetricTrendArrow } from './MetricTrendArrow';
import { ModuleIcon } from './ModuleIcon';
import { useSystemMetricsHistory, type ModuleMetrics } from '@/hooks/useSystemMetrics';
import { useAlertHistory } from '@/hooks/useAlertRules';
import { format } from 'date-fns';
import { AlertTriangle, Clock, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ModuleDetailModalProps {
  module: ModuleMetrics | null;
  open: boolean;
  onClose: () => void;
}

export function ModuleDetailModal({ module, open, onClose }: ModuleDetailModalProps) {
  const { data: errorRateHistory } = useSystemMetricsHistory(
    module?.name || '',
    'error_rate',
    24
  );
  
  const { data: moduleAlerts } = useAlertHistory({
    module: module?.name,
    limit: 10,
  });

  if (!module) return null;

  const chartData = errorRateHistory?.map(m => ({
    time: format(new Date(m.collected_at), 'HH:mm'),
    value: m.metric_value,
  })) || [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ModuleIcon icon={module.icon} size="lg" />
            <span>{module.displayName}</span>
            <StatusIndicator status={module.isEnabled ? module.status : 'disabled'} />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Usage"
              value={module.metrics.usagePercent !== null 
                ? `${module.metrics.usagePercent.toFixed(1)}%` 
                : 'N/A'}
              trend={module.trend}
            />
            <MetricCard
              label="Error Rate"
              value={module.metrics.errorRate !== null 
                ? `${module.metrics.errorRate.toFixed(2)}%` 
                : 'N/A'}
              trend={module.trend}
            />
            <MetricCard
              label="Latency"
              value={module.metrics.latencyMs !== null 
                ? `${module.metrics.latencyMs.toFixed(0)}ms` 
                : 'N/A'}
            />
            <MetricCard
              label="Failures (24h)"
              value={module.metrics.failures24h.toString()}
              isHighlighted={module.metrics.failures24h > 0}
            />
          </div>
          
          {/* Capacity Info */}
          {module.metrics.totalCapacity && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">Capacity</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">{module.metrics.totalCapacity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Used</p>
                    <p className="text-lg font-semibold">{module.metrics.used || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold">{module.metrics.remaining || '-'}</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                {module.metrics.usagePercent !== null && (
                  <div className="mt-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          module.metrics.usagePercent > 90 ? 'bg-red-500' :
                          module.metrics.usagePercent > 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(module.metrics.usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Error Rate Chart */}
          {chartData.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Error Rate (Last 24h)
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
          
          {/* Recent Alerts */}
          {moduleAlerts && moduleAlerts.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Recent Alerts
                </h4>
                <div className="space-y-2">
                  {moduleAlerts.slice(0, 5).map((alert) => (
                    <div 
                      key={alert.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'warning' ? 'secondary' : 'outline'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-sm">{alert.message}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(alert.triggered_at), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Last Incident */}
          {module.metrics.lastIncident && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last incident: {format(new Date(module.metrics.lastIncident), 'MMM d, yyyy HH:mm')}
            </div>
          )}
          
          {/* Last Updated */}
          {module.lastUpdated && (
            <div className="text-xs text-muted-foreground">
              Data last collected: {format(new Date(module.lastUpdated), 'MMM d, yyyy HH:mm:ss')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ 
  label, 
  value, 
  trend,
  isHighlighted 
}: { 
  label: string; 
  value: string; 
  trend?: 'up' | 'down' | 'stable';
  isHighlighted?: boolean;
}) {
  return (
    <Card className={isHighlighted ? 'border-yellow-500' : ''}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center justify-between">
          <span className={`text-xl font-semibold ${isHighlighted ? 'text-yellow-500' : ''}`}>
            {value}
          </span>
          {trend && <MetricTrendArrow trend={trend} size="sm" />}
        </div>
      </CardContent>
    </Card>
  );
}
