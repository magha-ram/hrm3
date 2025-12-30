import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LeaveRequest = Tables<'leave_requests'>;
export type LeaveRequestInsert = TablesInsert<'leave_requests'>;
export type LeaveRequestUpdate = TablesUpdate<'leave_requests'>;
export type LeaveType = Tables<'leave_types'>;

export function useLeaveTypes() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['leave-types', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useMyLeaveRequests() {
  const { companyId, employeeId } = useTenant();

  return useQuery({
    queryKey: ['leave-requests', 'my', companyId, employeeId],
    queryFn: async () => {
      if (!companyId || !employeeId) return [];

      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(id, name, color),
          reviewed_by_employee:employees!leave_requests_reviewed_by_fkey(id, first_name, last_name)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!employeeId,
  });
}

export function useTeamLeaveRequests() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['leave-requests', 'team', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(id, first_name, last_name, email),
          leave_type:leave_types(id, name, color)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function usePendingLeaveRequests() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['leave-requests', 'pending', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(id, first_name, last_name, email, department:departments(name)),
          leave_type:leave_types(id, name, color)
        `)
        .eq('company_id', companyId)
        .eq('status', 'pending')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  const { companyId, employeeId } = useTenant();

  return useMutation({
    mutationFn: async (request: Omit<LeaveRequestInsert, 'company_id' | 'employee_id'>) => {
      if (!companyId || !employeeId) throw new Error('Missing context');

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({ ...request, company_id: companyId, employee_id: employeeId })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'leave_requests',
        action: 'create',
        record_id: data.id,
        new_values: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request submitted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit leave request');
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  const { companyId, employeeId } = useTenant();

  return useMutation({
    mutationFn: async ({ id, review_notes }: { id: string; review_notes?: string }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          reviewed_by: employeeId,
          reviewed_at: new Date().toISOString(),
          review_notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'leave_requests',
        action: 'update',
        record_id: id,
        new_values: { status: 'approved', review_notes },
        metadata: { action_type: 'approve_leave' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request approved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  const { companyId, employeeId } = useTenant();

  return useMutation({
    mutationFn: async ({ id, review_notes }: { id: string; review_notes?: string }) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          reviewed_by: employeeId,
          reviewed_at: new Date().toISOString(),
          review_notes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'leave_requests',
        action: 'update',
        record_id: id,
        new_values: { status: 'rejected', review_notes },
        metadata: { action_type: 'reject_leave' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();
  const { companyId } = useTenant();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'canceled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'leave_requests',
        action: 'update',
        record_id: id,
        new_values: { status: 'canceled' },
        metadata: { action_type: 'cancel_leave' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request cancelled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel request');
    },
  });
}
