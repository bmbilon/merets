-- ============================================================================
-- WORKING APPROVAL FIX - Based on verified schema
-- ============================================================================
-- Schema verified:
-- user_profiles.merets_balance = NUMERIC(12,2)
-- user_profiles.total_xp = INTEGER
-- user_profiles.tasks_completed = INTEGER
-- user_profiles.lifetime_merets = NUMERIC(12,2)
-- user_profiles.average_quality_rating = NUMERIC(5,2) - max 999.99
-- user_profiles.consistency_score = NUMERIC(5,2) - max 999.99
-- task_templates.base_merets = NUMERIC(8,2)
-- ============================================================================

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
    v_task_base_merets NUMERIC(8,2);
    v_kid_balance NUMERIC(12,2);
    v_parent_balance NUMERIC(12,2);
    v_total_payment NUMERIC(12,2);
    v_bonus_dollars NUMERIC(12,2);
    v_current_tasks_completed INTEGER;
    v_current_avg_rating NUMERIC(5,2);
    v_new_avg_rating NUMERIC(5,2);
BEGIN
    -- Validate quality rating
    IF p_quality_rating < 1 OR p_quality_rating > 5 THEN
        RETURN json_build_object('success', false, 'error', 'Quality rating must be between 1 and 5');
    END IF;
    
    -- Get submission data
    SELECT commitment_id, submitted_by, submission_status
    INTO v_submission_commitment_id, v_submission_submitted_by, v_submission_status
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
    WHERE id = v_submission_commitment_id;
    
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
    
    -- Calculate payment (bonus is in cents, convert to dollars)
    v_bonus_dollars := (p_bonus_tip_cents::NUMERIC / 100.0);
    v_total_payment := COALESCE(v_task_base_merets, 0) + v_bonus_dollars;
    
    -- Get balances
    SELECT merets_balance INTO v_kid_balance FROM user_profiles WHERE id = v_submission_submitted_by;
    SELECT merets_balance INTO v_parent_balance FROM user_profiles WHERE id = p_reviewer_id;
    
    IF v_parent_balance < v_total_payment THEN
        RETURN json_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
    
    -- Get current stats for average calculation
    SELECT tasks_completed, average_quality_rating
    INTO v_current_tasks_completed, v_current_avg_rating
    FROM user_profiles
    WHERE id = v_submission_submitted_by;
    
    -- Calculate new average rating (safe for NUMERIC(5,2))
    -- Formula: (old_avg * old_count + new_rating) / (old_count + 1)
    -- But we need to ensure result fits in NUMERIC(5,2) which maxes at 999.99
    -- Since ratings are 1-5, average will always be 1-5, so this is safe
    v_new_avg_rating := (
        (COALESCE(v_current_avg_rating, 0.0) * COALESCE(v_current_tasks_completed, 0) + p_quality_rating::NUMERIC) 
        / (COALESCE(v_current_tasks_completed, 0) + 1)
    );
    
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
    WHERE id = v_submission_commitment_id;
    
    -- Transfer merets: parent -> kid
    UPDATE user_profiles 
    SET merets_balance = merets_balance - v_total_payment, updated_at = NOW() 
    WHERE id = p_reviewer_id;
    
    -- Update kid profile
    UPDATE user_profiles 
    SET 
        merets_balance = merets_balance + v_total_payment,
        lifetime_merets = lifetime_merets + v_total_payment,
        tasks_completed = COALESCE(tasks_completed, 0) + 1,
        completed_commitments = COALESCE(completed_commitments, 0) + 1,
        average_quality_rating = v_new_avg_rating,
        updated_at = NOW()
    WHERE id = v_submission_submitted_by;
    
    RETURN json_build_object(
        'success', true,
        'payment', v_total_payment,
        'new_kid_balance', v_kid_balance + v_total_payment,
        'new_parent_balance', v_parent_balance - v_total_payment
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION approve_submission TO authenticated, anon;

-- ============================================================================
-- TEST
-- ============================================================================
SELECT approve_submission(
    'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'::uuid,
    5,
    (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
    'Test approval',
    0
);
