-- Enhanced Locall Database Schema
-- Compliance, Security, Advanced Call Management, User Management, Analytics, Notifications

-- =====================
-- COMPLIANCE & SECURITY
-- =====================

-- GDPR/CCPA Consent Management
CREATE TABLE consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('data_processing', 'marketing', 'analytics', 'cookies', 'call_recording')),
  granted boolean NOT NULL DEFAULT false,
  granted_at timestamptz DEFAULT now(),
  withdrawn_at timestamptz,
  ip_address inet,
  user_agent text,
  legal_basis text CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests')),
  purpose text NOT NULL,
  retention_period_days integer DEFAULT 365,
  created_at timestamptz DEFAULT now()
);

-- Data Export Requests (Right to Data Portability)
CREATE TABLE data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  requested_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  data_types text[] NOT NULL,
  export_url text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Data Deletion Requests (Right to be Forgotten)
CREATE TABLE data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  requested_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  deletion_type text CHECK (deletion_type IN ('partial', 'complete')),
  data_types text[],
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Comprehensive Audit Logging
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  workspace_id uuid REFERENCES workspaces(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now(),
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category text CHECK (category IN ('authentication', 'authorization', 'data_access', 'data_modification', 'system', 'compliance')),
  success boolean DEFAULT true,
  error_message text,
  session_id text,
  api_endpoint text,
  request_id text
);

-- Security Events
CREATE TABLE security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text CHECK (event_type IN ('failed_login', 'suspicious_activity', 'data_breach', 'unauthorized_access', 'privilege_escalation')),
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES users(id),
  ip_address inet NOT NULL,
  user_agent text,
  details jsonb,
  timestamp timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id)
);

-- Compliance Reports
CREATE TABLE compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text CHECK (report_type IN ('gdpr', 'ccpa', 'security', 'audit')),
  generated_at timestamptz DEFAULT now(),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  data jsonb NOT NULL,
  generated_by uuid REFERENCES users(id) NOT NULL
);

-- =====================
-- ADVANCED CALL MANAGEMENT
-- =====================

-- Call Queues
CREATE TABLE call_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  max_wait_time integer DEFAULT 300, -- seconds
  max_queue_size integer DEFAULT 50,
  priority integer DEFAULT 1,
  skill_requirements text[],
  announcement_url text,
  hold_music_url text,
  overflow_destination text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Call Agents
CREATE TABLE call_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  extension text NOT NULL,
  skills text[],
  status text DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'away', 'offline')),
  max_concurrent_calls integer DEFAULT 1,
  current_calls integer DEFAULT 0,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Queued Calls
CREATE TABLE queued_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text NOT NULL,
  queue_id uuid REFERENCES call_queues(id) ON DELETE CASCADE,
  caller_number text NOT NULL,
  priority integer DEFAULT 1,
  queued_at timestamptz DEFAULT now(),
  estimated_wait_time integer, -- seconds
  position integer
);

-- Conferences
CREATE TABLE conferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  host_user_id uuid REFERENCES users(id),
  pin text,
  max_participants integer DEFAULT 10,
  start_time timestamptz,
  end_time timestamptz,
  is_recording boolean DEFAULT false,
  recording_url text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended')),
  created_at timestamptz DEFAULT now()
);

-- Conference Participants
CREATE TABLE conference_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid REFERENCES conferences(id) ON DELETE CASCADE,
  call_sid text,
  phone_number text,
  user_id uuid REFERENCES users(id),
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_muted boolean DEFAULT false,
  is_host boolean DEFAULT false
);

-- IVR Menus
CREATE TABLE ivr_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  level integer DEFAULT 1,
  parent_id uuid REFERENCES ivr_menus(id),
  welcome_message text NOT NULL,
  timeout_message text,
  invalid_message text,
  timeout_seconds integer DEFAULT 5,
  max_retries integer DEFAULT 3,
  created_at timestamptz DEFAULT now()
);

