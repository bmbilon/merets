# Rep Attribution System - Installation Guide

## 🎯 Quick Start

This guide walks you through installing the complete Rep Attribution System into your Supabase database.

---

## ⚠️ Prerequisites

Before starting:
- [ ] Supabase project is set up
- [ ] Database is accessible via SQL Editor
- [ ] You have admin access to run SQL commands
- [ ] Existing tables (`user_profiles`, `commitments`, `commitment_submissions`) are in place

---

## 📋 Installation Checklist

### Step 1: Apply Base Rep System
**File**: `/supabase/CREATE_REP_SYSTEM.sql`

This creates:
- Rep fields in `user_profiles` table
- `rep_history` table
- Rep tier mapping function
- Rep calculation function
- Basic Rep update triggers
- Rep privileges function

**To Apply**:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of `CREATE_REP_SYSTEM.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify no errors

**Verification**:
```sql
-- Check if rep_score column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'rep_score';

-- Check if rep_history table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'rep_history';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_rep_tier',
  'calculate_rep_score',
  'update_user_rep'
);
```

---

### Step 2: Apply Attribution System
**File**: `/supabase/REP_ATTRIBUTION_SYSTEM.sql`

This adds:
- Enhanced `rep_history` with blockchain fields
- Immutability rules (prevent delete/update)
- Enhanced Rep calculation with full attribution
- Blockchain hash generation
- Comprehensive triggers for all Rep events
- Blockchain verification functions
- Audit trail functions

**To Apply**:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of `REP_ATTRIBUTION_SYSTEM.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify no errors

**Verification**:
```sql
-- Check if blockchain_hash column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rep_history' 
  AND column_name = 'blockchain_hash';

-- Check if attribution functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'calculate_rep_score_with_attribution',
  'update_user_rep_with_attribution',
  'generate_rep_blockchain_hash',
  'verify_rep_blockchain',
  'get_rep_audit_trail'
);

-- Check if triggers exist
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%rep%';
```

---

### Step 3: Initialize User Rep Scores

All existing users need initial Rep scores set.

```sql
-- Set starting Rep for all users who don't have it
UPDATE user_profiles
SET 
  rep_score = 10,
  rep_title = 'Entry Earner',
  rep_tier = '1E',
  total_commitments = 0,
  completed_commitments = 0,
  failed_commitments = 0,
  average_quality_rating = 0.00,
  consistency_score = 0.00,
  last_rep_update = NOW()
WHERE rep_score IS NULL;
```

**Verification**:
```sql
-- Check all users have Rep scores
SELECT 
  name,
  rep_score,
  rep_title,
  rep_tier
FROM user_profiles
WHERE role = 'earner';
```

---

### Step 4: Recalculate Rep for Existing Data

If you have existing commitments and submissions, recalculate Rep:

```sql
-- For each earner, recalculate their Rep based on existing data
DO $$
DECLARE
  v_user RECORD;
  v_rep_data RECORD;
  v_rep_tier RECORD;
BEGIN
  FOR v_user IN 
    SELECT id FROM user_profiles WHERE role = 'earner'
  LOOP
    -- Calculate Rep with attribution
    SELECT * INTO v_rep_data 
    FROM calculate_rep_score_with_attribution(v_user.id);
    
    -- Get tier info
    SELECT * INTO v_rep_tier 
    FROM get_rep_tier(v_rep_data.rep_score);
    
    -- Update user profile
    UPDATE user_profiles
    SET 
      rep_score = v_rep_data.rep_score,
      rep_title = v_rep_tier.title,
      rep_tier = v_rep_tier.tier,
      total_commitments = v_rep_data.total_commitments,
      completed_commitments = v_rep_data.completed_commitments,
      failed_commitments = v_rep_data.failed_commitments,
      last_rep_update = NOW()
    WHERE id = v_user.id;
    
    -- Create initial ledger entry
    INSERT INTO rep_history (
      user_id,
      old_rep,
      new_rep,
      change_amount,
      change_reason,
      action_type,
      completion_rate_at_time,
      quality_score_at_time,
      consistency_score_at_time,
      volume_bonus_at_time,
      failure_penalty_at_time,
      blockchain_hash,
      previous_entry_id
    ) VALUES (
      v_user.id,
      10,
      v_rep_data.rep_score,
      v_rep_data.rep_score - 10,
      'Initial Rep calculation from existing data',
      'recalculation',
      v_rep_data.completion_rate,
      v_rep_data.quality_score,
      v_rep_data.consistency_score,
      v_rep_data.volume_bonus,
      v_rep_data.failure_penalty,
      generate_rep_blockchain_hash(
        v_user.id,
        10,
        v_rep_data.rep_score,
        v_rep_data.rep_score - 10,
        NOW(),
        NULL
      ),
      NULL
    );
    
    RAISE NOTICE 'Updated Rep for user %: %', v_user.id, v_rep_data.rep_score;
  END LOOP;
END $$;
```

