import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSuperAdminRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  company_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify caller is authenticated and is a super_admin or company_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify permissions
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callerUser) {
      console.error('Failed to get caller user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateSuperAdminRequest = await req.json();
    const { email, password, first_name, last_name, company_id } = body;

    console.log(`Creating super_admin for email: ${email}, company: ${company_id}`);

    // Validate required fields
    if (!email || !password || !company_id) {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'email, password, and company_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller has permission (must be super_admin or company_admin of the company)
    const { data: callerRole, error: roleError } = await supabaseAdmin
      .from('company_users')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .single();

    if (roleError || !callerRole) {
      console.error('Caller is not a member of this company:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: 'You are not a member of this company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only super_admin can create another super_admin
    if (callerRole.role !== 'super_admin') {
      console.error('Caller is not a super_admin, role:', callerRole.role);
      return new Response(
        JSON.stringify({ error: 'Forbidden', message: 'Only super_admin can create another super_admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log('User already exists, will add to company:', existingUser.id);
      userId = existingUser.id;

      // Check if already a member of this company
      const { data: existingMembership } = await supabaseAdmin
        .from('company_users')
        .select('id, role')
        .eq('user_id', userId)
        .eq('company_id', company_id)
        .single();

      if (existingMembership) {
        // Update existing membership to super_admin
        await supabaseAdmin
          .from('company_users')
          .update({ role: 'super_admin', is_active: true })
          .eq('id', existingMembership.id);

        console.log('Updated existing membership to super_admin');
        return new Response(
          JSON.stringify({
            success: true,
            message: 'User upgraded to super_admin',
            user_id: userId,
            is_new_user: false,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
        },
      });

      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user', message: createError?.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      console.log('Created new user:', userId);
    }

    // Add user to company as super_admin
    const { error: membershipError } = await supabaseAdmin
      .from('company_users')
      .insert({
        company_id,
        user_id: userId,
        role: 'super_admin',
        is_primary: false,
        is_active: true,
        joined_at: new Date().toISOString(),
      });

    if (membershipError) {
      console.error('Failed to add user to company:', membershipError);
      return new Response(
        JSON.stringify({ error: 'Failed to add user to company', message: membershipError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully created super_admin user');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Super admin created successfully',
        user_id: userId,
        is_new_user: !existingUser,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-super-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
