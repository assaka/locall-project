-- Advanced Fraud Detection Tables
-- This migration creates tables for comprehensive fraud detection and prevention

-- Table: fraud_analyses
-- Stores fraud analysis results for each user action
CREATE TABLE IF NOT EXISTS fraud_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('call', 'form_submit', 'payment', 'login', 'registration', 'api_call')),
    fraud_score INTEGER NOT NULL CHECK (fraud_score >= 0 AND fraud_score <= 100),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    factors JSONB NOT NULL DEFAULT '[]',
    context JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewer_id TEXT,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: fraud_user_actions
-- Stores all user actions for velocity and pattern analysis
CREATE TABLE IF NOT EXISTS fraud_user_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('call', 'form_submit', 'payment', 'login', 'registration', 'api_call')),
    action_details JSONB NOT NULL DEFAULT '{}',
    success BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: fraud_device_fingerprints
-- Stores device fingerprints for device analysis
CREATE TABLE IF NOT EXISTS fraud_device_fingerprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    fingerprint_hash TEXT NOT NULL,
    fingerprint JSONB NOT NULL DEFAULT '{}',
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    times_used INTEGER DEFAULT 1,
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: fraud_blocked_ips
-- Stores blocked IP addresses
CREATE TABLE IF NOT EXISTS fraud_blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    blocked_by TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: fraud_allowlist_ips
-- Stores allowlisted IP addresses
CREATE TABLE IF NOT EXISTS fraud_allowlist_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    added_by TEXT,
    reason TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: fraud_rules
-- Stores configurable fraud detection rules
CREATE TABLE IF NOT EXISTS fraud_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('velocity', 'device', 'location', 'behavior', 'pattern')),
    enabled BOOLEAN DEFAULT TRUE,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    conditions JSONB NOT NULL DEFAULT '[]',
    action TEXT NOT NULL CHECK (action IN ('flag', 'block', 'review', 'alert')),
    threshold INTEGER NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: fraud_incidents
-- Stores major fraud incidents and investigations
CREATE TABLE IF NOT EXISTS fraud_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    affected_users TEXT[] DEFAULT '{}',
    affected_ips INET[] DEFAULT '{}',
    total_loss DECIMAL(10,2) DEFAULT 0,
    assigned_to TEXT,
    created_by TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: fraud_geolocation_risks
