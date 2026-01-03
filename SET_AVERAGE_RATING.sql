-- Set average quality rating to 4.5 for Onyx and Aveya
UPDATE user_profiles
SET 
  average_quality_rating = 4.5,
  updated_at = NOW()
WHERE name IN ('Onyx', 'Aveya');

-- Verify the update
SELECT name, rep_score, average_quality_rating, lifetime_merets, total_earnings_cents
FROM user_profiles
WHERE name IN ('Onyx', 'Aveya');
