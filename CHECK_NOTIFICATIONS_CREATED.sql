-- Check if any notifications exist and their details
SELECT 
  n.id,
  n.created_at,
  n.notification_type,
  n.title,
  n.message,
  n.read,
  up.name as recipient_name,
  n.commitment_id,
  n.submission_id
FROM notifications n
JOIN user_profiles up ON up.id = n.recipient_id
ORDER BY n.created_at DESC
LIMIT 10;
