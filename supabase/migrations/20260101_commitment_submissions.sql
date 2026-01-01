-- Migration: Add commitment_submissions table for task submission workflow
-- Date: January 1, 2026
-- Purpose: Enable kids to submit completed work with proof photos for parent approval

-- Create commitment_submissions table
CREATE TABLE IF NOT EXISTS commitment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  proof_photos TEXT[], -- Array of image URLs from Supabase storage
  submission_notes TEXT,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'revision_requested')),
  reviewed_at TIMESTAMPTZ,
  reviewer_id UUID REFERENCES user_profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_notes TEXT,
  tip_amount_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_commitment_submissions_commitment_id ON commitment_submissions(commitment_id);
CREATE INDEX idx_commitment_submissions_status ON commitment_submissions(status);
CREATE INDEX idx_commitment_submissions_submitted_at ON commitment_submissions(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE commitment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON commitment_submissions FOR SELECT
  USING (
    commitment_id IN (
      SELECT id FROM commitments WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create submissions for their own commitments
CREATE POLICY "Users can create submissions"
  ON commitment_submissions FOR INSERT
  WITH CHECK (
    commitment_id IN (
      SELECT id FROM commitments WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Parents can view all submissions in their family
CREATE POLICY "Parents can view all submissions"
  ON commitment_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('parent', 'issuer')
    )
  );

-- RLS Policy: Parents can update submissions (for approval/rejection)
CREATE POLICY "Parents can update submissions"
  ON commitment_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('parent', 'issuer')
    )
  );

-- RLS Policy: Allow anon role to read (for development)
CREATE POLICY "Allow anon read access"
  ON commitment_submissions FOR SELECT
  USING (true);

CREATE POLICY "Allow anon insert access"
  ON commitment_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anon update access"
  ON commitment_submissions FOR UPDATE
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commitment_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER trigger_update_commitment_submissions_updated_at
  BEFORE UPDATE ON commitment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_commitment_submissions_updated_at();

-- Add comment for documentation
COMMENT ON TABLE commitment_submissions IS 'Stores submitted work for parent approval with proof photos and review data';
