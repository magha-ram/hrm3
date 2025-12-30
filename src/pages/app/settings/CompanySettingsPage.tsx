import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrentCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';
import { MultiCompanyRequestDialog } from '@/components/MultiCompanyRequestDialog';

export default function CompanySettingsPage() {
  const { companyId, isFrozen } = useTenant();
  const { data: company, isLoading, error } = useCurrentCompany();
  const queryClient = useQueryClient();
  const canEdit = !isFrozen;

  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when data loads
  useState(() => {
    if (company) {
      setCompanyName(company.name);
      setTimezone(company.timezone || 'UTC');
    }
  });

  // Update form when company data changes
  if (company && companyName === '' && company.name) {
    setCompanyName(company.name);
    setTimezone(company.timezone || 'UTC');
  }

  const updateCompany = useMutation({
    mutationFn: async (updates: { name: string; timezone: string }) => {
      if (!companyId) throw new Error('No company selected');

      const { error } = await supabase
        .from('companies')
        .update({
          name: updates.name,
          timezone: updates.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success('Company settings updated successfully');
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update company settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    updateCompany.mutate({ name: companyName, timezone });
  };

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>Manage your company profile and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>Manage your company profile and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            Failed to load company settings. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>
              Manage your company profile and preferences
              {isFrozen && <span className="ml-2 text-destructive">(Read-only while account is frozen)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input 
                id="company-name" 
                value={companyName}
                onChange={handleChange(setCompanyName)}
                disabled={!canEdit} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input 
                id="timezone" 
                value={timezone}
                onChange={handleChange(setTimezone)}
                disabled={!canEdit}
                placeholder="e.g., America/New_York" 
              />
              <p className="text-xs text-muted-foreground">
                Enter a valid IANA timezone (e.g., UTC, America/New_York, Europe/London)
              </p>
            </div>

            {canEdit && (
              <Button 
                type="submit" 
                disabled={!hasChanges || updateCompany.isPending}
              >
                {updateCompany.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Multi-Company Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Multi-Company Access
          </CardTitle>
          <CardDescription>
            Need to manage or join multiple companies? Request access to expand your account capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MultiCompanyRequestDialog />
        </CardContent>
      </Card>
    </div>
  );
}
