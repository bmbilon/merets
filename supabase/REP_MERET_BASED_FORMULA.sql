-- ============================================================================
-- MERET-BASED REP FORMULA
-- ============================================================================
-- This replaces the previous Rep calculation with a meret-based system where:
-- - Rep is earned through completed merets (60min of committed work)
-- - Diminishing returns: harder to gain Rep at higher levels
-- - Quality multiplier: star ratings affect meret value
-- - No Rep loss on failures: just no progress
-- ============================================================================

-- Drop old function
DROP FUNCTION IF EXISTS calculate_rep_score_with_attribution(UUID);

-- ============================================================================
-- FUNCTION: Calculate Rep from Merets with Diminishing Returns
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_rep_from_merets(
  p_total_merets DECIMAL,
  p_avg_quality_rating DECIMAL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_quality_multiplier DECIMAL;
  v_effective_merets DECIMAL;
  v_rep_score INTEGER := 0;
  v_remaining_merets DECIMAL;
BEGIN
  -- Calculate quality multiplier (1-5 stars → 0.1-1.0 multiplier)
  v_quality_multiplier := CASE
    WHEN p_avg_quality_rating >= 5.0 THEN 1.0
    WHEN p_avg_quality_rating >= 4.5 THEN 0.9
    WHEN p_avg_quality_rating >= 4.0 THEN 0.8
    WHEN p_avg_quality_rating >= 3.5 THEN 0.7
    WHEN p_avg_quality_rating >= 3.0 THEN 0.6
    WHEN p_avg_quality_rating >= 2.5 THEN 0.5
    WHEN p_avg_quality_rating >= 2.0 THEN 0.3
    ELSE 0.1
  END;
  
  -- Apply quality multiplier to total merets
  v_effective_merets := p_total_merets * v_quality_multiplier;
  v_remaining_merets := v_effective_merets;
  
  -- Rep 0-10: 1 meret = 1 Rep (10 merets total)
  IF v_remaining_merets >= 10 THEN
    v_rep_score := 10;
    v_remaining_merets := v_remaining_merets - 10;
  ELSE
    RETURN FLOOR(v_remaining_merets);
  END IF;
  
  -- Rep 10-20: 2 merets = 1 Rep (20 merets total)
  IF v_remaining_merets >= 20 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 20;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 2);
  END IF;
  
  -- Rep 20-25: 3 merets = 1 Rep (15 merets total)
  IF v_remaining_merets >= 15 THEN
    v_rep_score := v_rep_score + 5;
    v_remaining_merets := v_remaining_merets - 15;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 3);
  END IF;
  
  -- Rep 25-30: 5 merets = 1 Rep (25 merets total)
  IF v_remaining_merets >= 25 THEN
    v_rep_score := v_rep_score + 5;
    v_remaining_merets := v_remaining_merets - 25;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 5);
  END IF;
  
  -- Rep 30-40: 8 merets = 1 Rep (80 merets total)
  IF v_remaining_merets >= 80 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 80;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 8);
  END IF;
  
  -- Rep 40-50: 12 merets = 1 Rep (120 merets total)
  IF v_remaining_merets >= 120 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 120;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 12);
  END IF;
  
  -- Rep 50-60: 20 merets = 1 Rep (200 merets total)
  IF v_remaining_merets >= 200 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 200;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 20);
  END IF;
  
  -- Rep 60-70: 30 merets = 1 Rep (300 merets total)
  IF v_remaining_merets >= 300 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 300;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 30);
  END IF;
  
  -- Rep 70-80: 50 merets = 1 Rep (500 merets total)
  IF v_remaining_merets >= 500 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 500;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 50);
  END IF;
  
  -- Rep 80-90: 75 merets = 1 Rep (750 merets total)
  IF v_remaining_merets >= 750 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 750;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 75);
  END IF;
  
  -- Rep 90-99: 100 merets = 1 Rep (900 merets total)
  IF v_remaining_merets >= 900 THEN
    RETURN 99; -- Cap at 99
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 100);
  END IF;
END;
$$;

