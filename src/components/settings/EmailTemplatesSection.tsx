import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Eye, Loader2, Mail, Pencil, Save } from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_type: string;
  display_name: string;
  description: string | null;
  is_enabled: boolean;
  sender_email: string | null;
  sender_name: string | null;
}

const DEFAULT_TEMPLATES = [
  { type: 'user_invitation', name: 'User Invitation', description: 'Sent when inviting a new user to the company' },
  { type: 'welcome_email', name: 'Welcome Email', description: 'Welcome message for new employees' },
  { type: 'password_reset', name: 'Password Reset', description: 'Password reset instructions' },
  { type: 'leave_request', name: 'Leave Request', description: 'Notification about leave requests' },
  { type: 'leave_approved', name: 'Leave Approved', description: 'Leave request approval notification' },
  { type: 'leave_rejected', name: 'Leave Rejected', description: 'Leave request rejection notification' },
  { type: 'payslip_available', name: 'Payslip Available', description: 'Notification when payslip is ready' },
  { type: 'document_expiry', name: 'Document Expiry', description: 'Document expiration warning' },
  { type: 'interview_scheduled', name: 'Interview Scheduled', description: 'Interview scheduling notification' },
  { type: 'offer_letter', name: 'Offer Letter', description: 'Job offer email to candidates' },
  { type: 'security_alert', name: 'Security Alert', description: 'Security-related notifications' },
];

export function EmailTemplatesSection() {
  const { companyId } = useTenant();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  
  // Local state for edit form
  const [editSenderEmail, setEditSenderEmail] = useState('');
  const [editSenderName, setEditSenderName] = useState('');

  // Fetch existing templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['company-email-templates', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('company_email_templates')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data as EmailTemplate[];
    },
    enabled: !!companyId,
  });

  // Merge with defaults
  const mergedTemplates = DEFAULT_TEMPLATES.map((def) => {
    const existing = templates?.find((t) => t.template_type === def.type);
    return existing || {
      id: '',
      template_type: def.type,
      display_name: def.name,
      description: def.description,
      is_enabled: true,
      sender_email: null,
      sender_name: null,
    };
  });

  // Toggle template enabled/disabled
  const toggleMutation = useMutation({
    mutationFn: async ({ templateType, enabled }: { templateType: string; enabled: boolean }) => {
      if (!companyId) throw new Error('No company');

      const def = DEFAULT_TEMPLATES.find((d) => d.type === templateType);
      
      const { error } = await supabase
        .from('company_email_templates')
        .upsert({
          company_id: companyId,
          template_type: templateType,
          display_name: def?.name || templateType,
          description: def?.description || null,
          is_enabled: enabled,
        }, {
          onConflict: 'company_id,template_type',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-email-templates', companyId] });
    },
    onError: () => {
      toast.error('Failed to update template');
    },
  });

  // Save template settings
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !editingTemplate) throw new Error('No data');

      const def = DEFAULT_TEMPLATES.find((d) => d.type === editingTemplate.template_type);

      const { error } = await supabase
        .from('company_email_templates')
        .upsert({
          company_id: companyId,
          template_type: editingTemplate.template_type,
          display_name: def?.name || editingTemplate.template_type,
          description: def?.description || null,
          is_enabled: editingTemplate.is_enabled,
          sender_email: editSenderEmail || null,
          sender_name: editSenderName || null,
        }, {
          onConflict: 'company_id,template_type',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-email-templates', companyId] });
      toast.success('Template settings saved');
      setEditingTemplate(null);
    },
    onError: () => {
      toast.error('Failed to save template');
    },
  });

  const openEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSenderEmail(template.sender_email || '');
    setEditSenderName(template.sender_name || '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Email Templates</h3>
        <p className="text-sm text-muted-foreground">
          Configure which emails are sent and customize sender information
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead className="text-center">Enabled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mergedTemplates.map((template) => (
                <TableRow key={template.template_type}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{template.display_name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.sender_email ? (
                      <div className="text-sm">
                        <p>{template.sender_name || 'No name'}</p>
                        <p className="text-muted-foreground">{template.sender_email}</p>
                      </div>
                    ) : (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={template.is_enabled}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ templateType: template.template_type, enabled: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {editingTemplate?.display_name}</DialogTitle>
            <DialogDescription>
              Customize the sender information for this email type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sender-name">Sender Name</Label>
              <Input
                id="sender-name"
                value={editSenderName}
                onChange={(e) => setEditSenderName(e.target.value)}
                placeholder="e.g., HR Department"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use company default
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender-email">Sender Email</Label>
              <Input
                id="sender-email"
                type="email"
                value={editSenderEmail}
                onChange={(e) => setEditSenderEmail(e.target.value)}
                placeholder="e.g., hr@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use company default
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.display_name}</DialogTitle>
            <DialogDescription>
              This is a preview of the email template
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-lg p-6 bg-muted/30">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                <span className="font-medium">From:</span>
                <span>
                  {previewTemplate?.sender_name || 'Company Name'} &lt;
                  {previewTemplate?.sender_email || 'noreply@company.com'}&gt;
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Subject:</span>
                <span>[Sample Subject for {previewTemplate?.display_name}]</span>
              </div>
              <div className="border-t pt-4">
                <div className="bg-background rounded p-4 text-center text-muted-foreground">
                  <p>Template preview coming soon</p>
                  <p className="text-xs mt-2">
                    Custom template editing will be available in a future update
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
