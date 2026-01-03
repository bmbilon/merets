-- Check current user stats
SELECT 
  name,
  rep_score,
  lifetime_merets,
  average_quality_rating,
  total_earnings_cents,
  ROUND(lifetime_merets / COALESCE(NULLIF(average_quality_rating, 0), 1.0), 2) as implied_hours
FROM user_profiles
WHERE name IN ('Onyx', 'Aveya')
ORDER BY name;