-- Stores geolocation risk assessments
CREATE TABLE IF NOT EXISTS fraud_geolocation_risks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code CHAR(2) NOT NULL,
    country_name TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    reasons TEXT[] DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_user_id ON fraud_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_session_id ON fraud_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_created_at ON fraud_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_risk_level ON fraud_analyses(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_fraud_score ON fraud_analyses(fraud_score);

CREATE INDEX IF NOT EXISTS idx_fraud_user_actions_user_id ON fraud_user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_user_actions_session_id ON fraud_user_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_fraud_user_actions_action_type ON fraud_user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_fraud_user_actions_created_at ON fraud_user_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_user_actions_ip_address ON fraud_user_actions(ip_address);

CREATE INDEX IF NOT EXISTS idx_fraud_device_fingerprints_user_id ON fraud_device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_device_fingerprints_hash ON fraud_device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_fraud_device_fingerprints_last_seen ON fraud_device_fingerprints(last_seen);

CREATE INDEX IF NOT EXISTS idx_fraud_blocked_ips_ip_address ON fraud_blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_fraud_blocked_ips_is_active ON fraud_blocked_ips(is_active);
CREATE INDEX IF NOT EXISTS idx_fraud_blocked_ips_expires_at ON fraud_blocked_ips(expires_at);

CREATE INDEX IF NOT EXISTS idx_fraud_allowlist_ips_ip_address ON fraud_allowlist_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_fraud_allowlist_ips_is_active ON fraud_allowlist_ips(is_active);

CREATE INDEX IF NOT EXISTS idx_fraud_rules_type ON fraud_rules(type);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_enabled ON fraud_rules(enabled);

CREATE INDEX IF NOT EXISTS idx_fraud_incidents_status ON fraud_incidents(status);
CREATE INDEX IF NOT EXISTS idx_fraud_incidents_severity ON fraud_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_incidents_created_at ON fraud_incidents(created_at);

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_factors_gin ON fraud_analyses USING GIN(factors);
CREATE INDEX IF NOT EXISTS idx_fraud_analyses_context_gin ON fraud_analyses USING GIN(context);
CREATE INDEX IF NOT EXISTS idx_fraud_user_actions_details_gin ON fraud_user_actions USING GIN(action_details);
CREATE INDEX IF NOT EXISTS idx_fraud_device_fingerprints_gin ON fraud_device_fingerprints USING GIN(fingerprint);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_conditions_gin ON fraud_rules USING GIN(conditions);

-- Add updated_at trigger for fraud_analyses
CREATE OR REPLACE FUNCTION update_fraud_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fraud_analyses_updated_at
    BEFORE UPDATE ON fraud_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_fraud_analyses_updated_at();

-- Add updated_at trigger for fraud_rules
CREATE OR REPLACE FUNCTION update_fraud_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fraud_rules_updated_at
    BEFORE UPDATE ON fraud_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_fraud_rules_updated_at();

-- Add updated_at trigger for fraud_incidents
CREATE OR REPLACE FUNCTION update_fraud_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fraud_incidents_updated_at
    BEFORE UPDATE ON fraud_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_fraud_incidents_updated_at();

-- Update last_seen on device fingerprint updates
CREATE OR REPLACE FUNCTION update_device_fingerprint_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = CURRENT_TIMESTAMP;
    NEW.times_used = NEW.times_used + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_fingerprint_last_seen
    BEFORE UPDATE ON fraud_device_fingerprints
    FOR EACH ROW
    EXECUTE FUNCTION update_device_fingerprint_last_seen();

-- Enable Row Level Security (RLS)
ALTER TABLE fraud_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_allowlist_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_geolocation_risks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fraud_analyses
CREATE POLICY "fraud_analyses_select_policy" ON fraud_analyses
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'security') OR
        auth.jwt() ->> 'sub' = user_id
    );

CREATE POLICY "fraud_analyses_insert_policy" ON fraud_analyses
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'security', 'service') OR
        auth.jwt() ->> 'sub' = user_id
    );

CREATE POLICY "fraud_analyses_update_policy" ON fraud_analyses
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'security')
    );

-- RLS Policies for fraud_user_actions
CREATE POLICY "fraud_user_actions_select_policy" ON fraud_user_actions
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'security') OR
        auth.jwt() ->> 'sub' = user_id
    );

CREATE POLICY "fraud_user_actions_insert_policy" ON fraud_user_actions
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'security', 'service') OR
        auth.jwt() ->> 'sub' = user_id
    );

-- RLS Policies for fraud_blocked_ips (admin/security only)
CREATE POLICY "fraud_blocked_ips_policy" ON fraud_blocked_ips
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'security')
    );

-- RLS Policies for fraud_allowlist_ips (admin/security only)
CREATE POLICY "fraud_allowlist_ips_policy" ON fraud_allowlist_ips
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'security')
    );

-- RLS Policies for fraud_rules (admin/security only)
CREATE POLICY "fraud_rules_policy" ON fraud_rules
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'security')
    );

-- RLS Policies for fraud_incidents (admin/security only)
CREATE POLICY "fraud_incidents_policy" ON fraud_incidents
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'security')
    );

-- RLS Policies for fraud_geolocation_risks (read-only for all, write for admin/security)
CREATE POLICY "fraud_geolocation_risks_select_policy" ON fraud_geolocation_risks
    FOR SELECT USING (true);

CREATE POLICY "fraud_geolocation_risks_modify_policy" ON fraud_geolocation_risks
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'security')
    );

