import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type TimeEntry = Tables<'time_entries'>;

export function useMyTimeEntries(startDate?: string, endDate?: string) {
  const { companyId, employeeId } = useTenant();

  return useQuery({
    queryKey: ['time-entries', 'my', companyId, employeeId, startDate, endDate],
    queryFn: async () => {
      if (!companyId || !employeeId) return [];

      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!employeeId,
  });
}

export function useTeamTimeEntries(startDate?: string, endDate?: string) {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['time-entries', 'team', companyId, startDate, endDate],
    queryFn: async () => {
      if (!companyId) return [];

      let query = supabase
        .from('time_entries')
        .select(`
          *,
          employee:employees!time_entries_employee_id_fkey(id, first_name, last_name, email)
        `)
        .eq('company_id', companyId)
        .order('date', { ascending: false });

      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useTodayEntry() {
  const { employeeId } = useTenant();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['time-entries', 'today', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  const { companyId, employeeId } = useTenant();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async () => {
      if (!companyId || !employeeId) throw new Error('No company or employee selected');

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('time_entries')
        .upsert({
          company_id: companyId,
          employee_id: employeeId,
          date: today,
          clock_in: now,
        }, {
          onConflict: 'employee_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Clocked in successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock in');
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  const { employeeId } = useTenant();
  const today = new Date().toISOString().split('T')[0];

  return useMutation({
    mutationFn: async () => {
      if (!employeeId) throw new Error('No employee selected');

      // Get current entry
      const { data: entry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .single();

      if (!entry || !entry.clock_in) {
        throw new Error('You must clock in first');
      }

      const now = new Date();
      const clockIn = new Date(entry.clock_in);
      const totalMinutes = Math.round((now.getTime() - clockIn.getTime()) / (1000 * 60));
      const breakMinutes = entry.break_minutes || 0;
      const workMinutes = totalMinutes - breakMinutes;
      const totalHours = Math.max(0, workMinutes / 60);

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          clock_out: now.toISOString(),
          total_hours: Math.round(totalHours * 100) / 100,
        })
        .eq('id', entry.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Clocked out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock out');
    },
  });
}

export function useApproveTimeEntry() {
  const queryClient = useQueryClient();
  const { employeeId } = useTenant();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          is_approved: true,
          approved_by: employeeId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast.success('Time entry approved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve entry');
    },
  });
}

// Calculate time summaries
export function useTimeSummary() {
  const { employeeId } = useTenant();
  
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const { data: entries = [] } = useMyTimeEntries(
    startOfMonth.toISOString().split('T')[0]
  );

  const today = now.toISOString().split('T')[0];
  const weekStart = startOfWeek.toISOString().split('T')[0];

  const todayHours = entries
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + (e.total_hours || 0), 0);

  const weekHours = entries
    .filter(e => e.date >= weekStart)
    .reduce((sum, e) => sum + (e.total_hours || 0), 0);

  const monthHours = entries
    .reduce((sum, e) => sum + (e.total_hours || 0), 0);

  return {
    todayHours,
    weekHours,
    monthHours,
    entries,
  };
}
