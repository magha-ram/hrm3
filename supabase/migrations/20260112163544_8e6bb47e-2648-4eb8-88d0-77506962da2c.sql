-- =====================================================
-- Admin System Matrix & Observability Dashboard Schema
-- =====================================================

-- 1. System Metrics Table - Stores collected metrics for all modules
CREATE TABLE public.system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL, -- 'database', 'backend', 'frontend', 'auth', 'email', 'users', 'integrations', 'cron', 'storage', 'logs', 'security'
  metric_name text NOT NULL, -- 'storage_used', 'api_latency', 'error_rate', etc.
  metric_value numeric NOT NULL,
  metric_unit text, -- 'bytes', 'ms', 'percent', 'count'
  status text DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
  metadata jsonb DEFAULT '{}',
  collected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient querying by module and time
CREATE INDEX idx_system_metrics_module_collected ON public.system_metrics(module, collected_at DESC);
CREATE INDEX idx_system_metrics_collected_at ON public.system_metrics(collected_at DESC);

-- 2. Alert Rules Table - Configurable alert thresholds
CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  module text NOT NULL,
  metric_name text NOT NULL,
  condition text NOT NULL CHECK (condition IN ('greater_than', 'less_than', 'equals', 'greater_than_or_equal', 'less_than_or_equal')),
  threshold numeric NOT NULL,
  severity text DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  notification_channels jsonb DEFAULT '["in_app"]', -- ['in_app', 'email']
  is_active boolean DEFAULT true,
  cooldown_minutes integer DEFAULT 60,
  last_triggered_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_alert_rules_module ON public.alert_rules(module);
CREATE INDEX idx_alert_rules_active ON public.alert_rules(is_active) WHERE is_active = true;

-- 3. Alert History Table - Log of triggered alerts
CREATE TABLE public.alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  module text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  threshold numeric NOT NULL,
  condition text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message text,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  is_resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  metadata jsonb DEFAULT '{}',
  triggered_at timestamptz DEFAULT now()
);

CREATE INDEX idx_alert_history_triggered_at ON public.alert_history(triggered_at DESC);
CREATE INDEX idx_alert_history_unresolved ON public.alert_history(is_resolved, triggered_at DESC) WHERE is_resolved = false;
CREATE INDEX idx_alert_history_module ON public.alert_history(module, triggered_at DESC);

-- 4. Report Schedules Table - Scheduled email reports configuration
CREATE TABLE public.report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  schedule_type text DEFAULT 'daily' CHECK (schedule_type IN ('daily', 'weekly', 'monthly')),
  schedule_times jsonb DEFAULT '["09:00", "14:00", "18:00"]', -- Peak times in UTC
  day_of_week integer, -- 0-6 for weekly (0 = Sunday)
  day_of_month integer, -- 1-31 for monthly
  timezone text DEFAULT 'UTC',
  recipients jsonb NOT NULL DEFAULT '[]', -- Array of email addresses
  is_active boolean DEFAULT true,
  include_modules jsonb DEFAULT '["database", "backend", "frontend", "auth", "email", "users", "integrations", "cron", "storage", "logs", "security"]',
  include_alerts boolean DEFAULT true,
  include_recommendations boolean DEFAULT true,
  last_sent_at timestamptz,
  next_run_at timestamptz,
  report_config jsonb DEFAULT '{}', -- Additional configuration
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_report_schedules_active ON public.report_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_report_schedules_next_run ON public.report_schedules(next_run_at) WHERE is_active = true;

-- 5. Monitoring Config Table - Per-module monitoring settings
CREATE TABLE public.monitoring_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text UNIQUE NOT NULL,
  display_name text NOT NULL,
  icon text, -- Icon name for UI
  is_enabled boolean DEFAULT true,
  collection_interval_seconds integer DEFAULT 300, -- 5 minutes default
  retention_days integer DEFAULT 30,
  capacity_total numeric, -- For modules with quotas
  capacity_unit text, -- 'bytes', 'count', etc.
  settings jsonb DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Report History Table - Track sent reports
CREATE TABLE public.report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.report_schedules(id) ON DELETE SET NULL,
  report_type text NOT NULL,
  recipients jsonb NOT NULL,
  subject text NOT NULL,
  content_summary jsonb, -- Summary of what was included
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'partial')),
  error_message text,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX idx_report_history_sent_at ON public.report_history(sent_at DESC);

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Platform Admin Only Access
-- =====================================================

