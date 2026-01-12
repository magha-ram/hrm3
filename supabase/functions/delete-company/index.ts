import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ code: 'AUTH_MISSING', error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ code: 'AUTH_INVALID', error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const companyId: string | undefined = body.company_id;

    if (!companyId) {
      return new Response(JSON.stringify({ code: 'VALIDATION_ERROR', error: 'company_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only platform owners can delete companies
    const { data: ownerRow, error: ownerCheckError } = await supabaseAdmin
      .from('platform_admins')
      .select('id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'owner')
      .maybeSingle();

    if (ownerCheckError) throw ownerCheckError;

    if (!ownerRow) {
      return new Response(JSON.stringify({ code: 'NOT_AUTHORIZED', error: 'Not authorized to delete companies' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Run the cascade delete in the database
    const { error: deleteError } = await supabaseAdmin.rpc('delete_company_cascade', {
      _company_id: companyId,
    });

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true, company_id: companyId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in delete-company:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
