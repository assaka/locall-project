-- Call Recording and Sentiment Analysis Tables
-- This migration creates tables for call recording, transcription, sentiment analysis, and compliance

-- Table: call_recordings
-- Stores call recording metadata and status
CREATE TABLE IF NOT EXISTS call_recordings (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    vonage_call_id TEXT,
    recording_url TEXT,
    duration INTEGER DEFAULT 0, -- in seconds
    file_size BIGINT DEFAULT 0, -- in bytes
    format TEXT DEFAULT 'mp3' CHECK (format IN ('mp3', 'wav', 'mp4')),
    status TEXT DEFAULT 'recording' CHECK (status IN ('recording', 'completed', 'processing', 'failed', 'deleted')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: call_transcriptions
-- Stores transcribed text from call recordings
CREATE TABLE IF NOT EXISTS call_transcriptions (
    id TEXT PRIMARY KEY,
    recording_id TEXT NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    language TEXT DEFAULT 'en-US',
    speakers JSONB NOT NULL DEFAULT '[]',
    segments JSONB NOT NULL DEFAULT '[]',
    word_count INTEGER DEFAULT 0,
    processing_time INTEGER DEFAULT 0, -- in milliseconds
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: call_sentiment_analyses
-- Stores sentiment analysis results for call transcriptions
CREATE TABLE IF NOT EXISTS call_sentiment_analyses (
    id TEXT PRIMARY KEY,
    recording_id TEXT NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
    transcription_id TEXT NOT NULL REFERENCES call_transcriptions(id) ON DELETE CASCADE,
    overall_sentiment JSONB NOT NULL DEFAULT '{}',
    speaker_sentiments JSONB NOT NULL DEFAULT '[]',
    emotions JSONB NOT NULL DEFAULT '[]',
    key_phrases JSONB NOT NULL DEFAULT '[]',
    topics JSONB NOT NULL DEFAULT '[]',
    call_score JSONB NOT NULL DEFAULT '{}',
    insights JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: call_compliance_checks
-- Stores compliance check results for call recordings
CREATE TABLE IF NOT EXISTS call_compliance_checks (
    id TEXT PRIMARY KEY,
    recording_id TEXT NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
    rules JSONB NOT NULL DEFAULT '[]',
    violations JSONB NOT NULL DEFAULT '[]',
    overall_compliance INTEGER DEFAULT 100 CHECK (overall_compliance >= 0 AND overall_compliance <= 100),
    status TEXT DEFAULT 'compliant' CHECK (status IN ('compliant', 'violations', 'review_required')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: call_quality_scores
-- Stores detailed quality scoring for calls
CREATE TABLE IF NOT EXISTS call_quality_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recording_id TEXT NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 100),
    agent_performance INTEGER CHECK (agent_performance >= 0 AND agent_performance <= 100),
    resolution_effectiveness INTEGER CHECK (resolution_effectiveness >= 0 AND resolution_effectiveness <= 100),
    communication_quality INTEGER CHECK (communication_quality >= 0 AND communication_quality <= 100),
    compliance_adherence INTEGER CHECK (compliance_adherence >= 0 AND compliance_adherence <= 100),
    scoring_factors JSONB NOT NULL DEFAULT '[]',
    evaluator_id TEXT,
    evaluation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: compliance_rules
-- Stores configurable compliance rules for call monitoring
CREATE TABLE IF NOT EXISTS compliance_rules (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('required_disclosure', 'prohibited_language', 'data_security', 'call_duration', 'consent')),
    pattern TEXT, -- regex pattern for text matching
    threshold_value DECIMAL(10,2),
    threshold_unit TEXT, -- 'seconds', 'words', 'percentage', etc.
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN DEFAULT TRUE,
    auto_flag BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: call_analytics_summaries
-- Stores aggregated analytics data for performance
CREATE TABLE IF NOT EXISTS call_analytics_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    date DATE NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN ('day', 'week', 'month')),
    total_calls INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0, -- in seconds
    average_sentiment DECIMAL(3,2),
    average_compliance DECIMAL(5,2),
    average_quality_score DECIMAL(5,2),
    emotion_distribution JSONB NOT NULL DEFAULT '{}',
    topic_distribution JSONB NOT NULL DEFAULT '{}',
    violation_counts JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, date, period_type)
);

-- Table: call_coaching_insights
-- Stores AI-generated coaching insights for agents
CREATE TABLE IF NOT EXISTS call_coaching_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recording_id TEXT NOT NULL REFERENCES call_recordings(id) ON DELETE CASCADE,
    agent_id TEXT,
    insight_type TEXT CHECK (insight_type IN ('strength', 'improvement', 'coaching_tip', 'best_practice')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT CHECK (category IN ('communication', 'technical', 'compliance', 'customer_service', 'sales')),
    evidence TEXT, -- specific examples from the call
    recommendation TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_call_id ON call_recordings(call_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_workspace_id ON call_recordings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(status);
CREATE INDEX IF NOT EXISTS idx_call_recordings_created_at ON call_recordings(created_at);
CREATE INDEX IF NOT EXISTS idx_call_recordings_vonage_call_id ON call_recordings(vonage_call_id);

CREATE INDEX IF NOT EXISTS idx_call_transcriptions_recording_id ON call_transcriptions(recording_id);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_status ON call_transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_language ON call_transcriptions(language);

CREATE INDEX IF NOT EXISTS idx_call_sentiment_analyses_recording_id ON call_sentiment_analyses(recording_id);
CREATE INDEX IF NOT EXISTS idx_call_sentiment_analyses_transcription_id ON call_sentiment_analyses(transcription_id);

CREATE INDEX IF NOT EXISTS idx_call_compliance_checks_recording_id ON call_compliance_checks(recording_id);
CREATE INDEX IF NOT EXISTS idx_call_compliance_checks_status ON call_compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_call_compliance_checks_compliance ON call_compliance_checks(overall_compliance);

CREATE INDEX IF NOT EXISTS idx_call_quality_scores_recording_id ON call_quality_scores(recording_id);
CREATE INDEX IF NOT EXISTS idx_call_quality_scores_overall_score ON call_quality_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_call_quality_scores_evaluator_id ON call_quality_scores(evaluator_id);

CREATE INDEX IF NOT EXISTS idx_compliance_rules_workspace_id ON compliance_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_type ON compliance_rules(type);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_enabled ON compliance_rules(enabled);

CREATE INDEX IF NOT EXISTS idx_call_analytics_summaries_workspace_id ON call_analytics_summaries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_call_analytics_summaries_date ON call_analytics_summaries(date);
CREATE INDEX IF NOT EXISTS idx_call_analytics_summaries_period_type ON call_analytics_summaries(period_type);

CREATE INDEX IF NOT EXISTS idx_call_coaching_insights_recording_id ON call_coaching_insights(recording_id);
CREATE INDEX IF NOT EXISTS idx_call_coaching_insights_agent_id ON call_coaching_insights(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_coaching_insights_type ON call_coaching_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_call_coaching_insights_priority ON call_coaching_insights(priority);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_text_fts ON call_transcriptions USING gin(to_tsvector('english', text));

-- Create GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_call_recordings_metadata_gin ON call_recordings USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_speakers_gin ON call_transcriptions USING gin(speakers);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_segments_gin ON call_transcriptions USING gin(segments);
CREATE INDEX IF NOT EXISTS idx_call_sentiment_analyses_overall_gin ON call_sentiment_analyses USING gin(overall_sentiment);
CREATE INDEX IF NOT EXISTS idx_call_sentiment_analyses_emotions_gin ON call_sentiment_analyses USING gin(emotions);
CREATE INDEX IF NOT EXISTS idx_call_sentiment_analyses_key_phrases_gin ON call_sentiment_analyses USING gin(key_phrases);
CREATE INDEX IF NOT EXISTS idx_call_compliance_checks_violations_gin ON call_compliance_checks USING gin(violations);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_call_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_recordings_updated_at
    BEFORE UPDATE ON call_recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_call_recordings_updated_at();

CREATE OR REPLACE FUNCTION update_call_transcriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_transcriptions_updated_at
    BEFORE UPDATE ON call_transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_call_transcriptions_updated_at();

CREATE OR REPLACE FUNCTION update_call_sentiment_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_sentiment_analyses_updated_at
    BEFORE UPDATE ON call_sentiment_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_call_sentiment_analyses_updated_at();

CREATE OR REPLACE FUNCTION update_call_compliance_checks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER call_compliance_checks_updated_at
    BEFORE UPDATE ON call_compliance_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_call_compliance_checks_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_quality_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analytics_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_coaching_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_recordings
CREATE POLICY "call_recordings_workspace_policy" ON call_recordings
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        EXISTS (
            SELECT 1 FROM user_workspaces uw 
            WHERE uw.user_id = auth.jwt() ->> 'sub' 
            AND uw.workspace_id = call_recordings.workspace_id
        )
    );

-- RLS Policies for call_transcriptions
CREATE POLICY "call_transcriptions_policy" ON call_transcriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_recordings cr 
            WHERE cr.id = call_transcriptions.recording_id
            AND (
                auth.jwt() ->> 'role' IN ('admin', 'manager') OR
                EXISTS (
                    SELECT 1 FROM user_workspaces uw 
                    WHERE uw.user_id = auth.jwt() ->> 'sub' 
                    AND uw.workspace_id = cr.workspace_id
                )
            )
        )
    );

-- RLS Policies for call_sentiment_analyses
CREATE POLICY "call_sentiment_analyses_policy" ON call_sentiment_analyses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_recordings cr 
            WHERE cr.id = call_sentiment_analyses.recording_id
            AND (
                auth.jwt() ->> 'role' IN ('admin', 'manager') OR
                EXISTS (
                    SELECT 1 FROM user_workspaces uw 
                    WHERE uw.user_id = auth.jwt() ->> 'sub' 
                    AND uw.workspace_id = cr.workspace_id
                )
            )
        )
    );

