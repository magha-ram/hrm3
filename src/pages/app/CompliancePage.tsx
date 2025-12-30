import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, CheckCircle, AlertTriangle, Clock, FileText,
  Lock, Eye, Users, Server, Key, Database, Globe,
  ExternalLink
} from 'lucide-react';
import { RoleGate } from '@/components/PermissionGate';
import { useSecurityEvents } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';

interface ComplianceItem {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'attention' | 'non_compliant';
  category: string;
  lastChecked?: string;
}

const complianceChecks: ComplianceItem[] = [
  {
    id: 'rls_enabled',
    name: 'Row Level Security',
    description: 'All tables have RLS policies enabled',
    status: 'compliant',
    category: 'Data Access',
  },
  {
    id: 'audit_logging',
    name: 'Audit Logging',
    description: 'All data changes are logged for compliance',
    status: 'compliant',
    category: 'Monitoring',
  },
  {
    id: 'encryption_at_rest',
    name: 'Encryption at Rest',
    description: 'Database encryption enabled',
    status: 'compliant',
    category: 'Encryption',
  },
  {
    id: 'encryption_in_transit',
    name: 'Encryption in Transit',
    description: 'TLS 1.3 for all connections',
    status: 'compliant',
    category: 'Encryption',
  },
  {
    id: 'mfa_enabled',
    name: 'Multi-Factor Authentication',
    description: 'MFA available for all users',
    status: 'attention',
    category: 'Authentication',
  },
  {
    id: 'password_policy',
    name: 'Password Policy',
    description: 'Strong password requirements enforced',
    status: 'compliant',
    category: 'Authentication',
  },
  {
    id: 'session_management',
    name: 'Session Management',
    description: 'Secure session handling with timeout',
    status: 'compliant',
    category: 'Authentication',
  },
  {
    id: 'data_retention',
    name: 'Data Retention Policy',
    description: 'Configurable data retention rules',
    status: 'attention',
    category: 'Data Management',
  },
  {
    id: 'backup_policy',
    name: 'Backup & Recovery',
    description: 'Daily backups with point-in-time recovery',
    status: 'compliant',
    category: 'Data Management',
  },
  {
    id: 'access_reviews',
    name: 'Access Reviews',
    description: 'Periodic access review process',
    status: 'attention',
    category: 'Access Control',
  },
];

const statusConfig = {
  compliant: { label: 'Compliant', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
  attention: { label: 'Needs Attention', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertTriangle },
  non_compliant: { label: 'Non-Compliant', color: 'bg-destructive/20 text-destructive', icon: AlertTriangle },
};

function ComplianceStatusBadge({ status }: { status: 'compliant' | 'attention' | 'non_compliant' }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function ComplianceScoreCard() {
  const compliantCount = complianceChecks.filter(c => c.status === 'compliant').length;
  const totalCount = complianceChecks.length;
  const score = Math.round((compliantCount / totalCount) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Compliance Score
        </CardTitle>
        <CardDescription>Overall SOC2 readiness</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-5xl font-bold">{score}%</span>
        </div>
        <Progress value={score} className="h-3" />
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-2xl font-bold text-green-600">{compliantCount}</p>
            <p className="text-muted-foreground">Compliant</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {complianceChecks.filter(c => c.status === 'attention').length}
            </p>
            <p className="text-muted-foreground">Attention</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">
              {complianceChecks.filter(c => c.status === 'non_compliant').length}
            </p>
            <p className="text-muted-foreground">Issues</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityEventsCard() {
  const { data: events, isLoading } = useSecurityEvents();

  const recentEvents = events?.slice(0, 5) || [];

  const severityColors: Record<string, string> = {
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-destructive',
    critical: 'text-destructive font-bold',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Recent Security Events
        </CardTitle>
        <CardDescription>Latest security-related activities</CardDescription>
      </CardHeader>
      <CardContent>
        {recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between py-2 border-b last:border-0">
                <div className="space-y-1">
                  <p className={`font-medium ${severityColors[event.severity || 'info']}`}>
                    {event.event_type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.description || 'No description'}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.created_at), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p>No security events to report</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CompliancePage() {
  const categories = [...new Set(complianceChecks.map(c => c.category))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance & Security</h1>
          <p className="text-muted-foreground">SOC2-friendly security controls and compliance monitoring</p>
        </div>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <ComplianceScoreCard />
        <div className="md:col-span-2">
          <SecurityEventsCard />
        </div>
      </div>

      <Tabs defaultValue="controls" className="space-y-4">
        <TabsList>
          <TabsTrigger value="controls">Security Controls</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="controls">
          <div className="space-y-4">
            {categories.map((category) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceChecks
                      .filter(c => c.category === category)
                      .map((check) => (
                        <div key={check.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="space-y-1">
                            <p className="font-medium">{check.name}</p>
                            <p className="text-sm text-muted-foreground">{check.description}</p>
                          </div>
                          <ComplianceStatusBadge status={check.status} />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Protection Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Defines how personal and sensitive data is collected, processed, stored, and protected.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Data encryption at rest and in transit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Access controls and authentication
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Data retention and disposal procedures
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Access Control Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Governs how user access to systems and data is managed and controlled.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Role-based access control (RBAC)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Principle of least privilege
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Regular access reviews
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Audit & Logging Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Establishes requirements for logging, monitoring, and auditing system activities.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Comprehensive activity logging
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Log retention for compliance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Immutable audit trails
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Incident Response Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Outlines procedures for detecting, responding to, and recovering from security incidents.
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Incident detection and alerting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Response and escalation procedures
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Post-incident review process
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certifications">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg">SOC 2 Type II</h3>
                <Badge className="mt-2 bg-green-100 text-green-800">Ready</Badge>
                <p className="text-sm text-muted-foreground mt-4">
                  Platform designed with SOC 2 controls in mind
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg">GDPR</h3>
                <Badge className="mt-2 bg-green-100 text-green-800">Compliant</Badge>
                <p className="text-sm text-muted-foreground mt-4">
                  EU data protection requirements supported
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg">Data Residency</h3>
                <Badge className="mt-2 bg-blue-100 text-blue-800">Configurable</Badge>
                <p className="text-sm text-muted-foreground mt-4">
                  Choose your data storage region
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
