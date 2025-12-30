import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Settings, Mail, Palette, UserPlus, Clock, Save, Send, Loader2, Eye, Bell, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BrandingSettings {
  logo_url: string | null;
  primary_color: string;
  platform_name: string;
  base_domain: string;
  support_email: string;
}

interface RegistrationSettings {
  open_registration: boolean;
  require_invite: boolean;
  allowed_domains: string[];
}

interface TrialSettings {
  default_days: number;
  extend_allowed: boolean;
  max_extensions: number;
}

interface EmailSettings {
  provider: string;
  from_name: string;
  from_address: string;
}

interface ImpersonationSettings {
  enabled_for_all: boolean;
  enterprise_only: boolean;
}

interface NotificationSettings {
  user_invitation: boolean;
  welcome: boolean;
  password_reset: boolean;
  leave_request_submitted: boolean;
  leave_request_approved: boolean;
  leave_request_rejected: boolean;
  payroll_processed: boolean;
  subscription_expiring: boolean;
  company_frozen: boolean;
}

// Provider secrets configuration
const PROVIDER_SECRETS: Record<string, { name: string; required: string[]; optional?: string[]; docs: string }> = {
  console: {
    name: 'Console (Development)',
    required: [],
    docs: '',
  },
  mailersend: {
    name: 'MailerSend',
    required: ['MAILERSEND_API_KEY'],
    optional: ['EMAIL_FROM_ADDRESS', 'EMAIL_FROM_NAME'],
    docs: 'https://app.mailersend.com/api-tokens',
  },
  sendgrid: {
    name: 'SendGrid',
    required: ['SENDGRID_API_KEY'],
    optional: ['EMAIL_FROM_ADDRESS', 'EMAIL_FROM_NAME'],
    docs: 'https://app.sendgrid.com/settings/api_keys',
  },
  resend: {
    name: 'Resend',
    required: ['RESEND_API_KEY'],
    optional: ['EMAIL_FROM_ADDRESS', 'EMAIL_FROM_NAME'],
    docs: 'https://resend.com/api-keys',
  },
  brevo: {
    name: 'Brevo (Sendinblue)',
    required: ['BREVO_API_KEY'],
    optional: ['EMAIL_FROM_ADDRESS', 'EMAIL_FROM_NAME'],
    docs: 'https://app.brevo.com/settings/keys/api',
  },
  'aws-ses': {
    name: 'AWS SES',
    required: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
    optional: ['EMAIL_FROM_ADDRESS', 'EMAIL_FROM_NAME'],
    docs: 'https://console.aws.amazon.com/ses/',
  },
};

