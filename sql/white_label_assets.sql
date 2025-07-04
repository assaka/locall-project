-- White-label Assets Table
-- Stores generated CSS, themes, and other assets for white-label clients

CREATE TABLE IF NOT EXISTS white_label_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES white_labels(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('css', 'theme', 'logo', 'favicon', 'custom_js')),
  content TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_white_label_assets_client_id ON white_label_assets(client_id);
CREATE INDEX IF NOT EXISTS idx_white_label_assets_type ON white_label_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_white_label_assets_active ON white_label_assets(is_active);

-- Create unique constraint for client_id + asset_type combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_white_label_assets_client_type_unique 
ON white_label_assets(client_id, asset_type) 
WHERE is_active = true;

-- Update the white_labels table to include advanced features
ALTER TABLE white_labels ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'professional', 'enterprise'));
ALTER TABLE white_labels ADD COLUMN IF NOT EXISTS monthly_calls_limit INTEGER;
ALTER TABLE white_labels ADD COLUMN IF NOT EXISTS monthly_forms_limit INTEGER;
ALTER TABLE white_labels ADD COLUMN IF NOT EXISTS storage_limit_gb INTEGER DEFAULT 1;

-- Enable RLS
ALTER TABLE white_label_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for white_label_assets
CREATE POLICY "Users can view assets for their white-label clients" ON white_label_assets
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM white_labels WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage assets for their white-label clients" ON white_label_assets
  FOR ALL USING (
    client_id IN (
      SELECT id FROM white_labels WHERE user_id = auth.uid()
    )
  );

-- Function to update the updated_at timestamp for white_label_assets
CREATE OR REPLACE FUNCTION update_white_label_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_white_label_assets_updated_at_trigger
  BEFORE UPDATE ON white_label_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_white_label_assets_updated_at();

-- Function to increment version on asset updates
CREATE OR REPLACE FUNCTION increment_asset_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment version if content or file_url changed
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.file_url IS DISTINCT FROM NEW.file_url THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for version increment
CREATE TRIGGER increment_asset_version_trigger
  BEFORE UPDATE ON white_label_assets
  FOR EACH ROW
  EXECUTE FUNCTION increment_asset_version();

-- Grant permissions
GRANT ALL ON white_label_assets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON white_label_assets TO authenticated;
