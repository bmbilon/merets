-- ============================================================================
-- RENAME photo_urls TO proof_photos IN commitment_submissions
-- ============================================================================
-- This migration renames the column to match the application code expectations
-- Created: 2026-01-02
-- ============================================================================

-- Rename the column
ALTER TABLE commitment_submissions 
RENAME COLUMN photo_urls TO proof_photos;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commitment_submissions' 
  AND column_name = 'proof_photos';
