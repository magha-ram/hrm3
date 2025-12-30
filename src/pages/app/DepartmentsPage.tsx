import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';

export default function DepartmentsPage() {
  const { isFrozen } = useTenant();
  const canEdit = !isFrozen;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Organize your company structure</p>
        </div>
        {canEdit && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Structure</CardTitle>
          <CardDescription>
            {isFrozen ? 'View-only mode - Account is frozen' : 'Manage your department hierarchy'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No departments found. Create your first department to organize your team.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
