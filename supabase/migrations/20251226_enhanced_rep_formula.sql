-- ============================================================
-- ENHANCED REP FORMULA
-- Composite scoring: Completion Rate + Quality + Volume
-- ============================================================

-- Drop simple rep calculation, replace with composite
drop function if exists public._apply_rep_softening cascade;
drop function if exists public._rep_delta_from_stars cascade;

-- -------------------------
-- COMPOSITE REP CALCULATION
-- -------------------------

create or replace function public.calculate_composite_rep(p_earner_id uuid)
returns numeric(3,2)
language plpgsql
as $$
declare
  v_completion_rate numeric(4,3) := 0;
  v_quality_avg numeric(3,2) := 3.00;
  v_volume_bonus numeric(2,2) := 0;
  v_final_rep numeric(3,2);
  
  v_total_ments int := 0;
  v_completed_ments int := 0;
  v_failed_ments int := 0;
  v_quality_sum numeric := 0;
  v_quality_count int := 0;
begin
  -- Get commitment statistics
  select 
    count(*) filter (where status in ('completed', 'failed', 'canceled')) as total,
    count(*) filter (where status = 'completed') as completed,
    count(*) filter (where status = 'failed') as failed
  into v_total_ments, v_completed_ments, v_failed_ments
  from commitments
  where user_id = p_earner_id;
  
  -- Get quality statistics from reviews
  select 
    avg(quality_stars),
    count(*)
  into v_quality_avg, v_quality_count
  from commitment_reviews cr
  join commitments c on c.id = cr.commitment_id
  where c.user_id = p_earner_id;
  
  -- Component 1: Completion Rate (40% weight)
  -- Perfect completion = 1.0, scales down with failures
  if v_total_ments > 0 then
    v_completion_rate := v_completed_ments::numeric / v_total_ments::numeric;
  else
    v_completion_rate := 1.0; -- New earners start at 100%
  end if;
  
  -- Component 2: Quality Average (50% weight)
  -- Already 1-5 scale, use directly
  v_quality_avg := coalesce(v_quality_avg, 3.00);
  
  -- Component 3: Volume Bonus (10% weight)
  -- Logarithmic bonus: more ments = slightly higher cap
  -- 0 ments = 0.0, 10 ments = ~0.5, 50 ments = ~0.85, 100+ ments = ~1.0
  if v_completed_ments > 0 then
    v_volume_bonus := least(1.0, ln(v_completed_ments + 1) / 5.0);
  else
    v_volume_bonus := 0.0;
  end if;
  
  -- COMPOSITE FORMULA:
  -- Rep = (completion_rate × 0.4 + quality_avg/5.0 × 0.5 + volume_bonus × 0.1) × 5.0
  --
  -- This gives a 0-5 scale where:
  -- - 40% is based on honoring commitments
  -- - 50% is based on quality of work
  -- - 10% is based on experience/volume
  
  v_final_rep := (
    (v_completion_rate * 0.4) +
    (v_quality_avg / 5.0 * 0.5) +
    (v_volume_bonus * 0.1)
  ) * 5.0;
  
  -- Clamp to valid range
  v_final_rep := greatest(1.00, least(5.00, v_final_rep));
  
  return v_final_rep;
end;
$$;

-- -------------------------
-- UPDATE TRIGGER TO USE COMPOSITE REP
-- -------------------------

create or replace function public.on_commitment_review_update_rep()
returns trigger
language plpgsql
security definer
as $$
declare
  v_earner_id uuid;
  v_new_rep numeric(3,2);
begin
  -- Get earner from commitment
  select c.user_id into v_earner_id
  from commitments c
  where c.id = new.commitment_id;
  
  if v_earner_id is null then
    return new;
  end if;
  
  -- Recalculate composite rep
  v_new_rep := public.calculate_composite_rep(v_earner_id);
  
  -- Update cached rep on profile
  update user_profiles
  set 
    rep_stars = v_new_rep,
    rep_count = rep_count + 1,
    updated_at = now()
  where id = v_earner_id;
  
  return new;
