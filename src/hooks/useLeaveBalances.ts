import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  color: string | null;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface EmployeeLeaveBalances {
  employeeId: string;
  employeeName: string;
  balances: LeaveBalance[];
}

/**
 * Calculate leave balances for the current year
 * Formula: remaining = allocated - approved_used
 */
function calculateBalance(
  leaveType: { id: string; name: string; code: string; color: string | null; default_days: number | null },
  approvedRequests: { leave_type_id: string; total_days: number; status: string }[]
): LeaveBalance {
  const allocated = leaveType.default_days || 0;
  const approved = approvedRequests
    .filter(r => r.leave_type_id === leaveType.id && r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.total_days), 0);
  const pending = approvedRequests
    .filter(r => r.leave_type_id === leaveType.id && r.status === 'pending')
    .reduce((sum, r) => sum + Number(r.total_days), 0);

  return {
    leaveTypeId: leaveType.id,
    leaveTypeName: leaveType.name,
    leaveTypeCode: leaveType.code,
    color: leaveType.color,
    allocated,
    used: approved,
    pending,
    remaining: allocated - approved,
  };
}

/**
 * Get leave balances for the current user (employee self-service)
 */
export function useMyLeaveBalances() {
  const { companyId, employeeId } = useTenant();

  return useQuery({
    queryKey: ['leave-balances', 'my', companyId, employeeId],
    queryFn: async () => {
      if (!companyId || !employeeId) return [];

      // Get current year bounds
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      // Get all active leave types
      const { data: leaveTypes, error: typesError } = await supabase
        .from('leave_types')
        .select('id, name, code, color, default_days')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;

      // Get all leave requests for this year
      const { data: requests, error: requestsError } = await supabase
        .from('leave_requests')
        .select('leave_type_id, total_days, status')
        .eq('employee_id', employeeId)
        .gte('start_date', yearStart)
        .lte('start_date', yearEnd)
        .in('status', ['approved', 'pending']);

      if (requestsError) throw requestsError;

      return leaveTypes?.map(lt => calculateBalance(lt, requests || [])) || [];
    },
    enabled: !!companyId && !!employeeId,
  });
}

/**
 * Get leave balances for a specific employee (HR/Manager view)
 */
export function useEmployeeLeaveBalances(employeeId: string | null) {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['leave-balances', 'employee', companyId, employeeId],
    queryFn: async () => {
      if (!companyId || !employeeId) return [];

      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      const { data: leaveTypes, error: typesError } = await supabase
        .from('leave_types')
        .select('id, name, code, color, default_days')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;

      const { data: requests, error: requestsError } = await supabase
        .from('leave_requests')
        .select('leave_type_id, total_days, status')
        .eq('employee_id', employeeId)
        .gte('start_date', yearStart)
        .lte('start_date', yearEnd)
        .in('status', ['approved', 'pending']);

      if (requestsError) throw requestsError;

      return leaveTypes?.map(lt => calculateBalance(lt, requests || [])) || [];
    },
    enabled: !!companyId && !!employeeId,
  });
}

/**
 * Get leave balances for all employees (HR view for Leave Management)
 */
export function useAllEmployeeLeaveBalances() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['leave-balances', 'all', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      // Get all active leave types
      const { data: leaveTypes, error: typesError } = await supabase
        .from('leave_types')
        .select('id, name, code, color, default_days')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (typesError) throw typesError;

      // Get all active employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .neq('employment_status', 'terminated')
        .order('first_name');

      if (empError) throw empError;

      // Get all leave requests for this year
      const { data: allRequests, error: requestsError } = await supabase
        .from('leave_requests')
        .select('employee_id, leave_type_id, total_days, status')
        .eq('company_id', companyId)
        .gte('start_date', yearStart)
        .lte('start_date', yearEnd)
        .in('status', ['approved', 'pending']);

      if (requestsError) throw requestsError;

      // Calculate balances per employee
      return employees?.map(emp => ({
        employeeId: emp.id,
        employeeName: `${emp.first_name} ${emp.last_name}`,
        balances: leaveTypes?.map(lt => 
          calculateBalance(lt, allRequests?.filter(r => r.employee_id === emp.id) || [])
        ) || [],
      })) as EmployeeLeaveBalances[];
    },
    enabled: !!companyId,
  });
}
