-- Check ALL triggers on commitment_submissions, commitments, and user_profiles
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('commitment_submissions', 'commitments', 'user_profiles')
ORDER BY event_object_table, trigger_name;
