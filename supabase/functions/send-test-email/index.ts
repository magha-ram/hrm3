import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendTestEmailRequest {
  to: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is a platform admin
    const { data: platformAdmin } = await supabaseAdmin
      .from("platform_admins")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!platformAdmin) {
      console.error("User is not a platform admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden", message: "Only platform admins can send test emails" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: SendTestEmailRequest = await req.json();

    if (!body.to || typeof body.to !== "string") {
      return new Response(
        JSON.stringify({ error: "Validation Error", message: "Recipient email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending test email to: ${body.to}`);

    // Get email settings from platform_settings
    const { data: emailSettings } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "email")
      .maybeSingle();

    const settings = emailSettings?.value as { 
      provider?: string; 
      from_name?: string; 
      from_address?: string; 
    } || {};

    const provider = settings.provider || "console";
    const fromName = settings.from_name || "HR Platform";
    const fromAddress = settings.from_address || "noreply@example.com";

    // For console provider, just log
    if (provider === "console") {
      console.log("=== TEST EMAIL (Console Provider) ===");
      console.log(`From: ${fromName} <${fromAddress}>`);
      console.log(`To: ${body.to}`);
      console.log(`Subject: Test Email from HR Platform`);
      console.log(`Body: This is a test email to verify your email configuration is working correctly.`);
      console.log("=====================================");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test email logged to console (development mode)",
          provider: "console"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For actual email providers, call the send-email function
    const { error: emailError } = await supabaseAdmin.functions.invoke("send-email", {
      body: {
        to: body.to,
        subject: "Test Email from HR Platform",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Test Email</h1>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p style="color: #666; font-size: 14px;">Sent from: ${fromName} (${fromAddress})</p>
            <p style="color: #666; font-size: 14px;">Provider: ${provider}</p>
            <p style="color: #666; font-size: 14px;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
        text: `Test Email\n\nThis is a test email to verify your email configuration is working correctly.\n\nSent from: ${fromName} (${fromAddress})\nProvider: ${provider}\nTimestamp: ${new Date().toISOString()}`,
      },
    });

    if (emailError) {
      console.error("Error sending test email:", emailError);
      return new Response(
        JSON.stringify({ error: "Email Error", message: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Test email sent successfully to ${body.to}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${body.to}`,
        provider
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in send-test-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
