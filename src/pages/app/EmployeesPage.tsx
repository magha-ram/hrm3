import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Trash2, Loader2, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { WriteGate, RoleGate } from '@/components/PermissionGate';
import { ModuleGuard } from '@/components/ModuleGuard';
import { useEmployees, useDeleteEmployee, type Employee } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { EmployeeDetail } from '@/components/employees/EmployeeDetail';
import { BulkImportDialog } from '@/components/employees/BulkImportDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ReadOnlyPageBanner } from '@/components/platform/ImpersonationRestricted';
import { exportEmployeesToCSV, downloadEmployeeImportTemplate } from '@/lib/export-utils';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  on_leave: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-800',
};

export default function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees();
  const deleteEmployee = useDeleteEmployee();
  
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleExportEmployees = () => {
    if (employees && employees.length > 0) {
      exportEmployeesToCSV(employees as any);
    }
  };

  const filteredEmployees = employees?.filter(emp => {
    const searchLower = search.toLowerCase();
    return (
      emp.first_name.toLowerCase().includes(searchLower) ||
      emp.last_name.toLowerCase().includes(searchLower) ||
      emp.email.toLowerCase().includes(searchLower) ||
      emp.employee_number.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleView = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteEmployee.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  return (
    <ModuleGuard moduleId="employees">
      <div className="p-6 space-y-6">
        <ReadOnlyPageBanner />
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your organization's employees</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export/Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import/Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportEmployees} disabled={!employees?.length}>
                <Download className="h-4 w-4 mr-2" />
                Export Employees
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadEmployeeImportTemplate}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <WriteGate>
                <RoleGate role="hr_manager">
                  <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import
                  </DropdownMenuItem>
                </RoleGate>
              </WriteGate>
            </DropdownMenuContent>
          </DropdownMenu>

          <WriteGate>
            <RoleGate role="hr_manager">
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingEmployee(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                  </DialogHeader>
                  <EmployeeForm 
                    employee={editingEmployee} 
                    onSuccess={handleFormClose}
                    onCancel={handleFormClose}
                  />
                </DialogContent>
              </Dialog>
            </RoleGate>
          </WriteGate>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or employee number..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{search ? 'No employees match your search.' : 'No employees found. Add your first employee to get started.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(employee)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {employee.first_name[0]}{employee.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(employee as any).department?.name || '-'}
                    </TableCell>
                    <TableCell>{employee.job_title || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[employee.employment_status] || ''} variant="secondary">
                        {employee.employment_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {employee.employment_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RoleGate role="hr_manager">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(employee)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <WriteGate>
                              <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <RoleGate role="company_admin">
                                <DropdownMenuItem 
                                  onClick={() => setDeletingId(employee.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </RoleGate>
                            </WriteGate>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </RoleGate>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && <EmployeeDetail employee={selectedEmployee} />}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import Dialog */}
      <BulkImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      </div>
    </ModuleGuard>
  );
}
