-- Query to check task templates in database
SELECT id, title, effort_minutes, base_pay_cents, is_available_for_kids, skill_category
FROM task_templates
ORDER BY effort_minutes;
