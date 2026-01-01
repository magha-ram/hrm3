import { useState, useEffect } from 'react';
import { Bell, Mail, AlertTriangle, UserPlus, Shield, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCompanySetting, useUpdateCompanySetting } from '@/hooks/useCompanySettings';
import { toast } from 'sonner';

interface NotificationPreferences {
  document_expiry_enabled: boolean;
  document_expiry_days: number[];
  onboarding_emails_enabled: boolean;
  security_alerts_enabled: boolean;
  leave_notifications_enabled: boolean;
  payroll_notifications_enabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  document_expiry_enabled: true,
  document_expiry_days: [7, 30, 60],
  onboarding_emails_enabled: true,
  security_alerts_enabled: true,
  leave_notifications_enabled: true,
  payroll_notifications_enabled: true,
};

export default function NotificationSettingsPage() {
  const { data: savedPreferences, isLoading } = useCompanySetting('notification_preferences');
  const updateSetting = useUpdateCompanySetting();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [customDays, setCustomDays] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (savedPreferences?.value) {
      const saved = savedPreferences.value as unknown as NotificationPreferences;
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...saved,
      });
    }
  }, [savedPreferences]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleAddExpiryDay = () => {
    const day = parseInt(customDays);
    if (day > 0 && day <= 365 && !preferences.document_expiry_days.includes(day)) {
      setPreferences(prev => ({
        ...prev,
        document_expiry_days: [...prev.document_expiry_days, day].sort((a, b) => a - b),
      }));
      setCustomDays('');
      setHasChanges(true);
    }
  };

  const handleRemoveExpiryDay = (day: number) => {
    setPreferences(prev => ({
      ...prev,
      document_expiry_days: prev.document_expiry_days.filter(d => d !== day),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'notification_preferences',
        value: preferences as unknown as Record<string, unknown>,
        description: 'Company notification preferences',
      });
      setHasChanges(false);
      toast.success('Notification preferences saved');
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Configure how and when your company receives notifications
        </p>
      </div>

      {/* Document Expiry Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Document Expiry Alerts
          </CardTitle>
          <CardDescription>
            Get notified before employee documents expire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="doc-expiry-toggle" className="flex-1">
              Enable document expiry notifications
            </Label>
            <Switch
              id="doc-expiry-toggle"
              checked={preferences.document_expiry_enabled}
              onCheckedChange={() => handleToggle('document_expiry_enabled')}
            />
          </div>

          {preferences.document_expiry_enabled && (
            <div className="space-y-3 pt-2">
              <Label>Notify before expiry (days)</Label>
              <div className="flex flex-wrap gap-2">
                {preferences.document_expiry_days.map(day => (
                  <Button
                    key={day}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRemoveExpiryDay(day)}
                    className="gap-1"
                  >
                    {day} days
                    <span className="ml-1 text-xs opacity-70">×</span>
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Add days..."
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-32"
                  min={1}
                  max={365}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddExpiryDay}
                  disabled={!customDays || parseInt(customDays) <= 0}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Control which email notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="onboarding-toggle">Onboarding Emails</Label>
              <p className="text-xs text-muted-foreground">
                Welcome emails for new employees
              </p>
            </div>
            <Switch
              id="onboarding-toggle"
              checked={preferences.onboarding_emails_enabled}
              onCheckedChange={() => handleToggle('onboarding_emails_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="leave-toggle">Leave Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Updates about leave requests and approvals
              </p>
            </div>
            <Switch
              id="leave-toggle"
              checked={preferences.leave_notifications_enabled}
              onCheckedChange={() => handleToggle('leave_notifications_enabled')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payroll-toggle">Payroll Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Payslip availability and payroll updates
              </p>
            </div>
            <Switch
              id="payroll-toggle"
              checked={preferences.payroll_notifications_enabled}
              onCheckedChange={() => handleToggle('payroll_notifications_enabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Security Alerts
          </CardTitle>
          <CardDescription>
            Critical security notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security-toggle">Security Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Suspicious login attempts, password changes, and security events
              </p>
            </div>
            <Switch
              id="security-toggle"
              checked={preferences.security_alerts_enabled}
              onCheckedChange={() => handleToggle('security_alerts_enabled')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSetting.isPending}
        >
          {updateSetting.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
