-- ============================================================================
-- COMPLETE DATABASE UPDATE FOR EXPH AND MERETS SYSTEM
-- ============================================================================
-- Run this entire file in Supabase SQL Editor
-- This will:
--   1. Add experience_hours field
--   2. Calculate EXPH from existing completed tasks
--   3. Update approve_submission() function
--   4. Set consistent test data for Onyx and Aveya
-- ============================================================================

-- ============================================================================
-- PART 1: ADD EXPH FIELD
-- ============================================================================

-- Add the experience_hours field to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS experience_hours NUMERIC DEFAULT 0;

-- Calculate and set EXPH for existing users based on completed tasks
UPDATE user_profiles up
SET experience_hours = (
  SELECT COALESCE(SUM(c.effort_minutes / 60.0), 0)
  FROM commitments c
  WHERE c.user_id = up.id
    AND c.status = 'completed'
);

-- ============================================================================
-- PART 2: UPDATE APPROVE_SUBMISSION FUNCTION
-- ============================================================================

-- Update the approve_submission function to also increment experience_hours
CREATE OR REPLACE FUNCTION approve_submission(
  p_submission_id UUID,
  p_quality_rating INTEGER,
  p_bonus_tip_cents INTEGER DEFAULT 0,
  p_reviewer_notes TEXT DEFAULT NULL,
  p_reviewed_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_commitment_id UUID;
  v_user_id UUID;
  v_base_pay_cents INTEGER;
  v_effort_minutes INTEGER;
  v_quality_multiplier NUMERIC;
  v_total_money_cents INTEGER;
  v_total_merets NUMERIC;
  v_task_title TEXT;
  v_task_template_id UUID;
  v_reviewer_name TEXT;
  v_money_display TEXT;
  v_tip_display TEXT;
  v_old_rep_level INTEGER;
  v_new_rep_level INTEGER;
  v_old_lifetime_merets NUMERIC;
  v_new_lifetime_merets NUMERIC;
  v_level_up BOOLEAN := FALSE;
  v_hours_earned NUMERIC;
BEGIN
  -- Get commitment details
  SELECT 
    cs.commitment_id,
    c.user_id,
    c.pay_cents,
    c.effort_minutes,
    c.task_template_id,
    COALESCE(tt.title, c.custom_title, 'Task')
  INTO 
    v_commitment_id,
    v_user_id,
    v_base_pay_cents,
    v_effort_minutes,
    v_task_template_id,
    v_task_title
  FROM commitment_submissions cs
  JOIN commitments c ON c.id = cs.commitment_id
  LEFT JOIN task_templates tt ON tt.id = c.task_template_id
  WHERE cs.id = p_submission_id;

  -- Calculate quality multiplier based on star rating
  v_quality_multiplier := CASE p_quality_rating
    WHEN 5 THEN 1.20
    WHEN 4 THEN 1.00
    WHEN 3 THEN 0.70
    WHEN 2 THEN 0.40
    ELSE 0.20
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
  v_new_rep_level := calculate_rep_level_from_merets(v_new_lifetime_merets);
  v_level_up := (v_new_rep_level > v_old_rep_level);

  -- Update submission status
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

  -- Update commitment status
  UPDATE commitments
  SET 
    status = 'completed',
    completed_at = NOW(),
    quality_rating = CAST(p_quality_rating AS VARCHAR),
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
    task_template_id,
    read,
    archived,
    action_type,
    action_data,
    priority
  ) VALUES (
    v_user_id,
    'work_approved',
    '✅ Task Approved!' || CASE WHEN v_level_up THEN ' 🎉 Level Up!' ELSE '' END,
    CASE 
      WHEN v_level_up THEN
        CASE 
          WHEN p_bonus_tip_cents > 0 THEN
            'Amazing! You leveled up to Rep Level ' || v_new_rep_level || '! ' ||
            COALESCE(v_reviewer_name, 'Your parent') || ' approved "' || v_task_title || 
            '" and gave you a $' || v_tip_display || ' bonus tip! You earned $' || v_money_display || 
            ' and ' || v_total_merets || ' Merets.' ||
            CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
          ELSE
            'Congratulations! You leveled up to Rep Level ' || v_new_rep_level || '! ' ||
            COALESCE(v_reviewer_name, 'Your parent') || ' approved "' || v_task_title || 
            '". You earned $' || v_money_display || ' and ' || v_total_merets || ' merets.' ||
            CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
        END
      ELSE
        CASE 
          WHEN p_bonus_tip_cents > 0 THEN
            'Great job on "' || v_task_title || '"! ' || COALESCE(v_reviewer_name, 'Your parent') || 
            ' approved your work and gave you a $' || v_tip_display || 
            ' bonus tip! You earned $' || v_money_display || 
            ' total and ' || v_total_merets || ' Merets.' ||
            CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
          ELSE
            'Great job on "' || v_task_title || '"! ' || COALESCE(v_reviewer_name, 'Your parent') || 
            ' approved your work. You earned $' || v_money_display || 
            ' and ' || v_total_merets || ' Merets.' ||
            CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
        END
    END,
    v_commitment_id,
    p_submission_id,
    v_task_template_id,
    FALSE,
    FALSE,
    'view_task',
    jsonb_build_object(
      'commitment_id', v_commitment_id,
      'submission_id', p_submission_id,
      'money_earned_cents', v_total_money_cents,
      'merets_earned', v_total_merets,
      'effort_minutes', v_effort_minutes,
      'quality_rating', p_quality_rating,
      'quality_multiplier', v_quality_multiplier,
      'bonus_tip_cents', p_bonus_tip_cents,
      'reviewer_notes', p_reviewer_notes,
      'old_rep_level', v_old_rep_level,
      'new_rep_level', v_new_rep_level,
      'level_up', v_level_up
    ),
    CASE WHEN v_level_up THEN 'urgent' ELSE 'high' END
  );

  -- Return success with earnings and level info
  RETURN json_build_object(
    'success', TRUE,
    'money_earned_cents', v_total_money_cents,
    'merets_earned', v_total_merets,
    'hours_earned', v_hours_earned,
    'old_rep_level', v_old_rep_level,
    'new_rep_level', v_new_rep_level,
    'level_up', v_level_up
  );
END;
$$;

-- ============================================================================
-- PART 3: SET CONSISTENT TEST DATA
-- ============================================================================

-- Update Aveya (Rep Level 24)
UPDATE user_profiles
SET 
  rep_score = 24,
  lifetime_merets = 56,
  average_quality_rating = 4.5,
  experience_hours = 50.91,
  total_earnings_cents = 91636,  -- $916.36 (50.91 hours × $18/hr)
  updated_at = NOW()
WHERE name = 'Aveya';

-- Update Onyx (Rep Level 22)
UPDATE user_profiles
SET 
  rep_score = 22,
  lifetime_merets = 48,
  average_quality_rating = 4.5,
  experience_hours = 43.64,
  total_earnings_cents = 78545,  -- $785.45 (43.64 hours × $18/hr)
  updated_at = NOW()
WHERE name = 'Onyx';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the updates
SELECT 
  name,
  rep_score,
  lifetime_merets,
  experience_hours as exph,
  average_quality_rating,
  total_earnings_cents / 100.0 as total_earnings_dollars,
  ROUND((total_earnings_cents / 100.0) / experience_hours, 2) as implied_hourly_rate
FROM user_profiles
WHERE name IN ('Onyx', 'Aveya')
ORDER BY name;

-- Expected output:
-- Onyx:  22, 48, 43.64, 4.5, $785.45, $18.00/hr
-- Aveya: 24, 56, 50.91, 4.5, $916.36, $18.00/hr
