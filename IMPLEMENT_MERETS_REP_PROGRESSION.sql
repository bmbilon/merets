-- Complete Merets and Rep Level Progression System
-- Based on: 1.06x exponential growth after level 30
-- Merets earned = (effort_minutes / 60) × quality_multiplier

-- Function: Calculate cumulative merets required to reach a given rep level
CREATE OR REPLACE FUNCTION merets_required_for_level(p_level INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_total NUMERIC := 0;
  v_merets_per_level NUMERIC;
  v_current_level INTEGER;
BEGIN
  IF p_level <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Levels 1-10: 1 meret each
  IF p_level <= 10 THEN
    RETURN p_level;
  END IF;
  v_total := 10;
  
  -- Levels 11-20: 2 merets each
  IF p_level <= 20 THEN
    RETURN v_total + (p_level - 10) * 2;
  END IF;
  v_total := v_total + 20;
  
  -- Levels 21-30: 4 merets each
  IF p_level <= 30 THEN
    RETURN v_total + (p_level - 20) * 4;
  END IF;
  v_total := v_total + 40;
  
  -- Levels 31+: 1.06x growth per level
  v_merets_per_level := 4;
  FOR v_current_level IN 31..p_level LOOP
    v_merets_per_level := v_merets_per_level * 1.06;
    v_total := v_total + v_merets_per_level;
  END LOOP;
  
  RETURN ROUND(v_total, 2);
END;
$$;

-- Function: Calculate rep level from cumulative merets
CREATE OR REPLACE FUNCTION calculate_rep_level_from_merets(p_total_merets NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  v_level INTEGER;
BEGIN
  -- Binary search would be more efficient, but linear is fine for 0-100
  FOR v_level IN 0..100 LOOP
    IF merets_required_for_level(v_level + 1) > p_total_merets THEN
      RETURN v_level;
    END IF;
  END LOOP;
  
  RETURN 100; -- Max level
END;
$$;

-- Update approve_submission to use the new merets calculation
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
  v_merets_earned NUMERIC;
  v_task_title TEXT;
  v_task_template_id UUID;
  v_reviewer_name TEXT;
  v_money_display TEXT;
  v_tip_display TEXT;
  v_old_total_merets NUMERIC;
  v_new_total_merets NUMERIC;
  v_old_rep_level INTEGER;
  v_new_rep_level INTEGER;
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
  v_merets_earned := ROUND((COALESCE(v_effort_minutes, 0)::NUMERIC / 60.0) * v_quality_multiplier, 2);

  -- Calculate total money
  v_total_money_cents := v_base_pay_cents + COALESCE(p_bonus_tip_cents, 0);

  -- Format money
  v_money_display := TRIM(TO_CHAR(v_total_money_cents / 100.0, 'FM999999990.00'));
  v_tip_display := TRIM(TO_CHAR(p_bonus_tip_cents / 100.0, 'FM999999990.00'));

  -- Get reviewer name
  IF p_reviewed_by IS NOT NULL THEN
    SELECT name INTO v_reviewer_name FROM user_profiles WHERE id = p_reviewed_by;
  END IF;

  -- Get user's current merets and rep level
  SELECT 
    COALESCE(lifetime_merets, 0),
    COALESCE(rep_score, 0)
  INTO 
    v_old_total_merets,
    v_old_rep_level
  FROM user_profiles
  WHERE id = v_user_id;

  -- Calculate new totals
  v_new_total_merets := v_old_total_merets + v_merets_earned;
  v_new_rep_level := calculate_rep_level_from_merets(v_new_total_merets);

  -- Update submission
  UPDATE commitment_submissions
  SET 
    submission_status = 'approved',
    quality_rating = p_quality_rating,
    bonus_tip_cents = COALESCE(p_bonus_tip_cents, 0),
    reviewer_notes = p_reviewer_notes,
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- Update commitment
  UPDATE commitments
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_commitment_id;

  -- Update user profile with merets and rep level
  UPDATE user_profiles
  SET 
    total_earnings_cents = total_earnings_cents + v_total_money_cents,
    merets_balance = merets_balance + v_merets_earned,
    lifetime_merets = v_new_total_merets,
    rep_score = v_new_rep_level,
    completed_commitments = completed_commitments + 1,
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
    '✅ Task Approved!',
    CASE 
      WHEN p_bonus_tip_cents > 0 THEN
        'Great job on "' || v_task_title || '"! ' || COALESCE(v_reviewer_name, 'Your parent') || 
        ' approved your work and gave you a $' || v_tip_display || 
        ' bonus tip! You earned $' || v_money_display || 
        ' total and ' || v_merets_earned || ' merets.' ||
        CASE WHEN v_new_rep_level > v_old_rep_level THEN ' 🎉 Rep level up to ' || v_new_rep_level || '!' ELSE '' END ||
        CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
      ELSE
        'Great job on "' || v_task_title || '"! ' || COALESCE(v_reviewer_name, 'Your parent') || 
        ' approved your work. You earned $' || v_money_display || 
        ' and ' || v_merets_earned || ' merets.' ||
        CASE WHEN v_new_rep_level > v_old_rep_level THEN ' 🎉 Rep level up to ' || v_new_rep_level || '!' ELSE '' END ||
        CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
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
      'merets_earned', v_merets_earned,
      'effort_minutes', v_effort_minutes,
      'quality_rating', p_quality_rating,
      'quality_multiplier', v_quality_multiplier,
      'old_rep_level', v_old_rep_level,
      'new_rep_level', v_new_rep_level,
      'bonus_tip_cents', p_bonus_tip_cents,
      'reviewer_notes', p_reviewer_notes
    ),
    'high'
  );

  RETURN json_build_object(
    'success', TRUE,
    'money_earned_cents', v_total_money_cents,
    'merets_earned', v_merets_earned,
    'old_rep_level', v_old_rep_level,
    'new_rep_level', v_new_rep_level,
    'leveled_up', v_new_rep_level > v_old_rep_level
  );
END;
$$;

-- Test queries to verify the progression
-- SELECT merets_required_for_level(10);  -- Should return 10
-- SELECT merets_required_for_level(20);  -- Should return 30
-- SELECT merets_required_for_level(50);  -- Should return ~226
-- SELECT merets_required_for_level(90);  -- Should return ~2330
-- SELECT calculate_rep_level_from_merets(10);  -- Should return 10
-- SELECT calculate_rep_level_from_merets(30);  -- Should return 20
-- SELECT calculate_rep_level_from_merets(226);  -- Should return 50
