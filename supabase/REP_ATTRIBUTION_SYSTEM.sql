-- ============================================================================
-- REP ATTRIBUTION SYSTEM - Immutable Blockchain of Accountability
-- ============================================================================
-- This system creates an irrefutable ledger of every action that affects Rep.
-- Every task completion, failure, and quality rating is permanently recorded
-- and automatically attributed to the earner's Rep score.
--
-- Key Principles:
-- 1. IMMUTABLE: Rep history cannot be deleted or modified, only appended
-- 2. AUTOMATIC: Rep updates trigger on every relevant action
-- 3. DETERMINISTIC: Same inputs always produce same Rep score
-- 4. TRANSPARENT: Full audit trail of all Rep changes
-- 5. TRUSTWORTHY: Source of truth for accountability
-- ============================================================================

-- ============================================================================
-- PART 1: ENHANCED REP HISTORY TABLE (The Immutable Ledger)
-- ============================================================================

-- Add additional audit fields to rep_history for complete traceability
ALTER TABLE rep_history
ADD COLUMN IF NOT EXISTS action_type TEXT NOT NULL DEFAULT 'recalculation',
ADD COLUMN IF NOT EXISTS completion_rate_at_time DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS quality_score_at_time DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS consistency_score_at_time DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS volume_bonus_at_time INTEGER,
ADD COLUMN IF NOT EXISTS failure_penalty_at_time INTEGER,
ADD COLUMN IF NOT EXISTS blockchain_hash TEXT,
ADD COLUMN IF NOT EXISTS previous_entry_id UUID REFERENCES rep_history(id);

