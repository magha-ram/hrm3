import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { isBankDetailsComplete, type BankDetails } from '@/components/employees/BankDetailsSection';

interface BulkAddEmployeesDialogProps {
  runId: string;
  existingEmployeeIds: string[];
  isLocked: boolean;
}

export function BulkAddEmployeesDialog({ runId, existingEmployeeIds, isLocked }: BulkAddEmployeesDialogProps) {
  const [open, setOpen] = useState(false);
  const { companyId } = useTenant();
  const queryClient = useQueryClient();
  const { data: allEmployees } = useEmployees();

  // Filter to active employees not already in this run
  const eligibleEmployees = allEmployees?.filter(
    emp => emp.employment_status === 'active' && !existingEmployeeIds.includes(emp.id)
  ) || [];

  // Check for missing bank details
  const employeesWithoutBank = eligibleEmployees.filter(
    emp => !isBankDetailsComplete(emp.bank_details as BankDetails)
  );

  const bulkAddMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || eligibleEmployees.length === 0) return;

      // Get company PF settings
      const { data: company } = await supabase
        .from('companies')
        .select('pf_enabled, pf_employee_rate')
        .eq('id', companyId)
        .single();

      // Create entries for all eligible employees
      const entries = eligibleEmployees.map(emp => {
        const baseSalary = Number(emp.salary) || 0;
        let pfDeduction = 0;
        if (company?.pf_enabled) {
          const pfRate = Number(company.pf_employee_rate) || 0;
          pfDeduction = (baseSalary * pfRate) / 100;
        }
        const grossPay = baseSalary;
        const totalDeductions = pfDeduction;
        const netPay = grossPay - totalDeductions;

        return {
          company_id: companyId,
          payroll_run_id: runId,
          employee_id: emp.id,
          base_salary: baseSalary,
          overtime_pay: 0,
          bonuses: 0,
          commissions: 0,
          tax_deductions: 0,
          benefits_deductions: 0,
          pf_deduction: pfDeduction,
          gross_pay: grossPay,
          total_deductions: totalDeductions,
          net_pay: netPay,
          total_employer_cost: grossPay,
        };
      });

      const { error } = await supabase
        .from('payroll_entries')
        .insert(entries);

      if (error) throw error;

      // Update run totals
      const { data: allEntries } = await supabase
        .from('payroll_entries')
        .select('gross_pay, net_pay, total_deductions, total_employer_cost')
        .eq('payroll_run_id', runId);

      if (allEntries) {
        const totalGross = allEntries.reduce((sum, e) => sum + Number(e.gross_pay), 0);
        const totalNet = allEntries.reduce((sum, e) => sum + Number(e.net_pay), 0);
        const totalDeductions = allEntries.reduce((sum, e) => sum + Number(e.total_deductions || 0), 0);
        const totalEmployerCost = allEntries.reduce((sum, e) => sum + Number(e.total_employer_cost || 0), 0);

        await supabase
          .from('payroll_runs')
          .update({
            employee_count: allEntries.length,
            total_gross: totalGross,
            total_net: totalNet,
            total_deductions: totalDeductions,
            total_employer_cost: totalEmployerCost,
          })
          .eq('id', runId);
      }

      return eligibleEmployees.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-entries', runId] });
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success(`Added ${count} employees to payroll run`);
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add employees');
    },
  });

  if (isLocked || eligibleEmployees.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Add All Employees
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add All Active Employees</DialogTitle>
          <DialogDescription>
            Add all eligible employees to this payroll run using their base salary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Employees to add</p>
              <p className="text-sm text-muted-foreground">
                Active employees not already in this run
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {eligibleEmployees.length}
            </Badge>
          </div>

          {employeesWithoutBank.length > 0 && (
            <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-200">Missing Bank Details</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                {employeesWithoutBank.length} employee(s) have incomplete bank details. 
                They will be added but may need updates before payment.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-muted-foreground">
            <p>This will:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Create payroll entries using each employee's base salary</li>
              <li>Apply PF deductions if enabled for the company</li>
              <li>Set overtime, bonuses, and other extras to $0</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => bulkAddMutation.mutate()} disabled={bulkAddMutation.isPending}>
            {bulkAddMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add {eligibleEmployees.length} Employees
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
