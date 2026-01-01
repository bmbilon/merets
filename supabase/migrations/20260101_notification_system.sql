-- =====================================================
-- MERETS NOTIFICATION SYSTEM
-- Aligned with vision of accountability and commitment
-- Includes parental oversight for external tasks
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Recipients
  recipient_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    -- Earner notifications
    'task_committed',
    'external_task_pending_approval',
    'external_task_approved',
    'external_task_denied',
    'work_approved',
    'work_rejected',
    'payment_received',
    'meret_earned',
    'rework_requested',
    'rating_received',
    
    -- Parent/Guardian notifications
    'child_committed_external_task',
    'child_submitted_work',
    'approval_needed',
    'dispute_raised',
    
    -- Issuer notifications
    'work_submitted',
    'commitment_made'
  )),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  commitment_id UUID REFERENCES commitments(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES commitment_submissions(id) ON DELETE CASCADE,
  task_template_id UUID REFERENCES task_templates(id) ON DELETE SET NULL,
  
  -- Metadata
  read BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  
  -- Action data (for navigation)
  action_type TEXT CHECK (action_type IN (
    'view_commitment',
    'approve_external_task',
    'view_submission',
    'approve_work',
    'view_rating',
    'view_dispute',
    'none'
  )),
  action_data JSONB,
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_commitment ON notifications(commitment_id);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid() OR recipient_id IN (
  SELECT id FROM user_profiles WHERE id = auth.uid()
));

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid() OR recipient_id IN (
  SELECT id FROM user_profiles WHERE id = auth.uid()
));

-- System can create notifications (via service role)
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- PARENTAL APPROVAL SYSTEM
-- =====================================================

-- Add parental approval fields to commitments table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'commitments' AND column_name = 'requires_parental_approval') THEN
    ALTER TABLE commitments ADD COLUMN requires_parental_approval BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'commitments' AND column_name = 'parental_approval_status') THEN
    ALTER TABLE commitments ADD COLUMN parental_approval_status TEXT DEFAULT 'not_required' 
      CHECK (parental_approval_status IN ('not_required', 'pending', 'approved', 'denied'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'commitments' AND column_name = 'parent_approver_id') THEN
    ALTER TABLE commitments ADD COLUMN parent_approver_id UUID REFERENCES user_profiles(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'commitments' AND column_name = 'parent_approval_notes') THEN
    ALTER TABLE commitments ADD COLUMN parent_approval_notes TEXT;
  END IF;
END $$;

-- =====================================================
-- NOTIFICATION TRIGGER FUNCTIONS
-- =====================================================

-- Function: Send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_recipient_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_commitment_id UUID DEFAULT NULL,
  p_submission_id UUID DEFAULT NULL,
  p_task_template_id UUID DEFAULT NULL,
  p_action_type TEXT DEFAULT 'none',
  p_action_data JSONB DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    recipient_id,
    notification_type,
    title,
    message,
    commitment_id,
    submission_id,
    task_template_id,
    action_type,
    action_data,
    priority
  ) VALUES (
    p_recipient_id,
    p_type,
    p_title,
    p_message,
    p_commitment_id,
    p_submission_id,
    p_task_template_id,
    p_action_type,
    p_action_data,
    p_priority
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Notify on commitment creation
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
  SELECT title, created_by INTO v_task_title, v_issuer_id
  FROM task_templates WHERE id = NEW.task_template_id;
  
  SELECT name INTO v_earner_name
  FROM user_profiles WHERE id = NEW.user_id;
  
  SELECT name INTO v_issuer_name
  FROM user_profiles WHERE id = v_issuer_id;
  
  -- Check if this is an external task (issuer is not the earner's parent)
  SELECT parent_id INTO v_parent_id
  FROM user_profiles WHERE id = NEW.user_id;
  
  v_is_external := (v_issuer_id != v_parent_id);
  
  -- If external task, require parental approval
  IF v_is_external THEN
    UPDATE commitments 
    SET requires_parental_approval = TRUE,
        parental_approval_status = 'pending'
    WHERE id = NEW.id;
    
    -- Notify parent/guardian
    PERFORM send_notification(
      v_parent_id,
      'child_committed_external_task',
      '🔔 Approval Needed',
      v_earner_name || ' wants to commit to "' || v_task_title || '" from ' || v_issuer_name || '. Your approval is required.',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'approve_external_task',
      jsonb_build_object('commitment_id', NEW.id, 'task_title', v_task_title),
      'high'
    );
    
    -- Notify earner that approval is pending
    PERFORM send_notification(
      NEW.user_id,
      'external_task_pending_approval',
      '⏳ Awaiting Approval',
      'Your parent/guardian must approve "' || v_task_title || '" before you can proceed.',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'view_commitment',
      jsonb_build_object('commitment_id', NEW.id),
      'normal'
    );
  ELSE
    -- Internal task, notify earner of successful commitment
    PERFORM send_notification(
      NEW.user_id,
      'task_committed',
      '✅ Task Committed',
      'You committed to "' || v_task_title || '". Get started!',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'view_commitment',
      jsonb_build_object('commitment_id', NEW.id),
      'normal'
    );
  END IF;
  
  -- Always notify the issuer
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Notify on work submission
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
  SELECT c.user_id, c.task_template_id, t.title, t.created_by
  INTO v_earner_id, NEW.commitment_id, v_task_title, v_issuer_id
  FROM commitments c
  JOIN task_templates t ON t.id = c.task_template_id
  WHERE c.id = NEW.commitment_id;
  
  SELECT name INTO v_earner_name
  FROM user_profiles WHERE id = v_earner_id;
  
  -- Get parent/guardian
  SELECT parent_id INTO v_parent_id
  FROM user_profiles WHERE id = v_earner_id;
  
  -- Notify issuer
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
  
  -- Notify parent/guardian
  IF v_parent_id IS NOT NULL THEN
    PERFORM send_notification(
      v_parent_id,
      'child_submitted_work',
      '📋 Work Submitted',
      v_earner_name || ' submitted "' || v_task_title || '" for review',
      NEW.commitment_id,
      NEW.id,
      NULL,
      'view_submission',
      jsonb_build_object('submission_id', NEW.id, 'commitment_id', NEW.commitment_id),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_on_commitment ON commitments;
CREATE TRIGGER trigger_notify_on_commitment
AFTER INSERT ON commitments
FOR EACH ROW
EXECUTE FUNCTION notify_on_commitment();

DROP TRIGGER IF EXISTS trigger_notify_on_submission ON commitment_submissions;
CREATE TRIGGER trigger_notify_on_submission
AFTER INSERT ON commitment_submissions
FOR EACH ROW
EXECUTE FUNCTION notify_on_submission();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE recipient_id = p_user_id AND read = FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications SET read = TRUE WHERE id = p_notification_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications SET read = TRUE WHERE recipient_id = p_user_id AND read = FALSE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
