-- Separate approval logic from rep calculation
-- Step 1: Approval function only handles approval, merets, and earnings
-- Step 2: Trigger automatically calculates rep when merets change

-- Drop old versions
DROP FUNCTION IF EXISTS approve_submission(uuid, integer, integer, text, uuid);
DROP FUNCTION IF EXISTS approve_submission(uuid, integer, uuid, text, integer);

-- ============================================================================
-- STEP 1: Approval Function (handles approval, merets, earnings)
-- ============================================================================
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
  -- Get commitment details from submission
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
  WHERE s.id = p_submission_id;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Calculate quality multiplier based on rating
  -- 5★=120%, 4★=100%, 3★=70%, 2★=40%, 1★=20%
  v_quality_multiplier := CASE p_quality_rating
    WHEN 5 THEN 1.20
    WHEN 4 THEN 1.00
    WHEN 3 THEN 0.70
    WHEN 2 THEN 0.40
    WHEN 1 THEN 0.20
    ELSE 1.00
  END;
  
  -- Calculate merets earned (time × quality multiplier)
  v_merets_earned := (v_effort_minutes / 60.0) * v_quality_multiplier;
  
  -- Calculate raw hours for EXPH (without quality multiplier)
  v_hours_earned := v_effort_minutes / 60.0;
  
  -- Calculate total pay (base + bonus)
  v_total_pay_cents := v_base_pay_cents + p_bonus_tip_cents;

  -- Update commitment status
  UPDATE commitments
  SET 
    status = 'completed'
  WHERE id = v_commitment_id;

  -- Update submission with approval details
  UPDATE commitment_submissions
  SET 
    submission_status = 'approved',
    quality_rating = p_quality_rating,
    bonus_tip_cents = p_bonus_tip_cents,
    reviewer_notes = p_reviewer_notes,
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW()
  WHERE id = p_submission_id;

  -- Update user profile stats (merets, earnings, quality average)
  -- NOTE: rep_score will be calculated automatically by trigger
  UPDATE user_profiles
  SET 
    lifetime_merets = COALESCE(lifetime_merets, 0) + v_merets_earned,
    experience_hours = COALESCE(experience_hours, 0) + v_hours_earned,
    total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_total_pay_cents,
    tasks_completed = COALESCE(tasks_completed, 0) + 1,
    average_quality_rating = (
      COALESCE(average_quality_rating, 0) * COALESCE(tasks_completed, 0) + p_quality_rating
    ) / (COALESCE(tasks_completed, 0) + 1)
  WHERE id = v_earner_id;
  -- Rep score will be updated by the auto_update_rep_from_merets trigger

  -- Create notification for earner
  -- Actual schema: recipient_id, notification_type, title, message, commitment_id, submission_id, action_type, action_data
  INSERT INTO notifications (recipient_id, notification_type, title, message, commitment_id, submission_id, action_type, action_data)
  VALUES (
    v_earner_id,
    'approval',
    'Task Approved! 🎉',
    format('Your task was approved with %s stars! You earned %.1f Merets and $%.2f', 
           p_quality_rating, 
           v_merets_earned,
           v_total_pay_cents / 100.0),
    v_commitment_id,
    p_submission_id,
    'view_commitment',
    jsonb_build_object('commitment_id', v_commitment_id, 'submission_id', p_submission_id)
  );

  RETURN QUERY SELECT TRUE, v_commitment_id, v_merets_earned;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Auto-calculate Rep from Merets (trigger function)
-- ============================================================================
-- This trigger automatically updates rep_score whenever lifetime_merets changes
-- Parents don't need to worry about rep calculation when approving

CREATE OR REPLACE FUNCTION auto_update_rep_from_merets()
RETURNS TRIGGER AS $$
DECLARE
  v_new_rep INTEGER;
BEGIN
  -- Only recalculate if lifetime_merets or average_quality_rating changed
  IF (NEW.lifetime_merets IS DISTINCT FROM OLD.lifetime_merets) OR 
     (NEW.average_quality_rating IS DISTINCT FROM OLD.average_quality_rating) THEN
    
    -- Calculate rep from merets (if the function exists)
    -- If calculate_rep_from_merets doesn't exist, use simple formula
    BEGIN
      v_new_rep := calculate_rep_from_merets(
        COALESCE(NEW.lifetime_merets, 0), 
        COALESCE(NEW.average_quality_rating, 3.0)
      );
    EXCEPTION WHEN undefined_function THEN
      -- Fallback: Simple formula if calculate_rep_from_merets doesn't exist
      -- 1 meret = 1 rep for first 10, then diminishing returns
      v_new_rep := LEAST(99, FLOOR(COALESCE(NEW.lifetime_merets, 0) / 2));
    END;
    
    -- Update rep score
    NEW.rep_score := v_new_rep;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_update_rep ON user_profiles;

-- Create trigger on user_profiles
CREATE TRIGGER trigger_auto_update_rep
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_rep_from_merets();

-- ============================================================================
-- DONE
-- ============================================================================
-- Now when a parent approves work:
-- 1. approve_submission() updates merets, earnings, quality average
-- 2. Trigger automatically calculates and updates rep_score
-- 3. Parent doesn't need to know anything about rep calculation
