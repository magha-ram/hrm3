import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use anon client with user auth for getting user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Use service role client for admin check (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is a platform admin using service role to bypass RLS
    const { data: platformAdmin } = await adminClient
      .from('platform_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!platformAdmin) {
      return new Response(
        JSON.stringify({ error: 'Not a platform admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which secrets are configured
    const secretsToCheck = [
      'MAILERSEND_API_KEY',
      'SENDGRID_API_KEY',
      'RESEND_API_KEY',
      'BREVO_API_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'EMAIL_FROM_ADDRESS',
      'EMAIL_FROM_NAME',
      'EMAIL_PROVIDER',
    ];

    const secretStatus: Record<string, boolean> = {};
    
    for (const secret of secretsToCheck) {
      const value = Deno.env.get(secret);
      secretStatus[secret] = !!value && value.length > 0;
    }

    console.log('Secret status check completed:', Object.keys(secretStatus).filter(k => secretStatus[k]));

    return new Response(
      JSON.stringify(secretStatus),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking email secrets:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
