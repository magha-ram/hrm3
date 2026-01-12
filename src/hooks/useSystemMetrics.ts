import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ModuleMetrics {
  name: string;
  displayName: string;
  icon: string;
  status: 'healthy' | 'warning' | 'critical';
  isEnabled: boolean;
  metrics: {
    totalCapacity: string | null;
    used: string | null;
    remaining: string | null;
    usagePercent: number | null;
    errorRate: number | null;
    latencyMs: number | null;
    failures1h: number;
    failures24h: number;
    upgradeRecommended: boolean;
    lastIncident: string | null;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string | null;
}

export interface MatrixData {
  modules: ModuleMetrics[];
  summary: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
  lastUpdated: string;
  alerts: {
    active: number;
    unacknowledged: number;
  };
}

export interface MonitoringConfig {
  id: string;
  module: string;
  display_name: string;
  icon: string | null;
  is_enabled: boolean;
  collection_interval_seconds: number;
  retention_days: number;
  capacity_total: number | null;
  capacity_unit: string | null;
  settings: Record<string, any>;
  sort_order: number;
}

export function useMatrixData(refreshInterval?: number) {
  return useQuery({
    queryKey: ['matrix-data'],
    queryFn: async (): Promise<MatrixData> => {
      const { data, error } = await supabase.functions.invoke('get-matrix-data');
      
      if (error) throw error;
      return data;
    },
    refetchInterval: refreshInterval || 60000, // Default 1 minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

export function useMonitoringConfig() {
  return useQuery({
    queryKey: ['monitoring-config'],
    queryFn: async (): Promise<MonitoringConfig[]> => {
      const { data, error } = await supabase
        .from('monitoring_config')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as MonitoringConfig[];
    },
  });
}

export function useUpdateMonitoringConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MonitoringConfig> }) => {
      const { data, error } = await supabase
        .from('monitoring_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-config'] });
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      toast.success('Monitoring configuration updated');
    },
    onError: (error) => {
      toast.error('Failed to update configuration: ' + error.message);
    },
  });
}

export function useCollectMetrics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('collect-system-metrics');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      toast.success(`Collected ${data.metricsCollected} metrics`);
    },
    onError: (error) => {
      toast.error('Failed to collect metrics: ' + error.message);
    },
  });
}

export function useSystemMetricsHistory(module: string, metricName: string, hours = 24) {
  return useQuery({
    queryKey: ['system-metrics-history', module, metricName, hours],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .eq('module', module)
        .eq('metric_name', metricName)
        .gte('collected_at', cutoff)
        .order('collected_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!module && !!metricName,
  });
}
