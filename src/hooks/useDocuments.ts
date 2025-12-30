import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type EmployeeDocument = Tables<'employee_documents'>;
export type DocumentType = Tables<'document_types'>;

export function useDocumentTypes() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['document-types', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useMyDocuments() {
  const { companyId, employeeId } = useTenant();

  return useQuery({
    queryKey: ['documents', 'my', companyId, employeeId],
    queryFn: async () => {
      if (!companyId || !employeeId) return [];

      const { data, error } = await supabase
        .from('employee_documents')
        .select(`
          *,
          document_type:document_types(id, name, code)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!employeeId,
  });
}

export function useEmployeeDocuments(employeeId: string | null) {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['documents', 'employee', employeeId],
    queryFn: async () => {
      if (!companyId || !employeeId) return [];

      const { data, error } = await supabase
        .from('employee_documents')
        .select(`
          *,
          document_type:document_types(id, name, code),
          verified_by_employee:employees!employee_documents_verified_by_fkey(id, first_name, last_name)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId && !!employeeId,
  });
}

export function useAllDocuments() {
  const { companyId } = useTenant();

  return useQuery({
    queryKey: ['documents', 'all', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('employee_documents')
        .select(`
          *,
          employee:employees(id, first_name, last_name, email),
          document_type:document_types(id, name, code)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  const { companyId } = useTenant();

  return useMutation({
    mutationFn: async (document: Omit<TablesInsert<'employee_documents'>, 'company_id'>) => {
      if (!companyId) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('employee_documents')
        .insert({ ...document, company_id: companyId })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'employee_documents',
        action: 'create',
        record_id: data.id,
        new_values: { title: document.title, employee_id: document.employee_id },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload document');
    },
  });
}

export function useVerifyDocument() {
  const queryClient = useQueryClient();
  const { companyId, employeeId } = useTenant();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('employee_documents')
        .update({
          is_verified: true,
          verified_by: employeeId,
          verified_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'employee_documents',
        action: 'update',
        record_id: id,
        new_values: { is_verified: true },
        metadata: { action_type: 'verify_document' },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document verified');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify document');
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { companyId } = useTenant();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: oldData } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        company_id: companyId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        table_name: 'employee_documents',
        action: 'delete',
        record_id: id,
        old_values: oldData,
      });

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });
}
