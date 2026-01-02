-- ============================================================================
-- 3-MONTH HISTORY SIMULATION FOR AVEYA AND ONYX
-- ============================================================================
-- This script generates realistic task history spanning 3 months for both kids
-- with high-quality performance, consistent streaks, and full Rep attribution.
--
-- Aveya: 65 completed tasks, avg 4.7 stars, Rep ~68 (Senior Meritous)
-- Onyx: 58 completed tasks, avg 4.8 stars, Rep ~65 (Senior Meritous)
-- ============================================================================

DO $$
DECLARE
  v_aveya_id UUID;
  v_onyx_id UUID;
  v_lauren_id UUID;
  v_brett_id UUID;
  v_task_templates UUID[];
  v_current_date TIMESTAMP;
  v_commitment_id UUID;
  v_submission_id UUID;
  v_task_template_id UUID;
  v_quality_rating INTEGER;
  v_pay_cents INTEGER;
  v_effort_minutes INTEGER;
  v_task_title TEXT;
  v_task_count INTEGER;
  v_skip_day BOOLEAN;
  v_rep_data RECORD;
  v_rep_tier RECORD;
  v_previous_hash TEXT;
  v_new_hash TEXT;
  v_old_rep INTEGER;
BEGIN
  -- Get user IDs
  SELECT id INTO v_aveya_id FROM user_profiles WHERE name = 'Aveya';
  SELECT id INTO v_onyx_id FROM user_profiles WHERE name = 'Onyx';
  SELECT id INTO v_lauren_id FROM user_profiles WHERE name = 'Lauren';
  SELECT id INTO v_brett_id FROM user_profiles WHERE name = 'Brett';
  
  IF v_aveya_id IS NULL OR v_onyx_id IS NULL THEN
    RAISE EXCEPTION 'Users not found. Please ensure Aveya and Onyx exist in user_profiles.';
  END IF;
  
  -- Get available task templates
  SELECT ARRAY_AGG(id) INTO v_task_templates FROM task_templates LIMIT 20;
  
  RAISE NOTICE '🚀 Starting 3-month history simulation...';
  RAISE NOTICE 'Aveya ID: %', v_aveya_id;
  RAISE NOTICE 'Onyx ID: %', v_onyx_id;
  
  -- ============================================================================
  -- AVEYA'S HISTORY (65 tasks over 3 months, avg 4.7 stars)
  -- ============================================================================
  
  RAISE NOTICE '📊 Generating history for Aveya (65 tasks)...';
  
  v_current_date := NOW() - INTERVAL '90 days';
  v_task_count := 0;
  v_previous_hash := NULL;
  
  -- Loop through 90 days
  FOR day_offset IN 0..89 LOOP
    v_current_date := NOW() - INTERVAL '90 days' + (day_offset || ' days')::INTERVAL;
    
    -- Aveya completes tasks ~72% of days (65 tasks / 90 days)
    -- Skip some days randomly for realism
    v_skip_day := (random() < 0.28);
    
    IF NOT v_skip_day AND v_task_count < 65 THEN
      -- Select random task template
      v_task_template_id := v_task_templates[1 + floor(random() * array_length(v_task_templates, 1))];
      
      -- Get task details
      SELECT title, base_pay_cents, effort_minutes 
      INTO v_task_title, v_pay_cents, v_effort_minutes
      FROM task_templates 
      WHERE id = v_task_template_id;
      
      -- Generate quality rating (avg 4.7, range 3-5)
      -- 60% chance of 5 stars, 30% chance of 4 stars, 10% chance of 3 stars
      v_quality_rating := CASE 
        WHEN random() < 0.60 THEN 5
        WHEN random() < 0.90 THEN 4
        ELSE 3
      END;
      
      -- Create commitment
      INSERT INTO commitments (
        id,
        user_id,
        task_template_id,
        status,
        skill_category,
        effort_minutes,
        pay_cents,
        created_at,
        updated_at,
        completed_at
      ) VALUES (
        gen_random_uuid(),
        v_aveya_id,
        v_task_template_id,
        'completed',
        'household',
        v_effort_minutes,
        v_pay_cents,
        v_current_date,
        v_current_date + INTERVAL '2 hours',
        v_current_date + INTERVAL '2 hours'
      ) RETURNING id INTO v_commitment_id;
      
      -- Create submission
      INSERT INTO commitment_submissions (
        id,
        commitment_id,
        user_id,
        submission_status,
        submission_text,
        quality_rating,
        reviewed_by,
        created_at,
        reviewed_at
      ) VALUES (
        gen_random_uuid(),
        v_commitment_id,
        v_aveya_id,
        'approved',
        'Task completed!',
        v_quality_rating,
        v_lauren_id,
        v_current_date + INTERVAL '2 hours',
        v_current_date + INTERVAL '3 hours'
      );
      
      -- Update earnings
      UPDATE user_profiles
      SET 
        total_earnings_cents = total_earnings_cents + v_pay_cents,
        total_xp = total_xp + (10 * CASE v_quality_rating WHEN 5 THEN 1.5 WHEN 4 THEN 1.25 ELSE 1.0 END)
      WHERE id = v_aveya_id;
      
      v_task_count := v_task_count + 1;
      
      -- Every 10 tasks, recalculate Rep and create ledger entry
      IF v_task_count % 10 = 0 OR v_task_count = 65 THEN
        -- Get old Rep
        SELECT rep_score INTO v_old_rep FROM user_profiles WHERE id = v_aveya_id;
        IF v_old_rep IS NULL THEN v_old_rep := 10; END IF;
        
        -- Calculate new Rep
        SELECT * INTO v_rep_data FROM calculate_rep_score_with_attribution(v_aveya_id);
        SELECT * INTO v_rep_tier FROM get_rep_tier(v_rep_data.rep_score);
        
        -- Update user profile
        UPDATE user_profiles
        SET 
          rep_score = v_rep_data.rep_score,
          rep_title = v_rep_tier.title,
          rep_tier = v_rep_tier.tier,
          total_commitments = v_rep_data.total_commitments,
          completed_commitments = v_rep_data.completed_commitments,
          failed_commitments = v_rep_data.failed_commitments,
          average_quality_rating = (v_rep_data.quality_score / 100.0) * 5.0,
          consistency_score = v_rep_data.consistency_score / 100.0,
          last_rep_update = v_current_date + INTERVAL '3 hours'
        WHERE id = v_aveya_id;
        
        -- Generate blockchain hash
        v_new_hash := generate_rep_blockchain_hash(
          v_aveya_id,
          v_old_rep,
          v_rep_data.rep_score,
          v_rep_data.rep_score - v_old_rep,
          v_current_date + INTERVAL '3 hours',
          v_previous_hash
        );
        
        -- Create ledger entry
        INSERT INTO rep_history (
          user_id,
          old_rep,
          new_rep,
          change_amount,
          change_reason,
          action_type,
          related_commitment_id,
          completion_rate_at_time,
          quality_score_at_time,
          consistency_score_at_time,
          volume_bonus_at_time,
          failure_penalty_at_time,
          blockchain_hash,
          previous_entry_id,
          created_at
        ) VALUES (
          v_aveya_id,
          v_old_rep,
          v_rep_data.rep_score,
          v_rep_data.rep_score - v_old_rep,
          'Completed task: ' || v_task_title || ' (' || v_quality_rating || ' stars)',
          'quality_rating',
          v_commitment_id,
          v_rep_data.completion_rate,
          v_rep_data.quality_score,
          v_rep_data.consistency_score,
          v_rep_data.volume_bonus,
          v_rep_data.failure_penalty,
          v_new_hash,
          (SELECT id FROM rep_history WHERE user_id = v_aveya_id ORDER BY created_at DESC LIMIT 1),
          v_current_date + INTERVAL '3 hours'
        );
        
        v_previous_hash := v_new_hash;
        
        RAISE NOTICE 'Aveya Rep: % → % (after % tasks)', v_old_rep, v_rep_data.rep_score, v_task_count;
      END IF;
    END IF;
  END LOOP;
  
  -- Calculate final streak for Aveya (simulate 5-day streak)
  UPDATE user_profiles
  SET current_streak = 5
  WHERE id = v_aveya_id;
  
  RAISE NOTICE '✅ Aveya: % tasks completed over 3 months', v_task_count;
  
  -- ============================================================================
  -- ONYX'S HISTORY (58 tasks over 3 months, avg 4.8 stars)
  -- ============================================================================
  
  RAISE NOTICE '📊 Generating history for Onyx (58 tasks)...';
  
  v_current_date := NOW() - INTERVAL '90 days';
  v_task_count := 0;
  v_previous_hash := NULL;
  
  -- Loop through 90 days
  FOR day_offset IN 0..89 LOOP
    v_current_date := NOW() - INTERVAL '90 days' + (day_offset || ' days')::INTERVAL;
    
    -- Onyx completes tasks ~64% of days (58 tasks / 90 days)
    v_skip_day := (random() < 0.36);
    
    IF NOT v_skip_day AND v_task_count < 58 THEN
      -- Select random task template
      v_task_template_id := v_task_templates[1 + floor(random() * array_length(v_task_templates, 1))];
      
      -- Get task details
      SELECT title, base_pay_cents, effort_minutes 
      INTO v_task_title, v_pay_cents, v_effort_minutes
      FROM task_templates 
      WHERE id = v_task_template_id;
      
      -- Generate quality rating (avg 4.8, range 4-5)
      -- 80% chance of 5 stars, 20% chance of 4 stars
      v_quality_rating := CASE 
        WHEN random() < 0.80 THEN 5
        ELSE 4
      END;
      
      -- Create commitment
      INSERT INTO commitments (
        id,
        user_id,
        task_template_id,
        status,
        skill_category,
        effort_minutes,
        pay_cents,
        created_at,
        updated_at,
        completed_at
      ) VALUES (
        gen_random_uuid(),
        v_onyx_id,
        v_task_template_id,
        'completed',
        'household',
        v_effort_minutes,
        v_pay_cents,
        v_current_date,
        v_current_date + INTERVAL '1.5 hours',
        v_current_date + INTERVAL '1.5 hours'
      ) RETURNING id INTO v_commitment_id;
      
      -- Create submission
      INSERT INTO commitment_submissions (
        id,
        commitment_id,
        user_id,
        submission_status,
        submission_text,
        quality_rating,
        reviewed_by,
        created_at,
        reviewed_at
      ) VALUES (
        gen_random_uuid(),
        v_commitment_id,
        v_onyx_id,
        'approved',
        'Done!',
        v_quality_rating,
        v_brett_id,
        v_current_date + INTERVAL '1.5 hours',
        v_current_date + INTERVAL '2.5 hours'
      );
      
      -- Update earnings
      UPDATE user_profiles
      SET 
        total_earnings_cents = total_earnings_cents + v_pay_cents,
        total_xp = total_xp + (10 * CASE v_quality_rating WHEN 5 THEN 1.5 WHEN 4 THEN 1.25 ELSE 1.0 END)
      WHERE id = v_onyx_id;
      
      v_task_count := v_task_count + 1;
      
      -- Every 10 tasks, recalculate Rep and create ledger entry
      IF v_task_count % 10 = 0 OR v_task_count = 58 THEN
        -- Get old Rep
        SELECT rep_score INTO v_old_rep FROM user_profiles WHERE id = v_onyx_id;
        IF v_old_rep IS NULL THEN v_old_rep := 10; END IF;
        
        -- Calculate new Rep
        SELECT * INTO v_rep_data FROM calculate_rep_score_with_attribution(v_onyx_id);
        SELECT * INTO v_rep_tier FROM get_rep_tier(v_rep_data.rep_score);
        
        -- Update user profile
        UPDATE user_profiles
        SET 
          rep_score = v_rep_data.rep_score,
          rep_title = v_rep_tier.title,
          rep_tier = v_rep_tier.tier,
          total_commitments = v_rep_data.total_commitments,
          completed_commitments = v_rep_data.completed_commitments,
          failed_commitments = v_rep_data.failed_commitments,
          average_quality_rating = (v_rep_data.quality_score / 100.0) * 5.0,
          consistency_score = v_rep_data.consistency_score / 100.0,
          last_rep_update = v_current_date + INTERVAL '2.5 hours'
        WHERE id = v_onyx_id;
        
        -- Generate blockchain hash
        v_new_hash := generate_rep_blockchain_hash(
          v_onyx_id,
          v_old_rep,
          v_rep_data.rep_score,
          v_rep_data.rep_score - v_old_rep,
          v_current_date + INTERVAL '2.5 hours',
          v_previous_hash
        );
        
        -- Create ledger entry
        INSERT INTO rep_history (
          user_id,
          old_rep,
          new_rep,
          change_amount,
          change_reason,
          action_type,
          related_commitment_id,
          completion_rate_at_time,
          quality_score_at_time,
          consistency_score_at_time,
          volume_bonus_at_time,
          failure_penalty_at_time,
          blockchain_hash,
          previous_entry_id,
          created_at
        ) VALUES (
          v_onyx_id,
          v_old_rep,
          v_rep_data.rep_score,
          v_rep_data.rep_score - v_old_rep,
          'Completed task: ' || v_task_title || ' (' || v_quality_rating || ' stars)',
          'quality_rating',
          v_commitment_id,
          v_rep_data.completion_rate,
          v_rep_data.quality_score,
          v_rep_data.consistency_score,
          v_rep_data.volume_bonus,
          v_rep_data.failure_penalty,
          v_new_hash,
          (SELECT id FROM rep_history WHERE user_id = v_onyx_id ORDER BY created_at DESC LIMIT 1),
          v_current_date + INTERVAL '2.5 hours'
        );
        
        v_previous_hash := v_new_hash;
        
        RAISE NOTICE 'Onyx Rep: % → % (after % tasks)', v_old_rep, v_rep_data.rep_score, v_task_count;
      END IF;
    END IF;
  END LOOP;
  
  -- Calculate final streak for Onyx (simulate 7-day streak)
  UPDATE user_profiles
  SET current_streak = 7
  WHERE id = v_onyx_id;
  
  RAISE NOTICE '✅ Onyx: % tasks completed over 3 months', v_task_count;
  
  -- ============================================================================
  -- FINAL SUMMARY
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 3-MONTH SIMULATION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 FINAL STATS:';
  RAISE NOTICE '';
  
  -- Aveya stats
  SELECT 
    rep_score,
    rep_title,
    rep_tier,
    total_commitments,
    completed_commitments,
    average_quality_rating,
    total_earnings_cents / 100.0 as total_earnings,
    total_xp,
    current_streak
  INTO v_rep_data
  FROM user_profiles 
  WHERE id = v_aveya_id;
  
  RAISE NOTICE 'AVEYA:';
  RAISE NOTICE '  Rep: % (%) - %', v_rep_data.rep_score, v_rep_data.rep_tier, v_rep_data.rep_title;
  RAISE NOTICE '  Tasks: % completed / % total', v_rep_data.completed_commitments, v_rep_data.total_commitments;
  RAISE NOTICE '  Avg Rating: % stars', ROUND(v_rep_data.average_quality_rating::NUMERIC, 2);
  RAISE NOTICE '  Earnings: $%', v_rep_data.total_earnings;
  RAISE NOTICE '  XP: % (Level %)', v_rep_data.total_xp, (v_rep_data.total_xp / 100) + 1;
  RAISE NOTICE '  Streak: % days', v_rep_data.current_streak;
  RAISE NOTICE '';
  
  -- Onyx stats
  SELECT 
    rep_score,
    rep_title,
    rep_tier,
    total_commitments,
    completed_commitments,
    average_quality_rating,
    total_earnings_cents / 100.0 as total_earnings,
    total_xp,
    current_streak
  INTO v_rep_data
  FROM user_profiles 
  WHERE id = v_onyx_id;
  
  RAISE NOTICE 'ONYX:';
  RAISE NOTICE '  Rep: % (%) - %', v_rep_data.rep_score, v_rep_data.rep_tier, v_rep_data.rep_title;
  RAISE NOTICE '  Tasks: % completed / % total', v_rep_data.completed_commitments, v_rep_data.total_commitments;
  RAISE NOTICE '  Avg Rating: % stars', ROUND(v_rep_data.average_quality_rating::NUMERIC, 2);
  RAISE NOTICE '  Earnings: $%', v_rep_data.total_earnings;
  RAISE NOTICE '  XP: % (Level %)', v_rep_data.total_xp, (v_rep_data.total_xp / 100) + 1;
  RAISE NOTICE '  Streak: % days', v_rep_data.current_streak;
  RAISE NOTICE '';
  
  -- Verify blockchain integrity
  RAISE NOTICE '🔗 VERIFYING BLOCKCHAIN INTEGRITY...';
  
  DECLARE
    v_blockchain_status RECORD;
  BEGIN
    SELECT * INTO v_blockchain_status FROM verify_rep_blockchain(v_aveya_id);
    RAISE NOTICE 'Aveya blockchain: % (% / % entries verified)', 
      CASE WHEN v_blockchain_status.is_valid THEN '✓ VALID' ELSE '✗ INVALID' END,
      v_blockchain_status.verified_entries,
      v_blockchain_status.total_entries;
    
    SELECT * INTO v_blockchain_status FROM verify_rep_blockchain(v_onyx_id);
    RAISE NOTICE 'Onyx blockchain: % (% / % entries verified)', 
      CASE WHEN v_blockchain_status.is_valid THEN '✓ VALID' ELSE '✗ INVALID' END,
      v_blockchain_status.verified_entries,
      v_blockchain_status.total_entries;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '✨ Simulation complete! Rep Attribution System is live.';
  
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- View final Rep scores
SELECT 
  name,
  rep_score,
  rep_tier,
  rep_title,
  completed_commitments,
  total_commitments,
  ROUND(average_quality_rating::NUMERIC, 2) as avg_rating,
  total_earnings_cents / 100.0 as total_earnings,
  total_xp,
  (total_xp / 100) + 1 as level,
  current_streak
FROM user_profiles
WHERE name IN ('Aveya', 'Onyx')
ORDER BY rep_score DESC;

-- View Rep history
SELECT 
  up.name,
  rh.old_rep,
  rh.new_rep,
  rh.change_amount,
  rh.action_type,
  DATE(rh.created_at) as date
FROM rep_history rh
JOIN user_profiles up ON rh.user_id = up.id
WHERE up.name IN ('Aveya', 'Onyx')
ORDER BY rh.created_at DESC
LIMIT 20;

-- Verify blockchain integrity
SELECT 
  up.name,
  vr.is_valid,
  vr.total_entries,
  vr.verified_entries,
  vr.error_message
FROM user_profiles up
CROSS JOIN LATERAL verify_rep_blockchain(up.id) vr
WHERE up.name IN ('Aveya', 'Onyx');
