import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { Users } from 'lucide-react';

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'super_admin':
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
  const { data: users, isLoading, error } = useCompanyUsers();

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
    <Card>
      <CardHeader>
        <CardTitle>Users & Roles</CardTitle>
        <CardDescription>
          Manage team members and their access levels
          {isFrozen && <span className="ml-2 text-destructive">(Read-only while account is frozen)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users && users.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.profile?.first_name || user.profile?.last_name 
                          ? `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim()
                          : 'Unknown User'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.profile?.email || 'No email'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.joined_at 
                      ? new Date(user.joined_at).toLocaleDateString()
                      : 'Pending'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
