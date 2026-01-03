-- Check for triggers on commitment_submissions table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'commitment_submissions'
ORDER BY trigger_name;
