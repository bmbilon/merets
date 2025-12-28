-- Reset all commitments to fix the 5/3 limit issue
-- This will delete all active commitments for Aveya and Onyx

-- Delete all commitments
DELETE FROM commitments WHERE status IN ('pending', 'approved');

-- Verify the deletion
SELECT 
  u.name,
  COUNT(c.id) as active_commitments,
  SUM(c.effort_minutes) as total_minutes
FROM user_profiles u
LEFT JOIN commitments c ON c.user_id = u.id AND c.status IN ('pending', 'approved')
WHERE u.role = 'kid'
GROUP BY u.name;
