-- Give parent some merets to test with
UPDATE user_profiles 
SET merets_balance = 100.00 
WHERE role = 'parent';

-- Now test the approval
SELECT approve_submission(
    'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b'::uuid,
    5,
    (SELECT id FROM user_profiles WHERE role = 'parent' LIMIT 1),
    'Great work!',
    100
);
