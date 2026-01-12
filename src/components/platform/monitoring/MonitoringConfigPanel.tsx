import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Save, RefreshCw } from 'lucide-react';
import { useMonitoringConfig, useUpdateMonitoringConfig, useCollectMetrics } from '@/hooks/useSystemMetrics';
import { useProcessAlerts } from '@/hooks/useAlertRules';
import { ModuleIcon } from '../matrix/ModuleIcon';
import { useState } from 'react';
import { toast } from 'sonner';

export function MonitoringConfigPanel() {
  const { data: configs, isLoading, refetch } = useMonitoringConfig();
  const updateConfig = useUpdateMonitoringConfig();
  const collectMetrics = useCollectMetrics();
  const processAlerts = useProcessAlerts();
  
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<any>>>({});

  const handleChange = (id: string, field: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const saveChanges = async () => {
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) {
      toast.info('No changes to save');
      return;
    }

    for (const [id, updates] of entries) {
      await updateConfig.mutateAsync({ id, updates });
    }
    
    setPendingChanges({});
    refetch();
  };

  const getValue = (config: any, field: string) => {
    return pendingChanges[config.id]?.[field] ?? config[field];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Manually trigger metric collection and alert processing
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button 
            onClick={() => collectMetrics.mutate()}
            disabled={collectMetrics.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${collectMetrics.isPending ? 'animate-spin' : ''}`} />
            Collect Metrics Now
          </Button>
          <Button 
            variant="outline"
            onClick={() => processAlerts.mutate()}
            disabled={processAlerts.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${processAlerts.isPending ? 'animate-spin' : ''}`} />
            Process Alerts Now
          </Button>
        </CardContent>
      </Card>

      {/* Module Configuration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Module Configuration</CardTitle>
            <CardDescription>
              Enable/disable monitoring and configure settings per module
            </CardDescription>
          </div>
          <Button 
            onClick={saveChanges}
            disabled={Object.keys(pendingChanges).length === 0 || updateConfig.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="w-[100px]">Enabled</TableHead>
                  <TableHead>Collection Interval</TableHead>
                  <TableHead>Retention</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs?.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ModuleIcon icon={config.icon || 'Activity'} size="sm" />
                        <span className="font-medium">{config.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={getValue(config, 'is_enabled')}
                        onCheckedChange={(checked) => handleChange(config.id, 'is_enabled', checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={getValue(config, 'collection_interval_seconds').toString()}
                        onValueChange={(v) => handleChange(config.id, 'collection_interval_seconds', parseInt(v))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 min</SelectItem>
                          <SelectItem value="300">5 min</SelectItem>
                          <SelectItem value="900">15 min</SelectItem>
                          <SelectItem value="1800">30 min</SelectItem>
                          <SelectItem value="3600">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={getValue(config, 'retention_days').toString()}
                        onValueChange={(v) => handleChange(config.id, 'retention_days', parseInt(v))}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {Object.keys(pendingChanges).length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/50 rounded-lg text-sm">
              You have unsaved changes. Click "Save Changes" to apply them.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
