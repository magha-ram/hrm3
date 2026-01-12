import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ModuleMetrics {
  name: string;
  displayName: string;
  icon: string;
  status: 'healthy' | 'warning' | 'critical';
  isEnabled: boolean;
  metrics: {
    totalCapacity: string | null;
    used: string | null;
    remaining: string | null;
    usagePercent: number | null;
    errorRate: number | null;
    latencyMs: number | null;
    failures1h: number;
    failures24h: number;
    upgradeRecommended: boolean;
    lastIncident: string | null;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string | null;
}

interface MatrixResponse {
  modules: ModuleMetrics[];
  summary: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
  lastUpdated: string;
  alerts: {
    active: number;
    unacknowledged: number;
  };
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

    // Verify platform admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if platform admin
    const { data: isPlatformAdmin } = await supabaseAdmin.rpc('is_platform_admin', { _user_id: user.id });
    if (!isPlatformAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Platform admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get monitoring config
    const { data: monitoringConfig } = await supabaseAdmin
      .from('monitoring_config')
      .select('*')
      .order('sort_order');

    // Get latest metrics for each module (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentMetrics } = await supabaseAdmin
      .from('system_metrics')
      .select('*')
      .gte('collected_at', oneDayAgo)
      .order('collected_at', { ascending: false });

    // Get active alerts
    const { data: activeAlerts, count: activeAlertCount } = await supabaseAdmin
      .from('alert_history')
      .select('*', { count: 'exact' })
      .eq('is_resolved', false);

    const unacknowledgedCount = activeAlerts?.filter(a => !a.is_acknowledged).length || 0;

    // Aggregate metrics per module
    const moduleMetricsMap = new Map<string, any[]>();
    recentMetrics?.forEach(metric => {
      if (!moduleMetricsMap.has(metric.module)) {
        moduleMetricsMap.set(metric.module, []);
      }
      moduleMetricsMap.get(metric.module)!.push(metric);
    });

    // Build module data
    const modules: ModuleMetrics[] = (monitoringConfig || []).map(config => {
      const moduleMetrics = moduleMetricsMap.get(config.module) || [];
      const latestByMetric = new Map<string, any>();
      
      // Get latest value for each metric
      moduleMetrics.forEach(m => {
        if (!latestByMetric.has(m.metric_name)) {
          latestByMetric.set(m.metric_name, m);
        }
      });

      // Determine status from latest metrics
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let worstStatus = 0; // 0 = healthy, 1 = warning, 2 = critical
      
      latestByMetric.forEach(m => {
        if (m.status === 'critical' && worstStatus < 2) worstStatus = 2;
        else if (m.status === 'warning' && worstStatus < 1) worstStatus = 1;
      });
      
      if (worstStatus === 2) status = 'critical';
      else if (worstStatus === 1) status = 'warning';

      // Get module-specific "used" value
      const getUsedValue = (moduleName: string): number | null => {
        switch(moduleName) {
          case 'database': 
            return latestByMetric.get('operations_1h')?.metric_value ?? 
                   latestByMetric.get('query_count_1h')?.metric_value ?? null;
          case 'backend': 
            return latestByMetric.get('request_count_1h')?.metric_value ?? 
                   latestByMetric.get('invocations_1h')?.metric_value ?? null;
          case 'email': 
            return latestByMetric.get('sent_count_1h')?.metric_value ?? 
                   latestByMetric.get('emails_sent')?.metric_value ?? null;
          case 'auth': 
            return latestByMetric.get('login_success_1h')?.metric_value ?? 
                   latestByMetric.get('active_sessions')?.metric_value ?? null;
          case 'users': 
            return latestByMetric.get('active_users_24h')?.metric_value ?? 
                   latestByMetric.get('total_users')?.metric_value ?? null;
          case 'storage': 
            return latestByMetric.get('file_count')?.metric_value ?? 
                   latestByMetric.get('storage_used')?.metric_value ?? null;
          case 'logs': 
            return latestByMetric.get('total_logs_1h')?.metric_value ?? null;
          case 'notifications': 
            return latestByMetric.get('sent_count_1h')?.metric_value ?? null;
          case 'cron': 
            return latestByMetric.get('runs_last_hour')?.metric_value ?? null;
          case 'integrations': 
            return latestByMetric.get('active_webhooks')?.metric_value ?? null;
          default: 
            return null;
        }
      };

      // Get module-specific error rate
      const getErrorRate = (moduleName: string): number | null => {
        switch(moduleName) {
          case 'backend': 
            return latestByMetric.get('error_rate')?.metric_value ?? 
                   latestByMetric.get('error_rate_5xx')?.metric_value ?? null;
          case 'auth': 
            return latestByMetric.get('login_failure_rate')?.metric_value ?? null;
          case 'email': {
            const rate = latestByMetric.get('delivery_rate')?.metric_value;
            return rate !== undefined && rate !== null ? Math.round((100 - rate) * 100) / 100 : null;
          }
          case 'integrations': {
            const rate = latestByMetric.get('webhook_success_rate')?.metric_value;
            return rate !== undefined && rate !== null ? Math.round((100 - rate) * 100) / 100 : null;
          }
          case 'cron': {
            const rate = latestByMetric.get('success_rate')?.metric_value;
            return rate !== undefined && rate !== null ? Math.round((100 - rate) * 100) / 100 : null;
          }
          case 'database':
            return latestByMetric.get('error_rate')?.metric_value ?? null;
          default: 
            return null;
        }
      };

      // Get latency for applicable modules
      const getLatency = (moduleName: string): number | null => {
        if (moduleName === 'backend') {
          return latestByMetric.get('latency_avg')?.metric_value ?? 
                 latestByMetric.get('latency_p95')?.metric_value ?? null;
        }
        if (moduleName === 'database') {
          return latestByMetric.get('avg_query_time')?.metric_value ?? null;
        }
        return null;
      };

      // Get usage percent for applicable modules
      const getUsagePercent = (moduleName: string): number | null => {
        const directUsage = latestByMetric.get('usage_percent')?.metric_value;
        if (directUsage !== undefined && directUsage !== null) return directUsage;
        
        // For modules with success rates, show that as a "health" percentage
        if (moduleName === 'cron' || moduleName === 'integrations') {
          return latestByMetric.get('success_rate')?.metric_value ?? 
                 latestByMetric.get('webhook_success_rate')?.metric_value ?? null;
        }
        if (moduleName === 'email') {
          return latestByMetric.get('delivery_rate')?.metric_value ?? null;
        }
        return null;
      };

      const usedValue = getUsedValue(config.module);
      const errorRateValue = getErrorRate(config.module);
      const latencyValue = getLatency(config.module);
      const usagePercent = getUsagePercent(config.module);
      
      // Count failures in last 1h and 24h
      const failureMetricNames = ['error', 'failure', 'failed', 'error_count', 'failures'];
      const failures1h = moduleMetrics
        .filter(m => failureMetricNames.some(name => m.metric_name.includes(name)))
        .filter(m => new Date(m.collected_at) >= new Date(oneHourAgo))
        .reduce((sum, m) => sum + (m.metric_value || 0), 0);
      
      const failures24h = moduleMetrics
        .filter(m => failureMetricNames.some(name => m.metric_name.includes(name)))
        .reduce((sum, m) => sum + (m.metric_value || 0), 0);

      // Find last incident
      const moduleAlerts = activeAlerts?.filter(a => a.module === config.module) || [];
      const lastIncident = moduleAlerts.length > 0 
        ? moduleAlerts.sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())[0]?.triggered_at
        : null;

      // Determine trend (compare current to average)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (moduleMetrics.length > 1) {
        const errorMetrics = moduleMetrics.filter(m => m.metric_name.includes('error'));
        if (errorMetrics.length > 1) {
          const latest = errorMetrics[0]?.metric_value || 0;
          const avg = errorMetrics.slice(1).reduce((s, m) => s + m.metric_value, 0) / (errorMetrics.length - 1);
          if (latest > avg * 1.1) trend = 'up';
          else if (latest < avg * 0.9) trend = 'down';
        }
      }

      // Format capacity
      const formatBytes = (bytes: number | null): string | null => {
        if (bytes === null || bytes === undefined) return null;
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${bytes}B`;
      };

      const totalCapacity = config.capacity_total;

      // Format used value based on module type
      const formatUsedValue = (): string | null => {
        if (usedValue === null || usedValue === undefined) return null;
        if (config.capacity_unit === 'bytes') return formatBytes(usedValue);
        
        // Add appropriate suffix based on module
        switch(config.module) {
          case 'database': return `${usedValue} ops`;
          case 'backend': return `${usedValue} reqs`;
          case 'email': return `${usedValue} sent`;
          case 'auth': return `${usedValue} sessions`;
          case 'users': return `${usedValue} active`;
          case 'storage': return `${usedValue} files`;
          case 'logs': return `${usedValue} entries`;
          case 'notifications': return `${usedValue} sent`;
          case 'cron': return `${usedValue} runs`;
          case 'integrations': return `${usedValue} hooks`;
          default: return `${usedValue}`;
        }
      };

      return {
        name: config.module,
        displayName: config.display_name,
        icon: config.icon || 'Activity',
        status: config.is_enabled ? status : 'healthy',
        isEnabled: config.is_enabled,
        metrics: {
          totalCapacity: totalCapacity ? formatBytes(totalCapacity) : null,
          used: formatUsedValue(),
          remaining: (totalCapacity && usedValue) ? formatBytes(totalCapacity - usedValue) : null,
          usagePercent: usagePercent ?? null,
          errorRate: errorRateValue,
          latencyMs: latencyValue,
          failures1h: Math.round(failures1h),
          failures24h: Math.round(failures24h),
          upgradeRecommended: (usagePercent !== null && usagePercent > 80) || status === 'critical',
          lastIncident,
        },
        trend,
        lastUpdated: moduleMetrics[0]?.collected_at || null,
      };
    });

    // Calculate summary
    const summary = {
      healthy: modules.filter(m => m.status === 'healthy').length,
      warning: modules.filter(m => m.status === 'warning').length,
      critical: modules.filter(m => m.status === 'critical').length,
      total: modules.length,
    };

    const response: MatrixResponse = {
      modules,
      summary,
      lastUpdated: new Date().toISOString(),
      alerts: {
        active: activeAlertCount || 0,
        unacknowledged: unacknowledgedCount,
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching matrix data:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
