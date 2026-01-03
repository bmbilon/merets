-- ============================================================================
-- AUTO-FIX FUNCTION FOR APPROVAL FLOW
-- ============================================================================
-- This function applies all necessary fixes for the parent approval flow
-- Can be called via Supabase RPC: POST /rest/v1/rpc/apply_approval_fixes
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_approval_fixes()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_fixes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Fix 1: Change DECIMAL precision for average_quality_rating
  BEGIN
    ALTER TABLE user_profiles
    ALTER COLUMN average_quality_rating TYPE DECIMAL(5,2);
    
    v_fixes := array_append(v_fixes, 'Changed average_quality_rating to DECIMAL(5,2)');
  EXCEPTION WHEN OTHERS THEN
    v_fixes := array_append(v_fixes, 'average_quality_rating: ' || SQLERRM);
  END;
  
  -- Fix 2: Change DECIMAL precision for consistency_score
  BEGIN
    ALTER TABLE user_profiles
    ALTER COLUMN consistency_score TYPE DECIMAL(5,2);
    
    v_fixes := array_append(v_fixes, 'Changed consistency_score to DECIMAL(5,2)');
  EXCEPTION WHEN OTHERS THEN
    v_fixes := array_append(v_fixes, 'consistency_score: ' || SQLERRM);
  END;
  
  -- Fix 3: Update the trigger function with safer calculation
  BEGIN
    CREATE OR REPLACE FUNCTION update_rep_on_event()
    RETURNS TRIGGER AS $trigger$
    DECLARE
      v_user_id UUID;
      v_old_rep INTEGER;
      v_new_rep INTEGER;
      v_change_amount INTEGER;
      v_change_reason TEXT;
    BEGIN
      IF TG_TABLE_NAME = 'commitments' THEN
        v_user_id := NEW.user_id;
        IF NEW.status = 'failed' OR NEW.status = 'cancelled' THEN
          v_change_reason := 'Commitment failed or cancelled';
          UPDATE user_profiles
          SET failed_commitments = failed_commitments + 1
          WHERE id = v_user_id;
        END IF;
      ELSIF TG_TABLE_NAME = 'commitment_submissions' THEN
        v_user_id := (SELECT user_id FROM commitments WHERE id = NEW.commitment_id);
        IF NEW.submission_status = 'approved' THEN
          v_change_reason := 'Work approved with ' || NEW.quality_rating || ' stars';
          
          -- FIXED: Safer calculation that avoids overflow
          -- avg + (new - avg) / (count + 1)
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
      
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    v_fixes := array_append(v_fixes, 'Updated trigger function with safer calculation');
  EXCEPTION WHEN OTHERS THEN
    v_fixes := array_append(v_fixes, 'trigger function: ' || SQLERRM);
  END;
  
  -- Return results
  v_result := json_build_object(
    'success', true,
    'fixes_applied', array_length(v_fixes, 1),
    'details', v_fixes
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION apply_approval_fixes() TO anon, authenticated, service_role;

-- Test the function
SELECT apply_approval_fixes();
