import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import { useBaseDomain } from '@/hooks/useBaseDomain';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Globe, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Shield,
  Trash2,
  RefreshCw,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface CompanyDomain {
  id: string;
  subdomain: string | null;
  custom_domain: string | null;
  verification_token: string | null;
  is_verified: boolean;
  is_primary: boolean;
  is_active: boolean;
  verified_at: string | null;
}

interface SubdomainChangeRequest {
  id: string;
  current_subdomain: string;
  requested_subdomain: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}


export default function DomainSettingsPage() {
  const { companyId } = useTenant();
  const { user } = useAuth();
  const { baseDomain, isCustomDomain, isLovable } = useBaseDomain();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  
  // Subdomain change request state
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestedSubdomain, setRequestedSubdomain] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<{ available: boolean; message: string } | null>(null);
  
  // DNS Setup dialog state
  const [showDnsSetupDialog, setShowDnsSetupDialog] = useState(false);
  const [selectedDomainForDns, setSelectedDomainForDns] = useState<CompanyDomain | null>(null);
  
  // Fetch company domains
  const { data: domains, isLoading } = useQuery({
    queryKey: ['company-domains', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_domains')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as CompanyDomain[];
    },
    enabled: !!companyId,
  });

  // Fetch subdomain change requests
  const { data: changeRequests } = useQuery({
    queryKey: ['subdomain-change-requests', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subdomain_change_requests')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SubdomainChangeRequest[];
    },
    enabled: !!companyId,
  });

  const pendingRequest = changeRequests?.find(r => r.status === 'pending');
  const pastRequests = changeRequests?.filter(r => r.status !== 'pending') || [];

  // Check subdomain availability
  const checkAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setAvailabilityResult(null);
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subdomain-availability', {
        body: { subdomain: subdomain.toLowerCase(), exclude_company_id: companyId },
      });

      if (error) throw error;
      setAvailabilityResult(data);
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityResult({ available: false, message: 'Failed to check availability' });
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Debounce availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (requestedSubdomain) {
        checkAvailability(requestedSubdomain);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [requestedSubdomain]);

  // Submit subdomain change request
  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      const subdomainRecord = domains?.find(d => d.subdomain);
      if (!subdomainRecord) throw new Error('No current subdomain found');

      const { error } = await supabase
        .from('subdomain_change_requests')
        .insert({
          company_id: companyId,
          current_subdomain: subdomainRecord.subdomain,
          requested_subdomain: requestedSubdomain.toLowerCase(),
          reason: requestReason || null,
          requested_by: user?.user_id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subdomain-change-requests', companyId] });
      setShowRequestDialog(false);
      setRequestedSubdomain('');
      setRequestReason('');
      setAvailabilityResult(null);
      toast.success('Subdomain change request submitted. Waiting for approval.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit request');
    },
  });

  // Add custom domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const verificationToken = crypto.randomUUID().split('-')[0];
      
      const { data, error } = await supabase
        .from('company_domains')
        .insert({
          company_id: companyId,
          custom_domain: domain.toLowerCase().trim(),
          verification_token: verificationToken,
          is_verified: false,
          is_primary: false,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains', companyId] });
      setNewDomain('');
      toast.success('Domain added. Please verify DNS records.');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('This domain is already in use');
      } else {
        toast.error(error.message || 'Failed to add domain');
      }
    },
  });

  // Verify domain mutation (DNS check)
  const verifyDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domain_id: domainId },
      });
      
      if (error) throw error;
      if (!data.verified) {
        throw new Error(data.message || 'DNS verification failed');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains', companyId] });
      toast.success('Domain verified successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Verification failed. Check DNS records.');
    },
  });

  // Open DNS setup dialog
  const openDnsSetup = (domain: CompanyDomain) => {
    setSelectedDomainForDns(domain);
    setShowDnsSetupDialog(true);
  };

  // Open external DNS checker
  const openDnsChecker = (domain: string) => {
    window.open(`https://dnschecker.org/#A/${domain}`, '_blank');
  };

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from('company_domains')
        .delete()
        .eq('id', domainId)
        .eq('company_id', companyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains', companyId] });
      toast.success('Domain removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove domain');
    },
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const subdomainRecord = domains?.find(d => d.subdomain);
  const customDomains = domains?.filter(d => d.custom_domain) || [];
  
  // Get the effective domain for subdomain routing
  const effectiveBaseDomain = isCustomDomain ? baseDomain : (isLovable ? baseDomain : 'localhost:5173');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Domain Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your company's subdomain and custom domains
        </p>
      </div>

      {/* Platform Subdomain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Subdomain
          </CardTitle>
          <CardDescription>
            Your company's default subdomain on our platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subdomainRecord ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center">
                  <div className="px-3 py-2 bg-muted rounded-l-md border border-r-0 font-mono text-sm">
                    {subdomainRecord.subdomain}
                  </div>
                  <div className="px-3 py-2 bg-background border rounded-r-md text-muted-foreground text-sm">
                    .{effectiveBaseDomain}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(`${subdomainRecord.subdomain}.${effectiveBaseDomain}`, 'subdomain')}
                >
                  {copied === 'subdomain' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(`https://${subdomainRecord.subdomain}.${effectiveBaseDomain}`, '_blank')}
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {!pendingRequest && (
                  <Button
                    variant="outline"
                    onClick={() => setShowRequestDialog(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Request Change
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Active
                </Badge>
                <span className="text-muted-foreground">
                  Your employees can sign in at{' '}
                  <code className="bg-muted px-1 rounded">
                    {subdomainRecord.subdomain}.{effectiveBaseDomain}
                  </code>
                </span>
              </div>

              {/* Pending Request Alert */}
              {pendingRequest && (
                <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Subdomain change request pending</p>
                    <p className="text-sm mt-1">
                      Requested: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{pendingRequest.requested_subdomain}.{effectiveBaseDomain}</code>
                    </p>
                    <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">
                      Submitted {format(new Date(pendingRequest.created_at), 'MMM d, yyyy')}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Past Requests */}
              {pastRequests.length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Request History</p>
                  <div className="space-y-2">
                    {pastRequests.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          {request.status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-mono">{request.requested_subdomain}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={request.status === 'approved' ? 'default' : 'secondary'}>
                            {request.status}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No subdomain configured. Contact support if this is unexpected.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Custom Domain
          </CardTitle>
          <CardDescription>
            Use your own domain for a branded experience (e.g., hr.yourcompany.com)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing custom domains */}
          {customDomains.length > 0 && (
            <div className="space-y-3">
              {customDomains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-mono text-sm">{domain.custom_domain}</p>
                      {domain.is_verified ? (
                        <Badge variant="default" className="mt-1 gap-1">
                          <Check className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="mt-1 gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Pending Verification
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!domain.is_verified && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDnsSetup(domain)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Setup DNS
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => verifyDomainMutation.mutate(domain.id)}
                          disabled={verifyDomainMutation.isPending}
                        >
                          {verifyDomainMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-1" />
                          )}
                          Verify DNS
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteDomainMutation.mutate(domain.id)}
                      disabled={deleteDomainMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DNS verification instructions for pending domains */}
          {customDomains.some(d => !d.is_verified) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p className="font-medium">To verify your domain, add these DNS records:</p>
                {customDomains
                  .filter(d => !d.is_verified)
                  .map((domain) => (
                    <div key={domain.id} className="space-y-2 mt-2 p-2 bg-muted rounded">
                      <p className="text-xs font-medium">{domain.custom_domain}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-mono">TXT</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Name</p>
                          <p className="font-mono">_hrplatform-verify</p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-muted-foreground">Value</p>
                          <div className="flex items-center gap-1">
                            <p className="font-mono truncate">{domain.verification_token}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => copyToClipboard(domain.verification_token || '', domain.id)}
                            >
                              {copied === domain.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-mono">CNAME</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Name</p>
                          <p className="font-mono">{domain.custom_domain?.split('.')[0] || '@'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-mono">{subdomainRecord?.subdomain}.{baseDomain}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Add new domain */}
          <div className="space-y-3">
            <Label htmlFor="new-domain">Add Custom Domain</Label>
            <div className="flex gap-2">
              <Input
                id="new-domain"
                placeholder="hr.yourcompany.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => addDomainMutation.mutate(newDomain)}
                disabled={!newDomain.trim() || addDomainMutation.isPending}
              >
                {addDomainMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add Domain'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the domain you want to use (e.g., hr.yourcompany.com or portal.yourcompany.com)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Subdomain:</strong> Your company gets a subdomain based on your company code.
            To change it, submit a request for platform admin approval.
          </p>
          <p>
            <strong>Custom Domain:</strong> Point your own domain to our platform for a fully branded experience.
            You'll need access to your domain's DNS settings.
          </p>
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="https://docs.lovable.dev/features/custom-domain" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              View documentation
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* DNS Setup Dialog */}
      <Dialog open={showDnsSetupDialog} onOpenChange={setShowDnsSetupDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              DNS Configuration
            </DialogTitle>
            <DialogDescription>
              Configure your DNS records to point your domain to our platform.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDomainForDns && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Domain:</p>
                <p className="font-mono text-sm">{selectedDomainForDns.custom_domain}</p>
              </div>

              {/* Step-by-step instructions */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Add an A Record</p>
                    <p className="text-xs text-muted-foreground">
                      Go to your DNS provider and add an A record pointing to our IP address.
                    </p>
                  </div>
                </div>

                {/* DNS Record Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Type</th>
                        <th className="px-3 py-2 text-left font-medium">Name</th>
                        <th className="px-3 py-2 text-left font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-3 py-2 font-mono">A</td>
                        <td className="px-3 py-2 font-mono">@</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">185.158.133.1</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard('185.158.133.1', 'dns-ip')}
                            >
                              {copied === 'dns-ip' ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-t bg-muted/50">
                        <td className="px-3 py-2 font-mono">TXT</td>
                        <td className="px-3 py-2 font-mono">_hrplatform-verify</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono truncate max-w-[120px]">{selectedDomainForDns.verification_token}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(selectedDomainForDns.verification_token || '', 'dns-txt')}
                            >
                              {copied === 'dns-txt' ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Wait for DNS Propagation</p>
                    <p className="text-xs text-muted-foreground">
                      DNS changes can take up to 48 hours to propagate worldwide.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Verify Your Domain</p>
                    <p className="text-xs text-muted-foreground">
                      Once DNS is configured, click "Verify DNS" to complete setup.
                    </p>
                  </div>
                </div>
              </div>

              {/* DNS Checker Button */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => openDnsChecker(selectedDomainForDns.custom_domain || '')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Check DNS Propagation
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Opens dnschecker.org to verify your DNS records globally
                </p>
              </div>

              {/* DNS Provider Links */}
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  DNS Provider Guides
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Cloudflare', url: 'https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/' },
                    { name: 'GoDaddy', url: 'https://www.godaddy.com/help/add-an-a-record-19238' },
                    { name: 'Namecheap', url: 'https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/' },
                    { name: 'Google Domains', url: 'https://support.google.com/domains/answer/9211383' },
                  ].map((provider) => (
                    <Button
                      key={provider.name}
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => window.open(provider.url, '_blank')}
                    >
                      {provider.name}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDnsSetupDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedDomainForDns) {
                  verifyDomainMutation.mutate(selectedDomainForDns.id);
                  setShowDnsSetupDialog(false);
                }
              }}
              disabled={verifyDomainMutation.isPending}
            >
              {verifyDomainMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verify DNS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subdomain Change Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Subdomain Change</DialogTitle>
            <DialogDescription>
              Submit a request to change your company's subdomain. Platform admins will review and approve your request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Subdomain</Label>
              <div className="px-3 py-2 bg-muted rounded font-mono text-sm">
                {subdomainRecord?.subdomain}.{effectiveBaseDomain}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-subdomain">New Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="new-subdomain"
                  value={requestedSubdomain}
                  onChange={(e) => setRequestedSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-company"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.{effectiveBaseDomain}</span>
              </div>
              
              {/* Availability indicator */}
              {requestedSubdomain && (
                <div className="flex items-center gap-2 text-sm">
                  {isCheckingAvailability ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-muted-foreground">Checking availability...</span>
                    </>
                  ) : availabilityResult ? (
                    availabilityResult.available ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-600">{availabilityResult.message}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600">{availabilityResult.message}</span>
                      </>
                    )
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Change (optional)</Label>
              <Textarea
                id="reason"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Tell us why you'd like to change your subdomain..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitRequestMutation.mutate()}
              disabled={
                !requestedSubdomain ||
                requestedSubdomain.length < 3 ||
                !availabilityResult?.available ||
                submitRequestMutation.isPending
              }
            >
              {submitRequestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
