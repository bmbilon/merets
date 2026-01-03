-- Test each UPDATE column separately to find which causes overflow

-- Test 1: Just total_earnings_cents
BEGIN;
UPDATE user_profiles 
SET total_earnings_cents = COALESCE(total_earnings_cents, 0) + 900
WHERE id = '4be9f490-66e9-48ab-833d-9fade274504d';
SELECT 'Test 1: total_earnings_cents - SUCCESS' as result;
ROLLBACK;

-- Test 2: Just merets_balance
BEGIN;
UPDATE user_profiles 
SET merets_balance = merets_balance + 0.00
WHERE id = '4be9f490-66e9-48ab-833d-9fade274504d';
SELECT 'Test 2: merets_balance - SUCCESS' as result;
ROLLBACK;

-- Test 3: Just lifetime_merets
BEGIN;
UPDATE user_profiles 
SET lifetime_merets = lifetime_merets + 0.00
WHERE id = '4be9f490-66e9-48ab-833d-9fade274504d';
SELECT 'Test 3: lifetime_merets - SUCCESS' as result;
ROLLBACK;

-- Test 4: Just tasks_completed
BEGIN;
UPDATE user_profiles 
SET tasks_completed = COALESCE(tasks_completed, 0) + 1
WHERE id = '4be9f490-66e9-48ab-833d-9fade274504d';
SELECT 'Test 4: tasks_completed - SUCCESS' as result;
ROLLBACK;

-- Test 5: Just completed_commitments
BEGIN;
UPDATE user_profiles 
SET completed_commitments = COALESCE(completed_commitments, 0) + 1
WHERE id = '4be9f490-66e9-48ab-833d-9fade274504d';
SELECT 'Test 5: completed_commitments - SUCCESS' as result;
ROLLBACK;

-- Test 6: Just average_quality_rating
BEGIN;
UPDATE user_profiles 
SET average_quality_rating = 5.00
WHERE id = '4be9f490-66e9-48ab-833d-9fade274504d';
SELECT 'Test 6: average_quality_rating - SUCCESS' as result;
ROLLBACK;

-- Test 7: All together
BEGIN;
UPDATE user_profiles 
SET 
    total_earnings_cents = COALESCE(total_earnings_cents, 0) + 900,
    merets_balance = merets_balance + 0.00,
    lifetime_merets = lifetime_merets + 0.00,
    tasks_completed = COALESCE(tasks_completed, 0) + 1,
    completed_commitments = COALESCE(completed_commitments, 0) + 1,
    average_quality_rating = 5.00,
    updated_at = NOW()
WHERE id = '4be9f490-66e9-48ab-833d-9fade274504d';
SELECT 'Test 7: ALL COLUMNS - SUCCESS' as result;
ROLLBACK;
