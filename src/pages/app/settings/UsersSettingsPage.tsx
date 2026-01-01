import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCompanyUsers, CompanyUser } from '@/hooks/useCompanyUsers';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, MoreHorizontal, Shield, UserMinus, RotateCcw, Upload } from 'lucide-react';
import { ChangeRoleDialog } from '@/components/users/ChangeRoleDialog';
import { RemoveUserDialog } from '@/components/users/RemoveUserDialog';
import { BulkUserImportDialog } from '@/components/users/BulkUserImportDialog';

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
  const navigate = useNavigate();
  const { isFrozen, companyId, isLoading: tenantLoading } = useTenant();
  const { user } = useAuth();
  const { data: users, isLoading, error, refetch } = useCompanyUsers();
  const { canManageUsers, reactivateUser, bulkReactivateUsers } = useUserManagement();

  const [changeRoleUser, setChangeRoleUser] = useState<CompanyUser | null>(null);
  const [removeUser, setRemoveUser] = useState<CompanyUser | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [selectedInactiveUsers, setSelectedInactiveUsers] = useState<Set<string>>(new Set());
  const [usersPage, setUsersPage] = useState(1);
  const USERS_PAGE_SIZE = 10;

  const activeUsers = users?.filter(u => u.is_active) || [];
  const inactiveUsers = users?.filter(u => !u.is_active) || [];

  const paginatedActiveUsers = useMemo(() => {
    const start = (usersPage - 1) * USERS_PAGE_SIZE;
    return activeUsers.slice(start, start + USERS_PAGE_SIZE);
  }, [activeUsers, usersPage]);

  const handleReactivate = async (companyUser: CompanyUser) => {
    await reactivateUser.mutateAsync({
      companyUserId: companyUser.id,
      userId: companyUser.user_id,
    });
  };

  const handleBulkReactivate = async () => {
    const usersToReactivate = inactiveUsers
      .filter(u => selectedInactiveUsers.has(u.id))
      .map(u => ({ companyUserId: u.id, userId: u.user_id }));
    
    await bulkReactivateUsers.mutateAsync(usersToReactivate);
    setSelectedInactiveUsers(new Set());
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedInactiveUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleAllInactiveUsers = () => {
    if (selectedInactiveUsers.size === inactiveUsers.length) {
      setSelectedInactiveUsers(new Set());
    } else {
      setSelectedInactiveUsers(new Set(inactiveUsers.map(u => u.id)));
    }
  };

  // Show loading while tenant context initializes
  if (tenantLoading || !companyId) {
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
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Failed to load users. Please try again.</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={() => navigate('/app/settings/users/invite')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User Accounts
              </Button>
            </div>
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
                {paginatedActiveUsers.map((companyUser) => {
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Inactive Users ({inactiveUsers.length})
                </h3>
                {selectedInactiveUsers.size > 0 && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleBulkReactivate}
                    disabled={isFrozen || bulkReactivateUsers.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reactivate Selected ({selectedInactiveUsers.size})
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedInactiveUsers.size === inactiveUsers.length && inactiveUsers.length > 0}
                        onCheckedChange={toggleAllInactiveUsers}
                        disabled={isFrozen}
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveUsers.map((companyUser) => (
                    <TableRow key={companyUser.id} className="opacity-60">
                      <TableCell>
                        <Checkbox 
                          checked={selectedInactiveUsers.has(companyUser.id)}
                          onCheckedChange={() => toggleUserSelection(companyUser.id)}
                          disabled={isFrozen}
                        />
                      </TableCell>
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
      <BulkUserImportDialog 
        open={bulkImportOpen} 
        onOpenChange={setBulkImportOpen} 
      />
    </>
  );
}
