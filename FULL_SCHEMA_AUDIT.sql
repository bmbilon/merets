-- ============================================================================
-- COMPLETE SCHEMA AUDIT FOR APPROVAL FLOW
-- ============================================================================

-- Get ALL columns with full precision details for relevant tables
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name,
    numeric_precision,
    numeric_scale,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN (
    'commitment_submissions',
    'commitments', 
    'task_templates',
    'user_profiles'
)
ORDER BY 
    table_name,
    ordinal_position;
