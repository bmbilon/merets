-- ============================================================================
-- FIX REP TRACKING DECIMAL OVERFLOW
-- ============================================================================
-- Issue: average_quality_rating calculation causes overflow with DECIMAL(3,2)
-- Solution: Change to DECIMAL(5,2) AND rewrite calculation to be safer
-- Created: 2026-01-03
-- ============================================================================

-- Step 1: Change column type to allow larger intermediate values
ALTER TABLE user_profiles
ALTER COLUMN average_quality_rating TYPE DECIMAL(5,2);

ALTER TABLE user_profiles
ALTER COLUMN consistency_score TYPE DECIMAL(5,2);

-- Step 2: Recreate the trigger function with safer calculation
CREATE OR REPLACE FUNCTION update_rep_on_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_old_rep INTEGER;
  v_new_rep INTEGER;
  v_change_amount INTEGER;
  v_change_reason TEXT;
  v_previous_hash TEXT;
  v_new_hash TEXT;
BEGIN
  -- Determine user and reason based on which table triggered this
  IF TG_TABLE_NAME = 'commitments' THEN
    v_user_id := NEW.user_id;
    IF NEW.status = 'failed' OR NEW.status = 'cancelled' THEN
      v_change_reason := 'Commitment failed or cancelled';
      -- Increment failed count
      UPDATE user_profiles
      SET failed_commitments = failed_commitments + 1
      WHERE id = v_user_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'commitment_submissions' THEN
    v_user_id := (SELECT user_id FROM commitments WHERE id = NEW.commitment_id);
    IF NEW.submission_status = 'approved' THEN
      v_change_reason := 'Work approved with ' || NEW.quality_rating || ' stars';
      
      -- FIXED: Safer calculation that avoids overflow
      -- Instead of: (avg * count + new) / (count + 1)
      -- Use: avg + (new - avg) / (count + 1)
      -- This is mathematically equivalent but avoids large intermediate values
      UPDATE user_profiles
      SET 
        completed_commitments = completed_commitments + 1,
        average_quality_rating = average_quality_rating + 
          ((NEW.quality_rating - average_quality_rating) / (completed_commitments + 1)::DECIMAL(5,2))
      WHERE id = v_user_id;
    ELSIF NEW.submission_status = 'rejected' THEN
      v_change_reason := 'Work rejected';
    END IF;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Get current Rep
  SELECT rep_score INTO v_old_rep
  FROM user_profiles
  WHERE id = v_user_id;
  
  -- Calculate new Rep
  v_new_rep := calculate_rep_score(v_user_id);
  v_change_amount := v_new_rep - v_old_rep;
  
  -- Only update if Rep changed
  IF v_change_amount != 0 THEN
    -- Get previous blockchain hash
    SELECT blockchain_hash INTO v_previous_hash
    FROM rep_history
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Generate new blockchain hash
    v_new_hash := generate_rep_blockchain_hash(
      v_user_id,
      v_old_rep,
      v_new_rep,
      v_change_amount,
      v_change_reason,
      v_previous_hash
    );
    
    -- Update user's Rep score
    UPDATE user_profiles
    SET 
      rep_score = v_new_rep,
      last_rep_update = NOW()
    WHERE id = v_user_id;
    
    -- Record in Rep history
    INSERT INTO rep_history (
      user_id,
      old_rep,
      new_rep,
      change_amount,
      change_reason,
      related_commitment_id,
      related_submission_id,
      blockchain_hash,
      previous_hash
    ) VALUES (
      v_user_id,
      v_old_rep,
      v_new_rep,
      v_change_amount,
      v_change_reason,
      CASE WHEN TG_TABLE_NAME = 'commitments' THEN NEW.id ELSE NEW.commitment_id END,
      CASE WHEN TG_TABLE_NAME = 'commitment_submissions' THEN NEW.id ELSE NULL END,
      v_new_hash,
      v_previous_hash
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('average_quality_rating', 'consistency_score');
