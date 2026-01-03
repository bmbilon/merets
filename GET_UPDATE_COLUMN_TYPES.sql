-- Get exact data types for ALL columns that approve_submission updates

SELECT 
    column_name,
    data_type,
    udt_name,
    numeric_precision,
    numeric_scale,
    CASE 
        WHEN data_type = 'numeric' THEN 'NUMERIC(' || numeric_precision || ',' || numeric_scale || ')'
        WHEN data_type = 'integer' THEN 'INTEGER'
        WHEN data_type = 'bigint' THEN 'BIGINT'
        ELSE data_type
    END as full_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND column_name IN (
    'merets_balance',
    'xp',
    'total_tasks_completed',
    'total_merets_earned'
)
ORDER BY column_name;
