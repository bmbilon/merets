-- Check what notification_type values are actually being used
SELECT DISTINCT notification_type 
FROM notifications 
ORDER BY notification_type;

-- Also check the constraint
SELECT 
  conname,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND contype = 'c';
