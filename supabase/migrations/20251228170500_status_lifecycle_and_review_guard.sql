-- MERETS v1: Lifecycle statuses, review guard, and stats alignment

-- 1) Commitments: extend status and backfill
DO $$
BEGIN
  -- Drop old check if present
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='commitments'
      AND constraint_type='CHECK' AND constraint_name='commitments_status_check'
  ) THEN
    ALTER TABLE public.commitments DROP CONSTRAINT commitments_status_check;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE public.commitments
  ALTER COLUMN status TYPE text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.commitments
  ADD CONSTRAINT commitments_status_check
  CHECK (status IN (
    'draft','pending_approval','accepted','in_progress','submitted','ready_for_review','completed','redo_requested','rejected'
  ));

-- Backfill legacy to new lifecycle
-- pending -> pending_approval
UPDATE public.commitments SET status='pending_approval' WHERE status='pending';

-- approved with completed_at IS NULL -> accepted
UPDATE public.commitments SET status='accepted'
WHERE status='approved' AND completed_at IS NULL;

-- approved with completed_at NOT NULL -> ready_for_review
UPDATE public.commitments SET status='ready_for_review'
WHERE status='approved' AND completed_at IS NOT NULL;

-- completed -> completed (no change)
-- rejected -> rejected (no change)

-- updated_at trigger
CREATE OR REPLACE FUNCTION public._set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS trg_commitments_updated_at ON public.commitments;
CREATE TRIGGER trg_commitments_updated_at
BEFORE UPDATE ON public.commitments
FOR EACH ROW EXECUTE FUNCTION public._set_updated_at();


-- 2) Review trigger guard: one earning_event per commitment; merets as non-punitive delta
CREATE OR REPLACE FUNCTION public.on_commitment_review_create_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_task_id uuid;
  v_base_merets numeric := 0;
  v_mult numeric := 1.0;
  v_new_total_merets numeric := 0;
  v_prev_awarded numeric := 0;
  v_delta_merets numeric := 0;
  v_cash int := 0;
  v_earning_exists boolean := false;
BEGIN
  SELECT c.user_id, c.task_template_id INTO v_user_id, v_task_id
  FROM public.commitments c WHERE c.id = NEW.commitment_id;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  -- base merets from task_template if available
  IF v_task_id IS NOT NULL THEN
    SELECT COALESCE(base_merets, 0) INTO v_base_merets FROM public.task_templates WHERE id = v_task_id;
  END IF;

  -- multiplier from stars
  v_mult := CASE NEW.quality_stars
    WHEN 5 THEN 1.20
    WHEN 4 THEN 1.00
    WHEN 3 THEN 0.70
    WHEN 2 THEN 0.40
    ELSE 0.20
  END;

  v_new_total_merets := round((COALESCE(v_base_merets,0) * v_mult)::numeric, 2);

  -- previously awarded merets for this commitment
  SELECT COALESCE(SUM(me.merets_delta), 0) INTO v_prev_awarded
  FROM public.meret_events me WHERE me.commitment_id = NEW.commitment_id;

  -- non-punitive delta (never negative)
  v_delta_merets := GREATEST(0, v_new_total_merets - v_prev_awarded);

  -- earnings (credits) from commitments.pay_cents, guard to only one earning_event per commitment
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='commitments' AND column_name='pay_cents'
  ) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.earning_events ee WHERE ee.commitment_id = NEW.commitment_id
    ) INTO v_earning_exists;

    IF NOT v_earning_exists THEN
      EXECUTE format('SELECT COALESCE(pay_cents,0) FROM public.commitments WHERE id = %L', NEW.commitment_id) INTO v_cash;
      IF v_cash > 0 THEN
        INSERT INTO public.earning_events (user_id, actor_user_id, commitment_id, amount_cents, status)
        VALUES (v_user_id, NEW.reviewer_id, NEW.commitment_id, v_cash, 'owed');
      END IF;
    END IF;
  END IF;

  -- meret event as delta
  IF v_delta_merets > 0 THEN
    INSERT INTO public.meret_events (user_id, actor_user_id, commitment_id, merets_delta, reason, meta)
    VALUES (
      v_user_id,
      NEW.reviewer_id,
      NEW.commitment_id,
      v_delta_merets,
      'review',
      jsonb_build_object(
        'base_merets', v_base_merets,
        'multiplier', v_mult,
        'final_merets', v_new_total_merets,
        'prior_awarded', v_prev_awarded
      )
    );
  END IF;

  -- rep event + cached updates remain as before
  -- Recalculate composite rep (0-100)
  PERFORM 1; -- no-op placeholder; existing downstream logic can update rep

  -- Cache updates (merets)
  UPDATE public.user_profiles
  SET 
    merets_balance = COALESCE(merets_balance,0) + v_delta_merets,
    lifetime_merets = COALESCE(lifetime_merets,0) + v_delta_merets,
    updated_at = now()
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_review_events ON public.commitment_reviews;
CREATE TRIGGER trg_review_events
AFTER INSERT ON public.commitment_reviews
FOR EACH ROW EXECUTE FUNCTION public.on_commitment_review_create_events();


-- 3) Issuer stats RPC uses new lifecycle
CREATE OR REPLACE FUNCTION public.get_issuer_stats(p_issuer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'pending_approvals', (
      SELECT COUNT(*) FROM commitments c
      WHERE c.status = 'pending_approval'
        AND (c.issuer_id = p_issuer_id OR c.issuer_id IS NULL)
    ),
    'awaiting_review', (
      SELECT COUNT(*) FROM commitments c
      WHERE c.status = 'ready_for_review'
        AND (c.issuer_id = p_issuer_id OR c.issuer_id IS NULL)
    ),
    'total_approved', (
      SELECT COUNT(*) FROM issuer_approvals ia
      WHERE ia.issuer_id = p_issuer_id AND ia.approval_status = 'approved'
    ),
    'total_reviewed', (
      SELECT COUNT(*) FROM commitment_reviews cr
      WHERE cr.reviewer_id = p_issuer_id
    ),
    'earners_count', (
      SELECT COUNT(DISTINCT earner_id) FROM family_relationships WHERE issuer_id = p_issuer_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;