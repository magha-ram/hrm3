import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Loader2, Upload, Download, FileSpreadsheet, LayoutList, Network } from 'lucide-react';
import { WriteGate, RoleGate } from '@/components/PermissionGate';
import { useUserRole } from '@/hooks/useUserRole';
import { ModuleGuard } from '@/components/ModuleGuard';
import { useEmployees, useDeleteEmployee, type Employee } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { EmployeeDetail } from '@/components/employees/EmployeeDetail';
import { BulkImportDialog } from '@/components/employees/BulkImportDialog';
import { OrgChart } from '@/components/employees/OrgChart';
import { EmployeeFilters, type EmployeeFiltersState } from '@/components/employees/EmployeeFilters';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ReadOnlyPageBanner } from '@/components/platform/ImpersonationRestricted';
import { exportEmployeesToCSV, downloadEmployeeImportTemplate } from '@/lib/export-utils';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  on_leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  suspended: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

export default function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees();
  const { data: departments } = useDepartments();
  const deleteEmployee = useDeleteEmployee();
  const { isHROrAbove } = useUserRole();
  
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<EmployeeFiltersState>({
    departmentId: '',
    status: '',
    type: '',
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  const handleExportEmployees = () => {
    if (employees && employees.length > 0) {
      exportEmployeesToCSV(employees as any);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees?.filter(emp => {
      // Search filter
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || (
        emp.first_name.toLowerCase().includes(searchLower) ||
        emp.last_name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.employee_number.toLowerCase().includes(searchLower) ||
        (emp.job_title?.toLowerCase().includes(searchLower))
      );

      // Department filter
      const matchesDepartment = !filters.departmentId || emp.department_id === filters.departmentId;

      // Status filter
      const matchesStatus = !filters.status || emp.employment_status === filters.status;

      // Type filter
      const matchesType = !filters.type || emp.employment_type === filters.type;

      return matchesSearch && matchesDepartment && matchesStatus && matchesType;
    }) || [];
  }, [employees, search, filters]);

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

  const activeFilterCount = [filters.departmentId, filters.status, filters.type].filter(Boolean).length;

  return (
    <ModuleGuard moduleId="employees">
      <div className="p-6 space-y-6">
        <ReadOnlyPageBanner />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isHROrAbove ? 'Employees' : 'Company Directory'}</h1>
            <p className="text-muted-foreground">
              {isHROrAbove ? "Manage your organization's employees" : 'View your colleagues'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export/Import Dropdown - Only for HR */}
            <RoleGate role="hr_manager">
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
                    <DropdownMenuItem onClick={() => setIsImportOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Import
                    </DropdownMenuItem>
                  </WriteGate>
                </DropdownMenuContent>
              </DropdownMenu>
            </RoleGate>

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

        {/* Tabs for List and Org Chart views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <LayoutList className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="org" className="gap-2">
                <Network className="h-4 w-4" />
                Org Chart
              </TabsTrigger>
            </TabsList>

            {/* Filters - only show in list view */}
            {activeTab === 'list' && (
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, email, or ID..." 
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <EmployeeFilters 
                  filters={filters} 
                  onFiltersChange={setFilters}
                  departments={departments || []}
                />
              </div>
            )}
          </div>

          {/* Active filters display */}
          {activeTab === 'list' && activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.departmentId && (
                <Badge variant="secondary" className="gap-1">
                  Department: {departments?.find(d => d.id === filters.departmentId)?.name}
                  <button 
                    onClick={() => setFilters(f => ({ ...f, departmentId: '' }))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary" className="gap-1">
                  Status: {filters.status.replace('_', ' ')}
                  <button 
                    onClick={() => setFilters(f => ({ ...f, status: '' }))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.type.replace('_', ' ')}
                  <button 
                    onClick={() => setFilters(f => ({ ...f, type: '' }))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee Directory</CardTitle>
                <CardDescription>
                  {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
                  {activeFilterCount > 0 && ` (filtered from ${employees?.length || 0})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>{search || activeFilterCount > 0 ? 'No employees match your search or filters.' : 'No employees found. Add your first employee to get started.'}</p>
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
          </TabsContent>

          {/* Org Chart View */}
          <TabsContent value="org" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Chart</CardTitle>
                <CardDescription>
                  View department hierarchy and reporting structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <OrgChart 
                    employees={employees || []}
                    departments={departments || []}
                    onEmployeeClick={handleView}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Employee Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
            </DialogHeader>
            {selectedEmployee && <EmployeeDetail employee={selectedEmployee} canEdit={isHROrAbove} />}
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