import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import type { HelpGuide, Annotation, HelpGuideInput, HelpGuideStepInput } from '@/types/help-guides';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useHelpGuides() {
  const { companyId } = useTenant();
  
  return useQuery({
    queryKey: ['help-guides', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_guides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as HelpGuide[];
    },
    enabled: !!companyId,
  });
}

export function useHelpGuide(guideId: string | null) {
  return useQuery({
    queryKey: ['help-guide', guideId],
    queryFn: async () => {
      if (!guideId) return null;
      
      const { data: guide, error: guideError } = await supabase
        .from('help_guides')
        .select('*')
        .eq('id', guideId)
        .single();
      
      if (guideError) throw guideError;
      
      const { data: steps, error: stepsError } = await supabase
        .from('help_guide_steps')
        .select('*')
        .eq('guide_id', guideId)
        .order('step_number', { ascending: true });
      
      if (stepsError) throw stepsError;
      
      return {
        ...guide,
        steps: steps.map(step => ({
          ...step,
          annotations: (step.annotations as unknown as Annotation[]) || [],
        })),
      } as HelpGuide;
    },
    enabled: !!guideId,
  });
}

export function useCreateHelpGuide() {
  const queryClient = useQueryClient();
  const { companyId } = useTenant();
  
  return useMutation({
    mutationFn: async (guide: HelpGuideInput) => {
      const { steps, ...guideData } = guide;
      
      const { data: newGuide, error: guideError } = await supabase
        .from('help_guides')
        .insert({
          title: guideData.title || 'Untitled Guide',
          description: guideData.description,
          module: guideData.module,
          category: guideData.category,
          roles: guideData.roles,
          is_active: guideData.is_active ?? true,
          is_platform_guide: guideData.is_platform_guide ?? false,
          company_id: companyId,
        })
        .select()
        .single();
      
      if (guideError) throw guideError;
      
      if (steps && steps.length > 0) {
        const stepsData = steps.map((step, index) => ({
          guide_id: newGuide.id,
          step_number: index + 1,
          title: step.title || `Step ${index + 1}`,
          description: step.description,
          screenshot_url: step.screenshot_url,
          annotations: (step.annotations || []) as unknown as Json,
        }));
        
        const { error: stepsError } = await supabase
          .from('help_guide_steps')
          .insert(stepsData);
        
        if (stepsError) throw stepsError;
      }
      
      return newGuide;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-guides'] });
      toast.success('Guide created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create guide: ' + error.message);
    },
  });
}

export function useUpdateHelpGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: HelpGuideInput & { id: string }) => {
      const { steps, ...guideData } = data;
      
      const { error: guideError } = await supabase
        .from('help_guides')
        .update({
          title: guideData.title,
          description: guideData.description,
          module: guideData.module,
          category: guideData.category,
          roles: guideData.roles,
          is_active: guideData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (guideError) throw guideError;
      
      if (steps) {
        // Delete existing steps
        await supabase
          .from('help_guide_steps')
          .delete()
          .eq('guide_id', id);
        
        // Insert new steps
        if (steps.length > 0) {
          const stepsData = steps.map((step, index) => ({
            guide_id: id,
            step_number: index + 1,
            title: step.title || `Step ${index + 1}`,
            description: step.description,
            screenshot_url: step.screenshot_url,
            annotations: (step.annotations || []) as unknown as Json,
          }));
          
          const { error: stepsError } = await supabase
            .from('help_guide_steps')
            .insert(stepsData);
          
          if (stepsError) throw stepsError;
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['help-guides'] });
      queryClient.invalidateQueries({ queryKey: ['help-guide', variables.id] });
      toast.success('Guide updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update guide: ' + error.message);
    },
  });
}

export function useDeleteHelpGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (guideId: string) => {
      const { error } = await supabase
        .from('help_guides')
        .delete()
        .eq('id', guideId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-guides'] });
      toast.success('Guide deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete guide: ' + error.message);
    },
  });
}

export function useUploadGuideScreenshot() {
  return useMutation({
    mutationFn: async ({ file, companyId, guideId, stepNumber }: {
      file: File;
      companyId: string;
      guideId: string;
      stepNumber: number;
    }) => {
      const ext = file.name.split('.').pop();
      const path = `${companyId}/${guideId}/step-${stepNumber}.${ext}`;
      
      const { error } = await supabase.storage
        .from('help-guides')
        .upload(path, file, { upsert: true });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('help-guides')
        .getPublicUrl(path);
      
      return publicUrl;
    },
    onError: (error) => {
      toast.error('Failed to upload screenshot: ' + error.message);
    },
  });
}
