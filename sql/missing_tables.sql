-- Missing Database Tables for LoCall Project

-- 1. IVR Call Logs (referenced in /api/ivr/webhook)
CREATE TABLE IF NOT EXISTS ivr_call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  call_status VARCHAR(50) NOT NULL,
  dtmf_input VARCHAR(10),
  is_after_hours BOOLEAN DEFAULT false,
  direction VARCHAR(10) DEFAULT 'inbound',
  conversation_uuid VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SMS Calendly (referenced in /api/sms/send-calendly)
CREATE TABLE IF NOT EXISTS sms_calendly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  calendly_link TEXT NOT NULL,
  call_id UUID,
  sms_status VARCHAR(20) NOT NULL,
  message_id VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Voicemails (for IVR voicemail feature)
CREATE TABLE IF NOT EXISTS voicemails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20),
  recording_url TEXT NOT NULL,
  recording_uuid VARCHAR(100),
  conversation_uuid VARCHAR(100),
  duration INTEGER,
  size INTEGER,
  status VARCHAR(20) DEFAULT 'received',
  transcription TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Call Transfers (for IVR transfer tracking)
CREATE TABLE IF NOT EXISTS call_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_uuid VARCHAR(100),
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20),
  status VARCHAR(20) NOT NULL,
  direction VARCHAR(10) DEFAULT 'outbound',
  duration INTEGER,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Wallet Balances (referenced in wallet APIs)
CREATE TABLE IF NOT EXISTS wallet_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  balance INTEGER DEFAULT 0, -- in cents
  low_balance_threshold INTEGER DEFAULT 500, -- $5.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Wallet Transactions (referenced in wallet APIs)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'top-up', 'deduction'
  amount INTEGER NOT NULL, -- in cents (positive for top-up, negative for deduction)
  description TEXT,
  payment_intent_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Usage Logs (referenced in wallet APIs)
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  service VARCHAR(50) NOT NULL, -- 'phone_purchase', 'call', 'sms', 'routing'
  quantity INTEGER NOT NULL,
  cost INTEGER NOT NULL, -- in cents
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Call Recordings (for future call recording feature)
CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES calls(id),
  recording_url TEXT,
  transcript_text TEXT,
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Call Transcripts (referenced in calls API)
CREATE TABLE IF NOT EXISTS call_transcripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL REFERENCES calls(id),
  transcript_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Required functions for wallet operations
CREATE OR REPLACE FUNCTION increment_wallet_balance(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO wallet_balances (user_id, balance)
  VALUES (user_id, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = wallet_balances.balance + amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_wallet_balance(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE wallet_balances 
  SET balance = balance - amount, updated_at = NOW()
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Function to get low balance users (referenced in cron API)
CREATE OR REPLACE FUNCTION get_low_balance_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  balance INTEGER,
  threshold INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    wb.balance,
    wb.low_balance_threshold
  FROM users u
  JOIN wallet_balances wb ON u.id = wb.user_id
  WHERE wb.balance <= wb.low_balance_threshold;
END;
$$ LANGUAGE plpgsql;
