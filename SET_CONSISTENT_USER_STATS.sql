-- ============================================================================
-- SET CONSISTENT USER STATS
-- ============================================================================
-- This ensures that rep_score, lifetime_merets, and average_quality_rating
-- are mathematically consistent with each other.
--
-- Rep Level 24 requires 56 merets (10 + 30 + 16)
-- Rep Level 22 requires 48 merets (10 + 30 + 8)
--
-- With 4.5 star average (1.10x multiplier):
--   Rep 24 = 56 merets ÷ 1.10 = 50.91 hours worked
--   Rep 22 = 48 merets ÷ 1.10 = 43.64 hours worked
--
-- Assuming $10/hour average pay:
--   Rep 24 = $509.10 total earnings
--   Rep 22 = $436.40 total earnings
-- ============================================================================

-- Update Aveya (Rep Level 24)
UPDATE user_profiles
SET 
  rep_score = 24,
  lifetime_merets = 56,
  average_quality_rating = 4.5,
  total_earnings_cents = 50910,  -- $509.10 (50.91 hours × $10/hr)
  updated_at = NOW()
WHERE name = 'Aveya';

-- Update Onyx (Rep Level 22)
UPDATE user_profiles
SET 
  rep_score = 22,
  lifetime_merets = 48,
  average_quality_rating = 4.5,
  total_earnings_cents = 43640,  -- $436.40 (43.64 hours × $10/hr)
  updated_at = NOW()
WHERE name = 'Onyx';

-- Verify the updates
SELECT 
  name,
  rep_score,
  lifetime_merets,
  average_quality_rating,
  total_earnings_cents / 100.0 as total_earnings_dollars,
  ROUND(lifetime_merets / average_quality_rating, 2) as implied_hours_worked,
  ROUND((total_earnings_cents / 100.0) / (lifetime_merets / average_quality_rating), 2) as implied_hourly_rate
FROM user_profiles
WHERE name IN ('Onyx', 'Aveya')
ORDER BY name;
