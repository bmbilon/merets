-- ============================================================================
-- FINAL COMPREHENSIVE FIX FOR ALL DECIMAL OVERFLOW ISSUES
-- ============================================================================
-- This SQL fixes ALL decimal precision issues in the approval flow
-- Run this ONCE in Supabase SQL Editor
-- ============================================================================

-- Step 1: Fix ALL DECIMAL(3,2) columns to DECIMAL(5,2)
-- ============================================================================

ALTER TABLE user_profiles
ALTER COLUMN average_quality_rating TYPE DECIMAL(5,2);

ALTER TABLE user_profiles
ALTER COLUMN consistency_score TYPE DECIMAL(5,2);

-- Step 2: Drop and recreate the trigger to ensure it's using the new function
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_rep_on_submission ON commitment_submissions;
DROP TRIGGER IF EXISTS trigger_update_rep_on_commitment ON commitments;

-- Step 3: Create a simplified trigger function that avoids overflow
-- ============================================================================

CREATE OR REPLACE FUNCTION update_rep_on_event()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Only handle commitment_submissions table
  IF TG_TABLE_NAME = 'commitment_submissions' THEN
    -- Get the user_id from the commitment
    SELECT user_id INTO v_user_id
    FROM commitments
    WHERE id = NEW.commitment_id;
    
    -- Only update on approval
    IF NEW.submission_status = 'approved' AND NEW.quality_rating IS NOT NULL THEN
      -- Update completed count and average rating using safe incremental formula
      -- Formula: new_avg = old_avg + (new_value - old_avg) / (count + 1)
      UPDATE user_profiles
      SET 
        completed_commitments = COALESCE(completed_commitments, 0) + 1,
        average_quality_rating = COALESCE(average_quality_rating, 0::DECIMAL(5,2)) + 
          ((NEW.quality_rating::DECIMAL(5,2) - COALESCE(average_quality_rating, 0::DECIMAL(5,2))) / 
           (COALESCE(completed_commitments, 0) + 1)::DECIMAL(5,2))
      WHERE id = v_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger
-- ============================================================================

CREATE TRIGGER trigger_update_rep_on_submission
AFTER UPDATE ON commitment_submissions
FOR EACH ROW
WHEN (NEW.submission_status = 'approved')
EXECUTE FUNCTION update_rep_on_event();

-- Step 5: Verify the fix
-- ============================================================================

SELECT 
  'Fix applied successfully!' as status,
  json_build_object(
    'average_quality_rating_type', pg_typeof(average_quality_rating)::text,
    'consistency_score_type', pg_typeof(consistency_score)::text
  ) as column_types
FROM user_profiles
LIMIT 1;
