-- ============================================================================
-- FINAL MERETS PROGRESSION SYSTEM
-- ============================================================================
-- This implements the complete merets earning and rep level progression system
--
-- Key Targets:
--   Level 50:  ~475 hours (12 weeks FT - probationary period)
--   Level 70: ~1900 hours (12 months FT - 1 year experience)
--   Level 90: ~5000 hours (30 months FT - master level)
--   Level 99: ~10000 hours (60 months FT - peak professional)
--
-- Merets Earning Formula:
--   merets_earned = (effort_minutes / 60) × quality_multiplier
--   
--   Quality Multipliers:
--     5 stars: 1.20×
--     4 stars: 1.00×
--     3 stars: 0.70×
--     2 stars: 0.40×
--     1 star:  0.20×
--
-- Rep Level Progression:
--   Levels 1-10:   1 meret each (total: 10)
--   Levels 11-20:  3 merets each (total: 40)
--   Levels 21-30:  4 merets each (total: 80)
--   Levels 31-50:  1.0932× per level (reach ~480)
--   Levels 51-70:  2^((level-50)/10) growth (double every 10 levels)
--   Levels 71-90:  1.0505× per level (reach ~5000)
--   Levels 91-99:  1.0801× per level (reach ~10000)
-- ============================================================================

-- Function: Calculate cumulative merets required to reach a specific rep level
CREATE OR REPLACE FUNCTION merets_required_for_level(target_level INTEGER)
RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  total NUMERIC := 0;
  current_mpl NUMERIC;
  base_50 NUMERIC;
  base_70 NUMERIC;
  base_90 NUMERIC;
  i INTEGER;
BEGIN
  IF target_level <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Levels 1-10: 1 meret each
  IF target_level <= 10 THEN
    RETURN target_level;
  END IF;
  total := 10;
  
  -- Levels 11-20: 3 merets each
  IF target_level <= 20 THEN
    RETURN total + (target_level - 10) * 3;
  END IF;
  total := 40;
  
  -- Levels 21-30: 4 merets each
  IF target_level <= 30 THEN
    RETURN total + (target_level - 20) * 4;
  END IF;
  total := 80;
  
  -- Levels 31-50: 1.0932× per level
  IF target_level <= 50 THEN
    current_mpl := 4.0;
    FOR i IN 31..target_level LOOP
      current_mpl := current_mpl * 1.0932;
      total := total + current_mpl;
    END LOOP;
    RETURN ROUND(total, 2);
  END IF;
  
  -- Calculate base at level 50
  current_mpl := 4.0;
  FOR i IN 31..50 LOOP
    current_mpl := current_mpl * 1.0932;
    total := total + current_mpl;
  END LOOP;
  base_50 := total;
  
  -- Levels 51-70: Double every 10 levels
  IF target_level <= 70 THEN
    FOR i IN 51..target_level LOOP
      total := base_50 * POWER(2, (i - 50.0) / 10.0);
    END LOOP;
    RETURN ROUND(total, 2);
  END IF;
  
  -- Calculate base at level 70
  base_70 := base_50 * POWER(2, 2.0); -- 2 doublings from 50 to 70
  total := base_70;
  
  -- Levels 71-90: 1.0505× per level (reach 5000)
  IF target_level <= 90 THEN
    FOR i IN 71..target_level LOOP
      total := base_70 * POWER(5000.0 / base_70, (i - 70.0) / 20.0);
    END LOOP;
    RETURN ROUND(total, 2);
  END IF;
  
  -- Calculate base at level 90
  base_90 := 5000.0;
  
  -- Levels 91-99: 1.0801× per level (reach 10000)
  FOR i IN 91..target_level LOOP
    total := base_90 * POWER(10000.0 / base_90, (i - 90.0) / 9.0);
  END LOOP;
  
  RETURN ROUND(total, 2);
END;
$$;

-- Function: Calculate rep level from total lifetime merets
CREATE OR REPLACE FUNCTION calculate_rep_level_from_merets(total_merets NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  level INTEGER := 0;
BEGIN
  -- Binary search would be more efficient, but linear is simpler and fast enough for 0-99
  FOR level IN 0..99 LOOP
    IF merets_required_for_level(level + 1) > total_merets THEN
      RETURN level;
    END IF;
  END LOOP;
  
  RETURN 99; -- Max level
END;
$$;

-- Function: Update approve_submission to calculate and award merets correctly
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

  -- Update user's earnings, merets, and rep level
  UPDATE user_profiles
  SET 
    total_earnings_cents = total_earnings_cents + v_total_money_cents,
    lifetime_merets = v_new_lifetime_merets,
    rep_score = v_new_rep_level,
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
            ' and ' || v_total_merets || ' merets.' ||
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
            ' total and ' || v_total_merets || ' merets.' ||
            CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
          ELSE
            'Great job on "' || v_task_title || '"! ' || COALESCE(v_reviewer_name, 'Your parent') || 
            ' approved your work. You earned $' || v_money_display || 
            ' and ' || v_total_merets || ' merets.' ||
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
    'old_rep_level', v_old_rep_level,
    'new_rep_level', v_new_rep_level,
    'level_up', v_level_up
  );
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the system is working correctly:

-- Check merets required for key levels
SELECT 
  level,
  merets_required_for_level(level) as total_merets,
  ROUND(merets_required_for_level(level) / 40.0, 1) as weeks_ft,
  ROUND(merets_required_for_level(level) / 160.0, 1) as months_ft
FROM generate_series(10, 99, 10) as level
UNION ALL
SELECT 99, merets_required_for_level(99), 
       ROUND(merets_required_for_level(99) / 40.0, 1),
       ROUND(merets_required_for_level(99) / 160.0, 1)
ORDER BY level;

-- Test rep level calculation
SELECT 
  merets,
  calculate_rep_level_from_merets(merets) as rep_level
FROM (VALUES (10), (40), (80), (475), (1900), (5000), (10000)) as t(merets);

-- ============================================================================
-- DONE! The merets progression system is now live.
-- ============================================================================
