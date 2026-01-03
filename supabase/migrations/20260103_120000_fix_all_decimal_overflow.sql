-- Migration: Fix ALL DECIMAL(3,2) overflow issues in triggers and functions
-- Date: 2026-01-03
-- Issue: approve_submission() throws "numeric field overflow" despite column changes
-- Root cause: Trigger functions have hardcoded DECIMAL(3,2) in variable declarations

-- ============================================================================
-- STEP 1: Drop and recreate update_rep_on_event trigger function
-- This is the main culprit - it calculates reputation metrics
-- ============================================================================

DROP TRIGGER IF EXISTS update_rep_on_event ON commitment_submissions;
DROP FUNCTION IF EXISTS update_rep_on_event() CASCADE;

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
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Get task details
        SELECT base_reward, urgency_multiplier
        INTO v_task_reward, v_task_urgency
        FROM task_templates
        WHERE id = NEW.task_id;
        
        -- Get submission details (with safe defaults)
        v_quality_rating := COALESCE(NEW.quality_rating, 3.0);
        v_bonus_tip := COALESCE(NEW.bonus_tip, 0.0);
        v_total_earned := v_task_reward + v_bonus_tip;
        
        -- Calculate quality average (normalize to 0-1 scale)
        v_quality_avg := v_quality_rating / 5.0;
        
        -- Calculate volume bonus (cap at 2.0)
        v_volume_bonus := LEAST(2.0, (v_total_earned / 100.0));
        
        -- Get current streak info
        SELECT current_streak, max_streak
        INTO v_current_streak, v_max_streak
        FROM user_profiles
        WHERE user_id = NEW.kid_id;
        
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
            NEW.kid_id,
            'task_completion',
            NEW.task_id,
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
        WHERE user_id = NEW.kid_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER update_rep_on_event
    AFTER UPDATE OF status ON commitment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_rep_on_event();

-- ============================================================================
-- STEP 2: Fix on_commitment_status_change_update_rep trigger function
-- ============================================================================

DROP TRIGGER IF EXISTS on_commitment_status_change_update_rep ON commitment_submissions;
DROP FUNCTION IF EXISTS on_commitment_status_change_update_rep() CASCADE;

CREATE OR REPLACE FUNCTION on_commitment_status_change_update_rep()
RETURNS TRIGGER AS $$
DECLARE
    v_task_reward DECIMAL(10,2);
    v_quality_rating DECIMAL(5,2);
    v_bonus_tip DECIMAL(10,2);
    v_urgency DECIMAL(5,2);
BEGIN
    -- Only process approved submissions
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Get task reward and urgency
        SELECT base_reward, urgency_multiplier
        INTO v_task_reward, v_urgency
        FROM task_templates
        WHERE id = NEW.task_id;
        
        -- Get submission details
        v_quality_rating := COALESCE(NEW.quality_rating, 3.0);
        v_bonus_tip := COALESCE(NEW.bonus_tip, 0.0);
        
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
        WHERE user_id = NEW.kid_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_commitment_status_change_update_rep
    AFTER UPDATE OF status ON commitment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION on_commitment_status_change_update_rep();

-- ============================================================================
-- STEP 3: Verify update_user_streak function doesn't have DECIMAL issues
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
    SELECT MAX(approved_at)
    INTO v_last_completion
    FROM commitment_submissions
    WHERE kid_id = p_user_id AND status = 'approved';
    
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
-- STEP 4: Verify approve_submission function has correct DECIMAL types
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_submission(
    p_submission_id UUID,
    p_parent_id UUID,
    p_quality_rating DECIMAL(5,2),
    p_bonus_tip DECIMAL(10,2) DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_submission commitment_submissions%ROWTYPE;
    v_task task_templates%ROWTYPE;
    v_kid_balance DECIMAL(10,2);
    v_parent_balance DECIMAL(10,2);
    v_total_payment DECIMAL(10,2);
    v_xp_earned INTEGER;
    v_result JSON;
BEGIN
    -- Validate quality rating (1-5 scale)
    IF p_quality_rating < 1.0 OR p_quality_rating > 5.0 THEN
        RAISE EXCEPTION 'Quality rating must be between 1.0 and 5.0';
    END IF;
    
    -- Get submission details
    SELECT * INTO v_submission
    FROM commitment_submissions
    WHERE id = p_submission_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission not found';
    END IF;
    
    IF v_submission.status != 'submitted' THEN
        RAISE EXCEPTION 'Submission is not in submitted status';
    END IF;
    
    -- Get task details
    SELECT * INTO v_task
    FROM task_templates
    WHERE id = v_submission.task_id;
    
    -- Calculate total payment
    v_total_payment := v_task.base_reward + COALESCE(p_bonus_tip, 0.0);
    
    -- Calculate XP (base 10 XP per task, bonus for quality)
    v_xp_earned := 10 + FLOOR((p_quality_rating - 3.0) * 5.0)::INTEGER;
    
    -- Get current balances
    SELECT meret_balance INTO v_kid_balance
    FROM user_profiles
    WHERE user_id = v_submission.kid_id;
    
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
        status = 'approved',
        quality_rating = p_quality_rating,
        bonus_tip = p_bonus_tip,
        reviewer_notes = p_notes,
        approved_at = NOW(),
        approved_by = p_parent_id,
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
    WHERE user_id = v_submission.kid_id;
    
    -- Update user streak
    PERFORM update_user_streak(v_submission.kid_id);
    
    -- Return result
    SELECT json_build_object(
        'success', true,
        'submission_id', p_submission_id,
        'kid_id', v_submission.kid_id,
        'payment', v_total_payment,
        'xp_earned', v_xp_earned,
        'new_kid_balance', v_kid_balance + v_total_payment,
        'new_parent_balance', v_parent_balance - v_total_payment
    ) INTO v_result;
    
    RETURN v_result;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Recreate the available_tasks_for_kids view (depends on updated columns)
-- ============================================================================

DROP VIEW IF EXISTS available_tasks_for_kids CASCADE;

CREATE OR REPLACE VIEW available_tasks_for_kids AS
SELECT 
    tt.id,
    tt.title,
    tt.description,
    tt.base_reward,
    tt.category,
    tt.difficulty,
    tt.estimated_duration,
    tt.urgency_multiplier,
    tt.household_id,
    tt.issuer_id,
    tt.created_at,
    COUNT(DISTINCT c.id) as active_commitments,
    tt.max_concurrent_commitments,
    CASE 
        WHEN COUNT(DISTINCT c.id) >= tt.max_concurrent_commitments THEN false
        ELSE true
    END as is_available
FROM task_templates tt
LEFT JOIN commitments c ON c.task_id = tt.id 
    AND c.status IN ('active', 'in_progress')
WHERE tt.is_active = true
GROUP BY tt.id;

-- Grant permissions
GRANT SELECT ON available_tasks_for_kids TO authenticated, anon;

-- ============================================================================
-- VERIFICATION: Check all DECIMAL columns are now (5,2) or larger
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
