import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailSettingsRequest {
  company_id: string;
  use_platform_default?: boolean;
  provider?: string;
  from_email?: string;
  from_name?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  smtp_secure?: boolean;
  api_key?: string;
  aws_region?: string;
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = req.method;
    const url = new URL(req.url);
    const companyId = url.searchParams.get('company_id');

    // GET - Fetch settings
    if (method === 'GET') {
      if (!companyId) {
        return new Response(JSON.stringify({ error: 'company_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user is company admin
      const { data: isAdmin } = await supabaseAdmin.rpc('is_active_company_admin', {
        _user_id: user.id,
        _company_id: companyId,
      });

      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: settings, error } = await supabaseAdmin
        .from('company_email_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      // Mask sensitive fields
      const maskedSettings = settings ? {
        ...settings,
        smtp_password: settings.smtp_password ? '••••••••' : null,
        api_key: settings.api_key ? '••••••••' : null,
        aws_secret_access_key: settings.aws_secret_access_key ? '••••••••' : null,
      } : null;

      return new Response(JSON.stringify({ settings: maskedSettings }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Create or update settings
    if (method === 'POST') {
      const body: EmailSettingsRequest = await req.json();
      const targetCompanyId = body.company_id;

      if (!targetCompanyId) {
        return new Response(JSON.stringify({ error: 'company_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user is company admin
      const { data: isAdmin } = await supabaseAdmin.rpc('is_active_company_admin', {
        _user_id: user.id,
        _company_id: targetCompanyId,
      });

      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if settings exist
      const { data: existing } = await supabaseAdmin
        .from('company_email_settings')
        .select('id, smtp_password, api_key, aws_secret_access_key')
        .eq('company_id', targetCompanyId)
        .single();

      // Prepare update data - don't overwrite passwords with masked values
      const updateData: Record<string, unknown> = {
        company_id: targetCompanyId,
        use_platform_default: body.use_platform_default ?? true,
        provider: body.provider,
        from_email: body.from_email,
        from_name: body.from_name,
        smtp_host: body.smtp_host,
        smtp_port: body.smtp_port,
        smtp_username: body.smtp_username,
        smtp_secure: body.smtp_secure,
        aws_region: body.aws_region,
        is_verified: false, // Reset verification on settings change
      };

      // Only update passwords if not masked
      if (body.smtp_password && body.smtp_password !== '••••••••') {
        updateData.smtp_password = body.smtp_password;
      } else if (existing?.smtp_password) {
        updateData.smtp_password = existing.smtp_password;
      }

      if (body.api_key && body.api_key !== '••••••••') {
        updateData.api_key = body.api_key;
      } else if (existing?.api_key) {
        updateData.api_key = existing.api_key;
      }

      if (body.aws_access_key_id) {
        updateData.aws_access_key_id = body.aws_access_key_id;
      }

      if (body.aws_secret_access_key && body.aws_secret_access_key !== '••••••••') {
        updateData.aws_secret_access_key = body.aws_secret_access_key;
      } else if (existing?.aws_secret_access_key) {
        updateData.aws_secret_access_key = existing.aws_secret_access_key;
      }

      let result;
      if (existing) {
        // Update
        const { data, error } = await supabaseAdmin
          .from('company_email_settings')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Insert
        const { data, error } = await supabaseAdmin
          .from('company_email_settings')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Mask sensitive fields in response
      const maskedResult = {
        ...result,
        smtp_password: result.smtp_password ? '••••••••' : null,
        api_key: result.api_key ? '••••••••' : null,
        aws_secret_access_key: result.aws_secret_access_key ? '••••••••' : null,
      };

      console.log(`Email settings ${existing ? 'updated' : 'created'} for company ${targetCompanyId}`);

      return new Response(JSON.stringify({ settings: maskedResult }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Remove settings (revert to platform default)
    if (method === 'DELETE') {
      if (!companyId) {
        return new Response(JSON.stringify({ error: 'company_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user is company admin
      const { data: isAdmin } = await supabaseAdmin.rpc('is_active_company_admin', {
        _user_id: user.id,
        _company_id: companyId,
      });

      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabaseAdmin
        .from('company_email_settings')
        .delete()
        .eq('company_id', companyId);

      if (error) throw error;

      console.log(`Email settings deleted for company ${companyId}`);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manage-email-settings:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
