-- Compliance and Data Retention Schema
-- Add these tables to your Supabase database

-- Compliance settings table
CREATE TABLE IF NOT EXISTS compliance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  gdpr_enabled BOOLEAN DEFAULT true,
  call_recording_consent BOOLEAN DEFAULT true,
  data_processing_notice BOOLEAN DEFAULT true,
  export_requests_enabled BOOLEAN DEFAULT true,
  deletion_requests_enabled BOOLEAN DEFAULT true,
  audit_log_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id)
);

-- Data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('calls', 'recordings', 'transcripts', 'form_submissions', 'analytics')),
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  auto_delete BOOLEAN DEFAULT true,
  legal_hold BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, data_type)
);

-- Data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data_types TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Can be 'system' for automated actions
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_created ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_data_export_workspace ON data_export_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_data_export_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_retention_policies_workspace ON data_retention_policies(workspace_id);

-- Row Level Security policies
ALTER TABLE compliance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view compliance settings for their workspace" ON compliance_settings
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update compliance settings for their workspace" ON compliance_settings
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view retention policies for their workspace" ON data_retention_policies
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can manage retention policies for their workspace" ON data_retention_policies
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view export requests for their workspace" ON data_export_requests
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create export requests for their workspace" ON data_export_requests
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view audit logs for their workspace" ON audit_logs
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Function to automatically cleanup expired data (run as cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  policy_record RECORD;
  cutoff_date TIMESTAMP;
  deleted_count INTEGER;
BEGIN
  -- Loop through all active retention policies
  FOR policy_record IN 
    SELECT * FROM data_retention_policies 
    WHERE auto_delete = true AND legal_hold = false
  LOOP
    cutoff_date := NOW() - (policy_record.retention_days || ' days')::INTERVAL;
    
    CASE policy_record.data_type
      WHEN 'calls' THEN
        DELETE FROM calls 
        WHERE workspace_id = policy_record.workspace_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'recordings' THEN
        UPDATE calls 
        SET recording_url = NULL, updated_at = NOW()
        WHERE workspace_id = policy_record.workspace_id 
          AND created_at < cutoff_date 
          AND recording_url IS NOT NULL;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'transcripts' THEN
        DELETE FROM call_transcripts 
        WHERE call_id IN (
          SELECT id FROM calls 
          WHERE workspace_id = policy_record.workspace_id 
            AND created_at < cutoff_date
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'form_submissions' THEN
        DELETE FROM form_submissions 
        WHERE workspace_id = policy_record.workspace_id 
          AND created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END CASE;
    
    -- Log cleanup action
    IF deleted_count > 0 THEN
      INSERT INTO audit_logs (
        workspace_id, user_id, action, resource_type, details, created_at
      ) VALUES (
        policy_record.workspace_id,
        'system',
        'auto_cleanup',
        policy_record.data_type,
        jsonb_build_object(
          'deleted_count', deleted_count,
          'retention_days', policy_record.retention_days,
          'cutoff_date', cutoff_date
        ),
        NOW()
      );
    END IF;
  END LOOP;
END;
$$;

-- Function to trigger cleanup (call this from a cron job)
-- SELECT cleanup_expired_data();
