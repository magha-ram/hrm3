import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export interface CreateGoalInput {
  employee_id: string;
  title: string;
  description?: string;
  target_date: string;
  priority: string;
  status: string;
  progress: number;
}

// Note: These hooks require the employee_goals table to be created via migration
// For now, they return empty data gracefully
export function useGoals() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['goals', companyId],
    queryFn: async (): Promise<Goal[]> => {
      // Return empty array until employee_goals table is created
      return [];
    },
    enabled: !!companyId,
  });
}

export function useMyGoals() {
  const { companyId, employeeId } = useTenant();

  return useQuery({
    queryKey: ['my-goals', companyId, employeeId],
    queryFn: async (): Promise<Goal[]> => {
      // Return empty array until employee_goals table is created
      return [];
    },
    enabled: !!companyId && !!employeeId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: CreateGoalInput) => {
      // No-op until table exists - just show info message
      toast.info('Goals feature requires database setup');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-goals'] });
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
      // No-op until table exists
      toast.info('Goals feature requires database setup');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // No-op until table exists
      toast.info('Goals feature requires database setup');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['my-goals'] });
    },
  });
}
