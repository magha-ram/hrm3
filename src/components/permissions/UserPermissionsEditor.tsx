import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  useUserPermissions, 
  useSetUserPermission 
} from '@/hooks/usePermissions';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useTenant } from '@/contexts/TenantContext';
import { 
  PermissionModule, 
  PermissionAction, 
  MODULE_LABELS, 
  ACTION_LABELS 
} from '@/types/permissions';
import { 
  UserCog, 
  Check, 
  X, 
  RotateCcw,
  AlertCircle,
  Building2,
  Shield,
  ShieldOff,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserPermissionsEditor() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { isAdmin, companyId } = useTenant();
  
  const { data: users, isLoading: usersLoading } = useCompanyUsers();
  const { data: userPermissions, isLoading: permissionsLoading } = useUserPermissions(selectedUserId);
  const setPermission = useSetUserPermission();

  const isLoading = usersLoading || permissionsLoading;

  // Group permissions by module
  const permissionsByModule = userPermissions?.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<PermissionModule, typeof userPermissions>);

  const handleSetPermission = (
    module: PermissionModule, 
    action: PermissionAction, 
    granted: boolean | null
  ) => {
    if (!selectedUserId) return;
    
    setPermission.mutate({
      userId: selectedUserId,
      module,
      action,
      granted,
    });
  };

  const selectedUser = users?.find(u => u.user_id === selectedUserId);

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Only company admins can manage user permissions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          User Permission Overrides
        </CardTitle>
        <CardDescription>
          Grant or deny specific permissions for individual users. Overrides take precedence over role permissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Select User</label>
          <Select 
            value={selectedUserId || ''} 
            onValueChange={(v) => setSelectedUserId(v || null)}
          >
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Choose a user to manage permissions" />
            </SelectTrigger>
            <SelectContent>
              {users?.filter(u => u.role !== 'super_admin').map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  <div className="flex items-center gap-2">
                    <span>
                      {user.profile?.first_name} {user.profile?.last_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {user.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserId && selectedUser?.role === 'super_admin' && (
          <Alert className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Super admins have all permissions and cannot be modified.
            </AlertDescription>
          </Alert>
        )}

        {selectedUserId && selectedUser?.role !== 'super_admin' && (
          <>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Allow
                    </Badge>
                    <span>Explicitly granted</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                      <ShieldOff className="h-3 w-3 mr-1" />
                      Deny
                    </Badge>
                    <span>Explicitly denied</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">
                      Inherited
                    </Badge>
                    <span>From role</span>
                  </div>
                </div>

                {Object.entries(permissionsByModule || {}).map(([module, permissions]) => (
                  <div key={module} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {MODULE_LABELS[module as PermissionModule]}
                    </h4>
                    <div className="grid gap-2">
                      {permissions?.map((perm) => {
                        const isExplicitAllow = perm.source === 'explicit_allow';
                        const isExplicitDeny = perm.source === 'explicit_deny';
                        const isFromRole = perm.source === 'role';
                        const hasOverride = isExplicitAllow || isExplicitDeny;

                        return (
                          <div
                            key={perm.permission_id}
                            className={cn(
                              "flex items-center justify-between p-3 rounded border",
                              isExplicitAllow && "bg-green-500/5 border-green-200",
                              isExplicitDeny && "bg-red-500/5 border-red-200",
                              !hasOverride && "bg-muted/30"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{perm.name}</span>
                              {isFromRole && (
                                <Badge variant="outline" className="text-xs">
                                  From Role
                                </Badge>
                              )}
                              {isExplicitAllow && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">
                                  <ShieldCheck className="h-3 w-3 mr-1" />
                                  Override: Allow
                                </Badge>
                              )}
                              {isExplicitDeny && (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 text-xs">
                                  <ShieldOff className="h-3 w-3 mr-1" />
                                  Override: Deny
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant={isExplicitAllow ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  isExplicitAllow && "bg-green-600 hover:bg-green-700"
                                )}
                                onClick={() => handleSetPermission(
                                  perm.module,
                                  perm.action,
                                  isExplicitAllow ? null : true
                                )}
                                disabled={setPermission.isPending}
                                title="Allow"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={isExplicitDeny ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                  "h-8 w-8 p-0",
                                  isExplicitDeny && "bg-red-600 hover:bg-red-700"
                                )}
                                onClick={() => handleSetPermission(
                                  perm.module,
                                  perm.action,
                                  isExplicitDeny ? null : false
                                )}
                                disabled={setPermission.isPending}
                                title="Deny"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              {hasOverride && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleSetPermission(
                                    perm.module,
                                    perm.action,
                                    null
                                  )}
                                  disabled={setPermission.isPending}
                                  title="Reset to role default"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!selectedUserId && (
          <div className="text-center py-12 text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a user to manage their permission overrides</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UserPermissionsEditor;
