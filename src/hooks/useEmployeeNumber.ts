import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrentCompany } from '@/hooks/useCompany';

export interface EmployeeIdSettings {
  prefix: string;
  separator: '' | '-' | '_';
  padding: number;
  startingNumber: number;
}

const defaultSettings: EmployeeIdSettings = {
  prefix: '',
  separator: '',
  padding: 3,
  startingNumber: 1,
};

export function useEmployeeIdSettings() {
  const { data: company } = useCurrentCompany();
  
  const settings = company?.settings as { employeeId?: EmployeeIdSettings } | null;
  return settings?.employeeId ?? defaultSettings;
}

export function generateEmployeeNumber(
  settings: EmployeeIdSettings,
  nextNumber: number
): string {
  const paddedNumber = String(nextNumber).padStart(settings.padding, '0');
  
  if (settings.prefix) {
    return `${settings.prefix}${settings.separator}${paddedNumber}`;
  }
  
  return paddedNumber;
}

export function useNextEmployeeNumber() {
  const { companyId } = useTenant();
  const settings = useEmployeeIdSettings();

  return useQuery({
    queryKey: ['next-employee-number', companyId, settings],
    queryFn: async () => {
      if (!companyId) return null;

      // Get all employee numbers for this company
      const { data: employees, error } = await supabase
        .from('employees')
        .select('employee_number')
        .eq('company_id', companyId);

      if (error) throw error;

      // Extract numeric parts and find the highest
      let maxNumber = settings.startingNumber - 1;

      if (employees && employees.length > 0) {
        for (const emp of employees) {
          // Extract numbers from the employee_number
          const matches = emp.employee_number.match(/\d+/g);
          if (matches) {
            // Get the last number group (most likely the sequential part)
            const num = parseInt(matches[matches.length - 1], 10);
            if (!isNaN(num) && num > maxNumber) {
              maxNumber = num;
            }
          }
        }
      }

      const nextNumber = maxNumber + 1;
      return {
        nextNumber,
        formatted: generateEmployeeNumber(settings, nextNumber),
      };
    },
    enabled: !!companyId,
    staleTime: 0, // Always refetch to get latest number
  });
}

export function formatPreviewNumber(settings: EmployeeIdSettings): string {
  return generateEmployeeNumber(settings, settings.startingNumber);
}
