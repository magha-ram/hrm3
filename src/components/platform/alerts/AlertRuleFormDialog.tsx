import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useCreateAlertRule, 
  useUpdateAlertRule,
  type AlertRule 
} from '@/hooks/useAlertRules';
import { useMonitoringConfig } from '@/hooks/useSystemMetrics';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  module: z.string().min(1, 'Module is required'),
  metric_name: z.string().min(1, 'Metric name is required'),
  condition: z.enum(['greater_than', 'less_than', 'equals', 'greater_than_or_equal', 'less_than_or_equal']),
  threshold: z.number().min(0, 'Threshold must be positive'),
  severity: z.enum(['info', 'warning', 'critical']),
  notification_channels: z.array(z.string()).min(1, 'At least one channel required'),
  cooldown_minutes: z.number().min(1).max(1440),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface AlertRuleFormDialogProps {
  open: boolean;
  onClose: () => void;
  rule?: AlertRule | null;
}

const metricOptions: Record<string, string[]> = {
  database: ['usage_percent', 'operations_1h', 'error_count_1h', 'connection_count'],
  backend: ['error_rate', 'error_rate_5xx', 'latency_avg', 'latency_p95', 'request_count_1h'],
  email: ['failed_count_1h', 'delivery_rate', 'queue_size', 'sent_count_1h'],
  auth: ['login_failure_1h', 'login_failure_rate', 'suspicious_events_1h'],
  users: ['active_users_24h', 'high_risk_actions_1h'],
  security: ['critical_events_24h', 'high_severity_events_24h'],
  storage: ['usage_percent', 'file_count'],
  logs: ['error_logs_1h', 'warn_logs_1h'],
  notifications: ['sent_count_1h', 'unread_count_1h'],
  integrations: ['webhook_success_rate', 'webhook_errors_24h'],
  cron: ['success_rate', 'failures_24h'],
};

export function AlertRuleFormDialog({ open, onClose, rule }: AlertRuleFormDialogProps) {
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const { data: modules } = useMonitoringConfig();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      module: '',
      metric_name: '',
      condition: 'greater_than',
      threshold: 0,
      severity: 'warning',
      notification_channels: ['in_app'],
      cooldown_minutes: 60,
      is_active: true,
    },
  });

  const selectedModule = form.watch('module');

  useEffect(() => {
    if (rule) {
      form.reset({
        name: rule.name,
        description: rule.description || '',
        module: rule.module,
        metric_name: rule.metric_name,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity,
        notification_channels: rule.notification_channels,
        cooldown_minutes: rule.cooldown_minutes,
        is_active: rule.is_active,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        module: '',
        metric_name: '',
        condition: 'greater_than',
        threshold: 0,
        severity: 'warning',
        notification_channels: ['in_app'],
        cooldown_minutes: 60,
        is_active: true,
      });
    }
  }, [rule, form]);

  const onSubmit = (values: FormValues) => {
    if (rule) {
      updateRule.mutate(
        { id: rule.id, updates: values },
        { onSuccess: onClose }
      );
    } else {
      createRule.mutate(values as any, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Alert Rule' : 'Create Alert Rule'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Database usage warning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Alert when database storage exceeds threshold" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modules?.map((m) => (
                          <SelectItem key={m.module} value={m.module}>
                            {m.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="metric_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metric</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedModule}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(metricOptions[selectedModule] || []).map((metric) => (
                          <SelectItem key={metric} value={metric}>
                            {metric.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="greater_than">&gt;</SelectItem>
                        <SelectItem value="greater_than_or_equal">&gt;=</SelectItem>
                        <SelectItem value="less_than">&lt;</SelectItem>
                        <SelectItem value="less_than_or_equal">&lt;=</SelectItem>
                        <SelectItem value="equals">=</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Threshold</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="cooldown_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cooldown (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum time between repeated alerts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notification_channels"
              render={() => (
                <FormItem>
                  <FormLabel>Notification Channels</FormLabel>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="notification_channels"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes('in_app')}
                              onCheckedChange={(checked) => {
                                const newValue = checked 
                                  ? [...(field.value || []), 'in_app']
                                  : field.value?.filter((v: string) => v !== 'in_app');
                                field.onChange(newValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 font-normal">In-App</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notification_channels"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes('email')}
                              onCheckedChange={(checked) => {
                                const newValue = checked 
                                  ? [...(field.value || []), 'email']
                                  : field.value?.filter((v: string) => v !== 'email');
                                field.onChange(newValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="!mt-0 font-normal">Email</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRule.isPending || updateRule.isPending}
              >
                {rule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