-- Insert default geolocation risk data
INSERT INTO fraud_geolocation_risks (country_code, country_name, risk_level, risk_score, reasons) VALUES
('CN', 'China', 'high', 75, ARRAY['High fraud activity', 'Regulatory restrictions']),
('RU', 'Russia', 'high', 80, ARRAY['High fraud activity', 'Sanctions', 'Cyber threats']),
('IR', 'Iran', 'high', 85, ARRAY['Sanctions', 'High fraud activity']),
('KP', 'North Korea', 'critical', 95, ARRAY['Sanctions', 'Cyber threats', 'State-sponsored attacks']),
('SY', 'Syria', 'high', 80, ARRAY['Sanctions', 'Political instability']),
('AF', 'Afghanistan', 'medium', 65, ARRAY['Political instability', 'Limited banking infrastructure']),
('IQ', 'Iraq', 'medium', 60, ARRAY['Political instability', 'Limited infrastructure']),
('NG', 'Nigeria', 'medium', 55, ARRAY['High fraud activity', 'Romance scams']),
('GH', 'Ghana', 'medium', 50, ARRAY['Advance fee fraud', 'Romance scams']),
('PK', 'Pakistan', 'medium', 45, ARRAY['Moderate fraud activity'])
ON CONFLICT (country_code) DO NOTHING;

-- Create a function to get fraud risk for a country
CREATE OR REPLACE FUNCTION get_country_fraud_risk(country_code_param CHAR(2))
RETURNS TABLE(
    risk_level TEXT,
    risk_score INTEGER,
    reasons TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fgr.risk_level,
        fgr.risk_score,
        fgr.reasons
    FROM fraud_geolocation_risks fgr
    WHERE fgr.country_code = country_code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to calculate velocity for a user
CREATE OR REPLACE FUNCTION get_user_velocity(
    user_id_param TEXT,
    action_type_param TEXT,
    time_window_minutes INTEGER DEFAULT 60
)
RETURNS INTEGER AS $$
DECLARE
    action_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO action_count
    FROM fraud_user_actions
    WHERE user_id = user_id_param
      AND action_type = action_type_param
      AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '1 minute' * time_window_minutes);
    
    RETURN COALESCE(action_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(ip_address_param INET)
RETURNS BOOLEAN AS $$
DECLARE
    is_blocked BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM fraud_blocked_ips
        WHERE ip_address = ip_address_param
          AND is_active = TRUE
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ) INTO is_blocked;
    
    RETURN is_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if IP is allowlisted
CREATE OR REPLACE FUNCTION is_ip_allowlisted(ip_address_param INET)
RETURNS BOOLEAN AS $$
DECLARE
    is_allowed BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM fraud_allowlist_ips
        WHERE ip_address = ip_address_param
          AND is_active = TRUE
    ) INTO is_allowed;
    
    RETURN is_allowed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for fraud dashboard metrics
CREATE OR REPLACE VIEW fraud_dashboard_metrics AS
SELECT
    -- Total analyses in the last 24 hours
    (SELECT COUNT(*) FROM fraud_analyses WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as total_analyses_24h,
    
    -- High risk analyses in the last 24 hours
    (SELECT COUNT(*) FROM fraud_analyses WHERE risk_level IN ('high', 'critical') AND created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as high_risk_24h,
    
    -- Average fraud score in the last 24 hours
    (SELECT ROUND(AVG(fraud_score), 2) FROM fraud_analyses WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as avg_fraud_score_24h,
    
    -- Active blocked IPs
    (SELECT COUNT(*) FROM fraud_blocked_ips WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)) as active_blocked_ips,
    
    -- Open incidents
    (SELECT COUNT(*) FROM fraud_incidents WHERE status IN ('open', 'investigating')) as open_incidents,
    
    -- Top fraud factor types in the last 24 hours
    (SELECT jsonb_agg(jsonb_build_object('type', factor_type, 'count', factor_count))
     FROM (
         SELECT 
             jsonb_array_elements(factors)->>'type' as factor_type,
             COUNT(*) as factor_count
         FROM fraud_analyses 
         WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
           AND factors != '[]'::jsonb
         GROUP BY jsonb_array_elements(factors)->>'type'
         ORDER BY factor_count DESC
         LIMIT 5
     ) top_factors) as top_fraud_factors_24h;

-- Grant necessary permissions
GRANT SELECT ON fraud_dashboard_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_country_fraud_risk(CHAR(2)) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_velocity(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_blocked(INET) TO authenticated;
GRANT EXECUTE ON FUNCTION is_ip_allowlisted(INET) TO authenticated;
