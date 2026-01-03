-- ============================================================================
-- FIX: Parent Approval Flow - DECIMAL Overflow and Column Name Issues
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Fix approve_submission function with correct column names and types
CREATE OR REPLACE FUNCTION approve_submission(
    p_submission_id UUID,
    p_parent_id UUID,
    p_quality_rating INTEGER,
    p_bonus_tip_cents INTEGER DEFAULT 0,
    p_notes TEXT DEFAULT NULL
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
    
    IF v_submission.submission_status != 'submitted' THEN
        RAISE EXCEPTION 'Submission is not in submitted status';
    END IF;
    
    -- Get commitment details
    SELECT * INTO v_commitment
    FROM commitments
    WHERE id = v_submission.commitment_id;
    
    -- Get task details
    SELECT * INTO v_task
    FROM task_templates
    WHERE id = v_commitment.task_id;
    
    -- Calculate total payment (bonus_tip is in cents, convert to dollars)
    v_total_payment := v_task.base_reward + (p_bonus_tip_cents::DECIMAL / 100.0);
    
    -- Calculate XP (base 10 XP per task, bonus for quality)
    v_xp_earned := 10 + ((p_quality_rating - 3) * 5);
    
    -- Get current balances
    SELECT meret_balance INTO v_kid_balance
    FROM user_profiles
    WHERE user_id = v_submission.submitted_by;
    
    SELECT meret_balance INTO v_parent_balance
    FROM user_profiles
    WHERE user_id = p_parent_id;
    
    -- Check parent has sufficient balance
    IF v_parent_balance < v_total_payment THEN
        RAISE EXCEPTION 'Insufficient parent balance';
    END IF;
    
    -- Update submission status
    UPDATE commitment_submissions
    SET 
        submission_status = 'approved',
        quality_rating = p_quality_rating,
        bonus_tip_cents = p_bonus_tip_cents,
        reviewer_notes = p_notes,
        reviewed_at = NOW(),
        reviewed_by = p_parent_id,
        updated_at = NOW()
    WHERE id = p_submission_id;
    
    -- Transfer merets: parent -> kid
    UPDATE user_profiles
    SET 
        meret_balance = meret_balance - v_total_payment,
        updated_at = NOW()
    WHERE user_id = p_parent_id;
    
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
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix reject_submission function with correct column names
CREATE OR REPLACE FUNCTION reject_submission(
    p_submission_id UUID,
    p_parent_id UUID,
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
    
    IF v_submission.submission_status != 'submitted' THEN
        RAISE EXCEPTION 'Submission is not in submitted status';
    END IF;
    
    -- Update submission status
    UPDATE commitment_submissions
    SET 
        submission_status = 'rejected',
        reviewer_notes = p_rejection_reason,
        reviewed_at = NOW(),
        reviewed_by = p_parent_id,
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
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONE! Now test the approval flow in your app
-- ============================================================================
