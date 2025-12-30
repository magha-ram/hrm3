import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { EmailService } from "../_shared/email/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckLoginRequest {
  userAgent: string;
  timestamp: string;
}

function parseUserAgent(userAgent: string): string {
  // Simple browser detection
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return match ? `Chrome ${match[1]}` : 'Chrome';
  }
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return match ? `Firefox ${match[1]}` : 'Firefox';
  }
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return match ? `Safari ${match[1]}` : 'Safari';
  }
  if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return match ? `Edge ${match[1]}` : 'Edge';
  }
  return 'Unknown Browser';
}

function getDeviceFingerprint(userAgent: string): string {
  // Create a simple fingerprint from the user agent
  // In production, you'd use more sophisticated device fingerprinting
  const parts = [];
  
  // OS detection
  if (userAgent.includes('Windows')) parts.push('Windows');
  else if (userAgent.includes('Mac OS')) parts.push('macOS');
  else if (userAgent.includes('Linux')) parts.push('Linux');
  else if (userAgent.includes('Android')) parts.push('Android');
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) parts.push('iOS');
  else parts.push('Unknown OS');
  
  // Browser
  parts.push(parseUserAgent(userAgent));
  
  return parts.join(' - ');
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client for getting current user
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for querying all security events
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CheckLoginRequest = await req.json();
    const currentUserAgent = body.userAgent;
    const currentFingerprint = getDeviceFingerprint(currentUserAgent);

    console.log(`Checking login for user ${user.id} with fingerprint: ${currentFingerprint}`);

    // Get user profile for email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!profile) {
      console.log('No profile found for user');
      return new Response(
        JSON.stringify({ suspicious: false, reason: 'No profile' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get last 30 days of successful logins for this user
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentLogins, error: loginsError } = await supabaseAdmin
      .from('security_events')
      .select('user_agent, created_at, metadata')
      .eq('user_id', user.id)
      .eq('event_type', 'login_success')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (loginsError) {
      console.error('Error fetching recent logins:', loginsError);
      return new Response(
        JSON.stringify({ suspicious: false, error: loginsError.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skip the current login (first in list) and check if device is known
    const previousLogins = recentLogins?.slice(1) || [];
    const knownFingerprints = new Set(
      previousLogins.map(login => getDeviceFingerprint(login.user_agent || ''))
    );

    console.log(`Found ${previousLogins.length} previous logins, ${knownFingerprints.size} unique devices`);

    // Check if this is a new device
    const isNewDevice = previousLogins.length > 0 && !knownFingerprints.has(currentFingerprint);
    
    // If this is the first login ever, don't flag as suspicious
    if (previousLogins.length === 0) {
      console.log('First login for user, not flagging');
      return new Response(
        JSON.stringify({ suspicious: false, reason: 'First login' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isNewDevice) {
      console.log('New device detected, sending security alert');

      const userName = profile.first_name || profile.email.split('@')[0];
      const loginTime = new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      // Log suspicious activity
      await supabaseAdmin.from('security_events').insert({
        event_type: 'suspicious_activity',
        user_id: user.id,
        description: 'Login from new device detected',
        user_agent: currentUserAgent,
        severity: 'medium',
        metadata: {
          reason: 'new_device',
          device_fingerprint: currentFingerprint,
          known_devices: Array.from(knownFingerprints),
        },
      });

      // Send email notification
      try {
        const emailService = new EmailService();
        const result = await emailService.send({
          template: 'suspicious_login',
          data: {
            userName,
            loginTime,
            browser: parseUserAgent(currentUserAgent),
            location: 'Unknown (IP-based geolocation not enabled)',
            ipAddress: 'Hidden for privacy',
            reason: 'This login is from a new device we haven\'t seen before',
            secureAccountUrl: `${Deno.env.get('SITE_URL') || 'https://preview--hr-flow-platform.lovable.app'}/settings/security`,
          },
          to: { email: profile.email, name: userName },
        });

        console.log('Email send result:', result);
      } catch (emailError) {
        console.error('Failed to send suspicious login email:', emailError);
      }

      return new Response(
        JSON.stringify({ 
          suspicious: true, 
          reason: 'new_device',
          message: 'Login from new device detected'
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ suspicious: false, reason: 'Known device' }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-suspicious-login:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
