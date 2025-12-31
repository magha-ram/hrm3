import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, DollarSign, Lock, CheckCircle, Clock, AlertCircle,
  FileText, Users, Calculator, Loader2, Eye, Play
} from 'lucide-react';
import { RoleGate } from '@/components/PermissionGate';
import { ModuleGuard } from '@/components/ModuleGuard';
import { PayslipDownloadButton } from '@/components/payroll/PayslipDownloadButton';
import { usePayrollRuns, usePayrollEntries, useCreatePayrollRun, useLockPayrollRun, usePayrollStats, useAddPayrollEntry } from '@/hooks/usePayroll';
import { useEmployees } from '@/hooks/useEmployees';
import { format } from 'date-fns';

type PayrollStatus = 'draft' | 'processing' | 'completed' | 'failed';

const statusConfig: Record<PayrollStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: FileText },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-destructive/20 text-destructive', icon: AlertCircle },
};

function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function CreateRunDialog({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    period_start: '',
    period_end: '',
    pay_date: '',
    currency: 'USD',
    notes: '',
  });

  const createRun = useCreatePayrollRun();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRun.mutateAsync(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Run Name</Label>
        <Input
          id="name"
          placeholder="e.g., January 2025 Payroll"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="period_start">Period Start</Label>
          <Input
            id="period_start"
            type="date"
            value={formData.period_start}
            onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="period_end">Period End</Label>
          <Input
            id="period_end"
            type="date"
            value={formData.period_end}
            onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pay_date">Pay Date</Label>
          <Input
            id="pay_date"
            type="date"
            value={formData.pay_date}
            onChange={(e) => setFormData({ ...formData, pay_date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          placeholder="Any additional notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={createRun.isPending}>
          {createRun.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Run
        </Button>
      </div>
    </form>
  );
}

function PayrollRunDetail({ runId, onClose }: { runId: string; onClose: () => void }) {
  const { data: entries, isLoading } = usePayrollEntries(runId);
  const { data: runs } = usePayrollRuns();
  const run = runs?.find(r => r.id === runId);
  const lockRun = useLockPayrollRun();
  const addEntry = useAddPayrollEntry();
  const { data: employees } = useEmployees();
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    employee_id: '',
    base_salary: 0,
    overtime_pay: 0,
    bonuses: 0,
    tax_deductions: 0,
    benefits_deductions: 0,
  });

  if (!run) return null;

  const isLocked = run.status === 'completed' || run.status === 'processing';
  const canProcess = run.status === 'draft' && (entries?.length || 0) > 0;
  const canComplete = run.status === 'processing';

  const handleAddEntry = async () => {
    if (!newEntry.employee_id) return;
    await addEntry.mutateAsync({
      payroll_run_id: runId,
      ...newEntry,
    });
    setShowAddEntry(false);
    setNewEntry({ employee_id: '', base_salary: 0, overtime_pay: 0, bonuses: 0, tax_deductions: 0, benefits_deductions: 0 });
  };

  const existingEmployeeIds = entries?.map(e => e.employee_id) || [];
  const availableEmployees = employees?.filter(e => !existingEmployeeIds.includes(e.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{run.name}</h3>
          <p className="text-sm text-muted-foreground">
            Period: {run.period_start} to {run.period_end} | Pay Date: {run.pay_date}
          </p>
        </div>
        <PayrollStatusBadge status={run.status as PayrollStatus} />
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            This payroll run is locked and cannot be modified.
          </span>
        </div>
      )}

      <div className="flex gap-2">
        {!isLocked && (
          <Button variant="outline" size="sm" onClick={() => setShowAddEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
        {canProcess && (
          <Button 
            size="sm" 
            onClick={() => lockRun.mutate({ runId, action: 'process' })}
            disabled={lockRun.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            Submit for Processing
          </Button>
        )}
        {canComplete && (
          <Button 
            size="sm" 
            onClick={() => lockRun.mutate({ runId, action: 'complete' })}
            disabled={lockRun.isPending}
          >
            <Lock className="h-4 w-4 mr-2" />
            Complete & Lock
          </Button>
        )}
      </div>

      {showAddEntry && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Payroll Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={newEntry.employee_id} onValueChange={(v) => setNewEntry({ ...newEntry, employee_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Salary</Label>
                <Input
                  type="number"
                  value={newEntry.base_salary}
                  onChange={(e) => setNewEntry({ ...newEntry, base_salary: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Overtime Pay</Label>
                <Input
                  type="number"
                  value={newEntry.overtime_pay}
                  onChange={(e) => setNewEntry({ ...newEntry, overtime_pay: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bonuses</Label>
                <Input
                  type="number"
                  value={newEntry.bonuses}
                  onChange={(e) => setNewEntry({ ...newEntry, bonuses: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Deductions</Label>
                <Input
                  type="number"
                  value={newEntry.tax_deductions}
                  onChange={(e) => setNewEntry({ ...newEntry, tax_deductions: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddEntry(false)}>Cancel</Button>
              <Button onClick={handleAddEntry} disabled={addEntry.isPending || !newEntry.employee_id}>
                {addEntry.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries && entries.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Base Salary</TableHead>
              <TableHead className="text-right">Overtime</TableHead>
              <TableHead className="text-right">Bonuses</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {(entry as any).employee?.first_name} {(entry as any).employee?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(entry as any).employee?.employee_number}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">${Number(entry.base_salary).toLocaleString()}</TableCell>
                <TableCell className="text-right">${Number(entry.overtime_pay || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right">${Number(entry.bonuses || 0).toLocaleString()}</TableCell>
                <TableCell className="text-right text-destructive">
                  -${Number(entry.total_deductions || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${Number(entry.net_pay).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <PayslipDownloadButton 
                    entryId={entry.id} 
                    employeeName={`${(entry as any).employee?.first_name} ${(entry as any).employee?.last_name}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No entries yet. Add employees to this payroll run.</p>
        </div>
      )}

      {entries && entries.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{entries.length}</p>
                <p className="text-sm text-muted-foreground">Employees</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${entries.reduce((sum, e) => sum + Number(e.gross_pay), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Gross</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">
                  ${entries.reduce((sum, e) => sum + Number(e.total_deductions || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Deductions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${entries.reduce((sum, e) => sum + Number(e.net_pay), 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Net Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PayrollPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const { data: runs, isLoading } = usePayrollRuns();
  const { data: stats } = usePayrollStats();

  return (
    <ModuleGuard moduleId="payroll">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-muted-foreground">Process and manage payroll runs</p>
        </div>
        <RoleGate role="company_admin">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Payroll Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payroll Run</DialogTitle>
                <DialogDescription>
                  Create a new payroll run for a specific pay period
                </DialogDescription>
              </DialogHeader>
              <CreateRunDialog onClose={() => setCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRuns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRuns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Last Payroll</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastPayrollTotal ? `$${Number(stats.lastPayrollTotal).toLocaleString()}` : '-'}
              </div>
              {stats.lastPayDate && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(stats.lastPayDate), 'MMM d, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">YTD Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalPaidThisYear.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="runs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <RoleGate role="company_admin">
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </RoleGate>
        </TabsList>

        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>View and manage payroll runs</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : runs && runs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Pay Date</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.name}</TableCell>
                        <TableCell>
                          {format(new Date(run.period_start), 'MMM d')} - {format(new Date(run.period_end), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{format(new Date(run.pay_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{run.employee_count || 0}</TableCell>
                        <TableCell>
                          {run.total_net ? `$${Number(run.total_net).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <PayrollStatusBadge status={run.status as PayrollStatus} />
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedRunId(run.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Payroll Run Details</DialogTitle>
                              </DialogHeader>
                              {selectedRunId === run.id && (
                                <PayrollRunDetail runId={run.id} onClose={() => setSelectedRunId(null)} />
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payroll runs yet. Create your first payroll run to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Reports</CardTitle>
              <CardDescription>Generate and download payroll reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6">
                    <FileText className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-semibold">Payroll Summary</h3>
                    <p className="text-sm text-muted-foreground">Monthly payroll totals and trends</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6">
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-semibold">Employee Earnings</h3>
                    <p className="text-sm text-muted-foreground">Individual earnings breakdown</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6">
                    <Calculator className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-semibold">Tax Report</h3>
                    <p className="text-sm text-muted-foreground">Tax deductions and filings</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <RoleGate role="company_admin">
            <Card>
              <CardHeader>
                <CardTitle>Payroll Settings</CardTitle>
                <CardDescription>Configure payroll settings and schedules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select defaultValue="USD">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pay Frequency</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Immutable Payroll Records</p>
                    <p className="text-sm text-muted-foreground">
                      Once a payroll run is completed, it cannot be modified. This ensures SOC2 compliance and audit integrity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RoleGate>
        </TabsContent>
      </Tabs>
      </div>
    </ModuleGuard>
  );
}
