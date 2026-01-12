import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  module: string;
  metric_name: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'greater_than_or_equal' | 'less_than_or_equal';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  notification_channels: string[];
  is_active: boolean;
  cooldown_minutes: number;
  last_triggered_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  rule_id: string | null;
  module: string;
  metric_name: string;
  metric_value: number;
  threshold: number;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  message: string | null;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  metadata: Record<string, any>;
  triggered_at: string;
}

export function useAlertRules() {
  return useQuery({
    queryKey: ['alert-rules'],
    queryFn: async (): Promise<AlertRule[]> => {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('module', { ascending: true });
      
      if (error) throw error;
      return data as AlertRule[];
    },
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at' | 'last_triggered_at'>) => {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule created');
    },
    onError: (error) => {
      toast.error('Failed to create alert rule: ' + error.message);
    },
  });
}

export function useUpdateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AlertRule> }) => {
      const { data, error } = await supabase
        .from('alert_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule updated');
    },
    onError: (error) => {
      toast.error('Failed to update alert rule: ' + error.message);
    },
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete alert rule: ' + error.message);
    },
  });
}

export function useAlertHistory(options?: { 
  limit?: number; 
  unresolvedOnly?: boolean;
  module?: string;
}) {
  return useQuery({
    queryKey: ['alert-history', options],
    queryFn: async (): Promise<AlertHistory[]> => {
      let query = supabase
        .from('alert_history')
        .select('*')
        .order('triggered_at', { ascending: false });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.unresolvedOnly) {
        query = query.eq('is_resolved', false);
      }
      
      if (options?.module) {
        query = query.eq('module', options.module);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AlertHistory[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('alert_history')
        .update({
          is_acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-history'] });
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      toast.success('Alert acknowledged');
    },
    onError: (error) => {
      toast.error('Failed to acknowledge alert: ' + error.message);
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('alert_history')
        .update({
          is_resolved: true,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null,
        })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-history'] });
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      toast.success('Alert resolved');
    },
    onError: (error) => {
      toast.error('Failed to resolve alert: ' + error.message);
    },
  });
}

export function useProcessAlerts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-alerts');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alert-history'] });
      queryClient.invalidateQueries({ queryKey: ['matrix-data'] });
      if (data.alertsTriggered > 0) {
        toast.warning(`${data.alertsTriggered} alert(s) triggered`);
      } else {
        toast.success('Alerts processed - no new alerts');
      }
    },
    onError: (error) => {
      toast.error('Failed to process alerts: ' + error.message);
    },
  });
}
