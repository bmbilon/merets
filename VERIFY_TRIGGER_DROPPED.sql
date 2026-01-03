-- Check if trigger still exists
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'commitment_submissions'
AND trigger_name = 'trigger_update_rep_on_submission';

-- If it's gone, test a direct UPDATE to see if something else is causing overflow
BEGIN;
UPDATE commitment_submissions
SET submission_status = 'approved', quality_rating = 5
WHERE id = 'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b';
ROLLBACK;
