-- ============================================================================
-- FIX notify_on_submission FUNCTION BUG
-- ============================================================================
-- The function was overwriting NEW.commitment_id with task_template_id
-- This caused foreign key violations when trying to insert notifications
-- Created: 2026-01-02
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_on_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_task_template_id UUID;
  v_earner_id UUID;
  v_earner_name TEXT;
  v_issuer_id UUID;
  v_parent_id UUID;
BEGIN
  -- Get commitment and task details
  -- FIXED: Use v_task_template_id instead of overwriting NEW.commitment_id
  SELECT c.user_id, c.task_template_id, t.title, t.issuer_id
  INTO v_earner_id, v_task_template_id, v_task_title, v_issuer_id
  FROM commitments c
  JOIN task_templates t ON t.id = c.task_template_id
  WHERE c.id = NEW.commitment_id;
  
  SELECT name INTO v_earner_name
  FROM user_profiles WHERE id = v_earner_id;
  
  -- Get parent/guardian from family_relationships
  SELECT issuer_id INTO v_parent_id
  FROM family_relationships 
  WHERE earner_id = v_earner_id 
    AND relationship_type = 'parent'
  LIMIT 1;
  
  -- Notify issuer
  IF v_issuer_id IS NOT NULL THEN
    PERFORM send_notification(
      v_issuer_id,
      'work_submitted',
      '📸 Work Submitted',
      v_earner_name || ' submitted "' || v_task_title || '" for review',
      NEW.commitment_id,
      NEW.id,
      NULL,
      'view_submission',
      jsonb_build_object('submission_id', NEW.id, 'commitment_id', NEW.commitment_id),
      'high'
    );
  END IF;
  
  -- Notify parent/guardian
  IF v_parent_id IS NOT NULL THEN
    PERFORM send_notification(
      v_parent_id,
      'child_submitted_work',
      '📋 Work Submitted',
      v_earner_name || ' submitted "' || v_task_title || '" for approval',
      NEW.commitment_id,
      NEW.id,
      NULL,
      'view_submission',
      jsonb_build_object('submission_id', NEW.id, 'commitment_id', NEW.commitment_id),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
