-- Complete schema verification for approval flow

-- 1. Get ALL columns from commitment_submissions
SELECT 'commitment_submissions' as tbl, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'commitment_submissions'
ORDER BY ordinal_position;

-- 2. Get ALL columns from commitments
SELECT 'commitments' as tbl, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'commitments'
ORDER BY ordinal_position;

-- 3. Get ALL columns from task_templates
SELECT 'task_templates' as tbl, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'task_templates'
ORDER BY ordinal_position;

-- 4. Get ALL columns from user_profiles
SELECT 'user_profiles' as tbl, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('commitment_submissions', 'commitments')
ORDER BY tc.table_name;

-- 6. Get sample data to understand the flow
SELECT 
    cs.id as submission_id,
    cs.commitment_id,
    cs.submitted_by,
    cs.submission_status,
    c.id as commitment_id_check,
    c.task_template_id,
    c.status as commitment_status
FROM commitment_submissions cs
LEFT JOIN commitments c ON cs.commitment_id = c.id
WHERE cs.id = 'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'
LIMIT 1;
