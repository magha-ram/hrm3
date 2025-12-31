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

interface WildcardHealthResult {
  baseDomain: string;
  wildcardConfigured: boolean;
  rootResolvable: boolean;
  testSubdomains: {
    subdomain: string;
    resolvable: boolean;
    ipAddress: string | null;
  }[];
  expectedIp: string | null;
  message: string;
  instructions: string[];
  vercelInstructions: string[];
  lovableInstructions: string[];
  // New global DNS fields
  checkSource: string;
  googleDnsIp: string | null;
  cloudflareDnsIp: string | null;
  propagationStatus: 'complete' | 'partial' | 'pending';
  dnsResults: DnsResult[];
}

const DNS_PROVIDERS: DnsProvider[] = [
  { name: 'Google', url: 'https://dns.google/resolve' },
  { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
];

// Resolve domain using DNS-over-HTTPS (global, consistent results)
async function resolveDomainGlobal(hostname: string, provider: DnsProvider): Promise<DnsResult> {
  try {
    const url = `${provider.url}?name=${hostname}&type=A`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dns-json',
      },
    });

    if (!response.ok) {
      console.log(`[${provider.name}] HTTP error for ${hostname}: ${response.status}`);
      return { provider: provider.name, success: false, ip: null };
    }

    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      const aRecord = data.Answer.find((record: { type: number; data: string }) => record.type === 1);
      if (aRecord) {
        console.log(`[${provider.name}] Resolved ${hostname} to ${aRecord.data}`);
        return { provider: provider.name, success: true, ip: aRecord.data };
      }
    }
    
    console.log(`[${provider.name}] No A record found for ${hostname}`);
    return { provider: provider.name, success: false, ip: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[${provider.name}] DNS resolution failed for ${hostname}:`, errorMessage);
    return { provider: provider.name, success: false, ip: null };
  }
}

// Check DNS resolution using all providers
async function checkDnsResolutionAllProviders(hostname: string): Promise<{ 
  resolvable: boolean; 
  ipAddress: string | null;
  results: DnsResult[];
}> {
  const results = await Promise.all(
    DNS_PROVIDERS.map(provider => resolveDomainGlobal(hostname, provider))
  );
  
  // Get the best IP (prefer Google, then Cloudflare)
  const google = results.find(r => r.provider === 'Google' && r.success);
  const cloudflare = results.find(r => r.provider === 'Cloudflare' && r.success);
  
  const ip = google?.ip || cloudflare?.ip || null;
  
  return { 
    resolvable: ip !== null, 
    ipAddress: ip,
    results
  };
}

// Determine propagation status
function getPropagationStatus(results: DnsResult[], expectedIp?: string): 'complete' | 'partial' | 'pending' {
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
    const { baseDomain } = await req.json();
    
    if (!baseDomain) {
      return new Response(
        JSON.stringify({ error: 'baseDomain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[check-wildcard-health] Checking wildcard DNS for: ${baseDomain}`);
    console.log('Using global DNS-over-HTTPS (Google & Cloudflare)');

    // Check root domain using both providers
    const rootCheck = await checkDnsResolutionAllProviders(baseDomain);
    const googleResult = rootCheck.results.find(r => r.provider === 'Google');
    const cloudflareResult = rootCheck.results.find(r => r.provider === 'Cloudflare');
    
    console.log(`[check-wildcard-health] Root domain check:`, {
      google: googleResult?.ip,
      cloudflare: cloudflareResult?.ip,
      best: rootCheck.ipAddress
    });

    // Generate random test subdomains to check wildcard
    const testSubdomains = [
      `test-${Date.now()}`,
      `wildcard-check-${Math.random().toString(36).substring(7)}`,
      'wildcard-test-12345',
    ];

    const subdomainResults = await Promise.all(
      testSubdomains.map(async (sub) => {
        const hostname = `${sub}.${baseDomain}`;
        const result = await checkDnsResolutionAllProviders(hostname);
        console.log(`[check-wildcard-health] Subdomain ${hostname}:`, {
          resolvable: result.resolvable,
          ip: result.ipAddress
        });
        return {
          subdomain: sub,
          resolvable: result.resolvable,
          ipAddress: result.ipAddress,
        };
      })
    );

    // Determine if wildcard is configured
    const allSubdomainsResolve = subdomainResults.every(r => r.resolvable);
    const allSameIp = subdomainResults.every(r => r.ipAddress === rootCheck.ipAddress);
    const wildcardConfigured = allSubdomainsResolve && allSameIp && rootCheck.resolvable;

    // Determine propagation status
    const propagationStatus = getPropagationStatus(rootCheck.results);

    // Build response message
    let message: string;
    if (propagationStatus === 'pending') {
      message = `DNS propagation pending - changes may take 24-72 hours`;
    } else if (propagationStatus === 'partial') {
      message = `DNS propagation in progress - some regions updated`;
    } else if (wildcardConfigured) {
      message = `Wildcard DNS is properly configured for *.${baseDomain}`;
    } else if (rootCheck.resolvable && !allSubdomainsResolve) {
      message = `Root domain resolves but wildcard is not configured`;
    } else if (!rootCheck.resolvable) {
      message = `Root domain ${baseDomain} is not resolvable`;
    } else {
      message = `Wildcard DNS configuration is incomplete`;
    }

    // Build instructions based on hosting type
    const instructions = [
      'Configure wildcard DNS at your domain registrar (Cloudflare, GoDaddy, Namecheap, etc.)',
      `Add an A record for *.${baseDomain.split('.')[0]} pointing to your server IP`,
      'Wait for DNS propagation (can take up to 48 hours)',
    ];

    const vercelInstructions = [
      '1. Go to your Vercel project dashboard',
      '2. Navigate to Settings → Domains',
      `3. Add ${baseDomain} as a domain`,
      `4. Add *.${baseDomain} as a wildcard domain`,
      '5. Configure DNS:',
      `   - A record: *.${baseDomain.split('.')[0]} → 76.76.21.21`,
      `   - Or CNAME: *.${baseDomain.split('.')[0]} → cname.vercel-dns.com`,
      '6. Vercel will auto-provision SSL for wildcard domains',
    ];

    const lovableInstructions = [
      '1. Go to your Lovable project Settings → Domains',
      `2. Add ${baseDomain} as a custom domain`,
      `3. Add *.${baseDomain} as a wildcard domain (if supported)`,
      '4. Configure DNS:',
      `   - A record: @ → 185.158.133.1 (for root)`,
      `   - A record: *.${baseDomain.split('.')[0]} → 185.158.133.1 (for wildcard)`,
      '5. Wait for SSL provisioning',
    ];

    const result: WildcardHealthResult = {
      baseDomain,
      wildcardConfigured,
      rootResolvable: rootCheck.resolvable,
      testSubdomains: subdomainResults,
      expectedIp: rootCheck.ipAddress,
      message,
      instructions,
      vercelInstructions,
      lovableInstructions,
      checkSource: 'Global (Google & Cloudflare DNS)',
      googleDnsIp: googleResult?.ip || null,
      cloudflareDnsIp: cloudflareResult?.ip || null,
      propagationStatus,
      dnsResults: rootCheck.results,
    };

    console.log(`[check-wildcard-health] Result:`, { 
      baseDomain, 
      wildcardConfigured, 
      rootResolvable: rootCheck.resolvable,
      propagationStatus,
      googleDnsIp: googleResult?.ip,
      cloudflareDnsIp: cloudflareResult?.ip
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[check-wildcard-health] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
