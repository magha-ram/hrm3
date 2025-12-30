import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useCurrentCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building2, Hash } from 'lucide-react';
import { MultiCompanyRequestDialog } from '@/components/MultiCompanyRequestDialog';
import { type EmployeeIdSettings, formatPreviewNumber } from '@/hooks/useEmployeeNumber';
export default function CompanySettingsPage() {
  const { companyId, isFrozen } = useTenant();
  const { data: company, isLoading, error } = useCurrentCompany();
  const queryClient = useQueryClient();
  const canEdit = !isFrozen;

  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Employee ID settings
  const [employeeIdSettings, setEmployeeIdSettings] = useState<EmployeeIdSettings>({
    prefix: '',
    separator: '',
    padding: 3,
    startingNumber: 1,
  });
  const [hasIdSettingsChanges, setHasIdSettingsChanges] = useState(false);

  // Initialize form when data loads
  useEffect(() => {
    if (company) {
      setCompanyName(company.name);
      setTimezone(company.timezone || 'UTC');
      
      // Load employee ID settings
      const settings = company.settings as { employeeId?: EmployeeIdSettings } | null;
      if (settings?.employeeId) {
        setEmployeeIdSettings(settings.employeeId);
      }
    }
  }, [company]);

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

  const updateEmployeeIdSettings = useMutation({
    mutationFn: async (idSettings: EmployeeIdSettings) => {
      if (!companyId) throw new Error('No company selected');

      const currentSettings = (company?.settings ?? {}) as Record<string, unknown>;
      const newSettings = JSON.parse(JSON.stringify({ 
        ...currentSettings, 
        employeeId: {
          prefix: idSettings.prefix,
          separator: idSettings.separator,
          padding: idSettings.padding,
          startingNumber: idSettings.startingNumber,
        }
      }));
      
      const { error } = await supabase
        .from('companies')
        .update({
          settings: newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success('Employee ID format updated successfully');
      setHasIdSettingsChanges(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee ID settings');
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

      {/* Employee ID Format */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Employee ID Format
          </CardTitle>
          <CardDescription>
            Configure how employee numbers are automatically generated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id-prefix">Prefix (optional)</Label>
              <Input 
                id="id-prefix" 
                value={employeeIdSettings.prefix}
                onChange={(e) => {
                  setEmployeeIdSettings(prev => ({ ...prev, prefix: e.target.value }));
                  setHasIdSettingsChanges(true);
                }}
                disabled={!canEdit}
                placeholder="e.g., EMP, STAFF" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id-separator">Separator</Label>
              <Select
                value={employeeIdSettings.separator}
                onValueChange={(value: '' | '-' | '_') => {
                  setEmployeeIdSettings(prev => ({ ...prev, separator: value }));
                  setHasIdSettingsChanges(true);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger id="id-separator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="-">Hyphen (-)</SelectItem>
                  <SelectItem value="_">Underscore (_)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id-padding">Number Padding</Label>
              <Select
                value={String(employeeIdSettings.padding)}
                onValueChange={(value) => {
                  setEmployeeIdSettings(prev => ({ ...prev, padding: parseInt(value, 10) }));
                  setHasIdSettingsChanges(true);
                }}
                disabled={!canEdit}
              >
                <SelectTrigger id="id-padding">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 digits (001)</SelectItem>
                  <SelectItem value="4">4 digits (0001)</SelectItem>
                  <SelectItem value="5">5 digits (00001)</SelectItem>
                  <SelectItem value="6">6 digits (000001)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id-start">Starting Number</Label>
              <Input 
                id="id-start" 
                type="number"
                min="1"
                value={employeeIdSettings.startingNumber}
                onChange={(e) => {
                  setEmployeeIdSettings(prev => ({ ...prev, startingNumber: parseInt(e.target.value, 10) || 1 }));
                  setHasIdSettingsChanges(true);
                }}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground mb-1">Preview</p>
            <p className="text-lg font-mono font-medium">
              {formatPreviewNumber(employeeIdSettings)}
            </p>
          </div>

          {canEdit && (
            <Button 
              onClick={() => updateEmployeeIdSettings.mutate(employeeIdSettings)}
              disabled={!hasIdSettingsChanges || updateEmployeeIdSettings.isPending}
            >
              {updateEmployeeIdSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save ID Format
            </Button>
          )}
        </CardContent>
      </Card>

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
