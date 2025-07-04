-- Real-time Notifications Table
-- Stores notifications for real-time delivery via Supabase Realtime

CREATE TABLE IF NOT EXISTS realtime_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call_status', 'form_submission', 'system_alert', 'billing', 'integration', 'user_activity')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  actions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_workspace_id ON realtime_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_user_id ON realtime_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_type ON realtime_notifications(type);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_read ON realtime_notifications(read);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_created_at ON realtime_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_priority ON realtime_notifications(priority);

-- Create a compound index for common queries
CREATE INDEX IF NOT EXISTS idx_realtime_notifications_workspace_read_created ON realtime_notifications(workspace_id, read, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view notifications for their workspace" ON realtime_notifications
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert notifications" ON realtime_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON realtime_notifications
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_realtime_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_realtime_notifications_updated_at_trigger
  BEFORE UPDATE ON realtime_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_realtime_notifications_updated_at();

-- Function to clean up old read notifications (runs daily)
CREATE OR REPLACE FUNCTION cleanup_old_realtime_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM realtime_notifications 
  WHERE read = true 
    AND read_at < NOW() - INTERVAL '30 days';
  
  -- Delete unread non-urgent notifications older than 90 days
  DELETE FROM realtime_notifications 
  WHERE read = false 
    AND priority != 'urgent'
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_notifications;

-- Grant necessary permissions
GRANT ALL ON realtime_notifications TO service_role;
GRANT SELECT, INSERT, UPDATE ON realtime_notifications TO authenticated;
GRANT USAGE ON SEQUENCE realtime_notifications_id_seq TO authenticated;
