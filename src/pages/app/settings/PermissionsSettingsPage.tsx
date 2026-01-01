import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RolePermissionsEditor } from '@/components/permissions/RolePermissionsEditor';
import { UserPermissionsEditor } from '@/components/permissions/UserPermissionsEditor';
import { RoleGate } from '@/components/PermissionGate';
import { Shield, Users } from 'lucide-react';

export function PermissionsSettingsPage() {
  return (
    <RoleGate role="company_admin">
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Permission Management</h1>
          <p className="text-muted-foreground">
            Configure role-based permissions and user-specific overrides
          </p>
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Role Permissions
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              User Overrides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles">
            <RolePermissionsEditor />
          </TabsContent>

          <TabsContent value="users">
            <UserPermissionsEditor />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGate>
  );
}

export default PermissionsSettingsPage;
