-- Fix function return types to match actual column types (VARCHAR instead of TEXT)

-- Fix get_issuer_tasks_dashboard
DROP FUNCTION IF EXISTS get_issuer_tasks_dashboard(UUID);

CREATE OR REPLACE FUNCTION get_issuer_tasks_dashboard(p_issuer_user_profile_id UUID)
RETURNS TABLE (
  task_id UUID,
  title VARCHAR,
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

-- Fix get_issuer_all_commitments
DROP FUNCTION IF EXISTS get_issuer_all_commitments(UUID);

CREATE OR REPLACE FUNCTION get_issuer_all_commitments(p_issuer_user_profile_id UUID)
RETURNS TABLE (
  commitment_id UUID,
  task_title VARCHAR,
  earner_name VARCHAR,
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
    COALESCE(v.custom_title, v.template_title)::VARCHAR as task_title,
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

-- Fix get_task_commitments_with_parents
DROP FUNCTION IF EXISTS get_task_commitments_with_parents(UUID);

CREATE OR REPLACE FUNCTION get_task_commitments_with_parents(p_task_template_id UUID)
RETURNS TABLE (
  commitment_id UUID,
  earner_id UUID,
  earner_name VARCHAR,
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

GRANT EXECUTE ON FUNCTION get_issuer_tasks_dashboard TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_task_commitments_with_parents TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_issuer_all_commitments TO authenticated, anon;
