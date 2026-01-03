-- Migration: Fix DECIMAL overflow in trigger functions
-- Date: 2026-01-03
-- Issue: Triggers use DECIMAL(3,2) causing overflow when values exceed 9.99
-- Fix: Change all DECIMAL(3,2) to DECIMAL(5,2) in trigger function variable declarations

-- ============================================================================
-- STEP 1: Fix update_rep_on_event trigger function
-- This calculates reputation metrics and was using DECIMAL(3,2)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_rep_on_event()
RETURNS TRIGGER AS $$
DECLARE
    v_task_reward DECIMAL(10,2);
    v_quality_rating DECIMAL(5,2);
    v_bonus_tip DECIMAL(10,2);
    v_total_earned DECIMAL(10,2);
    v_task_urgency DECIMAL(5,2);
    v_quality_avg DECIMAL(5,2);
    v_volume_bonus DECIMAL(5,2);
    v_consistency_score DECIMAL(5,2);
    v_current_streak INTEGER;
    v_max_streak INTEGER;
BEGIN
    -- Only process approved submissions
    IF NEW.submission_status = 'approved' AND (OLD.submission_status IS NULL OR OLD.submission_status != 'approved') THEN
        
        -- Get task details
        SELECT base_reward, urgency_multiplier
        INTO v_task_reward, v_task_urgency
        FROM task_templates
        WHERE id = (SELECT task_id FROM commitments WHERE id = NEW.commitment_id);
        
        -- Get submission details (convert cents to dollars for bonus_tip)
        v_quality_rating := COALESCE(NEW.quality_rating::DECIMAL, 3.0);
        v_bonus_tip := COALESCE(NEW.bonus_tip_cents::DECIMAL / 100.0, 0.0);
        v_total_earned := v_task_reward + v_bonus_tip;
        
        -- Calculate quality average (normalize to 0-1 scale, quality_rating is 1-5)
        v_quality_avg := v_quality_rating / 5.0;
        
        -- Calculate volume bonus (cap at 2.0)
        v_volume_bonus := LEAST(2.0, (v_total_earned / 100.0));
        
        -- Get current streak info
        SELECT current_streak, max_streak
        INTO v_current_streak, v_max_streak
        FROM user_profiles
        WHERE user_id = NEW.submitted_by;
        
        -- Calculate consistency score based on streak (cap at 2.0)
        v_consistency_score := LEAST(2.0, 1.0 + (COALESCE(v_current_streak, 0)::DECIMAL / 30.0));
        
        -- Insert reputation event
        INSERT INTO rep_events (
            user_id,
            event_type,
            task_id,
            commitment_id,
            quality_avg,
            volume_bonus,
            consistency_score,
            urgency_multiplier,
            merets_earned,
            rep_delta,
            created_at
        ) VALUES (
            NEW.submitted_by,
            'task_completion',
            (SELECT task_id FROM commitments WHERE id = NEW.commitment_id),
            NEW.commitment_id,
            v_quality_avg,
            v_volume_bonus,
            v_consistency_score,
            COALESCE(v_task_urgency, 1.0),
            v_total_earned,
            -- Calculate rep_delta: base * quality * volume * consistency * urgency
            (10.0 * v_quality_avg * v_volume_bonus * v_consistency_score * COALESCE(v_task_urgency, 1.0)),
            NOW()
        );
        
        -- Update user profile reputation score
        UPDATE user_profiles
        SET 
            reputation_score = reputation_score + (10.0 * v_quality_avg * v_volume_bonus * v_consistency_score * COALESCE(v_task_urgency, 1.0)),
            average_quality_rating = (
                (COALESCE(average_quality_rating, 0.0) * COALESCE(total_tasks_completed, 0) + v_quality_rating) 
                / (COALESCE(total_tasks_completed, 0) + 1)
            ),
            consistency_score = v_consistency_score,
            updated_at = NOW()
        WHERE user_id = NEW.submitted_by;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Fix on_commitment_status_change_update_rep trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION on_commitment_status_change_update_rep()
RETURNS TRIGGER AS $$
DECLARE
    v_task_reward DECIMAL(10,2);
    v_quality_rating DECIMAL(5,2);
    v_bonus_tip DECIMAL(10,2);
    v_urgency DECIMAL(5,2);
BEGIN
    -- Only process approved submissions
    IF NEW.submission_status = 'approved' AND (OLD.submission_status IS NULL OR OLD.submission_status != 'approved') THEN
        
        -- Get task reward and urgency
        SELECT base_reward, urgency_multiplier
        INTO v_task_reward, v_urgency
        FROM task_templates tt
        JOIN commitments c ON c.task_id = tt.id
        WHERE c.id = NEW.commitment_id;
        
        -- Get submission details (convert cents to dollars)
        v_quality_rating := COALESCE(NEW.quality_rating::DECIMAL, 3.0);
        v_bonus_tip := COALESCE(NEW.bonus_tip_cents::DECIMAL / 100.0, 0.0);
        
        -- Update user profile
        UPDATE user_profiles
        SET 
            total_tasks_completed = COALESCE(total_tasks_completed, 0) + 1,
            total_merets_earned = COALESCE(total_merets_earned, 0) + v_task_reward + v_bonus_tip,
            average_quality_rating = (
                (COALESCE(average_quality_rating, 0.0) * COALESCE(total_tasks_completed, 0) + v_quality_rating) 
                / (COALESCE(total_tasks_completed, 0) + 1)
            ),
            updated_at = NOW()
        WHERE user_id = NEW.submitted_by;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Verify update_user_streak function has correct types
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_last_completion TIMESTAMP;
    v_current_streak INTEGER;
    v_max_streak INTEGER;
    v_days_since_last INTEGER;
BEGIN
    -- Get last approved submission
    SELECT MAX(reviewed_at)
    INTO v_last_completion
    FROM commitment_submissions
    WHERE submitted_by = p_user_id AND submission_status = 'approved';
    
    -- Get current streak info
    SELECT current_streak, max_streak
    INTO v_current_streak, v_max_streak
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Calculate days since last completion
    IF v_last_completion IS NOT NULL THEN
        v_days_since_last := EXTRACT(DAY FROM NOW() - v_last_completion);
        
        IF v_days_since_last <= 1 THEN
            -- Continue or start streak
            v_current_streak := COALESCE(v_current_streak, 0) + 1;
            v_max_streak := GREATEST(COALESCE(v_max_streak, 0), v_current_streak);
        ELSIF v_days_since_last > 1 THEN
            -- Streak broken
            v_current_streak := 0;
        END IF;
    ELSE
        -- No completions yet
        v_current_streak := 0;
    END IF;
    
    -- Update user profile
    UPDATE user_profiles
    SET 
        current_streak = v_current_streak,
        max_streak = v_max_streak,
        last_active = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Update approve_submission function to use correct column names
-- ============================================================================

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
    
    -- Update user streak
    PERFORM update_user_streak(v_submission.submitted_by);
    
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

-- ============================================================================
-- STEP 5: Create reject_submission function with correct column names
-- ============================================================================

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
-- VERIFICATION: Check all DECIMAL columns are (5,2) or larger
-- ============================================================================

DO $$
DECLARE
    v_bad_columns INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_bad_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
        AND data_type = 'numeric'
        AND numeric_precision = 3
        AND numeric_scale = 2;
    
    IF v_bad_columns > 0 THEN
        RAISE WARNING 'Found % columns still using DECIMAL(3,2)', v_bad_columns;
    ELSE
        RAISE NOTICE '✅ All DECIMAL(3,2) columns have been fixed';
    END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
