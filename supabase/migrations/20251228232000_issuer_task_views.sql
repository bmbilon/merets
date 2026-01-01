-- View: Issuer's tasks with commitment tracking
CREATE OR REPLACE VIEW v_issuer_tasks_with_commitments AS
SELECT 
  tt.id as task_id,
  tt.title,
  tt.description,
  tt.skill_category,
  tt.effort_minutes,
  tt.base_pay_cents,
  tt.difficulty_level,
  tt.is_micro_task,
  tt.is_available_for_kids,
  tt.due_date,
  tt.max_assignments,
  tt.current_assignments,
  tt.issuer_id,
  
  -- Issuer info
  i.name as issuer_name,
  i.issuer_type,
  i.organization_name,
  
  -- Count of commitments by status
  (SELECT COUNT(*) FROM commitments c WHERE c.task_template_id = tt.id AND c.status = 'pending_approval') as pending_approval_count,
  (SELECT COUNT(*) FROM commitments c WHERE c.task_template_id = tt.id AND c.status = 'accepted') as accepted_count,
  (SELECT COUNT(*) FROM commitments c WHERE c.task_template_id = tt.id AND c.status = 'in_progress') as in_progress_count,
  (SELECT COUNT(*) FROM commitments c WHERE c.task_template_id = tt.id AND c.status = 'ready_for_review') as ready_for_review_count,
  (SELECT COUNT(*) FROM commitments c WHERE c.task_template_id = tt.id AND c.status = 'completed') as completed_count,
  
  tt.created_at
FROM task_templates tt
LEFT JOIN user_profiles up ON tt.issuer_id = up.id
LEFT JOIN issuers i ON i.user_profile_id = up.id
WHERE tt.issuer_id IS NOT NULL;

-- View: Commitment details with earner and parent/guardian info
CREATE OR REPLACE VIEW v_commitments_with_relationships AS
SELECT 
  c.id as commitment_id,
  c.task_template_id,
  c.custom_title,
  c.custom_description,
  c.effort_minutes,
  c.pay_cents,
  c.status,
  c.created_at,
  c.completed_at,
  c.due_date,
  c.kid_notes,
  
  -- Earner (kid) info
  up_earner.id as earner_id,
  up_earner.name as earner_name,
  up_earner.age as earner_age,
  
  -- Issuer info
  c.issuer_id,
  up_issuer.name as issuer_name,
  i.issuer_type,
  i.organization_name,
  
  -- Parent/Guardian info for the earner
  (
    SELECT json_agg(json_build_object(
      'parent_id', up_parent.id,
      'parent_name', up_parent.name,
      'relationship_type', fr.relationship_type,
      'permission_level', fr.permission_level
    ))
    FROM family_relationships fr
    JOIN user_profiles up_parent ON fr.issuer_id = up_parent.id
    WHERE fr.earner_id = up_earner.id
      AND up_parent.role = 'parent'
  ) as parents_guardians,
  
  -- Task template info
  tt.title as template_title,
  tt.skill_category
  
FROM commitments c
JOIN user_profiles up_earner ON c.user_id = up_earner.id
LEFT JOIN user_profiles up_issuer ON c.issuer_id = up_issuer.id
LEFT JOIN issuers i ON i.user_profile_id = up_issuer.id
LEFT JOIN task_templates tt ON c.task_template_id = tt.id;

-- Function: Get issuer's tasks with all commitment details
CREATE OR REPLACE FUNCTION get_issuer_tasks_dashboard(p_issuer_user_profile_id UUID)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  description TEXT,
  effort_minutes INTEGER,
  base_pay_cents INTEGER,
  is_available_for_kids BOOLEAN,
  pending_approval_count BIGINT,
  accepted_count BIGINT,
  in_progress_count BIGINT,
  ready_for_review_count BIGINT,
  completed_count BIGINT,
  total_assignments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.task_id,
    v.title,
    v.description,
    v.effort_minutes,
    v.base_pay_cents,
    v.is_available_for_kids,
    v.pending_approval_count,
    v.accepted_count,
    v.in_progress_count,
    v.ready_for_review_count,
    v.completed_count,
    (v.pending_approval_count + v.accepted_count + v.in_progress_count + v.ready_for_review_count + v.completed_count) as total_assignments
  FROM v_issuer_tasks_with_commitments v
  WHERE v.issuer_id = p_issuer_user_profile_id
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get commitments for a specific task with earner and parent info
CREATE OR REPLACE FUNCTION get_task_commitments_with_parents(p_task_template_id UUID)
RETURNS TABLE (
  commitment_id UUID,
  earner_id UUID,
  earner_name TEXT,
  earner_age INTEGER,
  status TEXT,
  effort_minutes INTEGER,
  pay_cents INTEGER,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date DATE,
  parents_guardians JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.commitment_id,
    v.earner_id,
    v.earner_name,
    v.earner_age,
    v.status,
    v.effort_minutes,
    v.pay_cents,
    v.created_at,
    v.completed_at,
    v.due_date,
    v.parents_guardians
  FROM v_commitments_with_relationships v
  WHERE v.task_template_id = p_task_template_id
  ORDER BY 
    CASE v.status
      WHEN 'pending_approval' THEN 1
      WHEN 'accepted' THEN 2
      WHEN 'in_progress' THEN 3
      WHEN 'ready_for_review' THEN 4
      WHEN 'completed' THEN 5
      ELSE 6
    END,
    v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all commitments for issuer's tasks (overview)
CREATE OR REPLACE FUNCTION get_issuer_all_commitments(p_issuer_user_profile_id UUID)
RETURNS TABLE (
  commitment_id UUID,
  task_title TEXT,
  earner_name TEXT,
  earner_age INTEGER,
  status TEXT,
  effort_minutes INTEGER,
  pay_cents INTEGER,
  created_at TIMESTAMPTZ,
  parents_guardians JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.commitment_id,
    COALESCE(v.custom_title, v.template_title) as task_title,
    v.earner_name,
    v.earner_age,
    v.status,
    v.effort_minutes,
    v.pay_cents,
    v.created_at,
    v.parents_guardians
  FROM v_commitments_with_relationships v
  WHERE v.issuer_id = p_issuer_user_profile_id
  ORDER BY 
    CASE v.status
      WHEN 'pending_approval' THEN 1
      WHEN 'accepted' THEN 2
      WHEN 'in_progress' THEN 3
      WHEN 'ready_for_review' THEN 4
      WHEN 'completed' THEN 5
      ELSE 6
    END,
    v.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON v_issuer_tasks_with_commitments TO authenticated, anon;
GRANT SELECT ON v_commitments_with_relationships TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_issuer_tasks_dashboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_task_commitments_with_parents TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_issuer_all_commitments TO authenticated, anon;