end;
$$;

-- Replace trigger
drop trigger if exists trg_commitment_review_update_rep on commitment_reviews;
create trigger trg_commitment_review_update_rep
after insert on commitment_reviews
for each row
execute function public.on_commitment_review_update_rep();

-- Also recalculate when commitment status changes (failed/canceled)
create or replace function public.on_commitment_status_change_update_rep()
returns trigger
language plpgsql
security definer
as $$
declare
  v_new_rep numeric(3,2);
begin
  -- Only recalculate if status changed to terminal state
  if old.status is distinct from new.status and new.status in ('completed', 'failed', 'canceled') then
    v_new_rep := public.calculate_composite_rep(new.user_id);
    
    update user_profiles
    set 
      rep_stars = v_new_rep,
      updated_at = now()
    where id = new.user_id;
  end if;
  
  return new;
end;
$$;

drop trigger if exists trg_commitment_status_change_update_rep on commitments;
create trigger trg_commitment_status_change_update_rep
after update on commitments
for each row
execute function public.on_commitment_status_change_update_rep();

-- -------------------------
-- HELPER VIEW: Rep Breakdown
-- -------------------------

create or replace view v_earner_rep_breakdown as
select
  c.user_id as earner_id,
  
  -- Completion stats
  count(*) filter (where c.status in ('completed', 'failed', 'canceled')) as total_ments,
  count(*) filter (where c.status = 'completed') as completed_ments,
  count(*) filter (where c.status = 'failed') as failed_ments,
  round(
    count(*) filter (where c.status = 'completed')::numeric / 
    nullif(count(*) filter (where c.status in ('completed', 'failed', 'canceled')), 0) * 100,
    1
  ) as completion_rate_pct,
  
  -- Quality stats
  round(avg(cr.quality_stars), 2) as avg_quality_stars,
  count(cr.id) as reviewed_ments,
  
  -- Calculated rep components
  round(
    coalesce(
      count(*) filter (where c.status = 'completed')::numeric / 
      nullif(count(*) filter (where c.status in ('completed', 'failed', 'canceled')), 0),
      1.0
    ) * 0.4 * 5.0,
    2
  ) as completion_component,
  
  round(
    coalesce(avg(cr.quality_stars), 3.00) / 5.0 * 0.5 * 5.0,
    2
  ) as quality_component,
  
  round(
    least(1.0, ln(count(*) filter (where c.status = 'completed') + 1) / 5.0) * 0.1 * 5.0,
    2
  ) as volume_component

from commitments c
left join commitment_reviews cr on cr.commitment_id = c.id
group by c.user_id;

grant select on v_earner_rep_breakdown to authenticated;

-- ============================================================
-- ENHANCED REP FORMULA COMPLETE
-- 
-- COMPOSITE SCORING:
-- • 40% Completion Rate (honors commitments)
-- • 50% Quality Average (star ratings)
-- • 10% Volume Bonus (experience/reliability)
-- 
-- EXAMPLE SCENARIOS:
-- 
-- Scenario 1: New earner, 2 perfect ments
--   Completion: 100% → 2.0 stars
--   Quality: 5.0 avg → 2.5 stars
--   Volume: log(2+1)/5 → 0.22 → 0.11 stars
--   TOTAL: 4.61 stars
-- 
-- Scenario 2: Experienced, 50 ments, 90% completion, 4.2 quality
--   Completion: 90% → 1.8 stars
--   Quality: 4.2 avg → 2.1 stars
--   Volume: log(50+1)/5 → 0.78 → 0.39 stars
--   TOTAL: 4.29 stars
-- 
-- Scenario 3: Struggling, 10 ments, 60% completion, 3.0 quality
--   Completion: 60% → 1.2 stars
--   Quality: 3.0 avg → 1.5 stars
--   Volume: log(10+1)/5 → 0.48 → 0.24 stars
--   TOTAL: 2.94 stars
-- 
-- Use v_earner_rep_breakdown view to debug rep scores!
-- ============================================================