-- System Metrics Policies
CREATE POLICY "Platform admins can view system metrics"
  ON public.system_metrics FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Service role can insert system metrics"
  ON public.system_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Platform admins can delete old metrics"
  ON public.system_metrics FOR DELETE
  USING (public.is_platform_admin(auth.uid()));

-- Alert Rules Policies
CREATE POLICY "Platform admins can view alert rules"
  ON public.alert_rules FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage alert rules"
  ON public.alert_rules FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Alert History Policies
CREATE POLICY "Platform admins can view alert history"
  ON public.alert_history FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage alert history"
  ON public.alert_history FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Service role can insert alert history"
  ON public.alert_history FOR INSERT
  WITH CHECK (true);

-- Report Schedules Policies
CREATE POLICY "Platform admins can view report schedules"
  ON public.report_schedules FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage report schedules"
  ON public.report_schedules FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Monitoring Config Policies
CREATE POLICY "Platform admins can view monitoring config"
  ON public.monitoring_config FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage monitoring config"
  ON public.monitoring_config FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Report History Policies
CREATE POLICY "Platform admins can view report history"
  ON public.report_history FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Service role can insert report history"
  ON public.report_history FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Seed Default Monitoring Config
-- =====================================================

INSERT INTO public.monitoring_config (module, display_name, icon, is_enabled, collection_interval_seconds, sort_order) VALUES
  ('database', 'Database', 'Database', true, 300, 1),
  ('backend', 'Backend APIs', 'Server', true, 60, 2),
  ('frontend', 'Frontend Application', 'Monitor', true, 300, 3),
  ('auth', 'Authentication & Authorization', 'Shield', true, 60, 4),
  ('email', 'Email Service', 'Mail', true, 300, 5),
  ('notifications', 'Notification System', 'Bell', true, 300, 6),
  ('users', 'User Interactions', 'Users', true, 300, 7),
  ('integrations', 'Platform Integrations', 'Plug', true, 300, 8),
  ('cron', 'Background Jobs / Cron Tasks', 'Clock', true, 300, 9),
  ('storage', 'File Storage', 'HardDrive', true, 300, 10),
  ('logs', 'Logs & Error Tracking', 'FileText', true, 300, 11),
  ('security', 'Security & Access Control', 'Lock', true, 60, 12);

-- =====================================================
-- Seed Default Alert Rules
-- =====================================================

INSERT INTO public.alert_rules (name, description, module, metric_name, condition, threshold, severity, notification_channels, cooldown_minutes) VALUES
  ('Database Usage Warning', 'Alert when database storage exceeds 80%', 'database', 'usage_percent', 'greater_than', 80, 'warning', '["in_app", "email"]', 60),
  ('Database Usage Critical', 'Alert when database storage exceeds 95%', 'database', 'usage_percent', 'greater_than', 95, 'critical', '["in_app", "email"]', 30),
  ('API Error Rate High', 'Alert when API 5xx error rate exceeds 5%', 'backend', 'error_rate_5xx', 'greater_than', 5, 'critical', '["in_app", "email"]', 15),
  ('API Latency High', 'Alert when API P95 latency exceeds 2000ms', 'backend', 'latency_p95', 'greater_than', 2000, 'warning', '["in_app"]', 30),
  ('Email Failures Spike', 'Alert when email failures exceed 10 in 10 minutes', 'email', 'failed_count_10m', 'greater_than', 10, 'critical', '["in_app", "email"]', 15),
  ('Login Failures Spike', 'Alert when login failures exceed 20 in 1 hour', 'auth', 'login_failures_1h', 'greater_than', 20, 'warning', '["in_app", "email"]', 60),
  ('Suspicious Activity', 'Alert when suspicious security events exceed 5 in 1 hour', 'security', 'suspicious_events_1h', 'greater_than', 5, 'critical', '["in_app", "email"]', 30),
  ('Storage Usage Warning', 'Alert when file storage exceeds 80%', 'storage', 'usage_percent', 'greater_than', 80, 'warning', '["in_app"]', 120),
  ('Cron Job Failures', 'Alert when cron job failure rate exceeds 10%', 'cron', 'failure_rate', 'greater_than', 10, 'warning', '["in_app", "email"]', 60);

-- =====================================================
-- Create updated_at trigger function if not exists
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_monitoring_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_monitoring_updated_at();

CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_monitoring_updated_at();

CREATE TRIGGER update_monitoring_config_updated_at
  BEFORE UPDATE ON public.monitoring_config
  FOR EACH ROW EXECUTE FUNCTION public.update_monitoring_updated_at();