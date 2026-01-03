-- Drop the broken trigger on commitments
DROP TRIGGER IF EXISTS trg_commitment_status_change_update_rep ON commitments;

-- Test approval again
SELECT approve_submission(
    'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'::uuid,
    5,
    (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
    'Excellent work!',
    100
);
