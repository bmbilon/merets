-- Drop the broken trigger that's causing double-updates
DROP TRIGGER IF EXISTS trigger_update_rep_on_submission ON commitment_submissions;

-- Test the approval function now
SELECT approve_submission(
    'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'::uuid,
    5,
    (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
    'Excellent work!',
    100
);
