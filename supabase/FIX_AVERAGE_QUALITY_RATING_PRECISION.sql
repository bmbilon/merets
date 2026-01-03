-- ============================================================================
-- FIX average_quality_rating DECIMAL PRECISION
-- ============================================================================
-- The DECIMAL(3,2) was causing overflow errors when calculating running average
-- with large numbers of completed commitments (e.g., 4.5 * 65 = 292.5 > 9.99 max)
-- 
-- Change to DECIMAL(5,2) to allow intermediate calculations up to 999.99
-- Created: 2026-01-03
-- ============================================================================

ALTER TABLE user_profiles
ALTER COLUMN average_quality_rating TYPE DECIMAL(5,2);

-- Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name = 'average_quality_rating';