-- Create index for blockchain verification
CREATE INDEX IF NOT EXISTS idx_rep_history_blockchain ON rep_history(user_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_rep_history_previous ON rep_history(previous_entry_id);

-- Add constraint to prevent deletion (immutable ledger)
CREATE OR REPLACE RULE prevent_rep_history_delete AS
  ON DELETE TO rep_history
  DO INSTEAD NOTHING;

-- Add constraint to prevent updates (immutable ledger)
CREATE OR REPLACE RULE prevent_rep_history_update AS
  ON UPDATE TO rep_history
  DO INSTEAD NOTHING;

COMMENT ON TABLE rep_history IS 'Immutable ledger of all Rep changes - the blockchain of accountability';

-- ============================================================================
-- PART 2: ENHANCED REP CALCULATION WITH FULL ATTRIBUTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_rep_score_with_attribution(p_user_id UUID)
RETURNS TABLE(
  rep_score INTEGER,
  completion_rate DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  consistency_score DECIMAL(5,2),
  volume_bonus INTEGER,
  failure_penalty INTEGER,
  total_commitments INTEGER,
  completed_commitments INTEGER,
  failed_commitments INTEGER
) AS $$
DECLARE
  v_total_commits INTEGER;
  v_completed INTEGER;
  v_failed INTEGER;
  v_completion_rate DECIMAL;
  v_avg_quality DECIMAL;
  v_consistency DECIMAL;
  v_volume_bonus INTEGER;
  v_failure_penalty INTEGER;
  v_base_rep INTEGER;
  v_final_rep INTEGER;
  v_current_streak INTEGER;
  v_tasks_last_30_days INTEGER;
BEGIN
  -- Get user commitment stats
  SELECT 
    COALESCE(total_commitments, 0),
    COALESCE(completed_commitments, 0),
    COALESCE(failed_commitments, 0),
    COALESCE(average_quality_rating, 0),
    COALESCE(consistency_score, 0),
    COALESCE(current_streak, 0)
  INTO v_total_commits, v_completed, v_failed, v_avg_quality, v_consistency, v_current_streak
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- If no commitments yet, return starting Rep of 10
  IF v_total_commits = 0 THEN
    RETURN QUERY SELECT 10, 0.00::DECIMAL(5,2), 0.00::DECIMAL(5,2), 0.00::DECIMAL(5,2), 0, 0, 0, 0, 0;
    RETURN;
  END IF;
  
  -- Calculate completion rate (0-100%)
  v_completion_rate := (v_completed::DECIMAL / NULLIF(v_total_commits, 0)) * 100;
  
  -- Calculate quality score (0-100%, from 1-5 star average)
  -- avg_quality is stored as 0-5, convert to 0-100
  v_avg_quality := ((v_avg_quality / 5.0) * 100);
  
  -- Calculate consistency score (0-100%)
  -- Based on current streak and recent activity
  SELECT COUNT(*)
  INTO v_tasks_last_30_days
  FROM commitments
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND completed_at >= NOW() - INTERVAL '30 days';
  
  -- Consistency: 50% from streak, 50% from recent activity
  -- Streak: 1 day = 2%, capped at 50% (25 days)
  -- Activity: 1 task = 2%, capped at 50% (25 tasks)
  v_consistency := LEAST(50, v_current_streak * 2) + LEAST(50, v_tasks_last_30_days * 2);
  
  -- Calculate volume bonus (0-10 points)
  v_volume_bonus := CASE
    WHEN v_completed >= 200 THEN 10
    WHEN v_completed >= 100 THEN 9
    WHEN v_completed >= 50 THEN 7
    WHEN v_completed >= 25 THEN 5
    WHEN v_completed >= 10 THEN 3
    WHEN v_completed >= 5 THEN 1
    ELSE 0
  END;
  
  -- Calculate failure penalty (exponential, 0-100%)
  -- Count recent failures (last 30 days) for harsh penalty
  DECLARE
    v_recent_failures INTEGER;
  BEGIN
    SELECT COUNT(*)
    INTO v_recent_failures
    FROM commitments
    WHERE user_id = p_user_id
      AND status IN ('failed', 'cancelled')
      AND updated_at >= NOW() - INTERVAL '30 days';
    
    v_failure_penalty := CASE
      WHEN v_recent_failures = 0 THEN 0
      WHEN v_recent_failures = 1 THEN 10
      WHEN v_recent_failures = 2 THEN 25
      WHEN v_recent_failures = 3 THEN 45
      WHEN v_recent_failures = 4 THEN 70
      WHEN v_recent_failures >= 5 THEN 100
      ELSE 0
    END;
  END;
  
  -- Calculate base Rep using weighted formula:
  -- Completion Rate: 40% (0-40 points)
  -- Quality Score: 30% (0-30 points)
  -- Consistency: 15% (0-15 points)
  -- Volume Bonus: 10% (0-10 points)
  -- Failure Penalty: -5% (0-5 points deducted)
  
  v_base_rep := 
    FLOOR((v_completion_rate / 100.0) * 40) +  -- Completion: 40%
    FLOOR((v_avg_quality / 100.0) * 30) +      -- Quality: 30%
    FLOOR((v_consistency / 100.0) * 15) +      -- Consistency: 15%
    v_volume_bonus -                            -- Volume: 10%
    FLOOR((v_failure_penalty / 100.0) * 5);    -- Penalty: -5%
  
  -- Ensure Rep stays within 0-99 range (100 is unattainable)
  v_final_rep := GREATEST(0, LEAST(99, v_base_rep));
  
  -- Return all attribution data
  RETURN QUERY SELECT 
    v_final_rep,
    v_completion_rate,
    v_avg_quality,
    v_consistency,
    v_volume_bonus,
    v_failure_penalty,
    v_total_commits,
    v_completed,
    v_failed;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: BLOCKCHAIN HASH FUNCTION FOR IMMUTABILITY
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_rep_blockchain_hash(
  p_user_id UUID,
  p_old_rep INTEGER,
  p_new_rep INTEGER,
  p_change_amount INTEGER,
  p_timestamp TIMESTAMP,
  p_previous_hash TEXT
)
RETURNS TEXT AS $$
BEGIN
  -- Generate a deterministic hash from all inputs
  -- This creates a blockchain-like chain where each entry depends on the previous
  RETURN encode(
    digest(
      p_user_id::TEXT || 
      p_old_rep::TEXT || 
      p_new_rep::TEXT || 
      p_change_amount::TEXT || 
      p_timestamp::TEXT || 
      COALESCE(p_previous_hash, 'genesis'),
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PART 4: ENHANCED REP UPDATE FUNCTION WITH FULL ATTRIBUTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_rep_with_attribution()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_old_rep INTEGER;
  v_new_rep INTEGER;
  v_rep_data RECORD;
  v_rep_tier RECORD;
  v_change_reason TEXT;
  v_action_type TEXT;
  v_previous_entry_id UUID;
  v_previous_hash TEXT;
  v_new_hash TEXT;
BEGIN
  -- Determine user_id, change reason, and action type based on trigger context
  IF TG_TABLE_NAME = 'commitments' THEN
    v_user_id := NEW.user_id;
    
    IF NEW.status = 'completed' THEN
      v_action_type := 'task_completed';
      v_change_reason := 'Task completed: ' || (SELECT title FROM task_templates WHERE id = NEW.task_template_id);
    ELSIF NEW.status = 'failed' THEN
      v_action_type := 'task_failed';
      v_change_reason := 'Task failed: ' || (SELECT title FROM task_templates WHERE id = NEW.task_template_id);
    ELSIF NEW.status = 'cancelled' THEN
      v_action_type := 'task_cancelled';
      v_change_reason := 'Task cancelled: ' || (SELECT title FROM task_templates WHERE id = NEW.task_template_id);
    ELSE
      RETURN NEW;
    END IF;
    
  ELSIF TG_TABLE_NAME = 'commitment_submissions' THEN
    v_user_id := (SELECT user_id FROM commitments WHERE id = NEW.commitment_id);
    
    IF NEW.submission_status = 'approved' THEN
      v_action_type := 'quality_rating';
      v_change_reason := 'Work approved with ' || NEW.quality_rating || ' stars';
    ELSIF NEW.submission_status = 'rejected' THEN
      v_action_type := 'work_rejected';
      v_change_reason := 'Work rejected by reviewer';
    ELSE
      RETURN NEW;
    END IF;
    
  ELSE
    RETURN NEW;
  END IF;
  
  -- Get current Rep
  SELECT rep_score INTO v_old_rep FROM user_profiles WHERE id = v_user_id;
  
  -- Calculate new Rep with full attribution
  SELECT * INTO v_rep_data FROM calculate_rep_score_with_attribution(v_user_id);
  v_new_rep := v_rep_data.rep_score;
  
  -- Get Rep tier info
  SELECT * INTO v_rep_tier FROM get_rep_tier(v_new_rep);
  
  -- Get previous entry for blockchain linking
  SELECT id, blockchain_hash 
  INTO v_previous_entry_id, v_previous_hash
  FROM rep_history
  WHERE user_id = v_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Generate blockchain hash
  v_new_hash := generate_rep_blockchain_hash(
    v_user_id,
    v_old_rep,
    v_new_rep,
    v_new_rep - v_old_rep,
    NOW(),
    v_previous_hash
  );
  
  -- Update user profile with new Rep and attribution data
  UPDATE user_profiles
  SET 
    rep_score = v_new_rep,
    rep_title = v_rep_tier.title,
    rep_tier = v_rep_tier.tier,
    total_commitments = v_rep_data.total_commitments,
    completed_commitments = v_rep_data.completed_commitments,
    failed_commitments = v_rep_data.failed_commitments,
    last_rep_update = NOW()
  WHERE id = v_user_id;
  
  -- IMMUTABLE LEDGER ENTRY: Record Rep change with full attribution
  INSERT INTO rep_history (
    user_id,
    old_rep,
    new_rep,
    change_amount,
    change_reason,
    action_type,
    related_commitment_id,
    related_submission_id,
    completion_rate_at_time,
    quality_score_at_time,
    consistency_score_at_time,
    volume_bonus_at_time,
    failure_penalty_at_time,
    blockchain_hash,
    previous_entry_id,
    created_at
  ) VALUES (
    v_user_id,
    v_old_rep,
    v_new_rep,
    v_new_rep - v_old_rep,
    v_change_reason,
    v_action_type,
    CASE WHEN TG_TABLE_NAME = 'commitments' THEN NEW.id ELSE NULL END,
    CASE WHEN TG_TABLE_NAME = 'commitment_submissions' THEN NEW.id ELSE NULL END,
    v_rep_data.completion_rate,
    v_rep_data.quality_score,
    v_rep_data.consistency_score,
    v_rep_data.volume_bonus,
    v_rep_data.failure_penalty,
    v_new_hash,
    v_previous_entry_id,
    NOW()
  );
  
  -- Send notification for significant Rep changes (±3 or more)
  IF ABS(v_new_rep - v_old_rep) >= 3 THEN
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      action_type,
      priority,
      created_at
    ) VALUES (
      v_user_id,
      CASE WHEN v_new_rep > v_old_rep THEN 'rep_increased' ELSE 'rep_decreased' END,
      CASE WHEN v_new_rep > v_old_rep THEN '⭐ Rep Increased!' ELSE '⚠️ Rep Decreased' END,
      'Your Rep changed from ' || v_old_rep || ' to ' || v_new_rep || ' (' || 
        CASE WHEN v_new_rep > v_old_rep THEN '+' ELSE '' END || (v_new_rep - v_old_rep) || '). ' || 
        v_change_reason,
      'none',
      CASE WHEN v_new_rep > v_old_rep THEN 'normal' ELSE 'urgent' END,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: COMPREHENSIVE TRIGGERS FOR ALL REP ATTRIBUTION EVENTS
-- ============================================================================

-- Trigger on commitment completion
DROP TRIGGER IF EXISTS trigger_rep_on_commitment_complete ON commitments;
CREATE TRIGGER trigger_rep_on_commitment_complete
  AFTER UPDATE OF status ON commitments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_user_rep_with_attribution();

-- Trigger on commitment failure
DROP TRIGGER IF EXISTS trigger_rep_on_commitment_fail ON commitments;
CREATE TRIGGER trigger_rep_on_commitment_fail
  AFTER UPDATE OF status ON commitments
  FOR EACH ROW
  WHEN (NEW.status IN ('failed', 'cancelled') AND OLD.status NOT IN ('failed', 'cancelled'))
  EXECUTE FUNCTION update_user_rep_with_attribution();

-- Trigger on submission approval (quality rating)
DROP TRIGGER IF EXISTS trigger_rep_on_submission_approve ON commitment_submissions;
CREATE TRIGGER trigger_rep_on_submission_approve
  AFTER UPDATE OF submission_status, quality_rating ON commitment_submissions
  FOR EACH ROW
  WHEN (NEW.submission_status = 'approved' AND OLD.submission_status != 'approved')
  EXECUTE FUNCTION update_user_rep_with_attribution();

-- Trigger on submission rejection
DROP TRIGGER IF EXISTS trigger_rep_on_submission_reject ON commitment_submissions;
CREATE TRIGGER trigger_rep_on_submission_reject
  AFTER UPDATE OF submission_status ON commitment_submissions
  FOR EACH ROW
  WHEN (NEW.submission_status = 'rejected' AND OLD.submission_status != 'rejected')
  EXECUTE FUNCTION update_user_rep_with_attribution();

-- ============================================================================
-- PART 6: BLOCKCHAIN VERIFICATION FUNCTIONS
-- ============================================================================

-- Verify the integrity of the Rep blockchain for a user
CREATE OR REPLACE FUNCTION verify_rep_blockchain(p_user_id UUID)
RETURNS TABLE(
  is_valid BOOLEAN,
  total_entries INTEGER,
  verified_entries INTEGER,
  broken_chain_at_entry UUID,
  error_message TEXT
) AS $$
DECLARE
  v_entry RECORD;
  v_expected_hash TEXT;
  v_previous_hash TEXT;
  v_total INTEGER := 0;
  v_verified INTEGER := 0;
  v_broken_at UUID := NULL;
  v_error TEXT := NULL;
BEGIN
  -- Get all entries in chronological order
  FOR v_entry IN 
    SELECT * FROM rep_history 
    WHERE user_id = p_user_id 
    ORDER BY created_at ASC
  LOOP
    v_total := v_total + 1;
    
    -- Calculate expected hash
    v_expected_hash := generate_rep_blockchain_hash(
      v_entry.user_id,
      v_entry.old_rep,
      v_entry.new_rep,
      v_entry.change_amount,
      v_entry.created_at,
      v_previous_hash
    );
    
    -- Verify hash matches
    IF v_entry.blockchain_hash != v_expected_hash THEN
      v_broken_at := v_entry.id;
      v_error := 'Hash mismatch at entry ' || v_entry.id || '. Expected: ' || v_expected_hash || ', Got: ' || v_entry.blockchain_hash;
      EXIT;
    END IF;
    
    v_verified := v_verified + 1;
    v_previous_hash := v_entry.blockchain_hash;
  END LOOP;
  
  RETURN QUERY SELECT 
    (v_broken_at IS NULL)::BOOLEAN,
    v_total,
    v_verified,
    v_broken_at,
    v_error;
END;
$$ LANGUAGE plpgsql;

-- Get complete Rep audit trail for a user
CREATE OR REPLACE FUNCTION get_rep_audit_trail(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  entry_id UUID,
  timestamp TIMESTAMP,
  action_type TEXT,
  old_rep INTEGER,
  new_rep INTEGER,
  change_amount INTEGER,
  reason TEXT,
  completion_rate DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  consistency_score DECIMAL(5,2),
  volume_bonus INTEGER,
  failure_penalty INTEGER,
  blockchain_hash TEXT,
  is_verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rh.id,
    rh.created_at,
    rh.action_type,
    rh.old_rep,
    rh.new_rep,
    rh.change_amount,
    rh.change_reason,
    rh.completion_rate_at_time,
    rh.quality_score_at_time,
    rh.consistency_score_at_time,
    rh.volume_bonus_at_time,
    rh.failure_penalty_at_time,
    rh.blockchain_hash,
    TRUE::BOOLEAN -- Placeholder for verification status
  FROM rep_history rh
  WHERE rh.user_id = p_user_id
  ORDER BY rh.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION calculate_rep_score_with_attribution IS 
  'Calculates Rep score with full attribution breakdown. Returns all factors that contribute to the score.';

COMMENT ON FUNCTION update_user_rep_with_attribution IS 
  'Automatically updates Rep and creates immutable ledger entry. Triggered on task completion, failure, or quality rating.';

COMMENT ON FUNCTION generate_rep_blockchain_hash IS 
  'Generates SHA256 hash linking each Rep entry to previous entry, creating an immutable blockchain.';

COMMENT ON FUNCTION verify_rep_blockchain IS 
  'Verifies the integrity of the Rep blockchain for a user. Detects any tampering or corruption.';

COMMENT ON FUNCTION get_rep_audit_trail IS 
  'Returns complete audit trail of all Rep changes with full attribution data.';

-- ============================================================================
-- PART 8: GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_rep_score_with_attribution TO authenticated;
GRANT EXECUTE ON FUNCTION generate_rep_blockchain_hash TO authenticated;
GRANT EXECUTE ON FUNCTION verify_rep_blockchain TO authenticated;
GRANT EXECUTE ON FUNCTION get_rep_audit_trail TO authenticated;

-- ============================================================================
-- INSTALLATION COMPLETE
-- ============================================================================

-- To verify installation, run:
-- SELECT verify_rep_blockchain('user-id-here');
-- SELECT * FROM get_rep_audit_trail('user-id-here', 20);