// Known configured secrets (fetched from edge function)
function ProviderSecretsHelper({ provider }: { provider: string }) {
  const { data: secretStatus, isLoading } = useQuery({
    queryKey: ['email-secrets-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-email-secrets');
      if (error) throw error;
      return data as Record<string, boolean>;
    },
    staleTime: 60000,
  });

  const config = PROVIDER_SECRETS[provider];
  
  if (!config || provider === 'console') {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Console mode logs emails to the edge function logs instead of sending them. 
          Select a real provider for production use.
        </AlertDescription>
      </Alert>
    );
  }

  const allRequired = config.required;
  const allOptional = config.optional || [];

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{config.name} Configuration</h4>
        {config.docs && (
          <a
            href={config.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Get API Key <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Required Secrets:</p>
        <div className="grid gap-1.5">
          {allRequired.map((secret) => (
            <SecretStatusRow 
              key={secret} 
              name={secret} 
              isConfigured={secretStatus?.[secret]} 
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {allOptional.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Optional (uses defaults if not set):</p>
          <div className="grid gap-1.5">
            {allOptional.map((secret) => (
              <SecretStatusRow 
                key={secret} 
                name={secret} 
                isConfigured={secretStatus?.[secret]} 
                isLoading={isLoading}
                optional
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground pt-2 border-t">
        Configure secrets in{' '}
        <a
          href="https://supabase.com/dashboard/project/xwfzrbigmgyxsrzlkqwr/settings/functions"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Supabase Edge Function Secrets
        </a>
      </p>
    </div>
  );
}

function SecretStatusRow({ 
  name, 
  isConfigured, 
  isLoading,
  optional = false 
}: { 
  name: string; 
  isConfigured?: boolean; 
  isLoading: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : isConfigured ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : optional ? (
        <AlertCircle className="h-4 w-4 text-yellow-500" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{name}</code>
      {isConfigured && <span className="text-xs text-green-600">Configured</span>}
      {!isConfigured && !isLoading && !optional && (
        <span className="text-xs text-destructive">Not configured</span>
      )}
      {!isConfigured && !isLoading && optional && (
        <span className="text-xs text-yellow-600">Using default</span>
      )}
    </div>
  );
}

export default function PlatformSettingsPage() {
  const queryClient = useQueryClient();
  
  const [branding, setBranding] = useState<BrandingSettings>({
    logo_url: null,
    primary_color: '#3b82f6',
    platform_name: 'HR Platform',
    base_domain: 'hrplatform.com',
    support_email: 'support@hrplatform.com',
  });
  
  const [registration, setRegistration] = useState<RegistrationSettings>({
    open_registration: false,
    require_invite: true,
    allowed_domains: [],
  });
  
  const [trial, setTrial] = useState<TrialSettings>({
    default_days: 14,
    extend_allowed: true,
    max_extensions: 2,
  });
  
  const [email, setEmail] = useState<EmailSettings>({
    provider: 'console',
    from_name: 'HR Platform',
    from_address: 'noreply@example.com',
  });

  const [impersonation, setImpersonation] = useState<ImpersonationSettings>({
    enabled_for_all: false,
    enterprise_only: true,
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    user_invitation: true,
    welcome: true,
    password_reset: true,
    leave_request_submitted: true,
    leave_request_approved: true,
    leave_request_rejected: true,
    payroll_processed: true,
    subscription_expiring: true,
    company_frozen: true,
  });

  const [domainInput, setDomainInput] = useState('');
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      
      return settingsMap;
    },
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      if (settings.branding) setBranding(settings.branding);
      if (settings.registration) setRegistration(settings.registration);
      if (settings.trial) setTrial(settings.trial);
      if (settings.email) setEmail(settings.email);
      if (settings.impersonation) setImpersonation(settings.impersonation);
      if (settings.notifications) setNotifications(settings.notifications);
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSaveBranding = () => {
    updateSettingMutation.mutate({ key: 'branding', value: branding });
  };

  const handleSaveRegistration = () => {
    updateSettingMutation.mutate({ key: 'registration', value: registration });
  };

  const handleSaveTrial = () => {
    updateSettingMutation.mutate({ key: 'trial', value: trial });
  };

  const handleSaveEmail = () => {
    updateSettingMutation.mutate({ key: 'email', value: email });
  };

  const handleSaveImpersonation = () => {
    updateSettingMutation.mutate({ key: 'impersonation', value: impersonation });
  };

  const handleSaveNotifications = () => {
    updateSettingMutation.mutate({ key: 'notifications', value: notifications });
  };

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async (toEmail: string) => {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { to: toEmail },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Test email sent');
      setTestEmailAddress('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send test email');
    },
  });

  const handleSendTestEmail = () => {
    if (!testEmailAddress) {
      toast.error('Please enter an email address');
      return;
    }
    sendTestEmailMutation.mutate(testEmailAddress);
  };

  const handleAddDomain = () => {
    if (domainInput && !registration.allowed_domains.includes(domainInput)) {
      setRegistration({
        ...registration,
        allowed_domains: [...registration.allowed_domains, domainInput],
      });
      setDomainInput('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setRegistration({
      ...registration,
      allowed_domains: registration.allowed_domains.filter(d => d !== domain),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
          <p className="text-muted-foreground">Configure platform-wide settings</p>
        </div>
        <div className="grid gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </div>

      <div className="grid gap-6">
        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize the platform appearance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platform_name">Platform Name</Label>
                <Input
                  id="platform_name"
                  value={branding.platform_name}
                  onChange={(e) => setBranding({ ...branding, platform_name: e.target.value })}
                  placeholder="My HR Platform"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="base_domain">Base Domain</Label>
                <Input
                  id="base_domain"
                  value={branding.base_domain}
                  onChange={(e) => setBranding({ ...branding, base_domain: e.target.value })}
                  placeholder="hrplatform.com"
                />
                <p className="text-xs text-muted-foreground">
                  Used for company subdomains (e.g., company.{branding.base_domain || 'hrplatform.com'})
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={branding.support_email}
                  onChange={(e) => setBranding({ ...branding, support_email: e.target.value })}
                  placeholder="support@hrplatform.com"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed to users for support inquiries
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={branding.logo_url || ''}
                onChange={(e) => setBranding({ ...branding, logo_url: e.target.value || null })}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <Button onClick={handleSaveBranding} disabled={updateSettingMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Branding
            </Button>
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Registration</CardTitle>
                <CardDescription>Control how users can sign up</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="open_registration">Open Registration</Label>
                <p className="text-sm text-muted-foreground">Allow anyone to create a company</p>
              </div>
              <Switch
                id="open_registration"
                checked={registration.open_registration}
                onCheckedChange={(checked) => setRegistration({ ...registration, open_registration: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_invite">Require Invite</Label>
                <p className="text-sm text-muted-foreground">New users must be invited to join</p>
              </div>
              <Switch
                id="require_invite"
                checked={registration.require_invite}
                onCheckedChange={(checked) => setRegistration({ ...registration, require_invite: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label>Allowed Email Domains</Label>
              <p className="text-sm text-muted-foreground">
                If set, only users with these domains can sign up
              </p>
              <div className="flex gap-2">
                <Input
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="example.com"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                />
                <Button type="button" variant="outline" onClick={handleAddDomain}>
                  Add
                </Button>
              </div>
              {registration.allowed_domains.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {registration.allowed_domains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSaveRegistration} disabled={updateSettingMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Registration
            </Button>
          </CardContent>
        </Card>

        {/* Trial Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Trial Period</CardTitle>
                <CardDescription>Configure trial settings for new companies</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="default_days">Default Trial Length (days)</Label>
                <Input
                  id="default_days"
                  type="number"
                  min="1"
                  max="90"
                  value={trial.default_days}
                  onChange={(e) => setTrial({ ...trial, default_days: parseInt(e.target.value) || 14 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_extensions">Max Extensions</Label>
                <Input
                  id="max_extensions"
                  type="number"
                  min="0"
                  max="10"
                  value={trial.max_extensions}
                  onChange={(e) => setTrial({ ...trial, max_extensions: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="extend_allowed">Allow Trial Extensions</Label>
                <p className="text-sm text-muted-foreground">Platform admins can extend trials</p>
              </div>
              <Switch
                id="extend_allowed"
                checked={trial.extend_allowed}
                onCheckedChange={(checked) => setTrial({ ...trial, extend_allowed: checked })}
              />
            </div>

            <Button onClick={handleSaveTrial} disabled={updateSettingMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Trial Settings
            </Button>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Configure email sending settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="email_provider">Email Provider</Label>
                <Select
                  value={email.provider}
                  onValueChange={(value) => setEmail({ ...email, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="console">Console (Development)</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailersend">MailerSend</SelectItem>
                    <SelectItem value="resend">Resend</SelectItem>
                    <SelectItem value="brevo">Brevo (Sendinblue)</SelectItem>
                    <SelectItem value="aws-ses">AWS SES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={email.from_name}
                  onChange={(e) => setEmail({ ...email, from_name: e.target.value })}
                  placeholder="My Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_address">From Address</Label>
                <Input
                  id="from_address"
                  type="email"
                  value={email.from_address}
                  onChange={(e) => setEmail({ ...email, from_address: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
            </div>
            
            {/* Provider Secrets Helper */}
            <ProviderSecretsHelper provider={email.provider} />

            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t">
              <Button onClick={handleSaveEmail} disabled={updateSettingMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </Button>
              
              <div className="flex gap-2 flex-1">
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="max-w-xs"
                />
                <Button 
                  variant="outline"
                  onClick={handleSendTestEmail}
                  disabled={sendTestEmailMutation.isPending || !testEmailAddress}
                >
                  {sendTestEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure which events trigger automated emails</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="border-b pb-2">
                <h4 className="font-medium text-sm">User & Authentication</h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_invitation">User Invitation</Label>
                  <p className="text-sm text-muted-foreground">When a user is invited to join a company</p>
                </div>
                <Switch
                  id="notif_invitation"
                  checked={notifications.user_invitation}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, user_invitation: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_welcome">Welcome Email</Label>
                  <p className="text-sm text-muted-foreground">When a new user completes signup</p>
                </div>
                <Switch
                  id="notif_welcome"
                  checked={notifications.welcome}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, welcome: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_password">Password Reset</Label>
                  <p className="text-sm text-muted-foreground">When a user requests a password reset</p>
                </div>
                <Switch
                  id="notif_password"
                  checked={notifications.password_reset}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, password_reset: checked })}
                />
              </div>

              <div className="border-b pb-2 pt-4">
                <h4 className="font-medium text-sm">Leave Management</h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_leave_submitted">Leave Request Submitted</Label>
                  <p className="text-sm text-muted-foreground">When an employee submits a leave request</p>
                </div>
                <Switch
                  id="notif_leave_submitted"
                  checked={notifications.leave_request_submitted}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, leave_request_submitted: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_leave_approved">Leave Request Approved</Label>
                  <p className="text-sm text-muted-foreground">When a leave request is approved</p>
                </div>
                <Switch
                  id="notif_leave_approved"
                  checked={notifications.leave_request_approved}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, leave_request_approved: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_leave_rejected">Leave Request Rejected</Label>
                  <p className="text-sm text-muted-foreground">When a leave request is rejected</p>
                </div>
                <Switch
                  id="notif_leave_rejected"
                  checked={notifications.leave_request_rejected}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, leave_request_rejected: checked })}
                />
              </div>

              <div className="border-b pb-2 pt-4">
                <h4 className="font-medium text-sm">Payroll & Billing</h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_payroll">Payroll Processed</Label>
                  <p className="text-sm text-muted-foreground">When payroll is processed for employees</p>
                </div>
                <Switch
                  id="notif_payroll"
                  checked={notifications.payroll_processed}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, payroll_processed: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_subscription">Subscription Expiring</Label>
                  <p className="text-sm text-muted-foreground">When a company's subscription is about to expire</p>
                </div>
                <Switch
                  id="notif_subscription"
                  checked={notifications.subscription_expiring}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, subscription_expiring: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif_frozen">Company Frozen</Label>
                  <p className="text-sm text-muted-foreground">When a company account is frozen</p>
                </div>
                <Switch
                  id="notif_frozen"
                  checked={notifications.company_frozen}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, company_frozen: checked })}
                />
              </div>
            </div>

            <Button onClick={handleSaveNotifications} disabled={updateSettingMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* Impersonation Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Impersonation</CardTitle>
                <CardDescription>Control admin impersonation access</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled_for_all">Enable for All Companies</Label>
                <p className="text-sm text-muted-foreground">
                  Allow impersonation for all companies regardless of plan
                </p>
              </div>
              <Switch
                id="enabled_for_all"
                checked={impersonation.enabled_for_all}
                onCheckedChange={(checked) => setImpersonation({ ...impersonation, enabled_for_all: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enterprise_only">Enterprise Only</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow impersonation for Enterprise/Business plan companies
                </p>
              </div>
              <Switch
                id="enterprise_only"
                checked={impersonation.enterprise_only}
                disabled={impersonation.enabled_for_all}
                onCheckedChange={(checked) => setImpersonation({ ...impersonation, enterprise_only: checked })}
              />
            </div>

            <p className="text-sm text-muted-foreground border-l-2 pl-3 py-1 bg-muted/50 rounded">
              Impersonation allows platform admins to view company data as if they were logged in as that company. 
              All impersonation sessions are logged in the Impersonation Logs page.
            </p>

            <Button onClick={handleSaveImpersonation} disabled={updateSettingMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Impersonation Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
