-- Fix for composite rep function/view with proper casts and safe drops
-- This supersedes earlier 20251226_enhanced_rep_formula.sql without reusing its version key

-- Ensure we can change the return type by dropping the previous signature first
DROP FUNCTION IF EXISTS public.calculate_composite_rep(uuid) CASCADE;

-- Recreate composite rep function (0-100 int scale to match user_profiles.rep_score)
CREATE OR REPLACE FUNCTION public.calculate_composite_rep(p_earner_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  v_completion_rate numeric := 1.0;
  v_quality_avg numeric := 3.0;
  v_volume_bonus numeric := 0.0;
  v_total int := 0;
  v_completed int := 0;
  v_score int := 50;
BEGIN
  SELECT 
    count(*) FILTER (WHERE status IN ('completed', 'failed', 'canceled')),
    count(*) FILTER (WHERE status = 'completed')
  INTO v_total, v_completed
  FROM commitments WHERE user_id = p_earner_id;

  IF v_total > 0 THEN
    v_completion_rate := v_completed::numeric / v_total::numeric;
  END IF;

  SELECT COALESCE(AVG(quality_stars), 3.0)
  INTO v_quality_avg
  FROM commitment_reviews cr
  JOIN commitments c ON c.id = cr.commitment_id
  WHERE c.user_id = p_earner_id;

  IF v_completed > 0 THEN
    v_volume_bonus := LEAST(10.0, LN(v_completed + 1) * 2.0);
  END IF;

  v_score := GREATEST(0, LEAST(100, ROUND(
    (v_completion_rate * 40.0) +
    ((v_quality_avg - 1.0) / 4.0 * 50.0) +
    v_volume_bonus
  )::int));

  RETURN v_score;
END;
$$;

-- Keep existing triggers from prior migrations; no new triggers added in this fix.
-- (on_commitment_review_create_events already recalculates rep using calculate_composite_rep)
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_earner_id uuid;
  v_new_rep numeric(3,2);
BEGIN
  SELECT c.user_id INTO v_earner_id FROM commitments c WHERE c.id = NEW.commitment_id;
  IF v_earner_id IS NULL THEN RETURN NEW; END IF;
  v_new_rep := public.calculate_composite_rep(v_earner_id);
  UPDATE user_profiles
  SET rep_stars = v_new_rep,
      rep_count = rep_count + 1,
      updated_at = NOW()
  WHERE id = v_earner_id;
  RETURN NEW;
END;
$$;

-- (no duplicate triggers created to avoid double-processing of reviews)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_rep numeric(3,2);
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('completed', 'failed', 'canceled') THEN
    v_new_rep := public.calculate_composite_rep(NEW.user_id);
    UPDATE user_profiles
    SET rep_stars = v_new_rep,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate breakdown view with correct casts for round(..., n)
CREATE OR REPLACE VIEW v_earner_rep_breakdown AS
SELECT
  c.user_id AS earner_id,
  count(*) FILTER (WHERE c.status IN ('completed', 'failed', 'canceled')) AS total_ments,
  count(*) FILTER (WHERE c.status = 'completed') AS completed_ments,
  count(*) FILTER (WHERE c.status = 'failed') AS failed_ments,
  ROUND(
    count(*) FILTER (WHERE c.status = 'completed')::numeric /
    NULLIF(count(*) FILTER (WHERE c.status IN ('completed', 'failed', 'canceled')), 0) * 100,
    1
  ) AS completion_rate_pct,
  ROUND(COALESCE(AVG(cr.quality_stars), 3.00), 2) AS avg_quality_stars,
  COUNT(cr.id) AS reviewed_ments,
  ROUND(
    COALESCE(
      count(*) FILTER (WHERE c.status = 'completed')::numeric /
      NULLIF(count(*) FILTER (WHERE c.status IN ('completed', 'failed', 'canceled')), 0),
      1.0
    ) * 0.4 * 5.0,
    2
  ) AS completion_component,
  ROUND(
    COALESCE(AVG(cr.quality_stars), 3.00) / 5.0 * 0.5 * 5.0,
    2
  ) AS quality_component,
  ROUND(
    LEAST(1.0::numeric, (LN(count(*) FILTER (WHERE c.status = 'completed') + 1)::numeric / 5.0::numeric)) * 0.1::numeric * 5.0::numeric,
    2
  ) AS volume_component
FROM commitments c
LEFT JOIN commitment_reviews cr ON cr.commitment_id = c.id
GROUP BY c.user_id;

GRANT SELECT ON v_earner_rep_breakdown TO authenticated;