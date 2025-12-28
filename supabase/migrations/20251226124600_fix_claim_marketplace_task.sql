-- Fix claim_marketplace_task function to use SECURITY DEFINER
-- This allows the function to bypass RLS policies when inserting task assignments

DROP FUNCTION IF EXISTS claim_marketplace_task(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION claim_marketplace_task(
  p_user_id UUID,
  p_task_template_id UUID,
  p_kid_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commitment_id UUID;
  v_task_record RECORD;
BEGIN
  -- Get task details
  SELECT * INTO v_task_record 
  FROM available_tasks_for_kids 
  WHERE task_template_id = p_task_template_id
    AND availability_status = 'available';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not available for claiming';
  END IF;
  
  -- Create commitment
  INSERT INTO commitments (
    user_id,
    task_template_id,
    custom_title,
    custom_description,
    skill_category,
    effort_minutes,
    pay_cents,
    status,
    due_date,
    kid_notes
  ) VALUES (
    p_user_id,
    p_task_template_id,
    v_task_record.title,
    v_task_record.description,
    v_task_record.skill_category,
    v_task_record.effective_effort_minutes::INTEGER,
    v_task_record.effective_pay_cents::INTEGER,
    'pending',
    v_task_record.due_date,
    p_kid_notes
  )
  RETURNING id INTO v_commitment_id;
  
  -- Update assignment count
  IF v_task_record.max_assignments IS NOT NULL THEN
    UPDATE task_templates 
    SET current_assignments = current_assignments + 1
    WHERE id = p_task_template_id;
  END IF;
  
  -- Create task assignment record (with elevated privileges)
  INSERT INTO task_assignments (
    task_template_id,
    user_id,
    commitment_id,
    status
  ) VALUES (
    p_task_template_id,
    p_user_id,
    v_commitment_id,
    'claimed'
  );
  
  RETURN v_commitment_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_marketplace_task(UUID, UUID, TEXT) TO authenticated;
