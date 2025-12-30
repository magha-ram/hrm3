import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

export interface CompanyEmailSettings {
  id: string;
  company_id: string;
  use_platform_default: boolean;
  provider: string | null;
  from_email: string | null;
  from_name: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  smtp_password: string | null;
  smtp_secure: boolean | null;
  api_key: string | null;
  aws_region: string | null;
  aws_access_key_id: string | null;
  aws_secret_access_key: string | null;
  is_verified: boolean;
  verified_at: string | null;
  last_test_at: string | null;
  last_test_result: {
    success: boolean;
    error?: string;
    provider?: string;
    tested_to?: string;
  } | null;
}

export interface EmailSettingsFormData {
  use_platform_default: boolean;
  provider: string;
  from_email: string;
  from_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_secure: boolean;
  api_key: string;
  aws_region: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
}

export type EmailProvider = 'smtp' | 'resend' | 'mailersend' | 'sendgrid' | 'ses';

export function useCompanyEmailSettings() {
  const { companyId } = useTenant();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['company-email-settings', companyId],
    queryFn: async (): Promise<CompanyEmailSettings | null> => {
      if (!companyId) return null;

      const { data, error } = await supabase.functions.invoke('manage-email-settings', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // For GET requests, we need to use query params approach
      const response = await fetch(
        `https://xwfzrbigmgyxsrzlkqwr.supabase.co/functions/v1/manage-email-settings?company_id=${companyId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch email settings');
      }

      const result = await response.json();
      return result.settings;
    },
    enabled: !!companyId,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (formData: EmailSettingsFormData) => {
      if (!companyId) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('manage-email-settings', {
        body: {
          company_id: companyId,
          ...formData,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Email settings saved');
      queryClient.invalidateQueries({ queryKey: ['company-email-settings', companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save settings');
    },
  });

  const deleteSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company selected');

      const response = await fetch(
        `https://xwfzrbigmgyxsrzlkqwr.supabase.co/functions/v1/manage-email-settings?company_id=${companyId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Custom settings removed, using platform default');
      queryClient.invalidateQueries({ queryKey: ['company-email-settings', companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete settings');
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (toEmail: string) => {
      if (!companyId) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('test-company-email', {
        body: {
          company_id: companyId,
          to: toEmail,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Test email failed');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Test email sent successfully');
      queryClient.invalidateQueries({ queryKey: ['company-email-settings', companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send test email');
    },
  });

  return {
    settings,
    isLoading,
    error,
    saveSettings: saveSettingsMutation.mutate,
    isSaving: saveSettingsMutation.isPending,
    deleteSettings: deleteSettingsMutation.mutate,
    isDeleting: deleteSettingsMutation.isPending,
    sendTestEmail: testEmailMutation.mutate,
    isTesting: testEmailMutation.isPending,
  };
}
