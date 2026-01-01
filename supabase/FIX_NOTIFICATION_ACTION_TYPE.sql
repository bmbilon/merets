-- Fix notifications action_type constraint to include approve_commitment

-- Drop the old constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_action_type_check;

-- Add new constraint with all action types including approve_commitment
ALTER TABLE notifications ADD CONSTRAINT notifications_action_type_check 
CHECK (action_type IN (
  'view_task',
  'view_commitment',
  'view_submission',
  'approve_commitment',
  'approve_submission',
  'view_notification_settings',
  'none'
));
