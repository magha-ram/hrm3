import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { AppRole } from '@/types/auth';

interface InviteUserParams {
  email: string;
  role: AppRole;
  firstName?: string;
  lastName?: string;
}

interface UpdateRoleParams {
  userId: string;
  companyUserId: string;
  newRole: AppRole;
  currentRole: AppRole;
}

interface RemoveUserParams {
  companyUserId: string;
  userId: string;
}

export function useUserManagement() {
  const { companyId, role: currentUserRole } = useTenant();
  const queryClient = useQueryClient();

  const inviteUser = useMutation({
    mutationFn: async (params: InviteUserParams) => {
      if (!companyId) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          company_id: companyId,
          email: params.email.toLowerCase().trim(),
          role: params.role,
          first_name: params.firstName?.trim() || undefined,
          last_name: params.lastName?.trim() || undefined,
        },
      });

      if (error) {
        console.error('Invite error:', error);
        throw new Error(error.message || 'Failed to invite user');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to invite user');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['company-users', companyId] });
      toast.success(data.user_added ? 'User added to company' : 'Invitation sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async (params: UpdateRoleParams) => {
      if (!companyId) throw new Error('No company selected');

      // Prevent promoting to super_admin
      if (params.newRole === 'super_admin') {
        throw new Error('Cannot promote to Super Admin');
      }

      const { error } = await supabase
        .from('company_users')
        .update({ role: params.newRole, updated_at: new Date().toISOString() })
        .eq('id', params.companyUserId)
        .eq('company_id', companyId);

      if (error) throw error;

      // Log audit event
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'update',
        table_name: 'company_users',
        record_id: params.companyUserId,
        old_values: { role: params.currentRole },
        new_values: { role: params.newRole },
        metadata: { action_type: 'role_change' },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', companyId] });
      toast.success('User role updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  const removeUser = useMutation({
    mutationFn: async (params: RemoveUserParams) => {
      if (!companyId) throw new Error('No company selected');

      // Soft remove - set is_active to false
      const { error } = await supabase
        .from('company_users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', params.companyUserId)
        .eq('company_id', companyId);

      if (error) throw error;

      // Log audit event
      await supabase.from('audit_logs').insert({
        company_id: companyId,
        action: 'update',
        table_name: 'company_users',
        record_id: params.companyUserId,
        old_values: { is_active: true },
        new_values: { is_active: false },
        metadata: { action_type: 'user_removed' },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', companyId] });
      toast.success('User removed from company');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove user');
    },
  });

  const reactivateUser = useMutation({
    mutationFn: async (params: RemoveUserParams) => {
      if (!companyId) throw new Error('No company selected');

      const { error } = await supabase
        .from('company_users')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', params.companyUserId)
        .eq('company_id', companyId);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', companyId] });
      toast.success('User reactivated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reactivate user');
    },
  });

  return {
    inviteUser,
    updateUserRole,
    removeUser,
    reactivateUser,
    canManageUsers: currentUserRole === 'super_admin' || currentUserRole === 'company_admin',
  };
}
