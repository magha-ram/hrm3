import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Smartphone, Clock, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SecuritySettingsPage() {
  const { isFrozen } = useTenant();

  const securityItems = [
    {
      icon: Key,
      title: 'Password Policy',
      description: 'Minimum password requirements for all users',
      status: 'Configured',
      statusVariant: 'default' as const,
    },
    {
      icon: Smartphone,
      title: 'Multi-Factor Authentication (MFA)',
      description: 'Require additional verification for account access',
      status: 'Not Configured',
      statusVariant: 'secondary' as const,
    },
    {
      icon: Clock,
      title: 'Session Timeout',
      description: 'Automatic logout after inactivity',
      status: '30 minutes',
      statusVariant: 'outline' as const,
    },
    {
      icon: Shield,
      title: 'Single Sign-On (SSO)',
      description: 'Enterprise authentication integration',
      status: 'Enterprise Plan',
      statusVariant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Configure security policies for your organization
            {isFrozen && <span className="ml-2 text-destructive">(Read-only while account is frozen)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityItems.map((item, index) => (
            <div key={item.title}>
              <div className="flex items-start gap-4 py-3">
                <div className="p-2 rounded-lg bg-muted">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.title}</h4>
                    <Badge variant={item.statusVariant}>{item.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
              {index < securityItems.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Security Audit
          </CardTitle>
          <CardDescription>
            Recent security events and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No security issues detected</p>
            <p className="text-sm mt-1">Your organization follows security best practices</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
