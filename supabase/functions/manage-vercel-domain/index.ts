import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VERCEL_API_TOKEN = Deno.env.get('VERCEL_API_TOKEN');
const VERCEL_PROJECT_ID = Deno.env.get('VERCEL_PROJECT_ID');
const VERCEL_TEAM_ID = Deno.env.get('VERCEL_TEAM_ID');

interface VercelDomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

interface VercelDomainConfig {
  configuredBy: string | null;
  misconfigured: boolean;
}

async function addDomainToVercel(domain: string): Promise<{ success: boolean; data?: VercelDomainResponse; error?: string }> {
  console.log(`Adding domain ${domain} to Vercel project ${VERCEL_PROJECT_ID}`);
  
  const teamParam = VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : '';
  const url = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains?${teamParam}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    const data = await response.json();
    console.log('Vercel add domain response:', JSON.stringify(data));

    if (!response.ok) {
      // Handle specific error cases
      if (data.error?.code === 'domain_already_in_use') {
        return { success: false, error: 'This domain is already in use by another Vercel project' };
      }
      if (data.error?.code === 'domain_taken') {
        return { success: false, error: 'This domain is already registered on Vercel by another account' };
      }
      return { success: false, error: data.error?.message || 'Failed to add domain to Vercel' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error adding domain to Vercel:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  console.log(`Removing domain ${domain} from Vercel project ${VERCEL_PROJECT_ID}`);
  
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Vercel remove domain error:', data);
      return { success: false, error: data.error?.message || 'Failed to remove domain from Vercel' };
    }

    console.log('Domain removed successfully from Vercel');
    return { success: true };
  } catch (error) {
    console.error('Error removing domain from Vercel:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function getDomainStatus(domain: string): Promise<{ 
  success: boolean; 
  verified?: boolean; 
  configured?: boolean;
  misconfigured?: boolean;
  error?: string;
}> {
  console.log(`Checking domain status for ${domain}`);
  
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  
  try {
    // Get domain info
    const domainUrl = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${teamParam}`;
    const domainResponse = await fetch(domainUrl, {
      headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` },
    });

    if (!domainResponse.ok) {
      if (domainResponse.status === 404) {
        return { success: false, error: 'Domain not found in Vercel project' };
      }
      const data = await domainResponse.json();
      return { success: false, error: data.error?.message || 'Failed to get domain status' };
    }

    const domainData: VercelDomainResponse = await domainResponse.json();
    console.log('Domain data:', JSON.stringify(domainData));

    // Get domain configuration
    const configUrl = `https://api.vercel.com/v6/domains/${domain}/config${teamParam}`;
    const configResponse = await fetch(configUrl, {
      headers: { 'Authorization': `Bearer ${VERCEL_API_TOKEN}` },
    });

    let misconfigured = false;
    if (configResponse.ok) {
      const configData: VercelDomainConfig = await configResponse.json();
      console.log('Domain config:', JSON.stringify(configData));
      misconfigured = configData.misconfigured;
    }

    return {
      success: true,
      verified: domainData.verified,
      configured: !misconfigured,
      misconfigured,
    };
  } catch (error) {
    console.error('Error getting domain status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function verifyDomainOnVercel(domain: string): Promise<{ success: boolean; verified?: boolean; error?: string }> {
  console.log(`Triggering verification for domain ${domain}`);
  
  const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
  const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}/verify${teamParam}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    const data = await response.json();
    console.log('Vercel verify response:', JSON.stringify(data));

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Verification failed' };
    }

    return { success: true, verified: data.verified };
  } catch (error) {
    console.error('Error verifying domain:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify required environment variables
    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      console.error('Missing Vercel configuration');
      return new Response(
        JSON.stringify({ error: 'Vercel integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, domain, domainId, companyId } = await req.json();
    console.log(`Processing action: ${action} for domain: ${domain}`);

    if (!action || !domain) {
      return new Response(
        JSON.stringify({ error: 'Action and domain are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client for database updates
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (action) {
      case 'add': {
        result = await addDomainToVercel(domain);
        
        if (result.success && domainId) {
          // Update database with Vercel status
          await supabase
            .from('company_domains')
            .update({
              vercel_status: result.data?.verified ? 'active' : 'pending',
              vercel_verified: result.data?.verified || false,
              vercel_error: null,
            })
            .eq('id', domainId);
        } else if (!result.success && domainId) {
          await supabase
            .from('company_domains')
            .update({
              vercel_status: 'error',
              vercel_error: result.error,
            })
            .eq('id', domainId);
        }
        break;
      }

      case 'remove': {
        result = await removeDomainFromVercel(domain);
        break;
      }

      case 'status': {
        result = await getDomainStatus(domain);
        
        if (result.success && domainId) {
          const status = result.verified && result.configured ? 'active' : 
                        result.misconfigured ? 'misconfigured' : 'pending';
          
          await supabase
            .from('company_domains')
            .update({
              vercel_status: status,
              vercel_verified: result.verified || false,
              is_verified: result.verified && result.configured,
              is_active: result.verified && result.configured,
              vercel_error: result.misconfigured ? 'DNS misconfigured' : null,
            })
            .eq('id', domainId);
        }
        break;
      }

      case 'verify': {
        result = await verifyDomainOnVercel(domain);
        
        if (result.success && domainId) {
          await supabase
            .from('company_domains')
            .update({
              vercel_status: result.verified ? 'active' : 'pending',
              vercel_verified: result.verified || false,
              is_verified: result.verified,
              is_active: result.verified,
              verified_at: result.verified ? new Date().toISOString() : null,
              vercel_error: null,
            })
            .eq('id', domainId);
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-vercel-domain:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
