import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import type { Tables } from '@/integrations/supabase/types';

export type CompanyUser = Tables<'company_users'> & {
  profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function useCompanyUsers() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['company-users', companyId],
    queryFn: async (): Promise<CompanyUser[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_users')
        .select(`
          *,
          profile:profiles!company_users_user_id_fkey(
            email,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the profile field correctly
      return (data || []).map(user => ({
        ...user,
        profile: Array.isArray(user.profile) ? user.profile[0] : user.profile,
      })) as CompanyUser[];
    },
    enabled: !!companyId,
  });
}
