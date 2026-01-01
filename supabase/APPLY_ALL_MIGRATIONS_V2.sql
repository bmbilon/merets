-- ============================================================================
-- Merets v1.5.02 - Complete Migration Script (V2 - FIXED)
-- ============================================================================
-- Run this script in your Supabase SQL Editor to apply all v1.5.02 features
-- ============================================================================

-- STEP 1: Create commitment_submissions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS commitment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  
  -- Status (defined early, before CHECK constraint)
  submission_status TEXT NOT NULL DEFAULT 'pending_approval',
  
  -- Proof of work
  photo_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- Review details
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  quality_rating INTEGER,
  reviewer_notes TEXT,
  bonus_tip_cents INTEGER DEFAULT 0,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT submission_status_check CHECK (submission_status IN ('pending_approval', 'approved', 'rejected')),
  CONSTRAINT quality_rating_check CHECK (quality_rating BETWEEN 1 AND 5)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_commitment ON commitment_submissions(commitment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON commitment_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON commitment_submissions(reviewed_by);

-- RLS Policies
ALTER TABLE commitment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon to read all submissions" ON commitment_submissions;
CREATE POLICY "Allow anon to read all submissions"
  ON commitment_submissions FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert submissions" ON commitment_submissions;
CREATE POLICY "Allow anon to insert submissions"
  ON commitment_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to update submissions" ON commitment_submissions;
CREATE POLICY "Allow anon to update submissions"
  ON commitment_submissions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 2: Update commitments table to support new statuses
-- ============================================================================

-- Add new status values if not already present
ALTER TABLE commitments DROP CONSTRAINT IF EXISTS commitments_status_check;
ALTER TABLE commitments ADD CONSTRAINT commitments_status_check 
  CHECK (status IN ('pending', 'approved', 'completed', 'rejected', 'in_progress', 'pending_approval'));

-- Add tasks_completed column to user_profiles if not exists
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;

-- ============================================================================
-- STEP 3: Create approve_submission function
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_submission(
  p_submission_id UUID,
  p_reviewer_id UUID,
  p_quality_rating INTEGER,
  p_bonus_tip_cents INTEGER DEFAULT 0,
  p_reviewer_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commitment_id UUID;
  v_user_id UUID;
  v_pay_cents INTEGER;
  v_base_xp INTEGER;
  v_xp_multiplier NUMERIC;
  v_total_xp INTEGER;
  v_result JSON;
BEGIN
  -- Get submission details
  SELECT commitment_id
  INTO v_commitment_id
  FROM commitment_submissions
  WHERE id = p_submission_id;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Get commitment details
  SELECT user_id, pay_cents
  INTO v_user_id, v_pay_cents
  FROM commitments
  WHERE id = v_commitment_id;

  -- Calculate XP based on quality rating
  v_base_xp := 10; -- Base XP per task
  
  CASE p_quality_rating
    WHEN 5 THEN v_xp_multiplier := 1.5;  -- Perfect: 150% XP
    WHEN 4 THEN v_xp_multiplier := 1.25; -- Great: 125% XP
    WHEN 3 THEN v_xp_multiplier := 1.0;  -- Good: 100% XP
    WHEN 2 THEN v_xp_multiplier := 0.75; -- Needs work: 75% XP
    WHEN 1 THEN v_xp_multiplier := 0.5;  -- Poor: 50% XP
    ELSE v_xp_multiplier := 1.0;
  END CASE;

  v_total_xp := FLOOR(v_base_xp * v_xp_multiplier);

  -- Update submission status
  UPDATE commitment_submissions
  SET 
    submission_status = 'approved',
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    quality_rating = p_quality_rating,
    bonus_tip_cents = p_bonus_tip_cents,
    reviewer_notes = p_reviewer_notes,
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- Update commitment status
  UPDATE commitments
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_commitment_id;

  -- Update user stats
  UPDATE user_profiles
  SET 
    total_xp = COALESCE(total_xp, 0) + v_total_xp,
    total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_pay_cents + p_bonus_tip_cents,
    tasks_completed = COALESCE(tasks_completed, 0) + 1
  WHERE id = v_user_id;

  -- Update streak (call function if it exists)
  BEGIN
    PERFORM update_user_streak(v_user_id);
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if function doesn't exist yet
    NULL;
  END;

  -- Return result
  v_result := json_build_object(
    'success', true,
    'xp_earned', v_total_xp,
    'credits_earned', (v_pay_cents + p_bonus_tip_cents) / 100.0,
    'quality_rating', p_quality_rating
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- STEP 4: Create reject_submission function
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_submission(
  p_submission_id UUID,
  p_reviewer_id UUID,
  p_reviewer_notes TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commitment_id UUID;
  v_result JSON;
BEGIN
  -- Get submission details
  SELECT commitment_id
  INTO v_commitment_id
  FROM commitment_submissions
  WHERE id = p_submission_id;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Update submission status
  UPDATE commitment_submissions
  SET 
    submission_status = 'rejected',
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    reviewer_notes = p_reviewer_notes,
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- Return commitment to in_progress status
  UPDATE commitments
  SET 
    status = 'in_progress'
  WHERE id = v_commitment_id;

  -- Return result
  v_result := json_build_object(
    'success', true,
    'message', 'Submission rejected, task returned to in-progress'
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- STEP 5: Add streak columns to user_profiles
-- ============================================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_completion_date DATE;

-- ============================================================================
-- STEP 6: Create update_user_streak function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_completion_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE;
BEGIN
  v_today := CURRENT_DATE;

  -- Get current streak data
  SELECT last_completion_date, current_streak, longest_streak
  INTO v_last_completion_date, v_current_streak, v_longest_streak
  FROM user_profiles
  WHERE id = p_user_id;

  -- If no previous completion, start streak at 1
  IF v_last_completion_date IS NULL THEN
    UPDATE user_profiles
    SET 
      current_streak = 1,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), 1),
      last_completion_date = v_today
    WHERE id = p_user_id;
    RETURN;
  END IF;

  -- If completed today, no change (already counted)
  IF v_last_completion_date = v_today THEN
    RETURN;
  END IF;

  -- If completed yesterday, increment streak
  IF v_last_completion_date = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
    
    UPDATE user_profiles
    SET 
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_completion_date = v_today
    WHERE id = p_user_id;
    RETURN;
  END IF;

  -- If gap > 1 day, reset streak to 1
  UPDATE user_profiles
  SET 
    current_streak = 1,
    last_completion_date = v_today
  WHERE id = p_user_id;
END;
$$;

-- ============================================================================
-- STEP 7: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON commitment_submissions TO anon;
GRANT EXECUTE ON FUNCTION approve_submission TO anon;
GRANT EXECUTE ON FUNCTION reject_submission TO anon;
GRANT EXECUTE ON FUNCTION update_user_streak TO anon;

-- ============================================================================
-- DONE!
-- ============================================================================
-- All v1.5.02 database migrations have been applied.
-- You can now use the full feature set of Merets v1.5.02!
-- ============================================================================
