import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCompanyUsers, CompanyUser } from '@/hooks/useCompanyUsers';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, MoreHorizontal, Shield, UserMinus, RotateCcw } from 'lucide-react';
import { InviteUserDialog } from '@/components/users/InviteUserDialog';
import { ChangeRoleDialog } from '@/components/users/ChangeRoleDialog';
import { RemoveUserDialog } from '@/components/users/RemoveUserDialog';

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'super_admin':
      return 'destructive';
    case 'company_admin':
      return 'default';
    case 'hr_manager':
      return 'secondary';
    case 'manager':
      return 'outline';
    default:
      return 'outline';
  }
}

function formatRole(role: string) {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function UsersSettingsPage() {
  const { isFrozen } = useTenant();
  const { user } = useAuth();
  const { data: users, isLoading, error } = useCompanyUsers();
  const { canManageUsers, reactivateUser } = useUserManagement();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState<CompanyUser | null>(null);
  const [removeUser, setRemoveUser] = useState<CompanyUser | null>(null);

  const activeUsers = users?.filter(u => u.is_active) || [];
  const inactiveUsers = users?.filter(u => !u.is_active) || [];

  const handleReactivate = async (companyUser: CompanyUser) => {
    await reactivateUser.mutateAsync({
      companyUserId: companyUser.id,
      userId: companyUser.user_id,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
          <CardDescription>Manage team members and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
          <CardDescription>Manage team members and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            Failed to load users. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Users & Roles</CardTitle>
            <CardDescription>
              Manage team members and their access levels
              {isFrozen && <span className="ml-2 text-destructive">(Read-only while account is frozen)</span>}
            </CardDescription>
          </div>
          {canManageUsers && !isFrozen && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activeUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {canManageUsers && <TableHead className="w-[70px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeUsers.map((companyUser) => {
                  const isCurrentUser = companyUser.user_id === user?.user_id;
                  const isSuperAdmin = companyUser.role === 'super_admin';
                  
                  return (
                    <TableRow key={companyUser.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {companyUser.profile?.first_name || companyUser.profile?.last_name 
                              ? `${companyUser.profile?.first_name || ''} ${companyUser.profile?.last_name || ''}`.trim()
                              : 'Unknown User'}
                            {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {companyUser.profile?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(companyUser.role)}>
                          {formatRole(companyUser.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {companyUser.joined_at 
                          ? new Date(companyUser.joined_at).toLocaleDateString()
                          : 'Pending'}
                      </TableCell>
                      {canManageUsers && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={isFrozen || isCurrentUser || isSuperAdmin}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setChangeRoleUser(companyUser)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setRemoveUser(companyUser)}
                                className="text-destructive focus:text-destructive"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove from Company
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}

          {/* Inactive Users Section */}
          {inactiveUsers.length > 0 && canManageUsers && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Inactive Users</h3>
              <Table>
                <TableBody>
                  {inactiveUsers.map((companyUser) => (
                    <TableRow key={companyUser.id} className="opacity-60">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {companyUser.profile?.first_name || companyUser.profile?.last_name 
                              ? `${companyUser.profile?.first_name || ''} ${companyUser.profile?.last_name || ''}`.trim()
                              : 'Unknown User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {companyUser.profile?.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatRole(companyUser.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Inactive</Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleReactivate(companyUser)}
                          disabled={isFrozen || reactivateUser.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InviteUserDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen} 
      />
      <ChangeRoleDialog 
        user={changeRoleUser} 
        open={!!changeRoleUser} 
        onOpenChange={(open) => !open && setChangeRoleUser(null)} 
      />
      <RemoveUserDialog 
        user={removeUser} 
        open={!!removeUser} 
        onOpenChange={(open) => !open && setRemoveUser(null)} 
      />
    </>
  );
}
