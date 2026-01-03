-- Test each UPDATE from the approve_submission function individually
-- All wrapped in BEGIN/ROLLBACK so no data is changed

-- Test 1: Update commitment_submissions
DO $$
BEGIN
  BEGIN
    UPDATE commitment_submissions
    SET 
        submission_status = 'approved',
        quality_rating = 5,
        bonus_tip_cents = 100,
        reviewer_notes = 'Test',
        reviewed_at = NOW(),
        reviewed_by = (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
        updated_at = NOW()
    WHERE id = 'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b';
    RAISE NOTICE 'Test 1: commitment_submissions UPDATE - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 1: commitment_submissions UPDATE - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
END $$;

-- Test 2: Update commitments
DO $$
BEGIN
  BEGIN
    UPDATE commitments 
    SET status = 'completed', completed_at = NOW() 
    WHERE id = '68098873-bc51-43fe-94ab-b12d11f9d106';
    RAISE NOTICE 'Test 2: commitments UPDATE - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 2: commitments UPDATE - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
END $$;

-- Test 3: Update user_profiles with actual values
DO $$
DECLARE
  v_kid_id UUID := '4be9f490-66e9-48ab-833d-9fade274504d';
  v_merets_earned NUMERIC := 0.00;
  v_total_money_cents INTEGER := 900;
  v_new_avg_rating NUMERIC := 5.00;
BEGIN
  BEGIN
    UPDATE user_profiles 
    SET 
        total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_total_money_cents,
        merets_balance = merets_balance + v_merets_earned,
        lifetime_merets = lifetime_merets + v_merets_earned,
        tasks_completed = COALESCE(tasks_completed, 0) + 1,
        completed_commitments = COALESCE(completed_commitments, 0) + 1,
        average_quality_rating = v_new_avg_rating,
        updated_at = NOW()
    WHERE id = v_kid_id;
    RAISE NOTICE 'Test 3: user_profiles UPDATE - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 3: user_profiles UPDATE - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
END $$;

-- Test 4: Update user_profiles one column at a time
DO $$
DECLARE
  v_kid_id UUID := '4be9f490-66e9-48ab-833d-9fade274504d';
BEGIN
  -- Test total_earnings_cents
  BEGIN
    UPDATE user_profiles SET total_earnings_cents = COALESCE(total_earnings_cents, 0) + 900 WHERE id = v_kid_id;
    RAISE NOTICE 'Test 4a: total_earnings_cents - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 4a: total_earnings_cents - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
  
  -- Test merets_balance
  BEGIN
    UPDATE user_profiles SET merets_balance = merets_balance + 0.00 WHERE id = v_kid_id;
    RAISE NOTICE 'Test 4b: merets_balance - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 4b: merets_balance - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
  
  -- Test lifetime_merets
  BEGIN
    UPDATE user_profiles SET lifetime_merets = lifetime_merets + 0.00 WHERE id = v_kid_id;
    RAISE NOTICE 'Test 4c: lifetime_merets - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 4c: lifetime_merets - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
  
  -- Test tasks_completed
  BEGIN
    UPDATE user_profiles SET tasks_completed = COALESCE(tasks_completed, 0) + 1 WHERE id = v_kid_id;
    RAISE NOTICE 'Test 4d: tasks_completed - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 4d: tasks_completed - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
  
  -- Test completed_commitments
  BEGIN
    UPDATE user_profiles SET completed_commitments = COALESCE(completed_commitments, 0) + 1 WHERE id = v_kid_id;
    RAISE NOTICE 'Test 4e: completed_commitments - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 4e: completed_commitments - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
  
  -- Test average_quality_rating
  BEGIN
    UPDATE user_profiles SET average_quality_rating = 5.00 WHERE id = v_kid_id;
    RAISE NOTICE 'Test 4f: average_quality_rating - SUCCESS';
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test 4f: average_quality_rating - FAILED: % %', SQLSTATE, SQLERRM;
    ROLLBACK;
  END;
END $$;