**Verification**:
```sql
-- Check Rep scores were calculated
SELECT 
  name,
  rep_score,
  total_commitments,
  completed_commitments,
  failed_commitments
FROM user_profiles
WHERE role = 'earner'
ORDER BY rep_score DESC;

-- Check initial ledger entries were created
SELECT 
  user_id,
  old_rep,
  new_rep,
  change_reason,
  blockchain_hash
FROM rep_history
WHERE action_type = 'recalculation';
```

---

### Step 5: Test Automatic Updates

Create a test scenario to verify triggers work:

```sql
-- 1. Get a test user ID
SELECT id, name FROM user_profiles WHERE role = 'earner' LIMIT 1;

-- 2. Create a test commitment
INSERT INTO commitments (
  user_id,
  task_template_id,
  status,
  skill_category,
  effort_minutes,
  pay_cents
) VALUES (
  'test-user-id-here',
  (SELECT id FROM task_templates LIMIT 1),
  'in_progress',
  'household',
  30,
  500
) RETURNING id;

-- 3. Complete the commitment (should trigger Rep update)
UPDATE commitments
SET status = 'completed', completed_at = NOW()
WHERE id = 'test-commitment-id-here';

-- 4. Check if Rep was updated
SELECT 
  user_id,
  old_rep,
  new_rep,
  change_amount,
  change_reason,
  action_type
FROM rep_history
WHERE user_id = 'test-user-id-here'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Verify blockchain hash was generated
SELECT 
  blockchain_hash,
  previous_entry_id
FROM rep_history
WHERE user_id = 'test-user-id-here'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Step 6: Verify Blockchain Integrity

Test the blockchain verification:

```sql
-- Verify blockchain for a user
SELECT * FROM verify_rep_blockchain('test-user-id-here');

-- Expected result:
-- is_valid: true
-- total_entries: [number of entries]
-- verified_entries: [same as total]
-- broken_chain_at_entry: NULL
-- error_message: NULL
```

---

### Step 7: Test Audit Trail

Retrieve audit trail:

```sql
-- Get audit trail for a user
SELECT * FROM get_rep_audit_trail('test-user-id-here', 10);

-- Should return:
-- - entry_id
-- - timestamp
-- - action_type
-- - old_rep, new_rep, change_amount
-- - reason
-- - all attribution factors
-- - blockchain_hash
```

---

## 🧪 Complete Test Workflow

### Test Case: Full Task Lifecycle

```sql
-- 1. Get test user
SELECT id, name, rep_score FROM user_profiles WHERE name = 'Aveya';

-- 2. Record initial Rep
SELECT rep_score FROM user_profiles WHERE name = 'Aveya';

-- 3. Create commitment
INSERT INTO commitments (
  user_id,
  task_template_id,
  status,
  skill_category,
  effort_minutes,
  pay_cents
) VALUES (
  (SELECT id FROM user_profiles WHERE name = 'Aveya'),
  (SELECT id FROM task_templates WHERE title LIKE '%Clean%' LIMIT 1),
  'in_progress',
  'household',
  30,
  500
) RETURNING id;

-- 4. Create submission
INSERT INTO commitment_submissions (
  commitment_id,
  user_id,
  submission_status,
  submission_text
) VALUES (
  'commitment-id-from-step-3',
  (SELECT id FROM user_profiles WHERE name = 'Aveya'),
  'pending_approval',
  'Task completed!'
) RETURNING id;

