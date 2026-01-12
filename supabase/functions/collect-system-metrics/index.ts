import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MetricEntry {
  module: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  status: 'healthy' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

function determineStatus(value: number, warningThreshold: number, criticalThreshold: number, higherIsBad = true): 'healthy' | 'warning' | 'critical' {
  if (higherIsBad) {
    if (value >= criticalThreshold) return 'critical';
    if (value >= warningThreshold) return 'warning';
    return 'healthy';
  } else {
    if (value <= criticalThreshold) return 'critical';
    if (value <= warningThreshold) return 'warning';
    return 'healthy';
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

    const metrics: MetricEntry[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get enabled modules
    const { data: enabledModules } = await supabaseAdmin
      .from('monitoring_config')
      .select('module')
      .eq('is_enabled', true);

    const enabledModuleSet = new Set(enabledModules?.map(m => m.module) || []);

    // ==========================================
    // DATABASE METRICS
    // ==========================================
    if (enabledModuleSet.has('database')) {
      // Count audit logs as proxy for DB activity
      const { count: auditCount1h } = await supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      metrics.push({
        module: 'database',
        metric_name: 'operations_1h',
        metric_value: auditCount1h || 0,
        metric_unit: 'count',
        status: 'healthy',
      });

      // Count errors in application logs related to database
      const { data: dbErrors } = await supabaseAdmin
        .from('application_logs')
        .select('id')
        .eq('level', 'error')
        .ilike('message', '%database%')
        .gte('created_at', oneHourAgo);

      metrics.push({
        module: 'database',
        metric_name: 'error_count_1h',
        metric_value: dbErrors?.length || 0,
        metric_unit: 'count',
        status: determineStatus(dbErrors?.length || 0, 5, 20),
      });
    }

    // ==========================================
    // BACKEND API METRICS
    // ==========================================
    if (enabledModuleSet.has('backend')) {
      // Count edge function invocations from application logs
      const { data: apiLogs } = await supabaseAdmin
        .from('application_logs')
        .select('level, duration_ms')
        .eq('service', 'edge-function')
        .gte('created_at', oneHourAgo);

      const totalRequests = apiLogs?.length || 0;
      const errorRequests = apiLogs?.filter(l => l.level === 'error').length || 0;
      const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
      
      const latencies = apiLogs?.filter(l => l.duration_ms).map(l => l.duration_ms) || [];
      const avgLatency = latencies.length > 0 
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
        : 0;
      const p95Latency = latencies.length > 0
        ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] || 0
        : 0;

      metrics.push({
        module: 'backend',
        metric_name: 'request_count_1h',
        metric_value: totalRequests,
        metric_unit: 'count',
        status: 'healthy',
      });

      metrics.push({
        module: 'backend',
        metric_name: 'error_rate',
        metric_value: parseFloat(errorRate.toFixed(2)),
        metric_unit: 'percent',
        status: determineStatus(errorRate, 2, 5),
      });

      metrics.push({
        module: 'backend',
        metric_name: 'latency_avg',
        metric_value: Math.round(avgLatency),
        metric_unit: 'ms',
        status: determineStatus(avgLatency, 500, 2000),
      });

      metrics.push({
        module: 'backend',
        metric_name: 'latency_p95',
        metric_value: Math.round(p95Latency),
        metric_unit: 'ms',
        status: determineStatus(p95Latency, 1000, 3000),
      });
    }

    // ==========================================
    // EMAIL METRICS
    // ==========================================
    if (enabledModuleSet.has('email')) {
      const { data: emailLogs1h } = await supabaseAdmin
        .from('email_logs')
        .select('status')
        .gte('created_at', oneHourAgo);

      const sentCount = emailLogs1h?.filter(e => e.status === 'sent' || e.status === 'delivered').length || 0;
      const failedCount = emailLogs1h?.filter(e => e.status === 'failed').length || 0;
      const totalEmails = sentCount + failedCount;
      const deliveryRate = totalEmails > 0 ? (sentCount / totalEmails) * 100 : 100;

      metrics.push({
        module: 'email',
        metric_name: 'sent_count_1h',
        metric_value: sentCount,
        metric_unit: 'count',
        status: 'healthy',
      });

      metrics.push({
        module: 'email',
        metric_name: 'failed_count_1h',
        metric_value: failedCount,
        metric_unit: 'count',
        status: determineStatus(failedCount, 5, 10),
      });

      metrics.push({
        module: 'email',
        metric_name: 'delivery_rate',
        metric_value: parseFloat(deliveryRate.toFixed(2)),
        metric_unit: 'percent',
        status: determineStatus(deliveryRate, 95, 90, false),
      });

      // Queue size (pending emails)
      const { count: queueSize } = await supabaseAdmin
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      metrics.push({
        module: 'email',
        metric_name: 'queue_size',
        metric_value: queueSize || 0,
        metric_unit: 'count',
        status: determineStatus(queueSize || 0, 50, 200),
      });
    }

    // ==========================================
    // AUTHENTICATION METRICS
    // ==========================================
    if (enabledModuleSet.has('auth')) {
      const { data: securityEvents1h } = await supabaseAdmin
        .from('security_events')
        .select('event_type, severity')
        .gte('created_at', oneHourAgo);

      const loginSuccess = securityEvents1h?.filter(e => e.event_type === 'login_success').length || 0;
      const loginFailure = securityEvents1h?.filter(e => e.event_type === 'login_failure').length || 0;
      const totalLogins = loginSuccess + loginFailure;
      const loginFailureRate = totalLogins > 0 ? (loginFailure / totalLogins) * 100 : 0;

      metrics.push({
        module: 'auth',
        metric_name: 'login_success_1h',
        metric_value: loginSuccess,
        metric_unit: 'count',
        status: 'healthy',
      });

      metrics.push({
        module: 'auth',
        metric_name: 'login_failure_1h',
        metric_value: loginFailure,
        metric_unit: 'count',
        status: determineStatus(loginFailure, 10, 20),
      });

      metrics.push({
        module: 'auth',
        metric_name: 'login_failure_rate',
        metric_value: parseFloat(loginFailureRate.toFixed(2)),
        metric_unit: 'percent',
        status: determineStatus(loginFailureRate, 10, 25),
      });

      // Suspicious events
      const suspiciousEvents = securityEvents1h?.filter(e => 
        e.severity === 'high' || e.event_type.includes('suspicious')
      ).length || 0;

      metrics.push({
        module: 'auth',
        metric_name: 'suspicious_events_1h',
        metric_value: suspiciousEvents,
        metric_unit: 'count',
        status: determineStatus(suspiciousEvents, 3, 10),
      });
    }

    // ==========================================
    // USER INTERACTIONS METRICS
    // ==========================================
    if (enabledModuleSet.has('users')) {
      // Active users (unique users with audit logs today)
      const { data: activeUsersData } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id')
        .gte('created_at', oneDayAgo)
        .not('user_id', 'is', null);

      const uniqueUsers = new Set(activeUsersData?.map(a => a.user_id)).size;

      metrics.push({
        module: 'users',
        metric_name: 'active_users_24h',
        metric_value: uniqueUsers,
        metric_unit: 'count',
        status: 'healthy',
      });

      // High-risk actions
      const { count: highRiskCount } = await supabaseAdmin
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'high')
        .gte('created_at', oneHourAgo);

      metrics.push({
        module: 'users',
        metric_name: 'high_risk_actions_1h',
        metric_value: highRiskCount || 0,
        metric_unit: 'count',
        status: determineStatus(highRiskCount || 0, 5, 15),
      });
    }

    // ==========================================
    // SECURITY METRICS
    // ==========================================
    if (enabledModuleSet.has('security')) {
      const { data: securityEvents24h } = await supabaseAdmin
        .from('security_events')
        .select('severity, event_type')
        .gte('created_at', oneDayAgo);

      const criticalEvents = securityEvents24h?.filter(e => e.severity === 'critical').length || 0;
      const highEvents = securityEvents24h?.filter(e => e.severity === 'high').length || 0;

      metrics.push({
        module: 'security',
        metric_name: 'critical_events_24h',
        metric_value: criticalEvents,
        metric_unit: 'count',
        status: determineStatus(criticalEvents, 1, 5),
      });

      metrics.push({
        module: 'security',
        metric_name: 'high_severity_events_24h',
        metric_value: highEvents,
        metric_unit: 'count',
        status: determineStatus(highEvents, 5, 15),
      });

      // Password changes / MFA events
      const mfaEvents = securityEvents24h?.filter(e => 
        e.event_type.includes('mfa') || e.event_type.includes('2fa')
      ).length || 0;

      metrics.push({
        module: 'security',
        metric_name: 'mfa_events_24h',
        metric_value: mfaEvents,
        metric_unit: 'count',
        status: 'healthy',
      });
    }

    // ==========================================
    // LOGS & ERROR TRACKING METRICS
    // ==========================================
    if (enabledModuleSet.has('logs')) {
      const { data: appLogs1h } = await supabaseAdmin
        .from('application_logs')
        .select('level')
        .gte('created_at', oneHourAgo);

      const errorLogs = appLogs1h?.filter(l => l.level === 'error').length || 0;
      const warnLogs = appLogs1h?.filter(l => l.level === 'warn').length || 0;
      const totalLogs = appLogs1h?.length || 0;

      metrics.push({
        module: 'logs',
        metric_name: 'total_logs_1h',
        metric_value: totalLogs,
        metric_unit: 'count',
        status: 'healthy',
      });

      metrics.push({
        module: 'logs',
        metric_name: 'error_logs_1h',
        metric_value: errorLogs,
        metric_unit: 'count',
        status: determineStatus(errorLogs, 10, 50),
      });

      metrics.push({
        module: 'logs',
        metric_name: 'warn_logs_1h',
        metric_value: warnLogs,
        metric_unit: 'count',
        status: determineStatus(warnLogs, 20, 100),
      });
    }

    // ==========================================
    // NOTIFICATIONS METRICS
    // ==========================================
    if (enabledModuleSet.has('notifications')) {
      const { data: notifications1h } = await supabaseAdmin
        .from('notifications')
        .select('is_read')
        .gte('created_at', oneHourAgo);

      metrics.push({
        module: 'notifications',
        metric_name: 'sent_count_1h',
        metric_value: notifications1h?.length || 0,
        metric_unit: 'count',
        status: 'healthy',
      });

      const unreadCount = notifications1h?.filter(n => !n.is_read).length || 0;
      metrics.push({
        module: 'notifications',
        metric_name: 'unread_count_1h',
        metric_value: unreadCount,
        metric_unit: 'count',
        status: 'healthy',
      });
    }

    // ==========================================
    // INTEGRATIONS METRICS
    // ==========================================
    if (enabledModuleSet.has('integrations')) {
      // Check webhook failures
      const { data: webhookLogs } = await supabaseAdmin
        .from('application_logs')
        .select('level')
        .ilike('service', '%webhook%')
        .gte('created_at', oneDayAgo);

      const webhookErrors = webhookLogs?.filter(l => l.level === 'error').length || 0;
      const webhookTotal = webhookLogs?.length || 0;
      const webhookSuccessRate = webhookTotal > 0 
        ? ((webhookTotal - webhookErrors) / webhookTotal) * 100 
        : 100;

      metrics.push({
        module: 'integrations',
        metric_name: 'webhook_success_rate',
        metric_value: parseFloat(webhookSuccessRate.toFixed(2)),
        metric_unit: 'percent',
        status: determineStatus(webhookSuccessRate, 95, 80, false),
      });

      metrics.push({
        module: 'integrations',
        metric_name: 'webhook_errors_24h',
        metric_value: webhookErrors,
        metric_unit: 'count',
        status: determineStatus(webhookErrors, 5, 20),
      });
    }

    // ==========================================
    // CRON JOBS METRICS
    // ==========================================
    if (enabledModuleSet.has('cron')) {
      // Check cron-related logs
      const { data: cronLogs } = await supabaseAdmin
        .from('application_logs')
        .select('level, service')
        .ilike('service', '%cron%')
        .gte('created_at', oneDayAgo);

      const cronErrors = cronLogs?.filter(l => l.level === 'error').length || 0;
      const cronTotal = cronLogs?.length || 0;
      const cronSuccessRate = cronTotal > 0 
        ? ((cronTotal - cronErrors) / cronTotal) * 100 
        : 100;

      metrics.push({
        module: 'cron',
        metric_name: 'success_rate',
        metric_value: parseFloat(cronSuccessRate.toFixed(2)),
        metric_unit: 'percent',
        status: determineStatus(cronSuccessRate, 95, 80, false),
      });

      metrics.push({
        module: 'cron',
        metric_name: 'executions_24h',
        metric_value: cronTotal,
        metric_unit: 'count',
        status: 'healthy',
      });

      metrics.push({
        module: 'cron',
        metric_name: 'failures_24h',
        metric_value: cronErrors,
        metric_unit: 'count',
        status: determineStatus(cronErrors, 3, 10),
      });
    }

    // ==========================================
    // STORAGE METRICS
    // ==========================================
    if (enabledModuleSet.has('storage')) {
      // Count documents as proxy for storage usage
      const { count: documentCount } = await supabaseAdmin
        .from('employee_documents')
        .select('*', { count: 'exact', head: true });

      metrics.push({
        module: 'storage',
        metric_name: 'file_count',
        metric_value: documentCount || 0,
        metric_unit: 'count',
        status: 'healthy',
      });
    }

    // ==========================================
    // INSERT ALL METRICS
    // ==========================================
    if (metrics.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('system_metrics')
        .insert(metrics.map(m => ({
          ...m,
          collected_at: now.toISOString(),
        })));

      if (insertError) {
        console.error("Error inserting metrics:", insertError);
        throw insertError;
      }
    }

    // Clean up old metrics (older than retention period)
    const { data: retentionConfigs } = await supabaseAdmin
      .from('monitoring_config')
      .select('module, retention_days');

    for (const config of retentionConfigs || []) {
      const cutoffDate = new Date(now.getTime() - config.retention_days * 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin
        .from('system_metrics')
        .delete()
        .eq('module', config.module)
        .lt('collected_at', cutoffDate);
    }

    console.log(`Collected ${metrics.length} metrics`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        metricsCollected: metrics.length,
        timestamp: now.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error collecting metrics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
