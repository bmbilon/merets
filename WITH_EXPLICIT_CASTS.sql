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
    v_commitment_pay_cents INTEGER;
    v_task_base_merets NUMERIC;
    v_merets_multiplier NUMERIC;
    v_merets_earned NUMERIC;
    v_total_money_cents INTEGER;
    v_current_tasks_completed INTEGER;
    v_current_avg_rating NUMERIC;
    v_new_avg_rating NUMERIC;
BEGIN
    SELECT commitment_id, submitted_by, submission_status
    INTO v_submission_commitment_id, v_submission_submitted_by, v_submission_status
    FROM commitment_submissions
    WHERE id = p_submission_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Submission not found');
    END IF;
    
    SELECT task_template_id, pay_cents
    INTO v_commitment_task_template_id, v_commitment_pay_cents
    FROM commitments
    WHERE id = v_submission_commitment_id;
    
    SELECT base_merets INTO v_task_base_merets
    FROM task_templates
    WHERE id = v_commitment_task_template_id;
    
    v_merets_multiplier := CASE p_quality_rating
        WHEN 5 THEN 1.5
        WHEN 4 THEN 1.25
        WHEN 3 THEN 1.0
        WHEN 2 THEN 0.75
        ELSE 0.5
    END;
    
    v_merets_earned := COALESCE(v_task_base_merets, 0) * v_merets_multiplier;
    v_total_money_cents := COALESCE(v_commitment_pay_cents, 0) + COALESCE(p_bonus_tip_cents, 0);
    
    SELECT tasks_completed, average_quality_rating
    INTO v_current_tasks_completed, v_current_avg_rating
    FROM user_profiles
    WHERE id = v_submission_submitted_by;
    
    v_new_avg_rating := (
        (COALESCE(v_current_avg_rating, 0.0) * COALESCE(v_current_tasks_completed, 0) + p_quality_rating::NUMERIC) 
        / (COALESCE(v_current_tasks_completed, 0) + 1)
    );
    
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
    
    UPDATE commitments 
    SET status = 'completed', completed_at = NOW() 
    WHERE id = v_submission_commitment_id;
    
    -- Explicit casts to match column types exactly
    UPDATE user_profiles 
    SET 
        total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_total_money_cents,
        merets_balance = (merets_balance + v_merets_earned)::NUMERIC(12,2),
        lifetime_merets = (lifetime_merets + v_merets_earned)::NUMERIC(12,2),
        tasks_completed = COALESCE(tasks_completed, 0) + 1,
        completed_commitments = COALESCE(completed_commitments, 0) + 1,
        average_quality_rating = v_new_avg_rating::NUMERIC(5,2),
        updated_at = NOW()
    WHERE id = v_submission_submitted_by;
    
    RETURN json_build_object(
        'success', true,
        'money_earned_cents', v_total_money_cents,
        'merets_earned', v_merets_earned
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'error_detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_submission TO authenticated, anon;

SELECT approve_submission(
    'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'::uuid,
    5,
    (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
    'Test',
    100
);
