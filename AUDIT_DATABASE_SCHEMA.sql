-- Complete database schema audit for approval flow

-- 1. commitment_submissions table
SELECT 'commitment_submissions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commitment_submissions'
ORDER BY ordinal_position;

-- 2. commitments table
SELECT 'commitments' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commitments'
ORDER BY ordinal_position;

-- 3. task_templates table
SELECT 'task_templates' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'task_templates'
ORDER BY ordinal_position;

-- 4. user_profiles table
SELECT 'user_profiles' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check existing approve_submission function signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('approve_submission', 'reject_submission');

-- 6. Sample data from commitment_submissions
SELECT id, commitment_id, submitted_by, submission_status, quality_rating, bonus_tip_cents, submitted_at, reviewed_at
FROM commitment_submissions
ORDER BY submitted_at DESC
LIMIT 3;

-- 7. Sample data from commitments
SELECT id, status, created_at
FROM commitments
ORDER BY created_at DESC
LIMIT 3;
