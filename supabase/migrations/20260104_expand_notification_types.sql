-- ============================================================================
-- Migration: Expand notification_type constraint
-- Date: 2026-01-04
-- Purpose: Add canonical types while keeping legacy types
-- ============================================================================
-- 
-- CURRENT STATE: Only legacy types allowed (work_approved, task_committed, etc)
-- NEW STATE: Both legacy AND canonical types allowed
-- 
-- This allows gradual migration from legacy → canonical without breaking anything
-- ============================================================================

-- Drop old constraint
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

-- Add expanded constraint (legacy + canonical)
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type = ANY (ARRAY[
    -- ========================================================================
    -- CANONICAL TYPES (new standard)
    -- ========================================================================
    'task_assigned',
    'task_completed',
    'task_approved',
    'task_rejected',
    'payment_received',
    'achievement_unlocked',
    'reminder',
    'system',

    -- ========================================================================
    -- LEGACY TYPES (existing, keep for backward compatibility)
    -- ========================================================================
    'task_committed',
    'external_task_pending_approval',
    'external_task_approved',
    'external_task_denied',
    'work_approved',
    'work_rejected',
    'meret_earned',
    'rework_requested',
    'rating_received',
    'child_committed_external_task',
    'child_submitted_work',
    'approval_needed',
    'dispute_raised',
    'work_submitted',
    'commitment_made'
  ]::text[]));

-- ============================================================================
-- MIGRATION NOTES:
-- ============================================================================
-- 
-- IMMEDIATE EFFECT:
-- - All existing notifications remain valid ✅
-- - New code can use either legacy or canonical types ✅
-- - No breaking changes ✅
-- 
-- FUTURE CLEANUP (optional):
-- 1. Migrate existing notifications:
--    UPDATE notifications SET notification_type = 'task_approved' 
--    WHERE notification_type = 'work_approved';
-- 
-- 2. Update all functions to use canonical types
-- 
-- 3. Once migration complete, remove legacy types from constraint
-- 
-- MAPPING (legacy → canonical):
-- - work_approved → task_approved
-- - work_rejected → task_rejected
-- - work_submitted → task_completed
-- - child_submitted_work → task_completed
-- - task_committed → task_assigned
-- - commitment_made → task_assigned
-- ============================================================================
