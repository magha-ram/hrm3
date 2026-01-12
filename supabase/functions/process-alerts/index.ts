import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRule {
  id: string;
  name: string;
  module: string;
  metric_name: string;
  condition: string;
  threshold: number;
  severity: string;
  notification_channels: string[];
  cooldown_minutes: number;
  last_triggered_at: string | null;
}

function checkCondition(value: number, condition: string, threshold: number): boolean {
  switch (condition) {
    case 'greater_than': return value > threshold;
    case 'less_than': return value < threshold;
    case 'equals': return value === threshold;
    case 'greater_than_or_equal': return value >= threshold;
    case 'less_than_or_equal': return value <= threshold;
    default: return false;
  }
}

function formatCondition(condition: string): string {
  switch (condition) {
    case 'greater_than': return '>';
    case 'less_than': return '<';
    case 'equals': return '=';
    case 'greater_than_or_equal': return '>=';
    case 'less_than_or_equal': return '<=';
    default: return condition;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const now = new Date();
    let alertsTriggered = 0;
    let notificationsSent = 0;

    // Get active alert rules
    const { data: alertRules, error: rulesError } = await supabaseAdmin
      .from('alert_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) throw rulesError;

    // Get latest metrics for each module (last 10 minutes to catch recent data)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    
    const { data: recentMetrics, error: metricsError } = await supabaseAdmin
      .from('system_metrics')
      .select('*')
      .gte('collected_at', tenMinutesAgo)
      .order('collected_at', { ascending: false });

    if (metricsError) throw metricsError;

    // Group metrics by module and metric_name, keeping only latest
    const latestMetrics = new Map<string, any>();
    recentMetrics?.forEach(metric => {
      const key = `${metric.module}:${metric.metric_name}`;
      if (!latestMetrics.has(key)) {
        latestMetrics.set(key, metric);
      }
    });

    // Check each alert rule
    for (const rule of alertRules || []) {
      const metricKey = `${rule.module}:${rule.metric_name}`;
      const metric = latestMetrics.get(metricKey);

      if (!metric) {
        console.log(`No metric found for rule: ${rule.name} (${metricKey})`);
        continue;
      }

      // Check if condition is met
      if (!checkCondition(metric.metric_value, rule.condition, rule.threshold)) {
        continue;
      }

      // Check cooldown
      if (rule.last_triggered_at) {
        const lastTriggered = new Date(rule.last_triggered_at);
        const cooldownMs = rule.cooldown_minutes * 60 * 1000;
        if (now.getTime() - lastTriggered.getTime() < cooldownMs) {
          console.log(`Rule ${rule.name} is in cooldown`);
          continue;
        }
      }

      // Alert should be triggered
      const conditionStr = formatCondition(rule.condition);
      const message = `${rule.name}: ${rule.module}.${rule.metric_name} is ${metric.metric_value} (${conditionStr} ${rule.threshold})`;

      console.log(`Triggering alert: ${message}`);

      // Create alert history entry
      const { data: alertEntry, error: alertError } = await supabaseAdmin
        .from('alert_history')
        .insert({
          rule_id: rule.id,
          module: rule.module,
          metric_name: rule.metric_name,
          metric_value: metric.metric_value,
          threshold: rule.threshold,
          condition: rule.condition,
          severity: rule.severity,
          message,
          metadata: {
            metric_unit: metric.metric_unit,
            metric_status: metric.status,
            rule_name: rule.name,
          },
        })
        .select()
        .single();

      if (alertError) {
        console.error(`Error creating alert history:`, alertError);
        continue;
      }

      alertsTriggered++;

      // Update last triggered timestamp on rule
      await supabaseAdmin
        .from('alert_rules')
        .update({ last_triggered_at: now.toISOString() })
        .eq('id', rule.id);

      // Send notifications based on channels
      const channels = Array.isArray(rule.notification_channels) 
        ? rule.notification_channels 
        : JSON.parse(rule.notification_channels || '["in_app"]');

      // In-app notification to platform admins
      if (channels.includes('in_app')) {
        // Get platform admins
        const { data: platformAdmins } = await supabaseAdmin
          .from('platform_admins')
          .select('user_id')
          .eq('is_active', true);

        for (const admin of platformAdmins || []) {
          try {
            await supabaseAdmin.from('notifications').insert({
              user_id: admin.user_id,
              type: 'system_alert',
              title: `[${rule.severity.toUpperCase()}] ${rule.name}`,
              message: message,
              data: {
                alert_id: alertEntry.id,
                module: rule.module,
                severity: rule.severity,
              },
            });
            notificationsSent++;
          } catch (e) {
            console.error(`Error sending notification to admin ${admin.user_id}:`, e);
          }
        }
      }

      // Email notification
      if (channels.includes('email')) {
        // Get platform admin emails
        const { data: platformAdmins } = await supabaseAdmin
          .from('platform_admins')
          .select('user_id');

        for (const admin of platformAdmins || []) {
          // Get user email
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
          
          if (userData?.user?.email) {
            try {
              // Send email via send-email function
              await supabaseAdmin.functions.invoke('send-email', {
                body: {
                  to: userData.user.email,
                  subject: `[${rule.severity.toUpperCase()}] System Alert: ${rule.name}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <div style="background: ${rule.severity === 'critical' ? '#dc2626' : rule.severity === 'warning' ? '#f59e0b' : '#3b82f6'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0;">System Alert: ${rule.severity.toUpperCase()}</h2>
                      </div>
                      <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                        <p><strong>Alert:</strong> ${rule.name}</p>
                        <p><strong>Module:</strong> ${rule.module}</p>
                        <p><strong>Details:</strong> ${message}</p>
                        <p><strong>Time:</strong> ${now.toISOString()}</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #64748b; font-size: 14px;">
                          This is an automated alert from the HRM Platform monitoring system.
                          Please review and acknowledge this alert in the admin dashboard.
                        </p>
                      </div>
                    </div>
                  `,
                },
              });
              notificationsSent++;
            } catch (e) {
              console.error(`Error sending email to ${userData.user.email}:`, e);
            }
          }
        }
      }
    }

    console.log(`Processed ${alertRules?.length || 0} rules, triggered ${alertsTriggered} alerts, sent ${notificationsSent} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        rulesChecked: alertRules?.length || 0,
        alertsTriggered,
        notificationsSent,
        timestamp: now.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing alerts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
