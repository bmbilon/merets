-- Get the on_commitment_status_change_update_rep function definition
SELECT pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'on_commitment_status_change_update_rep';
