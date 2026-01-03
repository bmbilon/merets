-- Minimal working fix - ONLY verified columns
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
    v_submission_committed_id UUID;
    v_submission_submitted_by UUID;
    v_submission_status TEXT;
    v_commitment_task_template_id UUID;
    v_task_base_merets DECIMAL(10,2);
    v_kid_balance DECIMAL(10,2);
    v_parent_balance DECIMAL(10,2);
    v_total_payment DECIMAL(10,2);
    v_xp_earned INTEGER;
BEGIN
    -- Get submission data
    SELECT commitment_id, submitted_by, submission_status
    INTO v_submission_committed_id, v_submission_submitted_by, v_submission_status
    FROM commitment_submissions
    WHERE id = p_submission_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Submission not found');
    END IF;
    
    IF v_submission_status NOT IN ('pending_approval', 'submitted') THEN
        RETURN json_build_object('success', false, 'error', 'Invalid status: ' || v_submission_status);
    END IF;
    
    -- Get task_template_id from commitment
    SELECT task_template_id INTO v_commitment_task_template_id
    FROM commitments
    WHERE id = v_submission_committed_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Commitment not found');
    END IF;
    
    -- Get base payment from task
    SELECT base_merets INTO v_task_base_merets
    FROM task_templates
    WHERE id = v_commitment_task_template_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Task template not found');
    END IF;
    
    -- Calculate payment
    v_total_payment := COALESCE(v_task_base_merets, 0) + (p_bonus_tip_cents::DECIMAL / 100.0);
    v_xp_earned := 10 + ((p_quality_rating - 3) * 5);
    
    -- Get balances
    SELECT merets_balance INTO v_kid_balance FROM user_profiles WHERE id = v_submission_submitted_by;
    SELECT merets_balance INTO v_parent_balance FROM user_profiles WHERE id = p_reviewer_id;
    
    IF v_parent_balance < v_total_payment THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
    
    -- Update submission
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
    
    -- Update commitment
    UPDATE commitments 
    SET status = 'completed', completed_at = NOW() 
    WHERE id = v_submission_committed_id;
    
    -- Transfer merets
    UPDATE user_profiles 
    SET merets_balance = merets_balance - v_total_payment, updated_at = NOW() 
    WHERE id = p_reviewer_id;
    
    UPDATE user_profiles 
    SET 
        merets_balance = merets_balance + v_total_payment,
        total_tasks_completed = COALESCE(total_tasks_completed, 0) + 1,
        total_merets_earned = COALESCE(total_merets_earned, 0) + v_total_payment,
        updated_at = NOW()
    WHERE id = v_submission_submitted_by;
    
    RETURN json_build_object(
        'success', true,
        'payment', v_total_payment,
        'xp_earned', v_xp_earned
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_submission TO authenticated, anon;

-- TEST IT
SELECT approve_submission(
    'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'::uuid,
    5,
    (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
    'Test',
    0
);
