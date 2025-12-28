-- Fix return type mismatches in database functions
-- The issue is that task_templates.title is VARCHAR(200) but our functions return TEXT
-- PostgreSQL is strict about type matching in function returns

-- Fix get_prioritized_tasks_for_display function
DROP FUNCTION IF EXISTS get_prioritized_tasks_for_display(TEXT, BOOLEAN, INTEGER, UUID);

CREATE OR REPLACE FUNCTION get_prioritized_tasks_for_display(
  p_skill_category TEXT DEFAULT NULL,
  p_is_micro_task BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  task_id UUID,
  title VARCHAR(200),  -- Changed from TEXT to VARCHAR(200) to match table definition
  description TEXT,
  skill_category VARCHAR(50),  -- Changed from TEXT to VARCHAR(50) to match table definition
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

-- Fix get_marketplace_tasks function  
DROP FUNCTION IF EXISTS get_marketplace_tasks(UUID, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, BOOLEAN, TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_marketplace_tasks(
  p_user_id UUID DEFAULT NULL,
  p_min_pay_cents INTEGER DEFAULT 0,
  p_max_pay_cents INTEGER DEFAULT NULL,
  p_min_effort_minutes INTEGER DEFAULT 0,
  p_max_effort_minutes INTEGER DEFAULT NULL,
  p_skill_category TEXT DEFAULT NULL,
  p_is_micro_task BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'urgency_score',
  p_sort_order TEXT DEFAULT 'DESC',
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR(200),  -- Changed from TEXT to VARCHAR(200)
  description TEXT,
  skill_category VARCHAR(50),  -- Changed from TEXT to VARCHAR(50)
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
  max_assignments INTEGER,
  current_assignments INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.task_template_id as id,
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
    t.max_assignments,
    t.current_assignments
  FROM available_tasks_for_kids t
  WHERE 
    (p_min_pay_cents IS NULL OR t.effective_pay_cents >= p_min_pay_cents)
    AND (p_max_pay_cents IS NULL OR t.effective_pay_cents <= p_max_pay_cents)
    AND (p_min_effort_minutes IS NULL OR t.effective_effort_minutes >= p_min_effort_minutes)
    AND (p_max_effort_minutes IS NULL OR t.effective_effort_minutes <= p_max_effort_minutes)
    AND (p_skill_category IS NULL OR t.skill_category = p_skill_category)
    AND (p_is_micro_task IS NULL OR t.is_micro_task = p_is_micro_task)
  ORDER BY 
    CASE WHEN p_sort_by = 'effective_pay_cents' AND p_sort_order = 'DESC' THEN t.effective_pay_cents END DESC,
    CASE WHEN p_sort_by = 'effective_pay_cents' AND p_sort_order = 'ASC' THEN t.effective_pay_cents END ASC,
    CASE WHEN p_sort_by = 'effective_effort_minutes' AND p_sort_order = 'DESC' THEN t.effective_effort_minutes END DESC,
    CASE WHEN p_sort_by = 'effective_effort_minutes' AND p_sort_order = 'ASC' THEN t.effective_effort_minutes END ASC,
    CASE WHEN p_sort_by = 'days_until_due' AND p_sort_order = 'ASC' THEN t.days_until_due END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'days_until_due' AND p_sort_order = 'DESC' THEN t.days_until_due END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'urgency_score' AND p_sort_order = 'DESC' THEN t.urgency_score END DESC,
    CASE WHEN p_sort_by = 'urgency_score' AND p_sort_order = 'ASC' THEN t.urgency_score END ASC,
    t.urgency_score DESC, t.effective_pay_cents DESC -- Default fallback
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_prioritized_tasks_for_display TO authenticated;
GRANT EXECUTE ON FUNCTION get_marketplace_tasks TO authenticated;