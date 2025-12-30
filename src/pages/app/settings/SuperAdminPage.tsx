import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useUserRole } from '@/hooks/useUserRole';
import { createSuperAdmin } from '@/lib/saas-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Crown, Shield, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface SuperAdminFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export default function SuperAdminPage() {
  const { companyId } = useTenant();
  const { isSuperAdmin } = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SuperAdminFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  // Only super admins can access this page
  if (!isSuperAdmin) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // Fetch all super admins in the company
  const { data: superAdmins, isLoading } = useQuery({
    queryKey: ['super-admins', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      // First get company users with super_admin role
      const { data: companyUsers, error: usersError } = await supabase
        .from('company_users')
        .select('id, role, is_active, joined_at, user_id')
        .eq('company_id', companyId)
        .eq('role', 'super_admin')
        .order('joined_at', { ascending: true });

      if (usersError) throw usersError;
      if (!companyUsers || companyUsers.length === 0) return [];

      // Get profile data for each user
      const userIds = companyUsers.map(u => u.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      return companyUsers.map(user => ({
        ...user,
        profile: profiles?.find(p => p.id === user.user_id) || null,
      }));
    },
    enabled: !!companyId,
  });

  // Create super admin mutation
  const createMutation = useMutation({
    mutationFn: async (data: SuperAdminFormData) => {
      if (!companyId) throw new Error('No company selected');
      
      const result = await createSuperAdmin({
        company_id: companyId,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create super admin');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Super Admin Created',
        description: 'The new super admin has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['super-admins', companyId] });
      setIsDialogOpen(false);
      setFormData({ email: '', password: '', first_name: '', last_name: '' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create super admin',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Email and password are required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Super Admin Management</h1>
          <p className="text-muted-foreground">
            Manage super administrators who have full access to all company resources
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Super Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Create Super Admin
                </DialogTitle>
                <DialogDescription>
                  Super admins have unrestricted access to all company data and settings. 
                  Only grant this role to trusted individuals.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Super Admin
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Super Admins
          </CardTitle>
          <CardDescription>
            Users with super_admin role have full system access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : superAdmins && superAdmins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superAdmins.map((admin) => {
                  const profile = admin.profile;
                  return (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          {profile?.first_name || profile?.last_name 
                            ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                            : 'No name'}
                        </div>
                      </TableCell>
                      <TableCell>{profile?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {admin.joined_at 
                          ? new Date(admin.joined_at).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No super admins found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
