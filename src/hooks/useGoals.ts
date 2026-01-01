import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface Goal {
  id: string;
  company_id: string;
  employee_id: string;
  title: string;
  description: string | null;
  target_date: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    job_title: string | null;
  };
}

export function useGoals() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['goals', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('employee_goals')
        .select(`
          *,
          employee:employees(first_name, last_name, job_title)
        `)
        .eq('company_id', companyId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!companyId,
  });
}

export function useMyGoals() {
  const { companyId, employeeId } = useTenant();

  return useQuery({
    queryKey: ['my-goals', companyId, employeeId],
    queryFn: async () => {
      if (!companyId || !employeeId) return [];
      
      const { data, error } = await supabase
        .from('employee_goals')
        .select('*')
        .eq('company_id', companyId)
        .eq('employee_id', employeeId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!companyId && !!employeeId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const { companyId } = useTenant();

  return useMutation({
    mutationFn: async (goal: {
      employee_id: string;
      title: string;
      description?: string;
      target_date: string;
      priority: string;
      status: string;
      progress: number;
    }) => {
      if (!companyId) throw new Error('No company context');

      const { data, error } = await supabase
        .from('employee_goals')
        .insert({
          company_id: companyId,
          ...goal,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-goals'] });
      toast.success('Goal created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create goal');
      console.error(error);
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      employee_id?: string;
      title?: string;
      description?: string;
      target_date?: string;
      priority?: string;
      status?: string;
      progress?: number;
    }) => {
      const { data, error } = await supabase
        .from('employee_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-goals'] });
      toast.success('Goal updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update goal');
      console.error(error);
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-goals'] });
      toast.success('Goal deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete goal');
      console.error(error);
    },
  });
}