-- IVR Options
CREATE TABLE ivr_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid REFERENCES ivr_menus(id) ON DELETE CASCADE,
  digit text NOT NULL,
  action_type text CHECK (action_type IN ('transfer', 'queue', 'submenu', 'hangup', 'voicemail', 'webhook')),
  action_value text NOT NULL,
  message text
);

-- Call Scripts
CREATE TABLE call_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  type text CHECK (type IN ('inbound', 'outbound', 'callback')),
  variables jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Call Script Steps
CREATE TABLE call_script_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES call_scripts(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  type text CHECK (type IN ('message', 'question', 'data_collection', 'condition', 'action')),
  content text NOT NULL,
  expected_response text CHECK (expected_response IN ('yes_no', 'text', 'number', 'option_select')),
  options text[],
  next_step_id uuid REFERENCES call_script_steps(id),
  condition text,
  action text
);

-- Call Transfers
CREATE TABLE call_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text NOT NULL,
  destination text NOT NULL,
  transferred_at timestamptz DEFAULT now(),
  type text CHECK (type IN ('extension', 'queue', 'external')),
  success boolean DEFAULT true
);

-- =====================
-- ENHANCED USER MANAGEMENT
-- =====================

-- User Roles
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '[]',
  is_system_role boolean DEFAULT false,
  workspace_id uuid REFERENCES workspaces(id),
  created_at timestamptz DEFAULT now()
);

-- User Role Assignments
CREATE TABLE user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES user_roles(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, workspace_id)
);

-- Teams
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  team_lead_id uuid REFERENCES users(id),
  permissions text[],
  created_at timestamptz DEFAULT now()
);

-- Team Members
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'lead', 'admin')),
  joined_at timestamptz DEFAULT now(),
  permissions text[],
  UNIQUE(team_id, user_id)
);

-- Two-Factor Authentication
CREATE TABLE two_factor_auth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  method text CHECK (method IN ('totp', 'sms', 'email')),
  secret text,
  phone_number text,
  email text,
  is_verified boolean DEFAULT false,
  backup_codes text[],
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- User Sessions
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  last_activity_at timestamptz DEFAULT now()
);

-- User Preferences
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  notifications jsonb DEFAULT '{"email": true, "sms": false, "push": true, "call_alerts": true, "form_alerts": true, "system_alerts": true}',
  dashboard_layout jsonb DEFAULT '{}',
  call_settings jsonb DEFAULT '{"auto_answer": false, "record_calls": true, "transcribe_calls": true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Activities
CREATE TABLE user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id),
  activity_type text CHECK (activity_type IN ('login', 'logout', 'data_access', 'data_modify', 'system_action')),
  description text NOT NULL,
  ip_address inet,
  user_agent text,
  timestamp timestamptz DEFAULT now(),
  session_id text
);

-- =====================
-- ANALYTICS & REPORTING
-- =====================

-- Custom Reports
CREATE TABLE custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id),
  metrics text[] NOT NULL,
  dimensions text[],
  filters jsonb DEFAULT '[]',
  time_range jsonb NOT NULL,
  visualization text DEFAULT 'table' CHECK (visualization IN ('table', 'line', 'bar', 'pie', 'area', 'scatter')),
  schedule jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Predictive Models
CREATE TABLE predictive_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text CHECK (type IN ('linear_regression', 'time_series', 'classification', 'clustering')),
  target_metric text NOT NULL,
  features text[] NOT NULL,
  training_data jsonb,
  model_params jsonb,
  accuracy decimal(5,4),
  last_trained timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Predictions
CREATE TABLE predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES predictive_models(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  prediction_date timestamptz NOT NULL,
  predicted_value decimal(15,2) NOT NULL,
  confidence decimal(5,4),
  actual_value decimal(15,2),
  created_at timestamptz DEFAULT now()
);

-- =====================
-- NOTIFICATION SYSTEM
-- =====================

