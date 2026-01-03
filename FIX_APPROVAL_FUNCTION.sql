-- Fix the approve_submission function to use INTEGER quality_rating
-- Run this in Supabase SQL Editor to fix the approval error

CREATE OR REPLACE FUNCTION approve_submission(
  p_submission_id UUID,
  p_quality_rating INTEGER,
  p_reviewed_by UUID,
  p_reviewer_notes TEXT DEFAULT NULL,
  p_bonus_tip_cents INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commitment_id UUID;
  v_user_id UUID;
  v_base_pay_cents INTEGER;
  v_effort_minutes INTEGER;
  v_quality_multiplier NUMERIC;
  v_total_merets NUMERIC;
  v_hours_earned NUMERIC;
  v_total_money_cents INTEGER;
  v_money_display TEXT;
  v_tip_display TEXT;
  v_reviewer_name TEXT;
  v_old_rep_level INTEGER;
  v_new_rep_level INTEGER;
  v_old_lifetime_merets NUMERIC;
  v_new_lifetime_merets NUMERIC;
BEGIN
  -- Get submission details
  SELECT 
    c.id,
    c.user_id,
    tt.base_pay_cents,
    tt.effort_minutes
  INTO 
    v_commitment_id,
    v_user_id,
    v_base_pay_cents,
    v_effort_minutes
  FROM commitment_submissions cs
  JOIN commitments c ON c.id = cs.commitment_id
  LEFT JOIN task_templates tt ON tt.id = c.task_template_id
  WHERE cs.id = p_submission_id;

  -- Calculate quality multiplier based on star rating
  v_quality_multiplier := CASE p_quality_rating
    WHEN 5 THEN 1.20
    WHEN 4 THEN 1.10
    WHEN 3 THEN 1.00
    WHEN 2 THEN 0.75
    ELSE 0.50
  END;

  -- Calculate merets: (effort_minutes / 60) × quality_multiplier
  v_total_merets := ROUND((COALESCE(v_effort_minutes, 0)::NUMERIC / 60.0) * v_quality_multiplier, 2);

  -- Calculate hours earned (for EXPH)
  v_hours_earned := ROUND(COALESCE(v_effort_minutes, 0)::NUMERIC / 60.0, 2);

  -- Calculate total money
  v_total_money_cents := v_base_pay_cents + COALESCE(p_bonus_tip_cents, 0);

  -- Format money displays
  v_money_display := TRIM(TO_CHAR(v_total_money_cents / 100.0, 'FM999999990.00'));
  v_tip_display := TRIM(TO_CHAR(p_bonus_tip_cents / 100.0, 'FM999999990.00'));

  -- Get reviewer name if provided
  IF p_reviewed_by IS NOT NULL THEN
    SELECT name INTO v_reviewer_name
    FROM user_profiles
    WHERE id = p_reviewed_by;
  END IF;

  -- Get user's current rep level and lifetime merets
  SELECT rep_score, COALESCE(lifetime_merets, 0)
  INTO v_old_rep_level, v_old_lifetime_merets
  FROM user_profiles
  WHERE id = v_user_id;

  -- Calculate new lifetime merets and rep level
  v_new_lifetime_merets := v_old_lifetime_merets + v_total_merets;
  v_new_rep_level := calculate_rep_level(v_new_lifetime_merets);

  -- Update submission
  UPDATE commitment_submissions
  SET 
    submission_status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    quality_rating = p_quality_rating,
    reviewer_notes = p_reviewer_notes,
    bonus_tip_cents = p_bonus_tip_cents,
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- Update commitment status (quality_rating as INTEGER, not VARCHAR)
  UPDATE commitments
  SET 
    status = 'completed',
    completed_at = NOW(),
    quality_rating = p_quality_rating,
    actual_pay_cents = v_total_money_cents,
    parent_feedback = p_reviewer_notes,
    updated_at = NOW()
  WHERE id = v_commitment_id;

  -- Update user's earnings, merets, rep level, AND experience hours
  UPDATE user_profiles
  SET 
    total_earnings_cents = total_earnings_cents + v_total_money_cents,
    lifetime_merets = v_new_lifetime_merets,
    rep_score = v_new_rep_level,
    experience_hours = experience_hours + v_hours_earned,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Create notification
  INSERT INTO notifications (
    recipient_id,
    notification_type,
    title,
    message,
    commitment_id,
    submission_id,
    created_at
  ) VALUES (
    v_user_id,
    'submission_approved',
    'Task Approved! 🎉',
    'Great work! You earned $' || v_money_display || 
    ' and ' || v_total_merets || ' Merets' ||
    CASE WHEN p_bonus_tip_cents > 0 THEN ' (includes $' || v_tip_display || ' bonus tip!)' ELSE '' END ||
    CASE 
      WHEN v_new_rep_level > v_old_rep_level 
      THEN ' 🎊 Level up! You reached Rep Level ' || v_new_rep_level || '!'
      ELSE ''
    END,
    v_commitment_id,
    p_submission_id,
    NOW()
  );

  -- Return success with details
  RETURN json_build_object(
    'success', true,
    'money_earned_cents', v_total_money_cents,
    'merets_earned', v_total_merets,
    'hours_earned', v_hours_earned,
    'old_rep_level', v_old_rep_level,
    'new_rep_level', v_new_rep_level,
    'leveled_up', v_new_rep_level > v_old_rep_level
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error approving submission: %', SQLERRM;
END;
$$;
