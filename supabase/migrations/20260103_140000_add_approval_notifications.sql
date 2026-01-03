-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT,
  action_data JSONB
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Update the approve_submission function to create a notification
CREATE OR REPLACE FUNCTION approve_submission(
  p_submission_id UUID,
  p_quality_rating INTEGER,
  p_bonus_tip_cents INTEGER DEFAULT 0,
  p_reviewer_notes TEXT DEFAULT NULL,
  p_reviewed_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_commitment_id UUID;
  v_user_id UUID;
  v_base_pay_cents INTEGER;
  v_base_merets INTEGER;
  v_total_money_cents INTEGER;
  v_total_merets INTEGER;
  v_task_title TEXT;
  v_reviewer_name TEXT;
BEGIN
  -- Get commitment details and task info
  SELECT 
    cs.commitment_id,
    c.user_id,
    c.pay_cents,
    tt.base_merets,
    tt.title
  INTO 
    v_commitment_id,
    v_user_id,
    v_base_pay_cents,
    v_base_merets,
    v_task_title
  FROM commitment_submissions cs
  JOIN commitments c ON c.id = cs.commitment_id
  JOIN task_templates tt ON tt.id = c.task_template_id
  WHERE cs.id = p_submission_id;

  -- Calculate totals
  v_total_money_cents := v_base_pay_cents + COALESCE(p_bonus_tip_cents, 0);
  v_total_merets := v_base_merets;

  -- Get reviewer name
  IF p_reviewed_by IS NOT NULL THEN
    SELECT name INTO v_reviewer_name
    FROM user_profiles
    WHERE id = p_reviewed_by;
  END IF;

  -- Update submission
  UPDATE commitment_submissions
  SET 
    submission_status = 'approved',
    quality_rating = p_quality_rating,
    bonus_tip_cents = COALESCE(p_bonus_tip_cents, 0),
    reviewer_notes = p_reviewer_notes,
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW()
  WHERE id = p_submission_id;

  -- Update commitment
  UPDATE commitments
  SET 
    status = 'completed',
    completed_at = NOW()
  WHERE id = v_commitment_id;

  -- Update user profile
  UPDATE user_profiles
  SET 
    total_earnings_cents = total_earnings_cents + v_total_money_cents,
    merets_balance = merets_balance + v_total_merets,
    lifetime_merets = lifetime_merets + v_total_merets,
    completed_commitments = completed_commitments + 1
  WHERE id = v_user_id;

  -- Create notification for the user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    read,
    action_type,
    action_data
  ) VALUES (
    v_user_id,
    'work_approved',
    '✅ Task Approved!',
    CASE 
      WHEN p_bonus_tip_cents > 0 THEN
        format('Great job on "%s"! %s approved your work and gave you a $%s bonus tip! You earned $%s total and %s merets.%s',
          v_task_title,
          COALESCE(v_reviewer_name, 'Your parent'),
          (p_bonus_tip_cents::NUMERIC / 100)::TEXT,
          (v_total_money_cents::NUMERIC / 100)::TEXT,
          v_total_merets,
          CASE WHEN p_reviewer_notes IS NOT NULL THEN format(' Feedback: "%s"', p_reviewer_notes) ELSE '' END
        )
      ELSE
        format('Great job on "%s"! %s approved your work. You earned $%s and %s merets.%s',
          v_task_title,
          COALESCE(v_reviewer_name, 'Your parent'),
          (v_total_money_cents::NUMERIC / 100)::TEXT,
          v_total_merets,
          CASE WHEN p_reviewer_notes IS NOT NULL THEN format(' Feedback: "%s"', p_reviewer_notes) ELSE '' END
        )
    END,
    FALSE,
    'view_task',
    jsonb_build_object(
      'commitment_id', v_commitment_id,
      'submission_id', p_submission_id,
      'money_earned_cents', v_total_money_cents,
      'merets_earned', v_total_merets,
      'quality_rating', p_quality_rating,
      'bonus_tip_cents', p_bonus_tip_cents,
      'reviewer_notes', p_reviewer_notes
    )
  );

  -- Return success with earnings
  RETURN json_build_object(
    'success', TRUE,
    'money_earned_cents', v_total_money_cents,
    'merets_earned', v_total_merets
  );
END;
$$;