-- Notification Templates
CREATE TABLE notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text CHECK (type IN ('email', 'sms', 'push', 'webhook')),
  subject text,
  content text NOT NULL,
  variables text[],
  workspace_id uuid REFERENCES workspaces(id),
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  workspace_id uuid REFERENCES workspaces(id),
  type text CHECK (type IN ('email', 'sms', 'push', 'webhook', 'in_app')),
  channel text NOT NULL,
  recipient text NOT NULL,
  subject text,
  content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  error_message text,
  metadata jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category text DEFAULT 'transactional' CHECK (category IN ('system', 'marketing', 'transactional', 'alert')),
  template_id uuid REFERENCES notification_templates(id),
  created_at timestamptz DEFAULT now()
);

-- Notification Rules
CREATE TABLE notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  trigger_event text NOT NULL,
  conditions jsonb DEFAULT '[]',
  actions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Notification Subscriptions
CREATE TABLE notification_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channels text[] NOT NULL,
  is_active boolean DEFAULT true,
  preferences jsonb DEFAULT '{"frequency": "immediate", "timezone": "UTC"}',
  UNIQUE(user_id, workspace_id, event_type)
);

-- Push Devices
CREATE TABLE push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  device_token text UNIQUE NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  app_version text,
  is_active boolean DEFAULT true,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Scheduled Notifications
CREATE TABLE scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action jsonb NOT NULL,
  event_data jsonb NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- =====================
-- SMS MESSAGES (for analytics)
-- =====================

CREATE TABLE sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  to_number text NOT NULL,
  from_number text NOT NULL,
  message text NOT NULL,
  segments integer DEFAULT 1,
  status text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  error_message text
);

-- =====================
-- INDEXES FOR PERFORMANCE
-- =====================

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);

-- Security events indexes
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);

-- Calls indexes (for analytics)
CREATE INDEX idx_calls_workspace_started_at ON calls(workspace_id, started_at);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_direction ON calls(direction);

-- Form submissions indexes
CREATE INDEX idx_form_submissions_workspace_submitted_at ON form_submissions(workspace_id, submitted_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- =====================
-- FUNCTIONS FOR ANALYTICS
-- =====================

-- Function to get average call duration for a queue
CREATE OR REPLACE FUNCTION get_average_call_duration(queue_id uuid)
RETURNS integer AS $$
DECLARE
  avg_duration integer;
BEGIN
  SELECT COALESCE(AVG(duration), 300)::integer
  INTO avg_duration
  FROM calls c
  JOIN queued_calls qc ON c.twilio_sid = qc.call_sid
  WHERE qc.queue_id = $1
    AND c.status = 'completed'
    AND c.started_at > NOW() - INTERVAL '30 days';
  
  RETURN avg_duration;
END;
$$ LANGUAGE plpgsql;

-- Function to get agent call statistics
CREATE OR REPLACE FUNCTION get_agent_call_stats(
  agent_id uuid,
  start_date timestamptz,
  end_date timestamptz
)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_calls', COUNT(*),
    'completed_calls', COUNT(*) FILTER (WHERE status = 'completed'),
    'avg_duration', COALESCE(AVG(duration), 0),
    'total_duration', COALESCE(SUM(duration), 0)
  )
  INTO stats
  FROM calls c
  JOIN call_agents ca ON ca.extension = c.to_number
  WHERE ca.id = agent_id
    AND c.started_at BETWEEN start_date AND end_date;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue statistics
CREATE OR REPLACE FUNCTION get_queue_stats(queue_id uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'current_queue_size', COUNT(*) FILTER (WHERE qc.id IS NOT NULL),
    'avg_wait_time', COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - qc.queued_at))), 0),
    'max_wait_time', COALESCE(MAX(EXTRACT(EPOCH FROM (NOW() - qc.queued_at))), 0)
  )
  INTO stats
  FROM call_queues cq
  LEFT JOIN queued_calls qc ON qc.queue_id = cq.id
  WHERE cq.id = queue_id;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- ROW LEVEL SECURITY (RLS)
-- =====================

-- Enable RLS on all tables
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE call_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE queued_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivr_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivr_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_script_steps ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_devices ENABLE ROW LEVEL SECURITY;

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (example for workspace-based access)
CREATE POLICY "Users can access their own data" ON consent_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Workspace members can access workspace data" ON call_queues
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Additional policies would be created for each table based on access requirements
