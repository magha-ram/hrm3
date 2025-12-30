import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plug, Plus, Settings, CheckCircle, AlertCircle, Clock,
  CreditCard, MessageSquare, Mail, Calendar, Database,
  FileText, Users, Zap, ExternalLink
} from 'lucide-react';
import { ModuleGuard } from '@/components/ModuleGuard';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: any;
  status: 'connected' | 'available' | 'coming_soon';
  configurable?: boolean;
}

const integrations: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    category: 'Communication',
    icon: MessageSquare,
    status: 'available',
    configurable: true,
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Teams for notifications',
    category: 'Communication',
    icon: MessageSquare,
    status: 'available',
    configurable: true,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync leave and events with Google Calendar',
    category: 'Calendar',
    icon: Calendar,
    status: 'available',
    configurable: true,
  },
  {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    description: 'Sync with Microsoft Outlook calendars',
    category: 'Calendar',
    icon: Calendar,
    status: 'available',
    configurable: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Process payroll payments via Stripe',
    category: 'Payments',
    icon: CreditCard,
    status: 'coming_soon',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Export payroll data to QuickBooks',
    category: 'Accounting',
    icon: FileText,
    status: 'coming_soon',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Sync with Xero accounting software',
    category: 'Accounting',
    icon: FileText,
    status: 'coming_soon',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5000+ apps via Zapier',
    category: 'Automation',
    icon: Zap,
    status: 'available',
    configurable: true,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Send custom webhooks for events',
    category: 'Developer',
    icon: Database,
    status: 'available',
    configurable: true,
  },
  {
    id: 'api',
    name: 'REST API',
    description: 'Full API access for custom integrations',
    category: 'Developer',
    icon: Database,
    status: 'available',
    configurable: true,
  },
  {
    id: 'okta',
    name: 'Okta SSO',
    description: 'Single sign-on with Okta',
    category: 'Authentication',
    icon: Users,
    status: 'available',
    configurable: true,
  },
  {
    id: 'azure_ad',
    name: 'Azure AD',
    description: 'Microsoft Azure Active Directory SSO',
    category: 'Authentication',
    icon: Users,
    status: 'available',
    configurable: true,
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Custom email delivery via SendGrid',
    category: 'Communication',
    icon: Mail,
    status: 'coming_soon',
  },
];

const statusConfig = {
  connected: { label: 'Connected', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
  available: { label: 'Available', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Plug },
  coming_soon: { label: 'Coming Soon', color: 'bg-muted text-muted-foreground', icon: Clock },
};

function IntegrationCard({ integration }: { integration: Integration }) {
  const config = statusConfig[integration.status];
  const Icon = integration.icon;

  return (
    <Card className={integration.status === 'coming_soon' ? 'opacity-60' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{integration.name}</h3>
              <p className="text-sm text-muted-foreground">{integration.category}</p>
            </div>
          </div>
          <Badge className={config.color}>
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
        {integration.status === 'available' && (
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        )}
        {integration.status === 'connected' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch id={`${integration.id}-enabled`} defaultChecked />
              <Label htmlFor={`${integration.id}-enabled`}>Enabled</Label>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
        {integration.status === 'coming_soon' && (
          <Button variant="ghost" size="sm" className="w-full" disabled>
            Notify Me
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  const categories = [...new Set(integrations.map(i => i.category))];
  const connectedCount = integrations.filter(i => i.status === 'connected').length;

  return (
    <ModuleGuard moduleId="integrations">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">Connect with your favorite tools and services</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Integration
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Plug className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coming Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.status === 'coming_soon').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
          </CardContent>
        </Card>
      </div>

      {/* API Access Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Enterprise API Access</h3>
                <p className="text-muted-foreground">
                  Full REST API access for custom integrations and automation
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                View Docs
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button>
                Generate API Key
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Categories */}
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold">{category}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {integrations
              .filter(i => i.category === category)
              .map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
          </div>
        </div>
      ))}
      </div>
    </ModuleGuard>
  );
}
