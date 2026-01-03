-- Check for constraints on user_profiles
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
ORDER BY conname;
