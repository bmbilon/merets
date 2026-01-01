-- ============================================================================
-- Merets v1.5.02 - Migration for EXISTING Schema
-- ============================================================================
-- This works with your existing commitment_submissions table
-- ============================================================================

-- STEP 1: Add missing columns to existing commitment_submissions table
-- ============================================================================

ALTER TABLE commitment_submissions 
ADD COLUMN IF NOT EXISTS submission_status TEXT NOT NULL DEFAULT 'pending_approval';

ALTER TABLE commitment_submissions 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES user_profiles(id);

ALTER TABLE commitment_submissions 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

ALTER TABLE commitment_submissions 
ADD COLUMN IF NOT EXISTS quality_rating INTEGER;

ALTER TABLE commitment_submissions 
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

ALTER TABLE commitment_submissions 
ADD COLUMN IF NOT EXISTS bonus_tip_cents INTEGER DEFAULT 0;

ALTER TABLE commitment_submissions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'submission_status_check' 
    AND conrelid = 'commitment_submissions'::regclass
  ) THEN
    ALTER TABLE commitment_submissions 
    ADD CONSTRAINT submission_status_check 
    CHECK (submission_status IN ('pending_approval', 'approved', 'rejected'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quality_rating_check' 
    AND conrelid = 'commitment_submissions'::regclass
  ) THEN
    ALTER TABLE commitment_submissions 
    ADD CONSTRAINT quality_rating_check 
    CHECK (quality_rating IS NULL OR (quality_rating BETWEEN 1 AND 5));
  END IF;
END $$;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_submissions_status ON commitment_submissions(submission_status);

-- ============================================================================
-- STEP 2: Add streak columns to user_profiles
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tasks_completed INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_completion_date DATE;

-- ============================================================================
-- STEP 3: Create update_user_streak function
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

  SELECT last_completion_date, current_streak, longest_streak
  INTO v_last_completion_date, v_current_streak, v_longest_streak
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_last_completion_date IS NULL THEN
    UPDATE user_profiles
    SET 
      current_streak = 1,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), 1),
      last_completion_date = v_today
    WHERE id = p_user_id;
    RETURN;
  END IF;

  IF v_last_completion_date = v_today THEN
    RETURN;
  END IF;

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

  UPDATE user_profiles
  SET 
    current_streak = 1,
    last_completion_date = v_today
  WHERE id = p_user_id;
END;
$$;

-- ============================================================================
-- STEP 4: Create approve_submission function
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
  SELECT commitment_id
  INTO v_commitment_id
  FROM commitment_submissions
  WHERE id = p_submission_id;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  SELECT user_id, pay_cents
  INTO v_user_id, v_pay_cents
  FROM commitments
  WHERE id = v_commitment_id;

  v_base_xp := 10;
  
  CASE p_quality_rating
    WHEN 5 THEN v_xp_multiplier := 1.5;
    WHEN 4 THEN v_xp_multiplier := 1.25;
    WHEN 3 THEN v_xp_multiplier := 1.0;
    WHEN 2 THEN v_xp_multiplier := 0.75;
    WHEN 1 THEN v_xp_multiplier := 0.5;
    ELSE v_xp_multiplier := 1.0;
  END CASE;

  v_total_xp := FLOOR(v_base_xp * v_xp_multiplier);

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

  UPDATE commitments
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_commitment_id;

  UPDATE user_profiles
  SET 
    total_xp = COALESCE(total_xp, 0) + v_total_xp,
    total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_pay_cents + p_bonus_tip_cents,
    tasks_completed = COALESCE(tasks_completed, 0) + 1
  WHERE id = v_user_id;

  PERFORM update_user_streak(v_user_id);

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
-- STEP 5: Create reject_submission function
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
  SELECT commitment_id
  INTO v_commitment_id
  FROM commitment_submissions
  WHERE id = p_submission_id;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  UPDATE commitment_submissions
  SET 
    submission_status = 'rejected',
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    reviewer_notes = p_reviewer_notes,
    updated_at = NOW()
  WHERE id = p_submission_id;

  UPDATE commitments
  SET 
    status = 'in_progress'
  WHERE id = v_commitment_id;

  v_result := json_build_object(
    'success', true,
    'message', 'Submission rejected, task returned to in-progress'
  );

  RETURN v_result;
END;
$$;

-- ============================================================================
-- STEP 6: Grant necessary permissions
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE ON commitment_submissions TO anon;
GRANT EXECUTE ON FUNCTION approve_submission TO anon;
GRANT EXECUTE ON FUNCTION reject_submission TO anon;
GRANT EXECUTE ON FUNCTION update_user_streak TO anon;

-- ============================================================================
-- DONE!
-- ============================================================================
