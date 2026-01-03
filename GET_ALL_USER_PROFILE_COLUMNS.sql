-- Get ALL columns in user_profiles table
SELECT 
    column_name,
    data_type,
    udt_name,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;
