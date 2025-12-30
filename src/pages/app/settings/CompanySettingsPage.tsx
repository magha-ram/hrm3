import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompanySettingsPage() {
  const { companyName, isFrozen } = useTenant();
  const canEdit = !isFrozen;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Settings</CardTitle>
        <CardDescription>Manage your company profile and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input id="company-name" defaultValue={companyName || ''} disabled={!canEdit} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" defaultValue="UTC" disabled={!canEdit} />
        </div>

        {canEdit && (
          <Button>Save Changes</Button>
        )}
      </CardContent>
    </Card>
  );
}
