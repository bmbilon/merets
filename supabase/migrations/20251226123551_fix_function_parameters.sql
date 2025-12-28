-- Fix function parameters to match what the service is calling
-- The service calls get_prioritized_tasks_for_display with p_skill_category, p_is_micro_task, p_limit
-- But our current function only accepts p_user_id and p_limit

-- Drop existing function and recreate with correct parameters
DROP FUNCTION IF EXISTS get_prioritized_tasks_for_display(UUID, INTEGER);

-- Create new function with parameters that match the service calls
CREATE OR REPLACE FUNCTION get_prioritized_tasks_for_display(
  p_skill_category TEXT DEFAULT NULL,
  p_is_micro_task BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  description TEXT,
  skill_category TEXT,
  effort_minutes INTEGER,
  base_pay_cents INTEGER,
  effective_pay_cents NUMERIC,
  effective_effort_minutes INTEGER,
  difficulty_level INTEGER,
  is_micro_task BOOLEAN,
  due_date DATE,
  days_until_due INTEGER,
  priority_type TEXT,
  is_urgent BOOLEAN,
  urgency_score INTEGER,
  parent_notes TEXT,
  availability_status TEXT,
  base_effort_minutes INTEGER,
  priority_level INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.task_template_id as task_id,
    t.title,
    t.description,
    t.skill_category,
    t.effort_minutes,
    t.base_pay_cents,
    t.effective_pay_cents,
    t.effective_effort_minutes,
    t.difficulty_level,
    t.is_micro_task,
    t.due_date,
    t.days_until_due,
    t.priority_type,
    t.is_urgent,
    t.urgency_score,
    t.priority_notes as parent_notes,
    t.availability_status,
    t.effort_minutes as base_effort_minutes,
    t.urgency_score as priority_level
  FROM available_tasks_for_kids t
  WHERE t.availability_status = 'available'
    AND (p_skill_category IS NULL OR t.skill_category = p_skill_category)
    AND (p_is_micro_task IS NULL OR t.is_micro_task = p_is_micro_task)
  ORDER BY 
    t.urgency_score DESC, 
    t.effective_pay_cents DESC,
    t.days_until_due ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_prioritized_tasks_for_display TO authenticated;