-- Merets Issuer Collaboration System
-- Enables multiple adults (parents, grandparents, teachers, coaches) to approve and rate work

-- Family/Issuer relationships table
CREATE TABLE IF NOT EXISTS family_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  earner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'parent', 'guardian', 'grandparent', 'aunt_uncle', 
    'teacher', 'coach', 'mentor', 'other'
  )),
  permission_level TEXT NOT NULL DEFAULT 'full' CHECK (permission_level IN (
    'full',         -- Can approve, review, pay, create tasks
    'approve_only', -- Can only approve commitments
    'review_only',  -- Can only rate quality
    'view_only'     -- Read-only access
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(issuer_id, earner_id)
);

-- Add issuer tracking to task_templates
ALTER TABLE task_templates 
ADD COLUMN IF NOT EXISTS issuer_id UUID REFERENCES user_profiles(id);

-- Add issuer tracking to commitments
ALTER TABLE commitments
ADD COLUMN IF NOT EXISTS issuer_id UUID REFERENCES user_profiles(id);

-- Issuer approvals table (separate from commitment status for audit trail)
CREATE TABLE IF NOT EXISTS issuer_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  issuer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  approval_status TEXT NOT NULL CHECK (approval_status IN ('approved', 'rejected', 'revision_requested')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(commitment_id, issuer_id)
);

-- Payment records (separate tracking for who paid what)
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'venmo', 'paypal', 'zelle', 'check', 'other')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_relationships_issuer ON family_relationships(issuer_id);
CREATE INDEX IF NOT EXISTS idx_family_relationships_earner ON family_relationships(earner_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_issuer ON task_templates(issuer_id);
CREATE INDEX IF NOT EXISTS idx_commitments_issuer ON commitments(issuer_id);
CREATE INDEX IF NOT EXISTS idx_issuer_approvals_commitment ON issuer_approvals(commitment_id);
CREATE INDEX IF NOT EXISTS idx_issuer_approvals_issuer ON issuer_approvals(issuer_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_commitment ON payment_records(commitment_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payer ON payment_records(payer_id);

-- RLS Policies
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE issuer_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Family relationships: users can see their own relationships
CREATE POLICY family_relationships_select ON family_relationships
  FOR SELECT USING (true); -- Open for dev, tighten in prod

CREATE POLICY family_relationships_insert ON family_relationships
  FOR INSERT WITH CHECK (true); -- Open for dev

CREATE POLICY family_relationships_update ON family_relationships
  FOR UPDATE USING (true); -- Open for dev

-- Issuer approvals: open for dev
CREATE POLICY issuer_approvals_select ON issuer_approvals
  FOR SELECT USING (true);

CREATE POLICY issuer_approvals_insert ON issuer_approvals
  FOR INSERT WITH CHECK (true);

-- Payment records: open for dev
CREATE POLICY payment_records_select ON payment_records
  FOR SELECT USING (true);

CREATE POLICY payment_records_insert ON payment_records
  FOR INSERT WITH CHECK (true);

-- Helper function: Get commitments for earner by issuer
CREATE OR REPLACE FUNCTION get_earner_commitments_by_issuer(
  p_earner_id UUID,
  p_issuer_id UUID
) RETURNS TABLE (
  commitment_id UUID,
  custom_title TEXT,
  effort_minutes INTEGER,
  pay_cents INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approval_status TEXT,
  quality_stars INTEGER,
  reviewer_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.custom_title,
    c.effort_minutes,
    c.pay_cents,
    c.status,
    c.created_at,
    c.completed_at,
    ia.approval_status,
    cr.quality_stars,
    up.name as reviewer_name
  FROM commitments c
  LEFT JOIN issuer_approvals ia ON c.id = ia.commitment_id AND ia.issuer_id = p_issuer_id
  LEFT JOIN commitment_reviews cr ON c.id = cr.commitment_id
  LEFT JOIN user_profiles up ON cr.reviewer_id = up.id
  WHERE c.user_id = p_earner_id
    AND (c.issuer_id = p_issuer_id OR c.issuer_id IS NULL)
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get issuer statistics
CREATE OR REPLACE FUNCTION get_issuer_stats(p_issuer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_approvals', (
      SELECT COUNT(*)
      FROM commitments c
      WHERE c.status = 'pending'
        AND (c.issuer_id = p_issuer_id OR c.issuer_id IS NULL)
    ),
    'awaiting_review', (
      SELECT COUNT(*)
      FROM commitments c
      WHERE c.status = 'approved'
        AND c.completed_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM commitment_reviews cr WHERE cr.commitment_id = c.id
        )
        AND (c.issuer_id = p_issuer_id OR c.issuer_id IS NULL)
    ),
    'total_approved', (
      SELECT COUNT(*)
      FROM issuer_approvals ia
      WHERE ia.issuer_id = p_issuer_id
        AND ia.approval_status = 'approved'
    ),
    'total_reviewed', (
      SELECT COUNT(*)
      FROM commitment_reviews cr
      WHERE cr.reviewer_id = p_issuer_id
    ),
    'earners_count', (
      SELECT COUNT(DISTINCT earner_id)
      FROM family_relationships
      WHERE issuer_id = p_issuer_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_relationships_updated_at
  BEFORE UPDATE ON family_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
