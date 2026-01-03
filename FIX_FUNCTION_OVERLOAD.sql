-- Fix function overloading conflict by dropping all versions and creating one correct version

-- Drop both versions of the function
DROP FUNCTION IF EXISTS approve_submission(uuid, integer, integer, text, uuid);
DROP FUNCTION IF EXISTS approve_submission(uuid, integer, uuid, text, integer);

-- Create the correct version with proper parameter order
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
  v_total_pay_cents INTEGER;
  v_earner_id UUID;
BEGIN
  -- Get commitment details
  SELECT 
    c.id,
    c.effort_minutes,
    c.pay_cents,
    c.earner_id
  INTO 
    v_commitment_id,
    v_effort_minutes,
    v_base_pay_cents,
    v_earner_id
  FROM commitments c
  INNER JOIN submissions s ON s.commitment_id = c.id
  WHERE s.id = p_submission_id;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Calculate quality multiplier based on rating
  v_quality_multiplier := quality_multiplier_for_rating(p_quality_rating);
  
  -- Calculate merets earned (time × quality multiplier)
  v_merets_earned := (v_effort_minutes / 60.0) * v_quality_multiplier;
  
  -- Calculate total pay (base + bonus)
  v_total_pay_cents := v_base_pay_cents + p_bonus_tip_cents;

  -- Update commitment
  UPDATE commitments
  SET 
    status = 'approved',
    quality_rating = p_quality_rating,
    approved_at = NOW(),
    reviewed_by = p_reviewed_by,
    reviewer_notes = p_reviewer_notes,
    bonus_tip_cents = p_bonus_tip_cents,
    merets_earned = v_merets_earned,
    final_pay_cents = v_total_pay_cents
  WHERE id = v_commitment_id;

  -- Update submission status
  UPDATE submissions
  SET 
    status = 'approved',
    reviewed_at = NOW()
  WHERE id = p_submission_id;

  -- Update user profile stats
  UPDATE user_profiles
  SET 
    lifetime_merets = COALESCE(lifetime_merets, 0) + v_merets_earned,
    total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_total_pay_cents,
    rep_score = calculate_rep_level(COALESCE(lifetime_merets, 0) + v_merets_earned),
    tasks_completed = COALESCE(tasks_completed, 0) + 1,
    average_quality_rating = (
      COALESCE(average_quality_rating, 0) * COALESCE(tasks_completed, 0) + p_quality_rating
    ) / (COALESCE(tasks_completed, 0) + 1)
  WHERE id = v_earner_id;

  -- Create notification for earner
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (
    v_earner_id,
    'approval',
    'Task Approved! 🎉',
    format('Your task was approved with %s stars! You earned %.1f Merets and $%.2f', 
           p_quality_rating, 
           v_merets_earned,
           v_total_pay_cents / 100.0),
    v_commitment_id
  );

  RETURN QUERY SELECT TRUE, v_commitment_id, v_merets_earned;
END;
$$ LANGUAGE plpgsql;
