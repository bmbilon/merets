-- ============================================================================
-- FINAL FIX: Parent Approval Flow
-- Based on complete schema audit
-- ============================================================================
-- Schema facts discovered:
-- - commitment_submissions.commitment_id → commitments.id
-- - commitments.task_template_id → task_templates.id (NOT task_id!)
-- - commitment_submissions.submission_status = 'pending_approval'
-- - commitment_submissions.submitted_by (user who submitted)
-- - quality_rating and bonus_tip_cents are INTEGER
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS approve_submission(uuid,integer,uuid,text,integer);
DROP FUNCTION IF EXISTS reject_submission(uuid,uuid,text);

-- ============================================================================
-- approve_submission: Approve a submission and process payment
-- ============================================================================
CREATE FUNCTION approve_submission(
    p_submission_id UUID,
    p_quality_rating INTEGER,
    p_reviewer_id UUID,
    p_reviewer_notes TEXT DEFAULT NULL,
    p_bonus_tip_cents INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_submission commitment_submissions%ROWTYPE;
    v_commitment commitments%ROWTYPE;
    v_task task_templates%ROWTYPE;
    v_kid_balance DECIMAL(10,2);
    v_parent_balance DECIMAL(10,2);
    v_total_payment DECIMAL(10,2);
    v_xp_earned INTEGER;
    v_result JSON;
BEGIN
    -- Validate quality rating (1-5 scale)
    IF p_quality_rating < 1 OR p_quality_rating > 5 THEN
        RAISE EXCEPTION 'Quality rating must be between 1 and 5';
    END IF;
    
    -- Get submission details
    SELECT * INTO v_submission
    FROM commitment_submissions
    WHERE id = p_submission_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found';
    END IF;
    
    -- Check submission status (accept both pending_approval and submitted)
    IF v_submission.submission_status NOT IN ('pending_approval', 'submitted') THEN
        RAISE EXCEPTION 'Submission status is % (must be pending_approval or submitted)', v_submission.submission_status;
    END IF;
    
    -- Get commitment details
    SELECT * INTO v_commitment
    FROM commitments
    WHERE id = v_submission.commitment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commitment not found';
    END IF;
    
    -- Get task details using task_template_id (NOT task_id!)
    SELECT * INTO v_task
    FROM task_templates
    WHERE id = v_commitment.task_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task template not found';
    END IF;
    
    -- Calculate total payment (convert cents to dollars)
    v_total_payment := v_task.base_reward + (p_bonus_tip_cents::DECIMAL / 100.0);
    
    -- Calculate XP (base 10 XP per task, +/- 5 XP per star above/below 3)
    v_xp_earned := 10 + ((p_quality_rating - 3) * 5);
    
    -- Get current balances
    SELECT meret_balance INTO v_kid_balance
    FROM user_profiles
    WHERE user_id = v_submission.submitted_by;
    
    SELECT meret_balance INTO v_parent_balance
    FROM user_profiles
    WHERE user_id = p_reviewer_id;
    
    -- Check parent has sufficient balance
    IF v_parent_balance < v_total_payment THEN
        RAISE EXCEPTION 'Insufficient parent balance (has: %, needs: %)', v_parent_balance, v_total_payment;
    END IF;
    
    -- Update submission status
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
    
    -- Update commitment status to completed
    UPDATE commitments
    SET 
        status = 'completed',
        completed_at = NOW()
    WHERE id = v_submission.commitment_id;
    
    -- Transfer merets: parent -> kid
    UPDATE user_profiles
    SET 
        meret_balance = meret_balance - v_total_payment,
        updated_at = NOW()
    WHERE user_id = p_reviewer_id;
    
    UPDATE user_profiles
    SET 
        meret_balance = meret_balance + v_total_payment,
        xp = COALESCE(xp, 0) + v_xp_earned,
        total_tasks_completed = COALESCE(total_tasks_completed, 0) + 1,
        total_merets_earned = COALESCE(total_merets_earned, 0) + v_total_payment,
        updated_at = NOW()
    WHERE user_id = v_submission.submitted_by;
    
    -- Return result
    SELECT json_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'kid_id', v_submission.submitted_by,
        'payment', v_total_payment,
        'xp_earned', v_xp_earned,
        'new_kid_balance', v_kid_balance + v_total_payment,
        'new_parent_balance', v_parent_balance - v_total_payment
    ) INTO v_result;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details for debugging
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- reject_submission: Reject a submission and return commitment to in_progress
-- ============================================================================
CREATE FUNCTION reject_submission(
    p_submission_id UUID,
    p_reviewer_id UUID,
    p_rejection_reason TEXT
)
RETURNS JSON AS $$
DECLARE
    v_submission commitment_submissions%ROWTYPE;
    v_result JSON;
BEGIN
    -- Get submission details
    SELECT * INTO v_submission
    FROM commitment_submissions
    WHERE id = p_submission_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found';
    END IF;
    
    -- Check submission status
    IF v_submission.submission_status NOT IN ('pending_approval', 'submitted') THEN
        RAISE EXCEPTION 'Submission status is % (must be pending_approval or submitted)', v_submission.submission_status;
    END IF;
    
    -- Update submission status
    UPDATE commitment_submissions
    SET 
        submission_status = 'rejected',
        reviewer_notes = p_rejection_reason,
        reviewed_at = NOW(),
        reviewed_by = p_reviewer_id,
        updated_at = NOW()
    WHERE id = p_submission_id;
    
    -- Update commitment status back to in_progress
    UPDATE commitments
    SET status = 'in_progress'
    WHERE id = v_submission.commitment_id;
    
    -- Return result
    SELECT json_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'message', 'Submission rejected and returned to in progress'
    ) INTO v_result;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'error_detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant execute permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION approve_submission TO authenticated, anon;
GRANT EXECUTE ON FUNCTION reject_submission TO authenticated, anon;

-- ============================================================================
-- DONE! This should work with your actual schema
-- ============================================================================
