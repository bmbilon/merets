-- Migration: Add approve_submission function for handling approvals with rewards
-- Date: January 1, 2026
-- Purpose: Atomic function to approve submissions, award XP/credits, and update stats

CREATE OR REPLACE FUNCTION approve_submission(
  p_submission_id UUID,
  p_rating INTEGER,
  p_reviewer_id UUID,
  p_review_notes TEXT DEFAULT NULL,
  p_tip_cents INTEGER DEFAULT 0
) RETURNS JSON AS $$
DECLARE
  v_submission commitment_submissions%ROWTYPE;
  v_commitment commitments%ROWTYPE;
  v_task task_templates%ROWTYPE;
  v_user user_profiles%ROWTYPE;
  v_xp_earned INTEGER;
  v_credits_earned INTEGER;
  v_tip_amount INTEGER;
  v_total_earnings INTEGER;
  v_new_total_xp INTEGER;
  v_new_total_earnings INTEGER;
  v_new_tasks_completed INTEGER;
  v_result JSON;
BEGIN
  -- Get submission details
  SELECT * INTO v_submission
  FROM commitment_submissions
  WHERE id = p_submission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  -- Get commitment details
  SELECT * INTO v_commitment
  FROM commitments
  WHERE id = v_submission.commitment_id;
  
  -- Get task template details
  SELECT * INTO v_task
  FROM task_templates
  WHERE id = v_commitment.task_template_id;
  
  -- Get user details
  SELECT * INTO v_user
  FROM user_profiles
  WHERE id = v_commitment.user_id;
  
  -- Calculate rewards based on rating
  -- Rating scale: 1-5 stars
  -- XP: Base XP from task * rating multiplier
  -- 1 star = 50% XP, 2 = 75%, 3 = 100%, 4 = 125%, 5 = 150%
  CASE p_rating
    WHEN 1 THEN v_xp_earned := ROUND(v_task.base_xp * 0.5);
    WHEN 2 THEN v_xp_earned := ROUND(v_task.base_xp * 0.75);
    WHEN 3 THEN v_xp_earned := v_task.base_xp;
    WHEN 4 THEN v_xp_earned := ROUND(v_task.base_xp * 1.25);
    WHEN 5 THEN v_xp_earned := ROUND(v_task.base_xp * 1.5);
    ELSE v_xp_earned := v_task.base_xp;
  END CASE;
  
  -- Credits earned (always full amount unless rejected)
  v_credits_earned := v_commitment.pay_cents;
  v_tip_amount := COALESCE(p_tip_cents, 0);
  v_total_earnings := v_credits_earned + v_tip_amount;
  
  -- Update submission record
  UPDATE commitment_submissions
  SET status = 'approved',
      reviewed_at = NOW(),
      reviewer_id = p_reviewer_id,
      rating = p_rating,
      review_notes = p_review_notes,
      tip_amount_cents = v_tip_amount
  WHERE id = p_submission_id;
  
  -- Update commitment status
  UPDATE commitments
  SET status = 'completed',
      completed_at = NOW(),
      quality_rating = CASE 
        WHEN p_rating <= 2 THEN 'miss'
        WHEN p_rating = 3 THEN 'pass'
        ELSE 'perfect'
      END
  WHERE id = v_commitment.id;
  
  -- Update user stats
  UPDATE user_profiles
  SET total_xp = total_xp + v_xp_earned,
      total_earnings_cents = total_earnings_cents + v_total_earnings,
      tasks_completed = tasks_completed + 1,
      last_completion_date = NOW()
  WHERE id = v_user.id
  RETURNING total_xp, total_earnings_cents, tasks_completed
  INTO v_new_total_xp, v_new_total_earnings, v_new_tasks_completed;
  
  -- TODO: Check for achievements and streaks
  -- This will be implemented in Phase 2
  
  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'xp_earned', v_xp_earned,
    'credits_earned', v_credits_earned / 100.0,
    'tip_amount', v_tip_amount / 100.0,
    'total_earned', v_total_earnings / 100.0,
    'new_total_xp', v_new_total_xp,
    'new_total_earnings', v_new_total_earnings / 100.0,
    'new_tasks_completed', v_new_tasks_completed,
    'achievements_unlocked', '[]'::json,
    'streak_updated', false
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error in JSON format
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a submission
CREATE OR REPLACE FUNCTION reject_submission(
  p_submission_id UUID,
  p_reviewer_id UUID,
  p_rejection_reason TEXT
) RETURNS JSON AS $$
DECLARE
  v_submission commitment_submissions%ROWTYPE;
  v_result JSON;
BEGIN
  -- Get submission details
  SELECT * INTO v_submission
  FROM commitment_submissions
  WHERE id = p_submission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;
  
  -- Update submission record
  UPDATE commitment_submissions
  SET status = 'rejected',
      reviewed_at = NOW(),
      reviewer_id = p_reviewer_id,
      review_notes = p_rejection_reason
  WHERE id = p_submission_id;
  
  -- Update commitment status back to in_progress
  UPDATE commitments
  SET status = 'in_progress'
  WHERE id = v_submission.commitment_id;
  
  -- Build result JSON
  v_result := json_build_object(
    'success', true,
    'message', 'Submission rejected and returned to in progress'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add base_xp column to task_templates if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'task_templates' AND column_name = 'base_xp'
  ) THEN
    ALTER TABLE task_templates ADD COLUMN base_xp INTEGER DEFAULT 10;
    
    -- Set base XP based on difficulty and effort
    UPDATE task_templates
    SET base_xp = CASE
      WHEN difficulty_level = 1 THEN effort_minutes * 2
      WHEN difficulty_level = 2 THEN effort_minutes * 3
      WHEN difficulty_level = 3 THEN effort_minutes * 4
      ELSE effort_minutes * 2
    END;
  END IF;
END $$;

-- Add tasks_completed column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'tasks_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN tasks_completed INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add last_completion_date column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'last_completion_date'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_completion_date TIMESTAMPTZ;
  END IF;
END $$;

-- Add quality_rating column to commitments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commitments' AND column_name = 'quality_rating'
  ) THEN
    ALTER TABLE commitments ADD COLUMN quality_rating TEXT CHECK (quality_rating IN ('miss', 'pass', 'perfect'));
  END IF;
END $$;

COMMENT ON FUNCTION approve_submission IS 'Approves a submission, awards XP and credits, and updates user stats atomically';
COMMENT ON FUNCTION reject_submission IS 'Rejects a submission and returns the commitment to in_progress status';
