-- Update notification trigger functions to use family_relationships table

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_notify_on_commitment ON commitments;
DROP TRIGGER IF EXISTS trigger_notify_on_submission ON commitment_submissions;

-- Drop existing functions
DROP FUNCTION IF EXISTS notify_on_commitment();
DROP FUNCTION IF EXISTS notify_on_submission();

-- Recreate notify_on_commitment function with correct parent lookup
CREATE OR REPLACE FUNCTION notify_on_commitment()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_issuer_id UUID;
  v_issuer_name TEXT;
  v_earner_name TEXT;
  v_parent_id UUID;
  v_is_external BOOLEAN;
BEGIN
  -- Get task and user details
  SELECT title, issuer_id INTO v_task_title, v_issuer_id
  FROM task_templates WHERE id = NEW.task_template_id;
  
  SELECT name INTO v_earner_name
  FROM user_profiles WHERE id = NEW.user_id;
  
  SELECT name INTO v_issuer_name
  FROM user_profiles WHERE id = v_issuer_id;
  
  -- Get parent/guardian from family_relationships (using relationship_type = 'parent')
  SELECT issuer_id INTO v_parent_id
  FROM family_relationships 
  WHERE earner_id = NEW.user_id 
    AND relationship_type = 'parent'
  LIMIT 1;
  
  -- Check if this is an external task (issuer is not the earner's parent)
  v_is_external := (v_issuer_id != v_parent_id OR v_parent_id IS NULL);
  
  -- If external task, require parental approval
  IF v_is_external AND v_parent_id IS NOT NULL THEN
    UPDATE commitments 
    SET requires_parental_approval = TRUE,
        parental_approval_status = 'pending'
    WHERE id = NEW.id;
    
    -- Notify parent/guardian
    PERFORM send_notification(
      v_parent_id,
      'child_committed_external_task',
      '🔔 Approval Needed',
      v_earner_name || ' wants to commit to "' || v_task_title || '" from ' || COALESCE(v_issuer_name, 'external issuer') || '. Your approval is required.',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'approve_commitment',
      jsonb_build_object('commitment_id', NEW.id, 'task_title', v_task_title),
      'urgent'
    );
  ELSE
    -- Internal task, just notify the kid
    PERFORM send_notification(
      NEW.user_id,
      'task_committed',
      '✅ Task Committed',
      'You committed to "' || v_task_title || '"',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'view_commitment',
      jsonb_build_object('commitment_id', NEW.id),
      'normal'
    );
  END IF;
  
  -- Notify issuer that someone committed
  IF v_issuer_id IS NOT NULL THEN
    PERFORM send_notification(
      v_issuer_id,
      'commitment_made',
      '👤 New Commitment',
      v_earner_name || ' committed to "' || v_task_title || '"',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'view_commitment',
      jsonb_build_object('commitment_id', NEW.id),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate notify_on_submission function with correct parent lookup
CREATE OR REPLACE FUNCTION notify_on_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_task_title TEXT;
  v_earner_id UUID;
  v_earner_name TEXT;
  v_issuer_id UUID;
  v_parent_id UUID;
BEGIN
  -- Get commitment and task details
  SELECT c.user_id, c.task_template_id, t.title, t.issuer_id
  INTO v_earner_id, NEW.commitment_id, v_task_title, v_issuer_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER trigger_notify_on_commitment
  AFTER INSERT ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_commitment();

CREATE TRIGGER trigger_notify_on_submission
  AFTER INSERT ON commitment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_submission();
