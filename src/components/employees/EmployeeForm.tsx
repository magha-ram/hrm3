import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Scan } from 'lucide-react';
import { useCreateEmployee, useUpdateEmployee, type Employee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { useNextEmployeeNumber } from '@/hooks/useEmployeeNumber';
import { DocumentScanDialog } from './DocumentScanDialog';
import { EmergencyContactSection, type EmergencyContact } from './EmergencyContactSection';
import { BankDetailsSection, type BankDetails } from './BankDetailsSection';
import type { ExtractedData } from '@/hooks/useOCR';

const employeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  employee_number: z.string().min(1, 'Employee number is required'),
  hire_date: z.string().min(1, 'Hire date is required'),
  job_title: z.string().optional(),
  department_id: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern', 'temporary']),
  employment_status: z.enum(['active', 'on_leave', 'terminated', 'suspended']),
  phone: z.string().optional(),
  personal_email: z.string().email().optional().or(z.literal('')),
  work_location: z.string().optional(),
  national_id: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
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
  const { data: nextEmployeeNumber, isLoading: isLoadingNumber } = useNextEmployeeNumber();
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(
    (employee?.emergency_contact as EmergencyContact) || {}
  );
  const [bankDetails, setBankDetails] = useState<BankDetails>(
    (employee?.bank_details as BankDetails) || {}
  );
  
  const isEditing = !!employee;
  const isLoading = createEmployee.isPending || updateEmployee.isPending;

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
      employment_type: employee?.employment_type || 'full_time',
      employment_status: employee?.employment_status || 'active',
      phone: employee?.phone || '',
      personal_email: employee?.personal_email || '',
      work_location: employee?.work_location || '',
      national_id: employee?.national_id || '',
      date_of_birth: employee?.date_of_birth || '',
      gender: employee?.gender || '',
    },
  });

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
      if (isEditing && employee) {
        await updateEmployee.mutateAsync({ 
          id: employee.id, 
          ...values,
          department_id: values.department_id || null,
          personal_email: values.personal_email || null,
          emergency_contact: emergencyContact as Record<string, string>,
          bank_details: bankDetails as Record<string, string>,
        });
      } else {
        await createEmployee.mutateAsync({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          employee_number: values.employee_number,
          hire_date: values.hire_date,
          job_title: values.job_title || null,
          department_id: values.department_id || null,
          employment_type: values.employment_type,
          employment_status: values.employment_status,
          phone: values.phone || null,
          personal_email: values.personal_email || null,
          work_location: values.work_location || null,
          emergency_contact: emergencyContact as Record<string, string>,
          bank_details: bankDetails as Record<string, string>,
        });
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
