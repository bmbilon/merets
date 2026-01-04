-- ============================================================================
-- NOTIFICATION TYPE SANITY CHECK
-- Run this BEFORE tightening any constraints
-- ============================================================================

-- 1. Check what notification types are actually in use
SELECT 
  notification_type, 
  COUNT(*) as count,
  MIN(created_at) as first_used,
  MAX(created_at) as last_used
FROM notifications
GROUP BY notification_type
ORDER BY count DESC;

-- 2. Check current constraint definition
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notifications'::regclass
  AND conname LIKE '%notification_type%';

-- ============================================================================
-- EXPECTED "CANONICAL 8" TYPES:
-- - task_assigned
-- - task_completed
-- - task_approved
-- - task_rejected
-- - payment_received
-- - achievement_unlocked
-- - reminder
-- - system
--
-- POSSIBLE LEGACY TYPES (from old migrations):
-- - work_approved
-- - work_rejected
-- - work_submitted
-- - task_reminder
-- - etc.
-- ============================================================================

-- ============================================================================
-- IF LEGACY TYPES EXIST:
-- ============================================================================
-- DO NOT tighten constraint yet!
-- 
-- Option A: Migrate legacy data first
-- UPDATE notifications SET notification_type = 'task_approved' 
-- WHERE notification_type = 'work_approved';
--
-- Option B: Include legacy types in allowed set
-- ALTER TABLE notifications DROP CONSTRAINT notifications_notification_type_check;
-- ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check
-- CHECK (notification_type IN (
--   'task_assigned', 'task_completed', 'task_approved', 'task_rejected',
--   'payment_received', 'achievement_unlocked', 'reminder', 'system',
--   'work_approved', 'work_rejected'  -- legacy types
-- ));
-- ============================================================================

-- ============================================================================
-- BETTER LONG-TERM SOLUTION: Lookup Table (prevents constraint surgery)
-- ============================================================================
-- 
-- Step 1: Create lookup table
-- CREATE TABLE notification_types (
--   type TEXT PRIMARY KEY,
--   description TEXT,
--   is_legacy BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
--
-- Step 2: Populate with current types
-- INSERT INTO notification_types (type, is_legacy) VALUES
--   ('task_assigned', false),
--   ('task_completed', false),
--   ('task_approved', false),
--   ('task_rejected', false),
--   ('payment_received', false),
--   ('achievement_unlocked', false),
--   ('reminder', false),
--   ('system', false);
--
-- Step 3: Add legacy types if they exist
-- INSERT INTO notification_types (type, is_legacy) 
-- SELECT DISTINCT notification_type, true
-- FROM notifications
-- WHERE notification_type NOT IN (
--   'task_assigned', 'task_completed', 'task_approved', 'task_rejected',
--   'payment_received', 'achievement_unlocked', 'reminder', 'system'
-- );
--
-- Step 4: Drop CHECK constraint, add FK
-- ALTER TABLE notifications DROP CONSTRAINT notifications_notification_type_check;
-- ALTER TABLE notifications ADD CONSTRAINT fk_notification_type
--   FOREIGN KEY (notification_type) REFERENCES notification_types(type);
--
-- Step 5: Adding new types is now simple
-- INSERT INTO notification_types (type) VALUES ('new_type');
--
-- No more constraint surgery!
-- ============================================================================
