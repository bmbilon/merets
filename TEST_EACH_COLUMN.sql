-- Test updating each column individually to find which causes overflow
-- Using a test function that returns results instead of ROLLBACK

CREATE OR REPLACE FUNCTION test_user_profile_updates()
RETURNS TABLE(test_name TEXT, result TEXT) AS $$
DECLARE
  v_kid_id UUID := '4be9f490-66e9-48ab-833d-9fade274504d';
BEGIN
  -- Test 1: total_earnings_cents
  BEGIN
    PERFORM total_earnings_cents + 900 FROM user_profiles WHERE id = v_kid_id;
    RETURN QUERY SELECT 'total_earnings_cents'::TEXT, 'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'total_earnings_cents'::TEXT, (SQLSTATE || ': ' || SQLERRM)::TEXT;
  END;
  
  -- Test 2: merets_balance
  BEGIN
    PERFORM merets_balance + 0.00 FROM user_profiles WHERE id = v_kid_id;
    RETURN QUERY SELECT 'merets_balance'::TEXT, 'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'merets_balance'::TEXT, (SQLSTATE || ': ' || SQLERRM)::TEXT;
  END;
  
  -- Test 3: lifetime_merets
  BEGIN
    PERFORM lifetime_merets + 0.00 FROM user_profiles WHERE id = v_kid_id;
    RETURN QUERY SELECT 'lifetime_merets'::TEXT, 'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'lifetime_merets'::TEXT, (SQLSTATE || ': ' || SQLERRM)::TEXT;
  END;
  
  -- Test 4: Calculate new average (the complex one)
  BEGIN
    PERFORM (
      (COALESCE(average_quality_rating, 0.0) * COALESCE(tasks_completed, 0) + 5::NUMERIC) 
      / (COALESCE(tasks_completed, 0) + 1)
    ) FROM user_profiles WHERE id = v_kid_id;
    RETURN QUERY SELECT 'average_quality_rating_calc'::TEXT, 'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'average_quality_rating_calc'::TEXT, (SQLSTATE || ': ' || SQLERRM)::TEXT;
  END;
  
  -- Test 5: Cast to NUMERIC(5,2)
  BEGIN
    PERFORM (
      (COALESCE(average_quality_rating, 0.0) * COALESCE(tasks_completed, 0) + 5::NUMERIC) 
      / (COALESCE(tasks_completed, 0) + 1)
    )::NUMERIC(5,2) FROM user_profiles WHERE id = v_kid_id;
    RETURN QUERY SELECT 'average_quality_rating_cast'::TEXT, 'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'average_quality_rating_cast'::TEXT, (SQLSTATE || ': ' || SQLERRM)::TEXT;
  END;
  
  -- Test 6: merets_balance + lifetime_merets cast
  BEGIN
    PERFORM (merets_balance + 0.00)::NUMERIC(12,2) FROM user_profiles WHERE id = v_kid_id;
    RETURN QUERY SELECT 'merets_balance_cast'::TEXT, 'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'merets_balance_cast'::TEXT, (SQLSTATE || ': ' || SQLERRM)::TEXT;
  END;
  
  -- Test 7: lifetime_merets cast
  BEGIN
    PERFORM (lifetime_merets + 0.00)::NUMERIC(12,2) FROM user_profiles WHERE id = v_kid_id;
    RETURN QUERY SELECT 'lifetime_merets_cast'::TEXT, 'SUCCESS'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'lifetime_merets_cast'::TEXT, (SQLSTATE || ': ' || SQLERRM)::TEXT;
  END;
  
END;
$$ LANGUAGE plpgsql;

-- Run the tests
SELECT * FROM test_user_profile_updates();

-- Clean up
DROP FUNCTION test_user_profile_updates();
