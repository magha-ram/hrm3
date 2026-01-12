import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMatrixData, useCollectMetrics, type ModuleMetrics } from '@/hooks/useSystemMetrics';
import { StatusIndicator, StatusDot } from './StatusIndicator';
import { MetricTrendArrow } from './MetricTrendArrow';
import { ModuleIcon } from './ModuleIcon';
import { ModuleDetailModal } from './ModuleDetailModal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SystemMatrixGridProps {
  onAlertClick?: () => void;
}

export function SystemMatrixGrid({ onAlertClick }: SystemMatrixGridProps) {
  const [refreshInterval, setRefreshInterval] = useState(60000);
  const [selectedModule, setSelectedModule] = useState<ModuleMetrics | null>(null);
  
  const { data: matrixData, isLoading, refetch, isRefetching } = useMatrixData(refreshInterval);
  const collectMetrics = useCollectMetrics();

  const handleExportCSV = () => {
    if (!matrixData) return;
    
    const headers = ['Module', 'Status', 'Capacity', 'Used', 'Remaining', 'Usage %', 'Error Rate', 'Latency (ms)', 'Failures (1h)', 'Failures (24h)', 'Upgrade Recommended', 'Last Incident'];
    const rows = matrixData.modules.map(m => [
      m.displayName,
      m.status,
      m.metrics.totalCapacity || '-',
      m.metrics.used || '-',
      m.metrics.remaining || '-',
      m.metrics.usagePercent?.toFixed(1) || '-',
      m.metrics.errorRate?.toFixed(2) || '-',
      m.metrics.latencyMs?.toFixed(0) || '-',
      m.metrics.failures1h,
      m.metrics.failures24h,
      m.metrics.upgradeRecommended ? 'Yes' : 'No',
      m.metrics.lastIncident ? format(new Date(m.metrics.lastIncident), 'MMM d, HH:mm') : '-',
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-matrix-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">System Matrix</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {matrixData?.lastUpdated 
                ? format(new Date(matrixData.lastUpdated), 'MMM d, yyyy HH:mm:ss') 
                : 'Never'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Summary badges */}
            {matrixData && (
              <div className="hidden md:flex items-center gap-3 mr-4">
                <div className="flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{matrixData.summary.healthy}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>{matrixData.summary.warning}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span>{matrixData.summary.critical}</span>
                </div>
              </div>
            )}
            
            {/* Active alerts button */}
            {matrixData && matrixData.alerts.active > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onAlertClick}
                className="animate-pulse"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                {matrixData.alerts.unacknowledged} Alerts
              </Button>
            )}
            
            {/* Refresh interval selector */}
            <Select 
              value={refreshInterval.toString()} 
              onValueChange={(v) => setRefreshInterval(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30000">30s</SelectItem>
                <SelectItem value="60000">1 min</SelectItem>
                <SelectItem value="300000">5 min</SelectItem>
                <SelectItem value="0">Manual</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Manual refresh */}
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            </Button>
            
            {/* Collect metrics */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => collectMetrics.mutate()}
              disabled={collectMetrics.isPending}
            >
              {collectMetrics.isPending ? 'Collecting...' : 'Collect Now'}
            </Button>
            
            {/* Export */}
            <Button variant="outline" size="icon" onClick={handleExportCSV}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[200px]">Module</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Usage %</TableHead>
                  <TableHead>Error Rate</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Failures (1h)</TableHead>
                  <TableHead>Failures (24h)</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Upgrade?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrixData?.modules.map((module) => (
                  <TableRow 
                    key={module.name}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50 transition-colors',
                      !module.isEnabled && 'opacity-50'
                    )}
                    onClick={() => setSelectedModule(module)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ModuleIcon icon={module.icon} size="sm" />
                        <span className="font-medium">{module.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator 
                        status={module.isEnabled ? module.status : 'disabled'} 
                        size="sm" 
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {module.metrics.totalCapacity || '-'}
                    </TableCell>
                    <TableCell>{module.metrics.used || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {module.metrics.remaining || '-'}
                    </TableCell>
                    <TableCell>
                      {module.metrics.usagePercent !== null ? (
                        <span className={cn(
                          module.metrics.usagePercent > 90 && 'text-red-500 font-medium',
                          module.metrics.usagePercent > 75 && module.metrics.usagePercent <= 90 && 'text-yellow-500'
                        )}>
                          {module.metrics.usagePercent.toFixed(1)}%
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {module.metrics.errorRate !== null ? (
                        <span className={cn(
                          module.metrics.errorRate > 5 && 'text-red-500 font-medium',
                          module.metrics.errorRate > 2 && module.metrics.errorRate <= 5 && 'text-yellow-500'
                        )}>
                          {module.metrics.errorRate.toFixed(2)}%
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {module.metrics.latencyMs !== null ? (
                        <span className={cn(
                          module.metrics.latencyMs > 2000 && 'text-red-500 font-medium',
                          module.metrics.latencyMs > 500 && module.metrics.latencyMs <= 2000 && 'text-yellow-500'
                        )}>
                          {module.metrics.latencyMs.toFixed(0)}ms
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        module.metrics.failures1h > 0 && 'text-yellow-500'
                      )}>
                        {module.metrics.failures1h}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        module.metrics.failures24h > 5 && 'text-red-500 font-medium',
                        module.metrics.failures24h > 0 && module.metrics.failures24h <= 5 && 'text-yellow-500'
                      )}>
                        {module.metrics.failures24h}
                      </span>
                    </TableCell>
                    <TableCell>
                      <MetricTrendArrow trend={module.trend} size="sm" />
                    </TableCell>
                    <TableCell>
                      {module.metrics.upgradeRecommended ? (
                        <span className="text-yellow-500 font-medium">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Module Detail Modal */}
      <ModuleDetailModal 
        module={selectedModule}
        open={!!selectedModule}
        onClose={() => setSelectedModule(null)}
      />
    </>
  );
}