-- RLS Policies for call_compliance_checks
CREATE POLICY "call_compliance_checks_policy" ON call_compliance_checks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM call_recordings cr 
            WHERE cr.id = call_compliance_checks.recording_id
            AND (
                auth.jwt() ->> 'role' IN ('admin', 'manager') OR
                EXISTS (
                    SELECT 1 FROM user_workspaces uw 
                    WHERE uw.user_id = auth.jwt() ->> 'sub' 
                    AND uw.workspace_id = cr.workspace_id
                )
            )
        )
    );

-- RLS Policies for compliance_rules
CREATE POLICY "compliance_rules_workspace_policy" ON compliance_rules
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        EXISTS (
            SELECT 1 FROM user_workspaces uw 
            WHERE uw.user_id = auth.jwt() ->> 'sub' 
            AND uw.workspace_id = compliance_rules.workspace_id
        )
    );

-- RLS Policies for call_analytics_summaries
CREATE POLICY "call_analytics_summaries_workspace_policy" ON call_analytics_summaries
    FOR ALL USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        EXISTS (
            SELECT 1 FROM user_workspaces uw 
            WHERE uw.user_id = auth.jwt() ->> 'sub' 
            AND uw.workspace_id = call_analytics_summaries.workspace_id
        )
    );

-- Create functions for analytics

