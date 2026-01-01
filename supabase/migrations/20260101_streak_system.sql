-- Migration: Add streak tracking system
-- Date: January 1, 2026
-- Purpose: Track daily completion streaks for gamification

-- Add streak columns to user_profiles
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_updated TIMESTAMPTZ;

-- Function to update streak when task is completed
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user user_profiles%ROWTYPE;
  v_last_completion_date DATE;
  v_today DATE;
  v_days_since_last INTEGER;
  v_streak_updated BOOLEAN := false;
  v_streak_broken BOOLEAN := false;
  v_new_record BOOLEAN := false;
BEGIN
  -- Get user data
  SELECT * INTO v_user FROM user_profiles WHERE id = p_user_id;
  
  v_today := CURRENT_DATE;
  
  -- If this is the first completion ever
  IF v_user.last_completion_date IS NULL THEN
    UPDATE user_profiles
    SET current_streak = 1,
        longest_streak = 1,
        streak_last_updated = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
      'current_streak', 1,
      'longest_streak', 1,
      'streak_updated', true,
      'streak_broken', false,
      'new_record', true
    );
  END IF;
  
  -- Calculate days since last completion
  v_last_completion_date := v_user.last_completion_date::DATE;
  v_days_since_last := v_today - v_last_completion_date;
  
  -- Same day completion - no streak change
  IF v_days_since_last = 0 THEN
    RETURN json_build_object(
      'current_streak', v_user.current_streak,
      'longest_streak', v_user.longest_streak,
      'streak_updated', false,
      'streak_broken', false,
      'new_record', false
    );
  END IF;
  
  -- Next day completion - increment streak
  IF v_days_since_last = 1 THEN
    v_streak_updated := true;
    
    UPDATE user_profiles
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        streak_last_updated = NOW()
    WHERE id = p_user_id
    RETURNING current_streak, longest_streak INTO v_user.current_streak, v_user.longest_streak;
    
    -- Check if new record
    v_new_record := (v_user.current_streak = v_user.longest_streak);
    
    RETURN json_build_object(
      'current_streak', v_user.current_streak,
      'longest_streak', v_user.longest_streak,
      'streak_updated', true,
      'streak_broken', false,
      'new_record', v_new_record
    );
  END IF;
  
  -- More than 1 day - streak broken, reset to 1
  IF v_days_since_last > 1 THEN
    v_streak_broken := true;
    
    UPDATE user_profiles
    SET current_streak = 1,
        streak_last_updated = NOW()
    WHERE id = p_user_id;
    
    RETURN json_build_object(
      'current_streak', 1,
      'longest_streak', v_user.longest_streak,
      'streak_updated', true,
      'streak_broken', true,
      'new_record', false
    );
  END IF;
  
  -- Fallback
  RETURN json_build_object(
    'current_streak', v_user.current_streak,
    'longest_streak', v_user.longest_streak,
    'streak_updated', false,
    'streak_broken', false,
    'new_record', false
  );
END;
$$ LANGUAGE plpgsql;

-- Update approve_submission function to include streak tracking
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
  v_streak_data JSON;
  v_result JSON;
BEGIN
  -- Get submission details
  SELECT * INTO v_submission FROM commitment_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
  
  -- Get commitment details
  SELECT * INTO v_commitment FROM commitments WHERE id = v_submission.commitment_id;
  
  -- Get task template details
  SELECT * INTO v_task FROM task_templates WHERE id = v_commitment.task_template_id;
  
  -- Get user details
  SELECT * INTO v_user FROM user_profiles WHERE id = v_commitment.user_id;
  
  -- Calculate rewards based on rating
  CASE p_rating
    WHEN 1 THEN v_xp_earned := ROUND(v_task.base_xp * 0.5);
    WHEN 2 THEN v_xp_earned := ROUND(v_task.base_xp * 0.75);
    WHEN 3 THEN v_xp_earned := v_task.base_xp;
    WHEN 4 THEN v_xp_earned := ROUND(v_task.base_xp * 1.25);
    WHEN 5 THEN v_xp_earned := ROUND(v_task.base_xp * 1.5);
    ELSE v_xp_earned := v_task.base_xp;
  END CASE;
  
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
  
  -- Update streak
  SELECT update_user_streak(v_user.id) INTO v_streak_data;
  
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
    'streak_data', v_streak_data,
    'achievements_unlocked', '[]'::json
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_user_streak IS 'Updates user streak based on completion dates';
