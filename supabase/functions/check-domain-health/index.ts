import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  domain: string;
  wildcardConfigured: boolean;
  rootResolvable: boolean;
  testSubdomainResolvable: boolean;
  ipAddress: string | null;
  message: string;
  details: string[];
}

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
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    
    console.log(`Checking domain health for: ${cleanDomain}`);

    const details: string[] = [];
    let wildcardConfigured = false;
    let rootResolvable = false;
    let testSubdomainResolvable = false;
    let ipAddress: string | null = null;

    // Step 1: Check if the root domain resolves
    const rootResult = await resolveDomain(cleanDomain);
    if (rootResult.success && rootResult.addresses.length > 0) {
      rootResolvable = true;
      ipAddress = rootResult.addresses[0];
      details.push(`✓ Root domain resolves to ${rootResult.addresses.join(', ')}`);
    } else {
      details.push(`✗ Root domain does not resolve`);
    }

    // Step 2: Check if a test subdomain resolves (indicates wildcard DNS)
    // Use a random subdomain that's unlikely to exist as a specific record
    const testSubdomain = `_healthcheck-${Date.now()}`;
    const testDomain = `${testSubdomain}.${cleanDomain}`;
    
    const subdomainResult = await resolveDomain(testDomain);
    if (subdomainResult.success && subdomainResult.addresses.length > 0) {
      testSubdomainResolvable = true;
      details.push(`✓ Wildcard subdomain resolves to ${subdomainResult.addresses.join(', ')}`);
      
      // Verify it points to the same IP as root (or at least resolves)
      if (ipAddress && subdomainResult.addresses.includes(ipAddress)) {
        wildcardConfigured = true;
        details.push(`✓ Wildcard DNS correctly configured (points to same IP as root)`);
      } else if (ipAddress) {
        wildcardConfigured = true;
        details.push(`⚠ Wildcard DNS configured but points to different IP: ${subdomainResult.addresses.join(', ')}`);
      } else {
        wildcardConfigured = true;
        details.push(`✓ Wildcard DNS is configured`);
      }
    } else {
      details.push(`✗ Wildcard subdomain does not resolve`);
      details.push(`→ To enable subdomains, add a wildcard A record: *.${cleanDomain} → your server IP`);
    }

    // Step 3: Check a known subdomain pattern (like www)
    const wwwResult = await resolveDomain(`www.${cleanDomain}`);
    if (wwwResult.success) {
      details.push(`✓ www subdomain resolves to ${wwwResult.addresses.join(', ')}`);
    } else {
      details.push(`✗ www subdomain does not resolve`);
    }

    // Build summary message
    let message: string;
    if (wildcardConfigured && rootResolvable) {
      message = 'Domain is fully configured for subdomain routing';
    } else if (rootResolvable && !wildcardConfigured) {
      message = 'Root domain works but wildcard DNS is not configured - subdomains will not work';
    } else if (!rootResolvable) {
      message = 'Domain does not resolve - check DNS configuration';
    } else {
      message = 'Partial configuration detected - review details below';
    }

    const result: HealthCheckResult = {
      domain: cleanDomain,
      wildcardConfigured,
      rootResolvable,
      testSubdomainResolvable,
      ipAddress,
      message,
      details,
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
