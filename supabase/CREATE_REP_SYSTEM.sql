-- Merets Rep (Reputation) System
-- Rep ranges from 0-99 (100 is unattainable by design)
-- Rep is earned slowly and lost quickly
-- Rep reflects reliability, quality, and consistency over time

-- ============================================
-- 1. ADD REP FIELDS TO USER_PROFILES
-- ============================================

-- Add Rep score and tracking fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS rep_score INTEGER DEFAULT 10 CHECK (rep_score >= 0 AND rep_score <= 99),
ADD COLUMN IF NOT EXISTS rep_title TEXT DEFAULT 'Entry Earner',
ADD COLUMN IF NOT EXISTS rep_tier TEXT DEFAULT '1E',
ADD COLUMN IF NOT EXISTS total_commitments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_commitments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_commitments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_quality_rating DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS consistency_score DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_rep_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 2. CREATE REP_HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS rep_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  old_rep INTEGER NOT NULL,
  new_rep INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  change_reason TEXT NOT NULL,
  related_commitment_id UUID REFERENCES commitments(id),
  related_submission_id UUID REFERENCES commitment_submissions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rep_history_user ON rep_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rep_history_commitment ON rep_history(related_commitment_id);

-- ============================================
-- 3. REP TIER MAPPING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_rep_tier(rep INTEGER)
RETURNS TABLE(title TEXT, tier TEXT, abbrev TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE
      -- Unranked (0-9)
      WHEN rep BETWEEN 0 AND 9 THEN 'Unranked'
      -- Entry & Early Progression (10-19)
      WHEN rep = 10 THEN 'Entry Earner'
      WHEN rep BETWEEN 11 AND 19 THEN 'Entry Earner Progression'
      -- Active Participation (20-49)
      WHEN rep = 20 THEN 'Active Earner'
      WHEN rep BETWEEN 21 AND 29 THEN 'Active Progression'
      WHEN rep = 30 THEN 'Established Earner'
      WHEN rep BETWEEN 31 AND 39 THEN 'Established Progression'
      WHEN rep = 40 THEN 'Advanced Earner'
      WHEN rep BETWEEN 41 AND 49 THEN 'Advanced Progression'
      -- Meritous Tier (50-79)
      WHEN rep = 50 THEN 'Meritous Earner'
      WHEN rep BETWEEN 51 AND 59 THEN 'Meritous Progression'
      WHEN rep BETWEEN 60 AND 69 THEN 'Senior Meritous'
      WHEN rep BETWEEN 70 AND 79 THEN 'Elite Meritous'
      -- Virtuous Tier (80-89)
      WHEN rep = 80 THEN 'Virtuous Earner'
      WHEN rep BETWEEN 81 AND 89 THEN 'Virtuous Progression'
      -- Exceptional Tier (90-99)
      WHEN rep = 90 THEN 'Exceptionally Meretous'
      WHEN rep BETWEEN 91 AND 94 THEN 'Exceptional Progression'
      WHEN rep = 95 THEN 'Exceptionally Masterful'
      WHEN rep BETWEEN 96 AND 99 THEN 'Mythic Progression'
      ELSE 'Unranked'
    END AS title,
    CASE
      WHEN rep BETWEEN 0 AND 9 THEN 'unranked'
      WHEN rep BETWEEN 10 AND 19 THEN 'entry'
      WHEN rep BETWEEN 20 AND 49 THEN 'active'
      WHEN rep BETWEEN 50 AND 79 THEN 'meritous'
      WHEN rep BETWEEN 80 AND 89 THEN 'virtuous'
      WHEN rep BETWEEN 90 AND 99 THEN 'exceptional'
      ELSE 'unranked'
    END AS tier,
    CASE
      WHEN rep BETWEEN 0 AND 9 THEN '—'
      WHEN rep = 10 THEN '1E'
      WHEN rep BETWEEN 11 AND 19 THEN '1E' || (rep - 10)::TEXT
      WHEN rep = 20 THEN '2E'
      WHEN rep BETWEEN 21 AND 29 THEN '2E' || (rep - 20)::TEXT
      WHEN rep = 30 THEN '3E'
      WHEN rep BETWEEN 31 AND 39 THEN '3E' || (rep - 30)::TEXT
      WHEN rep = 40 THEN '4E'
      WHEN rep BETWEEN 41 AND 49 THEN '4E' || (rep - 40)::TEXT
      WHEN rep = 50 THEN '5M'
      WHEN rep BETWEEN 51 AND 59 THEN '5M' || (rep - 50)::TEXT
      WHEN rep BETWEEN 60 AND 69 THEN '6M' || (rep - 60)::TEXT
      WHEN rep BETWEEN 70 AND 79 THEN '7M' || (rep - 70)::TEXT
      WHEN rep = 80 THEN '8V'
      WHEN rep BETWEEN 81 AND 89 THEN '8V' || (rep - 80)::TEXT
      WHEN rep = 90 THEN '9X'
      WHEN rep BETWEEN 91 AND 94 THEN '9X' || (rep - 90)::TEXT
      WHEN rep = 95 THEN '95XM'
      WHEN rep BETWEEN 96 AND 99 THEN '9' || rep::TEXT
      ELSE '—'
    END AS abbrev;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 4. REP CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_rep_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_completion_rate DECIMAL;
  v_avg_quality DECIMAL;
  v_consistency DECIMAL;
  v_volume_bonus INTEGER;
  v_failure_penalty INTEGER;
  v_base_rep INTEGER;
  v_final_rep INTEGER;
  v_total_commits INTEGER;
  v_completed INTEGER;
  v_failed INTEGER;
BEGIN
  -- Get user stats
  SELECT 
    COALESCE(total_commitments, 0),
    COALESCE(completed_commitments, 0),
    COALESCE(failed_commitments, 0),
    COALESCE(average_quality_rating, 0),
    COALESCE(consistency_score, 0)
  INTO v_total_commits, v_completed, v_failed, v_avg_quality, v_consistency
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- If no commitments yet, return starting Rep of 10
  IF v_total_commits = 0 THEN
    RETURN 10;
  END IF;
  
  -- Calculate completion rate (0-1)
  v_completion_rate := v_completed::DECIMAL / NULLIF(v_total_commits, 0);
  
  -- Base Rep from completion rate (0-40 points)
  v_base_rep := FLOOR(v_completion_rate * 40);
  
  -- Quality bonus (0-30 points) - average rating from 1-5 stars
  v_base_rep := v_base_rep + FLOOR((v_avg_quality / 5.0) * 30);
  
  -- Consistency bonus (0-20 points) - calculated from streak and regularity
  v_base_rep := v_base_rep + FLOOR(v_consistency * 20);
  
  -- Volume bonus (0-10 points) - more completed tasks = higher Rep
  v_volume_bonus := CASE
    WHEN v_completed >= 100 THEN 10
    WHEN v_completed >= 50 THEN 7
    WHEN v_completed >= 25 THEN 5
    WHEN v_completed >= 10 THEN 3
    WHEN v_completed >= 5 THEN 1
    ELSE 0
  END;
  v_base_rep := v_base_rep + v_volume_bonus;
  
  -- Failure penalty (exponential) - failures hurt Rep significantly
  v_failure_penalty := CASE
    WHEN v_failed = 0 THEN 0
    WHEN v_failed = 1 THEN 2
    WHEN v_failed = 2 THEN 5
    WHEN v_failed = 3 THEN 10
    WHEN v_failed >= 4 THEN 15 + (v_failed - 4) * 3
    ELSE 0
  END;
  v_base_rep := v_base_rep - v_failure_penalty;
  
  -- Ensure Rep stays within 0-99 range (100 is unattainable)
  v_final_rep := GREATEST(0, LEAST(99, v_base_rep));
  
  RETURN v_final_rep;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. UPDATE REP TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_user_rep()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_old_rep INTEGER;
  v_new_rep INTEGER;
  v_rep_tier RECORD;
  v_change_reason TEXT;
BEGIN
  -- Determine user_id and change reason based on trigger context
  IF TG_TABLE_NAME = 'commitments' THEN
    v_user_id := NEW.user_id;
    IF NEW.status = 'failed' OR NEW.status = 'cancelled' THEN
      v_change_reason := 'Commitment failed or cancelled';
      -- Increment failed count
      UPDATE user_profiles
      SET failed_commitments = failed_commitments + 1
      WHERE id = v_user_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'commitment_submissions' THEN
    v_user_id := (SELECT user_id FROM commitments WHERE id = NEW.commitment_id);
    IF NEW.status = 'approved' THEN
      v_change_reason := 'Work approved with ' || NEW.quality_rating || ' stars';
      -- Increment completed count and update average quality
      UPDATE user_profiles
      SET 
        completed_commitments = completed_commitments + 1,
        average_quality_rating = (
          (average_quality_rating * completed_commitments + NEW.quality_rating) / 
          (completed_commitments + 1)
        )
      WHERE id = v_user_id;
    ELSIF NEW.status = 'rejected' THEN
      v_change_reason := 'Work rejected';
    END IF;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Get current Rep
  SELECT rep_score INTO v_old_rep FROM user_profiles WHERE id = v_user_id;
  
  -- Calculate new Rep
  v_new_rep := calculate_rep_score(v_user_id);
  
  -- Get Rep tier info
  SELECT * INTO v_rep_tier FROM get_rep_tier(v_new_rep);
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    rep_score = v_new_rep,
    rep_title = v_rep_tier.title,
    rep_tier = v_rep_tier.tier,
    last_rep_update = NOW()
  WHERE id = v_user_id;
  
  -- Log Rep change if it changed
  IF v_new_rep != v_old_rep THEN
    INSERT INTO rep_history (
      user_id,
      old_rep,
      new_rep,
      change_amount,
      change_reason,
      related_commitment_id,
      related_submission_id
    ) VALUES (
      v_user_id,
      v_old_rep,
      v_new_rep,
      v_new_rep - v_old_rep,
      v_change_reason,
      CASE WHEN TG_TABLE_NAME = 'commitments' THEN NEW.id ELSE NULL END,
      CASE WHEN TG_TABLE_NAME = 'commitment_submissions' THEN NEW.id ELSE NULL END
    );
    
    -- Send notification for significant Rep changes
    IF ABS(v_new_rep - v_old_rep) >= 5 THEN
      PERFORM send_notification(
        v_user_id,
        CASE WHEN v_new_rep > v_old_rep THEN 'rep_increased' ELSE 'rep_decreased' END,
        CASE WHEN v_new_rep > v_old_rep THEN '⭐ Rep Increased!' ELSE '⚠️ Rep Decreased' END,
        'Your Rep changed from ' || v_old_rep || ' to ' || v_new_rep || '. ' || v_change_reason,
        NULL,
        NULL,
        NULL,
        'none',
        NULL,
        CASE WHEN v_new_rep > v_old_rep THEN 'normal' ELSE 'urgent' END
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

-- Trigger on commitment status changes
DROP TRIGGER IF EXISTS trigger_update_rep_on_commitment ON commitments;
CREATE TRIGGER trigger_update_rep_on_commitment
  AFTER UPDATE OF status ON commitments
  FOR EACH ROW
  WHEN (NEW.status IN ('failed', 'cancelled'))
  EXECUTE FUNCTION update_user_rep();

-- Trigger on submission approval/rejection
DROP TRIGGER IF EXISTS trigger_update_rep_on_submission ON commitment_submissions;
CREATE TRIGGER trigger_update_rep_on_submission
  AFTER UPDATE OF status ON commitment_submissions
  FOR EACH ROW
  WHEN (NEW.status IN ('approved', 'rejected'))
  EXECUTE FUNCTION update_user_rep();

-- ============================================
-- 7. REP-BASED PRIVILEGES FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_rep_privileges(p_rep INTEGER)
RETURNS TABLE(
  can_auto_approve BOOLEAN,
  can_instant_pay BOOLEAN,
  pay_multiplier DECIMAL,
  requires_manual_approval BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Auto-approval at 8V (80+)
    (p_rep >= 80) AS can_auto_approve,
    -- Instant pay at 9X (90+)
    (p_rep >= 90) AS can_instant_pay,
    -- Pay multiplier increases at Meritous tier (50+)
    CASE
      WHEN p_rep >= 90 THEN 1.50  -- 50% bonus
      WHEN p_rep >= 80 THEN 1.30  -- 30% bonus
      WHEN p_rep >= 70 THEN 1.20  -- 20% bonus
      WHEN p_rep >= 60 THEN 1.15  -- 15% bonus
      WHEN p_rep >= 50 THEN 1.10  -- 10% bonus
      ELSE 1.00  -- No bonus
    END AS pay_multiplier,
    -- Manual approval required below Active tier (20)
    (p_rep < 20) AS requires_manual_approval;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 8. INITIALIZE EXISTING USERS
-- ============================================

-- Set all existing users to Entry Earner (Rep 10) if not set
UPDATE user_profiles
SET 
  rep_score = 10,
  rep_title = 'Entry Earner',
  rep_tier = 'entry',
  total_commitments = 0,
  completed_commitments = 0,
  failed_commitments = 0,
  average_quality_rating = 0.00,
  consistency_score = 0.00
WHERE rep_score IS NULL OR rep_score = 0;

-- ============================================
-- DONE
-- ============================================

-- Rep system is now fully implemented!
-- Rep ranges from 0-99 (100 is unattainable)
-- Rep is calculated from: completion rate, quality, consistency, volume, failures
-- Rep unlocks privileges: higher pay, auto-approval, instant pay
-- Rep changes are logged and users are notified
