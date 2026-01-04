-- ============================================================================
-- OPTIONAL: Switch approve_submission to use canonical types
-- ============================================================================
-- 
-- PREREQUISITE: Run 20260104_expand_notification_types.sql FIRST
-- 
-- This changes the function to use 'task_approved' instead of 'work_approved'
-- Only run this AFTER the constraint migration is complete
-- ============================================================================

DROP FUNCTION IF EXISTS approve_submission(uuid, integer, uuid, text, integer);

CREATE OR REPLACE FUNCTION approve_submission(
  p_submission_id UUID,
  p_quality_rating INTEGER,
  p_reviewed_by UUID,
  p_reviewer_notes TEXT DEFAULT '',
  p_bonus_tip_cents INTEGER DEFAULT 0
)
RETURNS TABLE (
  success BOOLEAN,
  commitment_id UUID,
  merets_earned NUMERIC
) AS $$
DECLARE
  v_commitment_id UUID;
  v_effort_minutes INTEGER;
  v_base_pay_cents INTEGER;
  v_quality_multiplier NUMERIC;
  v_merets_earned NUMERIC;
  v_hours_earned NUMERIC;
  v_total_pay_cents INTEGER;
  v_earner_id UUID;
BEGIN
  -- Input validation
  IF p_quality_rating < 1 OR p_quality_rating > 5 THEN
    RAISE EXCEPTION 'quality_rating must be between 1 and 5';
  END IF;

  IF p_bonus_tip_cents < 0 THEN
    RAISE EXCEPTION 'bonus_tip_cents cannot be negative';
  END IF;

  IF p_reviewed_by IS NULL THEN
    RAISE EXCEPTION 'reviewed_by cannot be null';
  END IF;

  -- Get commitment details (with row lock)
  SELECT
    c.id,
    c.effort_minutes,
    c.pay_cents,
    c.user_id
  INTO
    v_commitment_id,
    v_effort_minutes,
    v_base_pay_cents,
    v_earner_id
  FROM commitments c
  INNER JOIN commitment_submissions s ON s.commitment_id = c.id
  WHERE s.id = p_submission_id
  FOR UPDATE;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Calculate quality multiplier
  v_quality_multiplier := CASE p_quality_rating
    WHEN 5 THEN 1.20
    WHEN 4 THEN 1.00
    WHEN 3 THEN 0.70
    WHEN 2 THEN 0.40
    WHEN 1 THEN 0.20
    ELSE 1.00
  END;

  v_merets_earned := (v_effort_minutes / 60.0) * v_quality_multiplier;
  v_hours_earned := v_effort_minutes / 60.0;
  v_total_pay_cents := v_base_pay_cents + p_bonus_tip_cents;

  -- APPROVE SUBMISSION (idempotent)
  UPDATE commitment_submissions
  SET
    submission_status = 'approved',
    quality_rating = p_quality_rating,
    bonus_tip_cents = p_bonus_tip_cents,
    reviewer_notes = p_reviewer_notes,
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id
    AND submission_status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission is not pending approval (already reviewed?)';
  END IF;

  -- Update commitment
  UPDATE commitments
  SET
    status = 'completed',
    time_completed = NOW(),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_commitment_id
    AND status <> 'completed';

  -- Update user stats
  UPDATE user_profiles
  SET
    lifetime_merets = COALESCE(lifetime_merets, 0) + v_merets_earned,
    experience_hours = COALESCE(experience_hours, 0) + v_hours_earned,
    total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_total_pay_cents,
    tasks_completed = COALESCE(tasks_completed, 0) + 1,
    average_quality_rating = (
      COALESCE(average_quality_rating, 0) * COALESCE(tasks_completed, 0) + p_quality_rating
    ) / (COALESCE(tasks_completed, 0) + 1),
    updated_at = NOW()
  WHERE id = v_earner_id;

  -- Notification (using CANONICAL type: task_approved)
  INSERT INTO notifications (
    recipient_id,
    notification_type,
    title,
    message,
    commitment_id,
    submission_id,
    action_type,
    action_data
  ) VALUES (
    v_earner_id,
    'task_approved',  -- ← CANONICAL TYPE
    'Task Approved! 🎉',
    format(
      'Your task was approved with %s stars! You earned %s Merets and $%s',
      p_quality_rating,
      ROUND(v_merets_earned, 1),
      ROUND(v_total_pay_cents / 100.0, 2)
    ),
    v_commitment_id,
    p_submission_id,
    'view_task',
    jsonb_build_object(
      'commitment_id', v_commitment_id,
      'submission_id', p_submission_id,
      'merets_earned', v_merets_earned,
      'money_earned_cents', v_total_pay_cents,
      'quality_rating', p_quality_rating
    )
  );

  RETURN QUERY SELECT TRUE, v_commitment_id, v_merets_earned;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ONLY RUN THIS AFTER:
-- 1. Running 20260104_expand_notification_types.sql
-- 2. Verifying constraint includes 'task_approved'
-- ============================================================================
