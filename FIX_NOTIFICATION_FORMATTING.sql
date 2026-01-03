-- Fix approve_submission function with proper formatting and merets calculation
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
  v_task_template_id UUID;
  v_reviewer_name TEXT;
  v_money_display TEXT;
  v_tip_display TEXT;
BEGIN
  -- Get commitment details and task info
  SELECT 
    cs.commitment_id,
    c.user_id,
    c.pay_cents,
    c.task_template_id,
    COALESCE(tt.base_merets, 10),
    tt.title
  INTO 
    v_commitment_id,
    v_user_id,
    v_base_pay_cents,
    v_task_template_id,
    v_base_merets,
    v_task_title
  FROM commitment_submissions cs
  JOIN commitments c ON c.id = cs.commitment_id
  JOIN task_templates tt ON tt.id = c.task_template_id
  WHERE cs.id = p_submission_id;

  -- Calculate totals
  v_total_money_cents := v_base_pay_cents + COALESCE(p_bonus_tip_cents, 0);
  -- Ensure merets is at least 10 if base_merets is null or 0
  v_total_merets := CASE WHEN v_base_merets > 0 THEN v_base_merets ELSE 10 END;

  -- Format money properly (convert cents to dollars with 2 decimal places)
  v_money_display := TRIM(TO_CHAR(v_total_money_cents / 100.0, 'FM999999990.00'));
  v_tip_display := TRIM(TO_CHAR(p_bonus_tip_cents / 100.0, 'FM999999990.00'));

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
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;

  -- Update commitment
  UPDATE commitments
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_commitment_id;

  -- Update user profile
  UPDATE user_profiles
  SET 
    total_earnings_cents = total_earnings_cents + v_total_money_cents,
    merets_balance = merets_balance + v_total_merets,
    lifetime_merets = lifetime_merets + v_total_merets,
    completed_commitments = completed_commitments + 1,
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Create notification for the user (using recipient_id not user_id)
  INSERT INTO notifications (
    recipient_id,
    notification_type,
    title,
    message,
    commitment_id,
    submission_id,
    task_template_id,
    read,
    archived,
    action_type,
    action_data,
    priority
  ) VALUES (
    v_user_id,
    'work_approved',
    '✅ Task Approved!',
    CASE 
      WHEN p_bonus_tip_cents > 0 THEN
        'Great job on "' || v_task_title || '"! ' || COALESCE(v_reviewer_name, 'Your parent') || 
        ' approved your work and gave you a $' || v_tip_display || 
        ' bonus tip! You earned $' || v_money_display || 
        ' total and ' || v_total_merets || ' merets.' ||
        CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
      ELSE
        'Great job on "' || v_task_title || '"! ' || COALESCE(v_reviewer_name, 'Your parent') || 
        ' approved your work. You earned $' || v_money_display || 
        ' and ' || v_total_merets || ' merets.' ||
        CASE WHEN p_reviewer_notes IS NOT NULL THEN ' Feedback: "' || p_reviewer_notes || '"' ELSE '' END
    END,
    v_commitment_id,
    p_submission_id,
    v_task_template_id,
    FALSE,
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
    ),
    'high'
  );

  -- Return success with earnings
  RETURN json_build_object(
    'success', TRUE,
    'money_earned_cents', v_total_money_cents,
    'merets_earned', v_total_merets
  );
END;
$$;
