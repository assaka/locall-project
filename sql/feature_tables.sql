CREATE TABLE numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_sid text NOT NULL,
  phone_number text NOT NULL UNIQUE,
  user_id uuid REFERENCES users(id),         -- Make sure users table exists!
  workspace_id uuid REFERENCES workspaces(id) NOT NULL,
  purchased_at timestamptz DEFAULT now(),
  friendly_name text,
  is_active boolean DEFAULT true
);

CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_sid text NOT NULL,                
  from_number text NOT NULL,               
  to_number text NOT NULL,                 
  number_id uuid REFERENCES numbers(id),   
  user_id uuid REFERENCES users(id),       
  workspace_id uuid REFERENCES workspaces(id) NOT NULL,
  direction text CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  status text,                             
  duration integer,                        
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  recording_url text,                      
  created_at timestamptz DEFAULT now()
);

CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) NOT NULL,
  user_id uuid REFERENCES users(id),       
  form_name text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  data jsonb NOT NULL,                     
  source text,
  ip_address text,
  user_agent text,
  from_number text,
  to_number text
);
