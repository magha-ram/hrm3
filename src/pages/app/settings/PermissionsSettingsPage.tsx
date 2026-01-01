import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPermissionsTable } from '@/components/permissions/UserPermissionsTable';
import { RolePermissionsManager } from '@/components/permissions/RolePermissionsManager';
import { UserOverridesList } from '@/components/permissions/UserOverridesList';
import { RoleGate } from '@/components/PermissionGate';
import { Users, Shield, UserCog } from 'lucide-react';

export function PermissionsSettingsPage() {
  return (
    <RoleGate role="company_admin">
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Permission Management</h1>
          <p className="text-muted-foreground">
            Manage user permissions across different modules and features
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              User Permissions
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Role Permissions
            </TabsTrigger>
            <TabsTrigger value="overrides" className="gap-2">
              <UserCog className="h-4 w-4" />
              User Overrides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserPermissionsTable />
          </TabsContent>

          <TabsContent value="roles">
            <RolePermissionsManager />
          </TabsContent>

          <TabsContent value="overrides">
            <UserOverridesList />
          </TabsContent>
        </Tabs>
      </div>
    </RoleGate>
  );
}

export default PermissionsSettingsPage;
