import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Database, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2,
  Building2,
  Users,
  Mail
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TestCompanyConfig {
  company_name: string;
  employee_count: number;
  plan_name: 'Basic' | 'Pro' | 'Enterprise';
  subdomain: string;
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  real_email_users: { role: string; email: string; first_name: string; last_name: string }[];
}

const TEST_COMPANIES: TestCompanyConfig[] = [
  {
    company_name: 'Test Company 50',
    employee_count: 50,
    plan_name: 'Basic',
    subdomain: 'test50',
    admin_email: 'nateshkumar2021+test50@gmail.com',
    admin_first_name: 'Test50',
    admin_last_name: 'Admin',
    real_email_users: [
      { role: 'hr_manager', email: 'nateshkumar2021+test50_hr@gmail.com', first_name: 'HR', last_name: 'Manager' },
      { role: 'manager', email: 'nateshkumar2021+test50_mgr@gmail.com', first_name: 'Team', last_name: 'Manager' },
    ],
  },
  {
    company_name: 'Test Company 85',
    employee_count: 85,
    plan_name: 'Pro',
    subdomain: 'test85',
    admin_email: 'nateshkumar2021+test85@gmail.com',
    admin_first_name: 'Test85',
    admin_last_name: 'Admin',
    real_email_users: [
      { role: 'hr_manager', email: 'nateshkumar2021+test85_hr@gmail.com', first_name: 'HR', last_name: 'Manager' },
      { role: 'manager', email: 'nateshkumar2021+test85_mgr@gmail.com', first_name: 'Team', last_name: 'Manager' },
    ],
  },
  {
    company_name: 'Test Company 170',
    employee_count: 170,
    plan_name: 'Enterprise',
    subdomain: 'test170',
    admin_email: 'nateshkumar2021+test170@gmail.com',
    admin_first_name: 'Test170',
    admin_last_name: 'Admin',
    real_email_users: [
      { role: 'hr_manager', email: 'nateshkumar2021+test170_hr@gmail.com', first_name: 'HR', last_name: 'Manager' },
      { role: 'manager', email: 'nateshkumar2021+test170_mgr@gmail.com', first_name: 'Team', last_name: 'Manager' },
    ],
  },
];

export function TestDataSeeder() {
  const queryClient = useQueryClient();
  const [seedingCompany, setSeedingCompany] = useState<string | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch existing test companies
  const { data: testCompanies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['test-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug, is_test_company, created_at')
        .eq('is_test_company', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Seed company mutation
  const seedMutation = useMutation({
    mutationFn: async (config: TestCompanyConfig) => {
      setSeedingCompany(config.company_name);
      const { data, error } = await supabase.functions.invoke('seed-test-company', {
        body: config,
      });
      if (error) throw error;
      if (data.error) throw new Error(data.message || data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Created ${data.company.name} with ${data.stats.employees_created} employees`);
      queryClient.invalidateQueries({ queryKey: ['test-companies'] });
      setSeedingCompany(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setSeedingCompany(null);
    },
  });

  // Delete test company mutation  
  const deleteMutation = useMutation({
    mutationFn: async (companyId: string) => {
      setDeletingCompany(companyId);
      const { data, error } = await supabase.rpc('delete_test_company', { _company_id: companyId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test company deleted');
      queryClient.invalidateQueries({ queryKey: ['test-companies'] });
      setDeletingCompany(null);
      setConfirmDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setDeletingCompany(null);
    },
  });

  // Seed all companies
  const seedAllMutation = useMutation({
    mutationFn: async () => {
      for (const config of TEST_COMPANIES) {
        // Check if already exists
        const exists = testCompanies?.some(tc => tc.name === config.company_name);
        if (exists) continue;
        
        await seedMutation.mutateAsync(config);
      }
    },
    onSuccess: () => {
      toast.success('All test companies created');
    },
  });

  const isCompanyCreated = (name: string) => testCompanies?.some(tc => tc.name === name);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Test Data Seeder</CardTitle>
            <CardDescription>Create test companies with realistic data for testing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Test companies are marked with <Badge variant="outline" className="mx-1">is_test_company = true</Badge> 
            and can be deleted with one click. They are excluded from analytics by default.
          </AlertDescription>
        </Alert>

        {/* Existing Test Companies */}
        {loadingCompanies ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading test companies...
          </div>
        ) : testCompanies && testCompanies.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Existing Test Companies</h4>
            <div className="space-y-2">
              {testCompanies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.slug}</p>
                    </div>
                    <Badge variant="secondary">Test</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDelete({ id: company.id, name: company.name })}
                    disabled={deletingCompany === company.id}
                  >
                    {deletingCompany === company.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <Separator />

        {/* Companies to Create */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Test Companies Configuration</h4>
            <Button
              variant="default"
              size="sm"
              onClick={() => seedAllMutation.mutate()}
              disabled={seedAllMutation.isPending || TEST_COMPANIES.every(c => isCompanyCreated(c.company_name))}
            >
              {seedAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Seed All Missing
            </Button>
          </div>

          <div className="grid gap-4">
            {TEST_COMPANIES.map((config) => {
              const exists = isCompanyCreated(config.company_name);
              return (
                <div
                  key={config.company_name}
                  className={`p-4 border rounded-lg ${exists ? 'bg-muted/50' : 'bg-background'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{config.company_name}</h5>
                        <Badge variant={
                          config.plan_name === 'Enterprise' ? 'default' :
                          config.plan_name === 'Pro' ? 'secondary' : 'outline'
                        }>
                          {config.plan_name}
                        </Badge>
                        {exists && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Created
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {config.employee_count} employees
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {config.admin_email.replace(/^(.{10}).*(@.*)$/, '$1...$2')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Real email users: Admin + {config.real_email_users.length} others (HR Manager, Manager)
                      </div>
                    </div>
                    <Button
                      variant={exists ? 'ghost' : 'outline'}
                      size="sm"
                      onClick={() => seedMutation.mutate(config)}
                      disabled={exists || seedingCompany === config.company_name}
                    >
                      {seedingCompany === config.company_name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : exists ? (
                        'Created'
                      ) : (
                        'Seed Company'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Test Company</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? 
                This will permanently remove all employees, payroll, and historical data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Delete Company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
