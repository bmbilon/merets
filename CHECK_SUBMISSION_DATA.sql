-- Check all the data for this submission
SELECT 
    cs.id as submission_id,
    cs.commitment_id,
    cs.submitted_by,
    c.task_template_id,
    c.pay_cents,
    tt.base_merets,
    up.tasks_completed,
    up.average_quality_rating,
    up.total_earnings_cents,
    up.merets_balance,
    up.lifetime_merets
FROM commitment_submissions cs
JOIN commitments c ON cs.commitment_id = c.id
JOIN task_templates tt ON c.task_template_id = tt.id
JOIN user_profiles up ON cs.submitted_by = up.id
WHERE cs.id = 'd0e9b053-cc7f-4e5c-a57b-58d7a6ef957b';
