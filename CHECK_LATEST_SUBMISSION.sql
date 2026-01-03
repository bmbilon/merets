-- Check the latest submission and its payment details
SELECT 
    cs.id as submission_id,
    cs.submission_status,
    cs.quality_rating,
    cs.bonus_tip_cents,
    c.pay_cents as commitment_pay_cents,
    tt.base_pay_cents as template_base_pay,
    cs.submitted_by as kid_id,
    up.total_earnings_cents as kid_earnings
FROM commitment_submissions cs
JOIN commitments c ON cs.commitment_id = c.id
JOIN task_templates tt ON c.task_template_id = tt.id
JOIN user_profiles up ON cs.submitted_by = up.id
ORDER BY cs.updated_at DESC
LIMIT 1;
