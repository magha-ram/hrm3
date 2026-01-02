import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Scan, Clock, DollarSign } from 'lucide-react';
import { useCreateEmployee, useUpdateEmployee, type Employee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useNextEmployeeNumber } from '@/hooks/useEmployeeNumber';
import { useActiveShifts, useAssignShift, useDefaultShift, useEnsureDefaultShift } from '@/hooks/useShifts';
import { useAddSalary } from '@/hooks/useSalaryHistory';
import { DocumentScanDialog } from './DocumentScanDialog';
import { EmergencyContactSection, type EmergencyContact } from './EmergencyContactSection';
import { BankDetailsSection, type BankDetails } from './BankDetailsSection';
import type { ExtractedData } from '@/hooks/useOCR';
import { format } from 'date-fns';

const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  employee_number: z.string().min(1, 'Employee number is required'),
  hire_date: z.string().min(1, 'Hire date is required'),
  job_title: z.string().optional(),
  department_id: z.string().optional(),
  shift_id: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'temporary']),
  employment_status: z.enum(['active', 'on_leave', 'terminated', 'suspended']),
  phone: z.string().optional(),
  personal_email: z.string().email().optional().or(z.literal('')),
  work_location: z.string().optional(),
  national_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  // Salary fields for new employees
  initial_salary: z.coerce.number().optional(),
  salary_currency: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmployeeForm({ employee, onSuccess, onCancel }: EmployeeFormProps) {
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const { data: departments } = useDepartments();
  const { data: shifts } = useActiveShifts();
  const { data: defaultShift } = useDefaultShift();
  const ensureDefaultShift = useEnsureDefaultShift();
  const assignShift = useAssignShift();
  const addSalary = useAddSalary();
  const { data: nextEmployeeNumber, isLoading: isLoadingNumber } = useNextEmployeeNumber();
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(
    (employee?.emergency_contact as EmergencyContact) || {}
  );
  const [bankDetails, setBankDetails] = useState<BankDetails>(
    (employee?.bank_details as BankDetails) || {}
  );
  
  const isEditing = !!employee;
  const isLoading = createEmployee.isPending || updateEmployee.isPending || assignShift.isPending || addSalary.isPending;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: employee?.first_name || '',
      last_name: employee?.last_name || '',
      email: employee?.email || '',
      employee_number: employee?.employee_number || '',
      hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
      job_title: employee?.job_title || '',
      department_id: employee?.department_id || '',
      shift_id: '',
      employment_type: employee?.employment_type || 'full_time',
      employment_status: employee?.employment_status || 'active',
      phone: employee?.phone || '',
      personal_email: employee?.personal_email || '',
      work_location: employee?.work_location || '',
      national_id: employee?.national_id || '',
      date_of_birth: employee?.date_of_birth || '',
      gender: employee?.gender || '',
      // Salary defaults
      initial_salary: undefined,
      salary_currency: 'USD',
    },
  });

  // Pre-select default shift for new employees
  useEffect(() => {
    if (!isEditing && defaultShift && !form.getValues('shift_id')) {
      form.setValue('shift_id', defaultShift.id);
    }
  }, [isEditing, defaultShift, form]);

  // Ensure default shift exists
  useEffect(() => {
    if (!isEditing && shifts && shifts.length === 0) {
      ensureDefaultShift.mutate();
    }
  }, [isEditing, shifts]);

  // Auto-populate employee number for new employees
  useEffect(() => {
    if (!isEditing && nextEmployeeNumber?.formatted && !form.getValues('employee_number')) {
      form.setValue('employee_number', nextEmployeeNumber.formatted);
    }
  }, [isEditing, nextEmployeeNumber, form]);

  const handleOCRData = (data: Partial<ExtractedData>) => {
    if (data.firstName) form.setValue('first_name', data.firstName);
    if (data.lastName) form.setValue('last_name', data.lastName);
    if (data.nationalId) form.setValue('national_id', data.nationalId);
    if (data.dateOfBirth) form.setValue('date_of_birth', data.dateOfBirth);
    if (data.gender) form.setValue('gender', data.gender);
    if (data.phone) form.setValue('phone', data.phone);
    if (data.email) form.setValue('personal_email', data.email);
  };

  const onSubmit = async (values: EmployeeFormValues) => {
    try {
      // Extract fields not stored directly on employee
      const { shift_id, initial_salary, salary_currency, ...employeeValues } = values;
      
      if (isEditing && employee) {
        await updateEmployee.mutateAsync({ 
          id: employee.id, 
          ...employeeValues,
          department_id: employeeValues.department_id || null,
          personal_email: employeeValues.personal_email || null,
          emergency_contact: emergencyContact as Record<string, string>,
          bank_details: bankDetails as Record<string, string>,
        });
      } else {
        const newEmployee = await createEmployee.mutateAsync({
          first_name: employeeValues.first_name,
          last_name: employeeValues.last_name,
          email: employeeValues.email,
          employee_number: employeeValues.employee_number,
          hire_date: employeeValues.hire_date,
          job_title: employeeValues.job_title || null,
          department_id: employeeValues.department_id || null,
          employment_type: employeeValues.employment_type,
          employment_status: employeeValues.employment_status,
          phone: employeeValues.phone || null,
          personal_email: employeeValues.personal_email || null,
          work_location: employeeValues.work_location || null,
          emergency_contact: emergencyContact as Record<string, string>,
          bank_details: bankDetails as Record<string, string>,
        });
        
        // Assign shift to new employee
        if (shift_id && newEmployee?.id) {
          await assignShift.mutateAsync({
            employee_id: newEmployee.id,
            shift_id: shift_id,
            effective_from: employeeValues.hire_date,
            is_temporary: false,
          });
        }
        
        // Create initial salary record if provided
        if (initial_salary && initial_salary > 0 && newEmployee?.id) {
          await addSalary.mutateAsync({
            employee_id: newEmployee.id,
            base_salary: initial_salary,
            salary_currency: salary_currency || 'USD',
            effective_from: employeeValues.hire_date,
            reason: 'Initial Salary',
          });
        }
      }
      onSuccess();
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* OCR Scan Button - Only for new employees */}
          {!isEditing && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setScanDialogOpen(true)}
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan ID Document
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employee_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Number *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      readOnly={!isEditing}
                      className={!isEditing ? 'bg-muted' : ''}
                      placeholder={isLoadingNumber ? 'Generating...' : ''}
                    />
                  </FormControl>
                  {!isEditing && (
                    <p className="text-xs text-muted-foreground">Auto-generated based on company settings</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hire_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Shift Assignment - Only for new employees */}
          {!isEditing && (
            <FormField
              control={form.control}
              name="shift_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Default Shift
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {shifts?.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.name} ({format(new Date(`2000-01-01T${shift.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${shift.end_time}`), 'h:mm a')})
                          {shift.is_default && ' (Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The employee will be assigned to this shift starting from their hire date.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Initial Salary Section - Only for new employees */}
          {!isEditing && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                Initial Salary (Optional)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initial_salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 50000"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Monthly or annual base salary
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary_currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'USD'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="PKR">PKR</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="AED">AED</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="work_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personal_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Additional fields from OCR */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="national_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID / CNIC</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 12345-1234567-1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Emergency Contact Section */}
          <EmergencyContactSection
            value={emergencyContact}
            onChange={setEmergencyContact}
          />

          {/* Bank Details Section */}
          <BankDetailsSection
            value={bankDetails}
            onChange={setBankDetails}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : 'Create'} Employee
            </Button>
          </div>
        </form>
      </Form>

      <DocumentScanDialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
        onDataExtracted={handleOCRData}
      />
    </>
  );
}
