-- Create dedicated issuers table
-- Issuers can be parents, teachers, coaches, neighbors, etc. who create and approve tasks
CREATE TABLE IF NOT EXISTS issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Issuer type
  issuer_type TEXT NOT NULL CHECK (issuer_type IN (
    'parent',
    'guardian',
    'grandparent',
    'teacher',
    'coach',
    'neighbor',
    'family_friend',
    'mentor',
    'employer',
    'other'
  )),
  
  -- Organization info (for teachers, coaches, etc.)
  organization_name TEXT,
  organization_type TEXT, -- 'school', 'sports', 'music', 'tutoring', etc.
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  can_create_tasks BOOLEAN NOT NULL DEFAULT true,
  can_approve_commitments BOOLEAN NOT NULL DEFAULT true,
  can_rate_quality BOOLEAN NOT NULL DEFAULT true,
  
  -- Contact preferences
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb,
  
  -- Metadata
  bio TEXT,
  profile_image_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issuers_user_profile ON issuers(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_issuers_type ON issuers(issuer_type);
CREATE INDEX IF NOT EXISTS idx_issuers_active ON issuers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_issuers_email ON issuers(email) WHERE email IS NOT NULL;

-- RLS
ALTER TABLE issuers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on issuers" ON issuers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Update trigger
CREATE TRIGGER issuers_updated_at
  BEFORE UPDATE ON issuers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Migrate existing parent/guardian users to issuers table
INSERT INTO issuers (user_profile_id, name, issuer_type, is_active)
SELECT 
  id,
  name,
  'parent' as issuer_type,
  true as is_active
FROM user_profiles
WHERE role = 'parent'
ON CONFLICT (user_profile_id) DO NOTHING;

-- Update family_relationships to reference issuers table instead of user_profiles for issuer_id
-- Keep the FK for now but add comment about future migration
COMMENT ON COLUMN family_relationships.issuer_id IS 'References user_profiles.id - should migrate to issuers.id';
COMMENT ON COLUMN task_templates.issuer_id IS 'References user_profiles.id - should migrate to issuers.id';
COMMENT ON COLUMN commitments.issuer_id IS 'References user_profiles.id - should migrate to issuers.id';

-- Helper function: Get issuer by user_profile_id
CREATE OR REPLACE FUNCTION get_issuer_by_user_profile(p_user_profile_id UUID)
RETURNS TABLE (
  issuer_id UUID,
  name TEXT,
  issuer_type TEXT,
  can_create_tasks BOOLEAN,
  can_approve_commitments BOOLEAN,
  can_rate_quality BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.issuer_type,
    i.can_create_tasks,
    i.can_approve_commitments,
    i.can_rate_quality
  FROM issuers i
  WHERE i.user_profile_id = p_user_profile_id
    AND i.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get all active issuers for an earner
CREATE OR REPLACE FUNCTION get_earner_issuers(p_earner_id UUID)
RETURNS TABLE (
  issuer_id UUID,
  issuer_name TEXT,
  issuer_type TEXT,
  relationship_type TEXT,
  permission_level TEXT,
  organization_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.issuer_type,
    fr.relationship_type,
    fr.permission_level,
    i.organization_name
  FROM family_relationships fr
  JOIN user_profiles up ON fr.issuer_id = up.id
  JOIN issuers i ON i.user_profile_id = up.id
  WHERE fr.earner_id = p_earner_id
    AND i.is_active = true
  ORDER BY i.name;
END;
$$ LANGUAGE plpgsql;