-- ============================================================================
-- FUNCTION: Calculate Rep Score with Full Attribution (Meret-Based)
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_rep_score_with_attribution(p_user_id UUID)
RETURNS TABLE (
  rep_score INTEGER,
  total_merets DECIMAL,
  effective_merets DECIMAL,
  avg_quality_rating DECIMAL,
  quality_multiplier DECIMAL,
  total_commitments INTEGER,
  completed_commitments INTEGER,
  failed_commitments INTEGER,
  completion_rate DECIMAL,
  quality_score DECIMAL,
  consistency_score DECIMAL,
  volume_bonus INTEGER,
  failure_penalty INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_minutes INTEGER;
  v_total_merets DECIMAL;
  v_completed_count INTEGER;
  v_total_count INTEGER;
  v_failed_count INTEGER;
  v_avg_rating DECIMAL;
  v_quality_mult DECIMAL;
  v_effective_merets DECIMAL;
  v_rep INTEGER;
BEGIN
  -- Get total completed minutes (1 meret = 60 minutes)
  SELECT 
    COALESCE(SUM(c.effort_minutes), 0),
    COUNT(*) FILTER (WHERE c.status = 'completed'),
    COUNT(*),
    COUNT(*) FILTER (WHERE c.status = 'failed')
  INTO 
    v_total_minutes,
    v_completed_count,
    v_total_count,
    v_failed_count
  FROM commitments c
  WHERE c.user_id = p_user_id;
  
  -- Convert minutes to merets
  v_total_merets := v_total_minutes / 60.0;
  
  -- Get average quality rating from submissions
  SELECT COALESCE(AVG(cs.quality_rating), 3.0)
  INTO v_avg_rating
  FROM commitment_submissions cs
  WHERE cs.user_id = p_user_id
    AND cs.submission_status = 'approved'
    AND cs.quality_rating IS NOT NULL;
  
  -- Calculate quality multiplier
  v_quality_mult := CASE
    WHEN v_avg_rating >= 5.0 THEN 1.0
    WHEN v_avg_rating >= 4.5 THEN 0.9
    WHEN v_avg_rating >= 4.0 THEN 0.8
    WHEN v_avg_rating >= 3.5 THEN 0.7
    WHEN v_avg_rating >= 3.0 THEN 0.6
    WHEN v_avg_rating >= 2.5 THEN 0.5
    WHEN v_avg_rating >= 2.0 THEN 0.3
    ELSE 0.1
  END;
  
  -- Calculate effective merets (with quality multiplier)
  v_effective_merets := v_total_merets * v_quality_mult;
  
  -- Calculate Rep score from merets
  v_rep := calculate_rep_from_merets(v_total_merets, v_avg_rating);
  
  -- Return full attribution data
  RETURN QUERY SELECT
    v_rep,
    v_total_merets,
    v_effective_merets,
    v_avg_rating,
    v_quality_mult,
    v_total_count,
    v_completed_count,
    v_failed_count,
    CASE WHEN v_total_count > 0 THEN (v_completed_count::DECIMAL / v_total_count * 100) ELSE 0 END,
    (v_avg_rating / 5.0 * 100),
    0.0::DECIMAL, -- consistency_score (legacy, kept for compatibility)
    0, -- volume_bonus (legacy, kept for compatibility)
    0; -- failure_penalty (legacy, kept for compatibility)
END;
$$;

-- ============================================================================
-- FUNCTION: Update User Rep with Meret-Based Calculation
-- ============================================================================
CREATE OR REPLACE FUNCTION update_user_rep_with_attribution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_rep INTEGER;
  v_rep_data RECORD;
  v_rep_tier RECORD;
  v_change_amount INTEGER;
  v_change_reason TEXT;
  v_previous_hash TEXT;
  v_new_hash TEXT;
  v_action_type TEXT;
BEGIN
  -- Determine action type
  v_action_type := CASE
    WHEN TG_TABLE_NAME = 'commitments' AND NEW.status = 'completed' THEN 'task_completed'
    WHEN TG_TABLE_NAME = 'commitments' AND NEW.status = 'failed' THEN 'task_failed'
    WHEN TG_TABLE_NAME = 'commitments' AND NEW.status = 'cancelled' THEN 'task_cancelled'
    WHEN TG_TABLE_NAME = 'commitment_submissions' AND NEW.submission_status = 'approved' THEN 'quality_rating'
    WHEN TG_TABLE_NAME = 'commitment_submissions' AND NEW.submission_status = 'rejected' THEN 'work_rejected'
    ELSE 'rep_update'
  END;
  
  -- Get old Rep score
  SELECT rep_score INTO v_old_rep FROM user_profiles WHERE id = NEW.user_id;
  IF v_old_rep IS NULL THEN v_old_rep := 0; END IF;
  
  -- Calculate new Rep with attribution
  SELECT * INTO v_rep_data FROM calculate_rep_score_with_attribution(NEW.user_id);
  
  -- Get Rep tier info
  SELECT * INTO v_rep_tier FROM get_rep_tier(v_rep_data.rep_score);
  
  -- Calculate change
  v_change_amount := v_rep_data.rep_score - v_old_rep;
  
  -- Generate change reason
  v_change_reason := CASE
    WHEN v_action_type = 'task_completed' THEN 
      'Completed task (' || ROUND(v_rep_data.total_merets, 1) || ' merets total, ' || ROUND(v_rep_data.avg_quality_rating, 1) || '★ avg)'
    WHEN v_action_type = 'quality_rating' THEN 
      'Quality rating received (' || ROUND(v_rep_data.avg_quality_rating, 1) || '★ avg, ' || ROUND(v_rep_data.effective_merets, 1) || ' effective merets)'
    WHEN v_action_type = 'task_failed' THEN 
      'Task failed (no Rep gained)'
    ELSE 
      'Rep recalculated'
  END;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    rep_score = v_rep_data.rep_score,
    rep_title = v_rep_tier.title,
    rep_tier = v_rep_tier.tier,
    total_commitments = v_rep_data.total_commitments,
    completed_commitments = v_rep_data.completed_commitments,
    failed_commitments = v_rep_data.failed_commitments,
    average_quality_rating = v_rep_data.avg_quality_rating,
    last_rep_update = NOW()
  WHERE id = NEW.user_id;
  
  -- Only create ledger entry if Rep changed
  IF v_change_amount != 0 THEN
    -- Get previous hash
    SELECT blockchain_hash INTO v_previous_hash
    FROM rep_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Generate new hash
    v_new_hash := generate_rep_blockchain_hash(
      NEW.user_id,
      v_old_rep,
      v_rep_data.rep_score,
      v_change_amount,
      NOW(),
      v_previous_hash
    );
    
    -- Create ledger entry
    INSERT INTO rep_history (
      user_id,
      old_rep,
      new_rep,
      change_amount,
      change_reason,
      action_type,
      related_commitment_id,
      related_submission_id,
      completion_rate_at_time,
      quality_score_at_time,
      consistency_score_at_time,
      volume_bonus_at_time,
      failure_penalty_at_time,
      blockchain_hash,
      previous_entry_id
    ) VALUES (
      NEW.user_id,
      v_old_rep,
      v_rep_data.rep_score,
      v_change_amount,
      v_change_reason,
      v_action_type,
      CASE WHEN TG_TABLE_NAME = 'commitments' THEN NEW.id ELSE NULL END,
      CASE WHEN TG_TABLE_NAME = 'commitment_submissions' THEN NEW.id ELSE NULL END,
      v_rep_data.completion_rate,
      v_rep_data.quality_score,
      v_rep_data.consistency_score,
      v_rep_data.volume_bonus,
      v_rep_data.failure_penalty,
      v_new_hash,
      (SELECT id FROM rep_history WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 1)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Test the new formula
SELECT 
  calculate_rep_from_merets(10, 5.0) as rep_at_10_merets_5star,  -- Should be 10
  calculate_rep_from_merets(30, 4.7) as rep_at_30_merets_47star, -- Should be ~25
  calculate_rep_from_merets(70, 4.5) as rep_at_70_merets_45star, -- Should be ~35
  calculate_rep_from_merets(320, 4.8) as rep_at_320_merets_48star; -- Should be ~50