-- Function to calculate call sentiment trends
CREATE OR REPLACE FUNCTION get_call_sentiment_trend(
    workspace_id_param TEXT,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    date DATE,
    avg_sentiment DECIMAL(3,2),
    call_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.start_time::DATE as date,
        AVG((csa.overall_sentiment->>'score')::DECIMAL(3,2)) as avg_sentiment,
        COUNT(*)::INTEGER as call_count
    FROM call_recordings cr
    JOIN call_sentiment_analyses csa ON cr.id = csa.recording_id
    WHERE cr.workspace_id = workspace_id_param
      AND cr.start_time >= CURRENT_DATE - INTERVAL '1 day' * days_back
      AND cr.status = 'completed'
    GROUP BY cr.start_time::DATE
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get compliance violations summary
CREATE OR REPLACE FUNCTION get_compliance_violations_summary(
    workspace_id_param TEXT,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    violation_type TEXT,
    violation_count BIGINT,
    severity TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (jsonb_array_elements(ccc.violations)->>'ruleName')::TEXT as violation_type,
        COUNT(*) as violation_count,
        (jsonb_array_elements(ccc.violations)->>'severity')::TEXT as severity
    FROM call_recordings cr
    JOIN call_compliance_checks ccc ON cr.id = ccc.recording_id
    WHERE cr.workspace_id = workspace_id_param
      AND cr.start_time >= CURRENT_DATE - INTERVAL '1 day' * days_back
      AND jsonb_array_length(ccc.violations) > 0
    GROUP BY violation_type, severity
    ORDER BY violation_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top emotions in calls
CREATE OR REPLACE FUNCTION get_top_call_emotions(
    workspace_id_param TEXT,
    days_back INTEGER DEFAULT 30,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
    emotion TEXT,
    avg_intensity DECIMAL(3,2),
    occurrence_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (jsonb_array_elements(csa.emotions)->>'emotion')::TEXT as emotion,
        AVG((jsonb_array_elements(csa.emotions)->>'intensity')::DECIMAL(3,2)) as avg_intensity,
        COUNT(*) as occurrence_count
    FROM call_recordings cr
    JOIN call_sentiment_analyses csa ON cr.id = csa.recording_id
    WHERE cr.workspace_id = workspace_id_param
      AND cr.start_time >= CURRENT_DATE - INTERVAL '1 day' * days_back
      AND cr.status = 'completed'
    GROUP BY emotion
    ORDER BY occurrence_count DESC, avg_intensity DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search call transcriptions
CREATE OR REPLACE FUNCTION search_call_transcriptions(
    workspace_id_param TEXT,
    search_query TEXT,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
    recording_id TEXT,
    transcription_text TEXT,
    confidence DECIMAL(3,2),
    call_start_time TIMESTAMP WITH TIME ZONE,
    sentiment_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.recording_id,
        ct.text as transcription_text,
        ct.confidence,
        cr.start_time as call_start_time,
        (csa.overall_sentiment->>'score')::DECIMAL(3,2) as sentiment_score
    FROM call_transcriptions ct
    JOIN call_recordings cr ON ct.recording_id = cr.id
    LEFT JOIN call_sentiment_analyses csa ON cr.id = csa.recording_id
    WHERE cr.workspace_id = workspace_id_param
      AND to_tsvector('english', ct.text) @@ plainto_tsquery('english', search_query)
      AND cr.status = 'completed'
    ORDER BY ts_rank(to_tsvector('english', ct.text), plainto_tsquery('english', search_query)) DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default compliance rules
INSERT INTO compliance_rules (id, workspace_id, name, description, type, pattern, severity, enabled) VALUES
('default_recording_consent', 'default', 'Recording Consent Disclosure', 'Call must include recording consent disclosure', 'required_disclosure', '(record|recording).*(consent|permission|agree)', 'critical', true),
('default_data_privacy', 'default', 'Data Privacy Compliance', 'No sharing of sensitive personal information', 'data_security', '(social security|ssn|credit card|password)', 'high', true),
('default_professional_language', 'default', 'Professional Language', 'No inappropriate or offensive language', 'prohibited_language', '(damn|hell|stupid|idiot)', 'medium', true),
('default_call_duration', 'default', 'Call Duration Limit', 'Calls should not exceed reasonable duration', 'call_duration', null, 'low', true)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON call_recordings TO authenticated;
GRANT SELECT ON call_transcriptions TO authenticated;
GRANT SELECT ON call_sentiment_analyses TO authenticated;
GRANT SELECT ON call_compliance_checks TO authenticated;
GRANT SELECT ON compliance_rules TO authenticated;
GRANT SELECT ON call_analytics_summaries TO authenticated;
GRANT SELECT ON call_coaching_insights TO authenticated;

GRANT EXECUTE ON FUNCTION get_call_sentiment_trend(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_compliance_violations_summary(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_call_emotions(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_call_transcriptions(TEXT, TEXT, INTEGER) TO authenticated;
