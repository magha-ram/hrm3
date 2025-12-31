import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DnsProvider {
  name: string;
  url: string;
}

interface DnsResult {
  provider: string;
  success: boolean;
  ip: string | null;
}

interface HealthCheckResult {
  domain: string;
  rootResolved: boolean;
  rootIp: string | null;
  wildcardConfigured: boolean;
  wwwResolved: boolean;
  wwwIp: string | null;
  isHealthy: boolean;
  messages: string[];
  expectedIp?: string;
  ipMismatch?: boolean;
  // New global DNS fields
  checkSource: string;
  googleDnsIp: string | null;
  cloudflareDnsIp: string | null;
  propagationStatus: 'complete' | 'partial' | 'pending';
  dnsResults: DnsResult[];
}

const HOSTING_IPS: Record<string, string> = {
  lovable: '185.158.133.1',
  vercel: '76.76.21.21',
};

const DNS_PROVIDERS: DnsProvider[] = [
  { name: 'Google', url: 'https://dns.google/resolve' },
  { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
];

// Resolve domain using DNS-over-HTTPS (global, consistent results)
async function resolveDomainGlobal(domain: string, provider: DnsProvider): Promise<DnsResult> {
  try {
    const url = provider.name === 'Google' 
      ? `${provider.url}?name=${domain}&type=A`
      : `${provider.url}?name=${domain}&type=A`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dns-json',
      },
    });

    if (!response.ok) {
      console.log(`[${provider.name}] HTTP error for ${domain}: ${response.status}`);
      return { provider: provider.name, success: false, ip: null };
    }

    const data = await response.json();
    
    // Both Google and Cloudflare use similar response format
    if (data.Answer && data.Answer.length > 0) {
      // Find A record (type 1)
      const aRecord = data.Answer.find((record: { type: number; data: string }) => record.type === 1);
      if (aRecord) {
        console.log(`[${provider.name}] Resolved ${domain} to ${aRecord.data}`);
        return { provider: provider.name, success: true, ip: aRecord.data };
      }
    }
    
    console.log(`[${provider.name}] No A record found for ${domain}`);
    return { provider: provider.name, success: false, ip: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[${provider.name}] DNS resolution failed for ${domain}:`, errorMessage);
    return { provider: provider.name, success: false, ip: null };
  }
}

// Resolve domain using all providers
async function resolveDomainAllProviders(domain: string): Promise<DnsResult[]> {
  const results = await Promise.all(
    DNS_PROVIDERS.map(provider => resolveDomainGlobal(domain, provider))
  );
  return results;
}

// Get the best IP (prefer Google, then Cloudflare)
function getBestIp(results: DnsResult[]): string | null {
  const google = results.find(r => r.provider === 'Google' && r.success);
  if (google?.ip) return google.ip;
  
  const cloudflare = results.find(r => r.provider === 'Cloudflare' && r.success);
  if (cloudflare?.ip) return cloudflare.ip;
  
  return null;
}

// Determine propagation status
function getPropagationStatus(results: DnsResult[], expectedIp: string | undefined): 'complete' | 'partial' | 'pending' {
  const successfulResults = results.filter(r => r.success && r.ip);
  
  if (successfulResults.length === 0) {
    return 'pending';
  }
  
  if (expectedIp) {
    const correctResults = successfulResults.filter(r => r.ip === expectedIp);
    if (correctResults.length === results.length) {
      return 'complete';
    } else if (correctResults.length > 0) {
      return 'partial';
    } else {
      return 'pending';
    }
  }
  
  // No expected IP - just check if all providers agree
  if (successfulResults.length === results.length) {
    const ips = new Set(successfulResults.map(r => r.ip));
    return ips.size === 1 ? 'complete' : 'partial';
  }
  
  return 'partial';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, hostingProvider } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    
    console.log(`Checking domain health for: ${cleanDomain}, provider: ${hostingProvider}`);
    console.log('Using global DNS-over-HTTPS (Google & Cloudflare)');

    const messages: string[] = [];
    let wildcardConfigured = false;
    let rootResolved = false;
    let rootIp: string | null = null;
    let wwwResolved = false;
    let wwwIp: string | null = null;

    // Get expected IP based on hosting provider
    const expectedIp = hostingProvider ? HOSTING_IPS[hostingProvider] : undefined;

    // Step 1: Check if the root domain resolves (using global DNS)
    const rootResults = await resolveDomainAllProviders(cleanDomain);
    const googleResult = rootResults.find(r => r.provider === 'Google');
    const cloudflareResult = rootResults.find(r => r.provider === 'Cloudflare');
    
    rootIp = getBestIp(rootResults);
    rootResolved = rootIp !== null;
    
    if (rootResolved) {
      messages.push(`✓ Root domain resolves to ${rootIp}`);
      if (googleResult?.ip) messages.push(`  → Google DNS: ${googleResult.ip}`);
      if (cloudflareResult?.ip) messages.push(`  → Cloudflare DNS: ${cloudflareResult.ip}`);
    } else {
      messages.push(`✗ Root domain does not resolve globally`);
      messages.push(`  → Google DNS: not resolving`);
      messages.push(`  → Cloudflare DNS: not resolving`);
    }

    // Step 2: Check if a test subdomain resolves (indicates wildcard DNS)
    const testSubdomain = `_healthcheck-${Date.now()}`;
    const testDomain = `${testSubdomain}.${cleanDomain}`;
    
    const subdomainResults = await resolveDomainAllProviders(testDomain);
    const subdomainIp = getBestIp(subdomainResults);
    
    if (subdomainIp) {
      messages.push(`✓ Wildcard subdomain resolves to ${subdomainIp}`);
      
      if (rootIp && subdomainIp === rootIp) {
        wildcardConfigured = true;
        messages.push(`✓ Wildcard DNS correctly configured (points to same IP as root)`);
      } else if (rootIp) {
        wildcardConfigured = true;
        messages.push(`⚠ Wildcard DNS configured but points to different IP: ${subdomainIp}`);
      } else {
        wildcardConfigured = true;
        messages.push(`✓ Wildcard DNS is configured`);
      }
    } else {
      messages.push(`✗ Wildcard subdomain does not resolve`);
      messages.push(`→ To enable subdomains, add a wildcard A record: *.${cleanDomain} → your server IP`);
    }

    // Step 3: Check www subdomain
    const wwwResults = await resolveDomainAllProviders(`www.${cleanDomain}`);
    wwwIp = getBestIp(wwwResults);
    wwwResolved = wwwIp !== null;
    
    if (wwwResolved) {
      messages.push(`✓ www subdomain resolves to ${wwwIp}`);
    } else {
      messages.push(`✗ www subdomain does not resolve`);
    }

    // Check IP mismatch
    const ipMismatch = expectedIp && rootIp ? rootIp !== expectedIp : false;
    if (ipMismatch && expectedIp) {
      messages.push(`⚠ IP mismatch: expected ${expectedIp}, got ${rootIp}`);
      messages.push(`→ DNS propagation may still be in progress (can take 24-72 hours)`);
    }

    // Determine propagation status
    const propagationStatus = getPropagationStatus(rootResults, expectedIp);

    // Determine overall health
    const isHealthy = rootResolved && !ipMismatch;

    // Build summary message
    if (propagationStatus === 'pending') {
      messages.unshift('⏳ DNS propagation pending - changes may take 24-72 hours to complete globally');
    } else if (propagationStatus === 'partial') {
      messages.unshift('⏳ DNS propagation in progress - some regions updated, others pending');
    } else if (isHealthy && wildcardConfigured) {
      messages.unshift('✓ Domain is fully configured for subdomain routing');
    } else if (rootResolved && !wildcardConfigured) {
      messages.unshift('Root domain works but wildcard DNS is not configured - subdomains will not work');
    } else if (!rootResolved) {
      messages.unshift('Domain does not resolve - check DNS configuration');
    } else if (ipMismatch) {
      messages.unshift('Domain resolves but points to wrong IP address');
    } else {
      messages.unshift('Partial configuration detected - review details below');
    }

    const result: HealthCheckResult = {
      domain: cleanDomain,
      rootResolved,
      rootIp,
      wildcardConfigured,
      wwwResolved,
      wwwIp,
      isHealthy,
      messages,
      expectedIp,
      ipMismatch,
      checkSource: 'Global (Google & Cloudflare DNS)',
      googleDnsIp: googleResult?.ip || null,
      cloudflareDnsIp: cloudflareResult?.ip || null,
      propagationStatus,
      dnsResults: rootResults,
    };

    console.log('Health check result:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Domain health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Health check failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
