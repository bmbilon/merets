-- Debug version to find exactly where overflow happens

DROP FUNCTION IF EXISTS approve_submission(uuid,integer,uuid,text,integer);

CREATE FUNCTION approve_submission(
    p_submission_id UUID,
    p_quality_rating INTEGER,
    p_reviewer_id UUID,
    p_reviewer_notes TEXT DEFAULT NULL,
    p_bonus_tip_cents INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_submission_commitment_id UUID;
    v_submission_submitted_by UUID;
    v_submission_status TEXT;
    v_commitment_task_template_id UUID;
    v_task_base_merets NUMERIC;
    v_total_payment NUMERIC;
    v_bonus_dollars NUMERIC;
    v_current_tasks_completed INTEGER;
    v_current_avg_rating NUMERIC;
    v_new_avg_rating NUMERIC;
BEGIN
    RAISE NOTICE 'Step 1: Starting approval';
    
    -- Get submission data
    SELECT commitment_id, submitted_by, submission_status
    INTO v_submission_commitment_id, v_submission_submitted_by, v_submission_status
    FROM commitment_submissions
    WHERE id = p_submission_id;
    
    RAISE NOTICE 'Step 2: Got submission data';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Submission not found');
    END IF;
    
    -- Get task_template_id
    SELECT task_template_id INTO v_commitment_task_template_id
    FROM commitments
    WHERE id = v_submission_commitment_id;
    
    RAISE NOTICE 'Step 3: Got commitment data';
    
    -- Get base payment
    SELECT base_merets INTO v_task_base_merets
    FROM task_templates
    WHERE id = v_commitment_task_template_id;
    
    RAISE NOTICE 'Step 4: Got task base_merets = %', v_task_base_merets;
    
    -- Calculate payment
    v_bonus_dollars := (p_bonus_tip_cents::NUMERIC / 100.0);
    RAISE NOTICE 'Step 5: Calculated bonus_dollars = %', v_bonus_dollars;
    
    v_total_payment := COALESCE(v_task_base_merets, 0) + v_bonus_dollars;
    RAISE NOTICE 'Step 6: Calculated total_payment = %', v_total_payment;
    
    -- Get current stats
    SELECT tasks_completed, average_quality_rating
    INTO v_current_tasks_completed, v_current_avg_rating
    FROM user_profiles
    WHERE id = v_submission_submitted_by;
    
    RAISE NOTICE 'Step 7: Got current stats - tasks=%, avg=%', v_current_tasks_completed, v_current_avg_rating;
    
    -- Calculate new average
    v_new_avg_rating := (
        (COALESCE(v_current_avg_rating, 0.0) * COALESCE(v_current_tasks_completed, 0) + p_quality_rating::NUMERIC) 
        / (COALESCE(v_current_tasks_completed, 0) + 1)
    );
    
    RAISE NOTICE 'Step 8: Calculated new_avg_rating = %', v_new_avg_rating;
    
    -- Update submission
    RAISE NOTICE 'Step 9: About to update submission';
    UPDATE commitment_submissions
    SET 
        submission_status = 'approved',
        quality_rating = p_quality_rating,
        bonus_tip_cents = p_bonus_tip_cents,
        reviewer_notes = p_reviewer_notes,
        reviewed_at = NOW(),
        reviewed_by = p_reviewer_id,
        updated_at = NOW()
    WHERE id = p_submission_id;
    
    RAISE NOTICE 'Step 10: Updated submission, about to update commitment';
    
    -- Update commitment
    UPDATE commitments 
    SET status = 'completed', completed_at = NOW() 
    WHERE id = v_submission_commitment_id;
    
    RAISE NOTICE 'Step 11: Updated commitment, about to update parent balance';
    
    -- Transfer merets
    UPDATE user_profiles 
    SET merets_balance = merets_balance - v_total_payment, updated_at = NOW() 
    WHERE id = p_reviewer_id;
    
    RAISE NOTICE 'Step 12: Updated parent, about to update kid';
    
    -- Update kid
    UPDATE user_profiles 
    SET 
        merets_balance = merets_balance + v_total_payment,
        lifetime_merets = lifetime_merets + v_total_payment,
        tasks_completed = COALESCE(tasks_completed, 0) + 1,
        completed_commitments = COALESCE(completed_commitments, 0) + 1,
        average_quality_rating = v_new_avg_rating,
        updated_at = NOW()
    WHERE id = v_submission_submitted_by;
    
    RAISE NOTICE 'Step 13: Success!';
    
    RETURN json_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR at step: %', SQLERRM;
        RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test and show notices
DO $$
DECLARE
    result JSON;
BEGIN
    result := approve_submission(
        'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'::uuid,
        5,
        (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
        'Test',
        0
    );
    RAISE NOTICE 'Final result: %', result;
END $$;
