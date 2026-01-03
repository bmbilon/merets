-- ============================================================================
-- FIX ALL REMAINING DECIMAL(3,2) COLUMNS
-- ============================================================================
-- This drops the view, fixes columns, and recreates the view
-- ============================================================================

-- Step 1: Drop the view that depends on task_templates.urgency_multiplier
DROP VIEW IF EXISTS available_tasks_for_kids CASCADE;

-- Step 2: Fix all DECIMAL(3,2) columns in tables
ALTER TABLE task_templates
ALTER COLUMN urgency_multiplier TYPE DECIMAL(5,2);

ALTER TABLE rep_events
ALTER COLUMN quality_avg TYPE DECIMAL(5,2);

ALTER TABLE rep_events
ALTER COLUMN volume_bonus TYPE DECIMAL(5,2);

-- Step 3: Recreate the view
CREATE OR REPLACE VIEW available_tasks_for_kids AS
SELECT 
  tt.id AS task_template_id,
  tt.id,
  tt.title,
  tt.description,
  tt.skill_category,
  tt.effort_minutes,
  tt.base_pay_cents,
  tt.difficulty_level,
  tt.is_micro_task,
  tt.created_at,
  tt.due_date,
  tt.is_available_for_kids,
  tt.max_assignments,
  tt.current_assignments,
  tt.parent_notes,
  tt.urgency_multiplier,
  tp.priority_type,
  tp.is_urgent,
  tp.custom_pay_cents,
  tp.custom_effort_minutes,
  tp.parent_notes AS priority_notes,
  COALESCE(tp.custom_pay_cents, tt.base_pay_cents)::numeric * COALESCE(tt.urgency_multiplier, 1.0) AS effective_pay_cents,
  COALESCE(tp.custom_effort_minutes, tt.effort_minutes) AS effective_effort_minutes,
  CASE
    WHEN tp.priority_type = 'urgent'::text THEN 100
    WHEN tp.priority_type = 'high'::text THEN 75
    WHEN tp.priority_type = 'normal'::text THEN 50
    WHEN tp.priority_type = 'low'::text THEN 25
    ELSE 50
  END AS urgency_score,
  CASE
    WHEN tt.due_date IS NOT NULL THEN tt.due_date - CURRENT_DATE
    ELSE NULL::integer
  END AS days_until_due,
  CASE
    WHEN tt.max_assignments IS NOT NULL AND tt.current_assignments >= tt.max_assignments THEN 'full'::text
    WHEN tt.due_date IS NOT NULL AND tt.due_date < CURRENT_DATE THEN 'expired'::text
    WHEN tt.is_available_for_kids = false THEN 'hidden'::text
    ELSE 'available'::text
  END AS availability_status
FROM task_templates tt
LEFT JOIN task_priorities tp ON tt.id = tp.task_template_id
WHERE tt.is_available_for_kids = true 
  AND (tt.max_assignments IS NULL OR tt.current_assignments < tt.max_assignments) 
  AND (tt.due_date IS NULL OR tt.due_date >= CURRENT_DATE);

-- Step 4: Verify no more DECIMAL(3,2) columns exist
SELECT 
  COUNT(*) as remaining_decimal_3_2_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'numeric'
  AND numeric_precision = 3
  AND numeric_scale = 2;

SELECT 'All DECIMAL columns fixed!' as status;
