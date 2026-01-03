-- Get the update_rep_on_event function definition
SELECT pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'update_rep_on_event';
