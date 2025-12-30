import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/contexts/TenantContext';
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
  RefreshCw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export default function DomainSettingsPage() {
  const { companyId } = useTenant();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [baseDomain, setBaseDomain] = useState('hrplatform.com');

  // Fetch base domain from platform settings
  useEffect(() => {
    const fetchBaseDomain = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'base_domain')
        .maybeSingle();
      
      if (data?.value) {
        setBaseDomain(String(data.value).replace(/"/g, ''));
      }
    };
    fetchBaseDomain();
  }, []);

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

  // Add custom domain mutation
  const addDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      // Generate verification token
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

  // Verify domain mutation
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
                    .{baseDomain}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(`${subdomainRecord.subdomain}.${baseDomain}`, 'subdomain')}
                >
                  {copied === 'subdomain' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Active
                </Badge>
                <span className="text-muted-foreground">
                  Your employees can sign in at{' '}
                  <code className="bg-muted px-1 rounded">
                    {subdomainRecord.subdomain}.{baseDomain}
                  </code>
                </span>
              </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyDomainMutation.mutate(domain.id)}
                        disabled={verifyDomainMutation.isPending}
                      >
                        {verifyDomainMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Verify
                      </Button>
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
            <strong>Subdomain:</strong> Your company automatically gets a subdomain based on your company code.
            Employees can bookmark this URL for easy access.
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
    </div>
  );
}