-- 5. Approve with 5-star rating (should trigger Rep update)
UPDATE commitment_submissions
SET 
  submission_status = 'approved',
  quality_rating = 5,
  reviewed_by = (SELECT id FROM user_profiles WHERE name = 'Lauren'),
  reviewed_at = NOW()
WHERE id = 'submission-id-from-step-4';

-- 6. Check Rep increased
SELECT 
  name,
  rep_score,
  rep_title,
  rep_tier
FROM user_profiles 
WHERE name = 'Aveya';

-- 7. Check ledger entry was created
SELECT 
  old_rep,
  new_rep,
  change_amount,
  change_reason,
  action_type,
  completion_rate_at_time,
  quality_score_at_time,
  blockchain_hash
FROM rep_history
WHERE user_id = (SELECT id FROM user_profiles WHERE name = 'Aveya')
ORDER BY created_at DESC
LIMIT 1;

-- 8. Verify blockchain
SELECT * FROM verify_rep_blockchain(
  (SELECT id FROM user_profiles WHERE name = 'Aveya')
);
```

---

## 🔍 Troubleshooting

### Rep Not Updating

**Problem**: Rep score doesn't change after task completion

**Solutions**:
1. Check if triggers are enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%rep%';
```

2. Check for trigger errors in logs

3. Manually trigger update:
```sql
SELECT * FROM calculate_rep_score_with_attribution('user-id');
```

4. Verify commitment status changed:
```sql
SELECT status, updated_at FROM commitments WHERE id = 'commitment-id';
```

---

### Blockchain Verification Fails

**Problem**: `verify_rep_blockchain()` returns `is_valid = false`

**Solutions**:
1. Check error message in result
2. Inspect broken entry:
```sql
SELECT * FROM rep_history WHERE id = 'broken-entry-id';
```

3. Verify previous entry exists:
```sql
SELECT * FROM rep_history WHERE id = 'previous-entry-id';
```

4. If corruption detected, may need to rebuild from that point

---

### Missing Attribution Data

**Problem**: `completion_rate_at_time` or other fields are NULL

**Solutions**:
1. Ensure using new trigger function:
```sql
SELECT tgname, tgfoid::regproc 
FROM pg_trigger 
WHERE tgname LIKE '%rep%';
```

2. Should show `update_user_rep_with_attribution` not `update_user_rep`

3. Re-apply REP_ATTRIBUTION_SYSTEM.sql if needed

---

## ✅ Post-Installation Checklist

- [ ] Both SQL files applied successfully
- [ ] All functions exist and are callable
- [ ] All triggers are active
- [ ] User Rep scores initialized
- [ ] Test commitment completes successfully
- [ ] Rep updates automatically
- [ ] Ledger entry created with blockchain hash
- [ ] Blockchain verification passes
- [ ] Audit trail accessible
- [ ] No errors in database logs

---

## 🚀 Next Steps

After installation:

1. **Test in Development**
   - Create test commitments
   - Complete tasks
   - Verify Rep updates
   - Check notifications

2. **Monitor Initial Usage**
   - Watch for Rep changes
   - Verify blockchain integrity
   - Check performance

3. **Educate Users**
   - Explain Rep system to kids
   - Show Rep profile
   - Demonstrate privileges

4. **Iterate**
   - Gather feedback
   - Adjust weights if needed
   - Fine-tune penalties

---

## 📊 Monitoring Queries

### Daily Rep Changes
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as changes,
  AVG(change_amount) as avg_change
FROM rep_history
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Top Performers
```sql
SELECT 
  name,
  rep_score,
  rep_tier,
  completed_commitments,
  total_commitments
FROM user_profiles
WHERE role = 'earner'
ORDER BY rep_score DESC;
```

### Recent Rep Activity
```sql
SELECT 
  up.name,
  rh.old_rep,
  rh.new_rep,
  rh.change_amount,
  rh.change_reason,
  rh.created_at
FROM rep_history rh
JOIN user_profiles up ON rh.user_id = up.id
ORDER BY rh.created_at DESC
LIMIT 20;
```

---

## 🎉 Installation Complete!

Your Rep Attribution System is now live. Every task completion, failure, and quality rating will automatically update Rep scores and create immutable ledger entries.

**The blockchain of accountability is running!** 🔗✨
