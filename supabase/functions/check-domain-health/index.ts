import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
}

const HOSTING_IPS: Record<string, string> = {
  lovable: '185.158.133.1',
  vercel: '76.76.21.21',
};

async function resolveDomain(domain: string): Promise<{ success: boolean; addresses: string[] }> {
  try {
    const addresses = await Deno.resolveDns(domain, "A");
    return { success: true, addresses };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`DNS resolution failed for ${domain}:`, errorMessage);
    return { success: false, addresses: [] };
  }
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

    const messages: string[] = [];
    let wildcardConfigured = false;
    let rootResolved = false;
    let rootIp: string | null = null;
    let wwwResolved = false;
    let wwwIp: string | null = null;

    // Get expected IP based on hosting provider
    const expectedIp = hostingProvider ? HOSTING_IPS[hostingProvider] : undefined;

    // Step 1: Check if the root domain resolves
    const rootResult = await resolveDomain(cleanDomain);
    if (rootResult.success && rootResult.addresses.length > 0) {
      rootResolved = true;
      rootIp = rootResult.addresses[0];
      messages.push(`✓ Root domain resolves to ${rootResult.addresses.join(', ')}`);
    } else {
      messages.push(`✗ Root domain does not resolve`);
    }

    // Step 2: Check if a test subdomain resolves (indicates wildcard DNS)
    const testSubdomain = `_healthcheck-${Date.now()}`;
    const testDomain = `${testSubdomain}.${cleanDomain}`;
    
    const subdomainResult = await resolveDomain(testDomain);
    if (subdomainResult.success && subdomainResult.addresses.length > 0) {
      messages.push(`✓ Wildcard subdomain resolves to ${subdomainResult.addresses.join(', ')}`);
      
      if (rootIp && subdomainResult.addresses.includes(rootIp)) {
        wildcardConfigured = true;
        messages.push(`✓ Wildcard DNS correctly configured (points to same IP as root)`);
      } else if (rootIp) {
        wildcardConfigured = true;
        messages.push(`⚠ Wildcard DNS configured but points to different IP: ${subdomainResult.addresses.join(', ')}`);
      } else {
        wildcardConfigured = true;
        messages.push(`✓ Wildcard DNS is configured`);
      }
    } else {
      messages.push(`✗ Wildcard subdomain does not resolve`);
      messages.push(`→ To enable subdomains, add a wildcard A record: *.${cleanDomain} → your server IP`);
    }

    // Step 3: Check www subdomain
    const wwwResult = await resolveDomain(`www.${cleanDomain}`);
    if (wwwResult.success && wwwResult.addresses.length > 0) {
      wwwResolved = true;
      wwwIp = wwwResult.addresses[0];
      messages.push(`✓ www subdomain resolves to ${wwwResult.addresses.join(', ')}`);
    } else {
      messages.push(`✗ www subdomain does not resolve`);
    }

    // Check IP mismatch
    const ipMismatch = expectedIp && rootIp ? rootIp !== expectedIp : false;
    if (ipMismatch && expectedIp) {
      messages.push(`⚠ IP mismatch: expected ${expectedIp}, got ${rootIp}`);
    }

    // Determine overall health
    const isHealthy = rootResolved && !ipMismatch;

    // Build summary message
    if (isHealthy && wildcardConfigured) {
      messages.unshift('Domain is fully configured for subdomain routing');
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
    };

    console.log('Health check result:', result);

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
