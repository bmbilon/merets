--
-- PostgreSQL database dump
--

\restrict SvBQMSMdQZf0P9xaF7V6vtete0bHtKnoFo6i8EnR9RjjQ5q1CPVrFwWGoRhEo5q

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'earner',
    'provider',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: _set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public._set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;$$;


ALTER FUNCTION public._set_updated_at() OWNER TO postgres;

--
-- Name: apply_approval_fixes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.apply_approval_fixes() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
DECLARE
  v_result JSON;
  v_fixes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Fix 1: Change DECIMAL precision
  BEGIN
    ALTER TABLE user_profiles
    ALTER COLUMN average_quality_rating TYPE DECIMAL(5,2);
    v_fixes := array_append(v_fixes, 'Changed average_quality_rating to DECIMAL(5,2)');
  EXCEPTION WHEN OTHERS THEN
    v_fixes := array_append(v_fixes, 'average_quality_rating: ' || SQLERRM);
  END;
  
  BEGIN
    ALTER TABLE user_profiles
    ALTER COLUMN consistency_score TYPE DECIMAL(5,2);
    v_fixes := array_append(v_fixes, 'Changed consistency_score to DECIMAL(5,2)');
  EXCEPTION WHEN OTHERS THEN
    v_fixes := array_append(v_fixes, 'consistency_score: ' || SQLERRM);
  END;
  
  -- Fix 2: Update trigger function
  BEGIN
    CREATE OR REPLACE FUNCTION update_rep_on_event()
    RETURNS TRIGGER AS $trigger$
    DECLARE
      v_user_id UUID;
      v_change_reason TEXT;
    BEGIN
      IF TG_TABLE_NAME = 'commitment_submissions' THEN
        v_user_id := (SELECT user_id FROM commitments WHERE id = NEW.commitment_id);
        IF NEW.submission_status = 'approved' THEN
          UPDATE user_profiles
          SET 
            completed_commitments = completed_commitments + 1,
            average_quality_rating = average_quality_rating + 
              ((NEW.quality_rating - average_quality_rating) / (completed_commitments + 1)::DECIMAL(5,2))
          WHERE id = v_user_id;
        END IF;
      END IF;
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;
    
    v_fixes := array_append(v_fixes, 'Updated trigger function');
  EXCEPTION WHEN OTHERS THEN
    v_fixes := array_append(v_fixes, 'trigger: ' || SQLERRM);
  END;
  
  RETURN json_build_object('success', true, 'fixes', v_fixes);
END;
$_$;


ALTER FUNCTION public.apply_approval_fixes() OWNER TO postgres;

--
-- Name: approve_submission(uuid, integer, uuid, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.approve_submission(p_submission_id uuid, p_quality_rating integer, p_reviewed_by uuid, p_reviewer_notes text DEFAULT ''::text, p_bonus_tip_cents integer DEFAULT 0) RETURNS TABLE(success boolean, commitment_id uuid, merets_earned numeric, money_earned_cents integer)
    LANGUAGE plpgsql
    AS $_$
DECLARE
  v_commitment_id UUID;
  v_effort_minutes INTEGER;
  v_base_pay_cents INTEGER;
  v_quality_multiplier NUMERIC;
  v_merets_earned NUMERIC;
  v_hours_earned NUMERIC;
  v_total_pay_cents INTEGER;
  v_earner_id UUID;
BEGIN
  -- Input validation
  IF p_quality_rating < 1 OR p_quality_rating > 5 THEN
    RAISE EXCEPTION 'quality_rating must be between 1 and 5';
  END IF;

  IF p_bonus_tip_cents < 0 THEN
    RAISE EXCEPTION 'bonus_tip_cents cannot be negative';
  END IF;

  IF p_reviewed_by IS NULL THEN
    RAISE EXCEPTION 'reviewed_by cannot be null';
  END IF;

  -- Get commitment details (with row lock to prevent race conditions)
  SELECT
    c.id,
    c.effort_minutes,
    c.pay_cents,
    c.user_id
  INTO
    v_commitment_id,
    v_effort_minutes,
    v_base_pay_cents,
    v_earner_id
  FROM commitments c
  INNER JOIN commitment_submissions s ON s.commitment_id = c.id
  WHERE s.id = p_submission_id
  FOR UPDATE;

  IF v_commitment_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Calculate quality multiplier (5★=120%, 4★=100%, 3★=70%, 2★=40%, 1★=20%)
  v_quality_multiplier := CASE p_quality_rating
    WHEN 5 THEN 1.20
    WHEN 4 THEN 1.00
    WHEN 3 THEN 0.70
    WHEN 2 THEN 0.40
    WHEN 1 THEN 0.20
    ELSE 1.00
  END;

  v_merets_earned := (v_effort_minutes / 60.0) * v_quality_multiplier;
  v_hours_earned := v_effort_minutes / 60.0;
  v_total_pay_cents := v_base_pay_cents + p_bonus_tip_cents;

  -- APPROVE SUBMISSION (idempotent guard - only if pending)
  UPDATE commitment_submissions
  SET
    submission_status = 'approved',
    quality_rating = p_quality_rating,
    bonus_tip_cents = p_bonus_tip_cents,
    reviewer_notes = p_reviewer_notes,
    reviewed_by = p_reviewed_by,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id
    AND submission_status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission is not pending approval (already reviewed?)';
  END IF;

  -- Update commitment (only if not already completed, set both timestamps)
  UPDATE commitments
  SET
    status = 'completed',
    time_completed = NOW(),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = v_commitment_id
    AND status <> 'completed';

  -- Update user stats (rep calculated by trigger)
  UPDATE user_profiles
  SET
    lifetime_merets = COALESCE(lifetime_merets, 0) + v_merets_earned,
    experience_hours = COALESCE(experience_hours, 0) + v_hours_earned,
    total_earnings_cents = COALESCE(total_earnings_cents, 0) + v_total_pay_cents,
    tasks_completed = COALESCE(tasks_completed, 0) + 1,
    average_quality_rating = (
      COALESCE(average_quality_rating, 0) * COALESCE(tasks_completed, 0) + p_quality_rating
    ) / (COALESCE(tasks_completed, 0) + 1),
    updated_at = NOW()
  WHERE id = v_earner_id;

  -- Notification (using task_approved - verified in constraint)
  INSERT INTO notifications (
    recipient_id,
    notification_type,
    title,
    message,
    commitment_id,
    submission_id,
    action_type,
    action_data
  ) VALUES (
    v_earner_id,
    'work_approved',
    'Task Approved! 🎉',
    format(
      'Your task was approved with %s stars! You earned %s Merets and $%s',
      p_quality_rating,
      ROUND(v_merets_earned, 1),
      ROUND(v_total_pay_cents / 100.0, 2)
    ),
    v_commitment_id,
    p_submission_id,
    'view_task',
    jsonb_build_object(
      'commitment_id', v_commitment_id,
      'submission_id', p_submission_id,
      'merets_earned', v_merets_earned,
      'money_earned_cents', v_total_pay_cents,
      'quality_rating', p_quality_rating
    )
  );

  RETURN QUERY SELECT TRUE, v_commitment_id, v_merets_earned, v_total_pay_cents;
END;
$_$;


ALTER FUNCTION public.approve_submission(p_submission_id uuid, p_quality_rating integer, p_reviewed_by uuid, p_reviewer_notes text, p_bonus_tip_cents integer) OWNER TO postgres;

--
-- Name: auto_update_rep_from_merets(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.auto_update_rep_from_merets() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_new_rep INTEGER;
BEGIN
  -- Only recalculate if merets or quality changed
  IF (NEW.lifetime_merets IS DISTINCT FROM OLD.lifetime_merets) OR 
     (NEW.average_quality_rating IS DISTINCT FROM OLD.average_quality_rating) THEN
    
    -- Try to use calculate_rep_from_merets if it exists, otherwise simple formula
    BEGIN
      v_new_rep := calculate_rep_from_merets(
        COALESCE(NEW.lifetime_merets, 0), 
        COALESCE(NEW.average_quality_rating, 3.0)
      );
    EXCEPTION WHEN undefined_function THEN
      -- Fallback: Simple formula (capped at 100)
      v_new_rep := LEAST(100, FLOOR(COALESCE(NEW.lifetime_merets, 0) / 2));
    END;
    
    NEW.rep_score := v_new_rep;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.auto_update_rep_from_merets() OWNER TO postgres;

--
-- Name: calculate_composite_rep(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_composite_rep(p_earner_id uuid) RETURNS integer
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


ALTER FUNCTION public.calculate_composite_rep(p_earner_id uuid) OWNER TO postgres;

--
-- Name: calculate_rep_from_merets(numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_rep_from_merets(p_total_merets numeric, p_avg_quality_rating numeric) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_quality_multiplier DECIMAL;
  v_effective_merets DECIMAL;
  v_rep_score INTEGER := 0;
  v_remaining_merets DECIMAL;
BEGIN
  -- Calculate quality multiplier (1-5 stars → 0.1-1.0 multiplier)
  v_quality_multiplier := CASE
    WHEN p_avg_quality_rating >= 5.0 THEN 1.0
    WHEN p_avg_quality_rating >= 4.5 THEN 0.9
    WHEN p_avg_quality_rating >= 4.0 THEN 0.8
    WHEN p_avg_quality_rating >= 3.5 THEN 0.7
    WHEN p_avg_quality_rating >= 3.0 THEN 0.6
    WHEN p_avg_quality_rating >= 2.5 THEN 0.5
    WHEN p_avg_quality_rating >= 2.0 THEN 0.3
    ELSE 0.1
  END;
  
  -- Apply quality multiplier to total merets
  v_effective_merets := p_total_merets * v_quality_multiplier;
  v_remaining_merets := v_effective_merets;
  
  -- Rep 0-10: 1 meret = 1 Rep (10 merets total)
  IF v_remaining_merets >= 10 THEN
    v_rep_score := 10;
    v_remaining_merets := v_remaining_merets - 10;
  ELSE
    RETURN FLOOR(v_remaining_merets);
  END IF;
  
  -- Rep 10-20: 2 merets = 1 Rep (20 merets total)
  IF v_remaining_merets >= 20 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 20;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 2);
  END IF;
  
  -- Rep 20-25: 3 merets = 1 Rep (15 merets total)
  IF v_remaining_merets >= 15 THEN
    v_rep_score := v_rep_score + 5;
    v_remaining_merets := v_remaining_merets - 15;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 3);
  END IF;
  
  -- Rep 25-30: 5 merets = 1 Rep (25 merets total)
  IF v_remaining_merets >= 25 THEN
    v_rep_score := v_rep_score + 5;
    v_remaining_merets := v_remaining_merets - 25;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 5);
  END IF;
  
  -- Rep 30-40: 8 merets = 1 Rep (80 merets total)
  IF v_remaining_merets >= 80 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 80;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 8);
  END IF;
  
  -- Rep 40-50: 12 merets = 1 Rep (120 merets total)
  IF v_remaining_merets >= 120 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 120;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 12);
  END IF;
  
  -- Rep 50-60: 20 merets = 1 Rep (200 merets total)
  IF v_remaining_merets >= 200 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 200;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 20);
  END IF;
  
  -- Rep 60-70: 30 merets = 1 Rep (300 merets total)
  IF v_remaining_merets >= 300 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 300;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 30);
  END IF;
  
  -- Rep 70-80: 50 merets = 1 Rep (500 merets total)
  IF v_remaining_merets >= 500 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 500;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 50);
  END IF;
  
  -- Rep 80-90: 75 merets = 1 Rep (750 merets total)
  IF v_remaining_merets >= 750 THEN
    v_rep_score := v_rep_score + 10;
    v_remaining_merets := v_remaining_merets - 750;
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 75);
  END IF;
  
  -- Rep 90-99: 100 merets = 1 Rep (900 merets total)
  IF v_remaining_merets >= 900 THEN
    RETURN 99; -- Cap at 99
  ELSE
    RETURN v_rep_score + FLOOR(v_remaining_merets / 100);
  END IF;
END;
$$;


ALTER FUNCTION public.calculate_rep_from_merets(p_total_merets numeric, p_avg_quality_rating numeric) OWNER TO postgres;

--
-- Name: calculate_rep_level_from_merets(numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_rep_level_from_merets(total_merets numeric) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  level INTEGER := 0;
BEGIN
  -- Binary search would be more efficient, but linear is simpler and fast enough for 0-99
  FOR level IN 0..99 LOOP
    IF merets_required_for_level(level + 1) > total_merets THEN
      RETURN level;
    END IF;
  END LOOP;
  
  RETURN 99; -- Max level
END;
$$;


ALTER FUNCTION public.calculate_rep_level_from_merets(total_merets numeric) OWNER TO postgres;

--
-- Name: calculate_rep_score_with_attribution(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_rep_score_with_attribution(p_user_id uuid) RETURNS TABLE(rep_score integer, total_merets numeric, effective_merets numeric, avg_quality_rating numeric, quality_multiplier numeric, total_commitments integer, completed_commitments integer, failed_commitments integer, completion_rate numeric, quality_score numeric, consistency_score numeric, volume_bonus integer, failure_penalty integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_total_minutes INTEGER;
  v_total_merets DECIMAL;
  v_completed_count INTEGER;
  v_total_count INTEGER;
  v_failed_count INTEGER;
  v_avg_rating DECIMAL;
  v_quality_mult DECIMAL;
  v_effective_merets DECIMAL;
  v_rep INTEGER;
BEGIN
  -- Get total completed minutes (1 meret = 60 minutes)
  SELECT 
    COALESCE(SUM(c.effort_minutes), 0),
    COUNT(*) FILTER (WHERE c.status = 'completed'),
    COUNT(*),
    COUNT(*) FILTER (WHERE c.status = 'failed')
  INTO 
    v_total_minutes,
    v_completed_count,
    v_total_count,
    v_failed_count
  FROM commitments c
  WHERE c.user_id = p_user_id;
  
  -- Convert minutes to merets
  v_total_merets := v_total_minutes / 60.0;
  
  -- Get average quality rating from submissions
  SELECT COALESCE(AVG(cs.quality_rating), 3.0)
  INTO v_avg_rating
  FROM commitment_submissions cs
  WHERE cs.user_id = p_user_id
    AND cs.submission_status = 'approved'
    AND cs.quality_rating IS NOT NULL;
  
  -- Calculate quality multiplier
  v_quality_mult := CASE
    WHEN v_avg_rating >= 5.0 THEN 1.0
    WHEN v_avg_rating >= 4.5 THEN 0.9
    WHEN v_avg_rating >= 4.0 THEN 0.8
    WHEN v_avg_rating >= 3.5 THEN 0.7
    WHEN v_avg_rating >= 3.0 THEN 0.6
    WHEN v_avg_rating >= 2.5 THEN 0.5
    WHEN v_avg_rating >= 2.0 THEN 0.3
    ELSE 0.1
  END;
  
  -- Calculate effective merets (with quality multiplier)
  v_effective_merets := v_total_merets * v_quality_mult;
  
  -- Calculate Rep score from merets
  v_rep := calculate_rep_from_merets(v_total_merets, v_avg_rating);
  
  -- Return full attribution data
  RETURN QUERY SELECT
    v_rep,
    v_total_merets,
    v_effective_merets,
    v_avg_rating,
    v_quality_mult,
    v_total_count,
    v_completed_count,
    v_failed_count,
    CASE WHEN v_total_count > 0 THEN (v_completed_count::DECIMAL / v_total_count * 100) ELSE 0 END,
    (v_avg_rating / 5.0 * 100),
    0.0::DECIMAL, -- consistency_score (legacy, kept for compatibility)
    0, -- volume_bonus (legacy, kept for compatibility)
    0; -- failure_penalty (legacy, kept for compatibility)
END;
$$;


ALTER FUNCTION public.calculate_rep_score_with_attribution(p_user_id uuid) OWNER TO postgres;

--
-- Name: claim_marketplace_task(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.claim_marketplace_task(p_user_id uuid, p_task_template_id uuid, p_kid_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_commitment_id UUID;
  v_task_record RECORD;
BEGIN
  -- Get task details
  SELECT * INTO v_task_record 
  FROM available_tasks_for_kids 
  WHERE task_template_id = p_task_template_id
    AND availability_status = 'available';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not available for claiming';
  END IF;
  
  -- Create commitment with correct status
  INSERT INTO commitments (
    user_id,
    task_template_id,
    custom_title,
    custom_description,
    skill_category,
    effort_minutes,
    pay_cents,
    status,
    due_date,
    kid_notes
  ) VALUES (
    p_user_id,
    p_task_template_id,
    v_task_record.title,
    v_task_record.description,
    v_task_record.skill_category,
    v_task_record.effective_effort_minutes::INTEGER,
    v_task_record.effective_pay_cents::INTEGER,
    'pending_approval',
    v_task_record.due_date,
    p_kid_notes
  )
  RETURNING id INTO v_commitment_id;
  
  -- Update assignment count
  IF v_task_record.max_assignments IS NOT NULL THEN
    UPDATE task_templates 
    SET current_assignments = current_assignments + 1
    WHERE id = p_task_template_id;
  END IF;
  
  -- Create task assignment record
  INSERT INTO task_assignments (
    task_template_id,
    user_id,
    commitment_id,
    status
  ) VALUES (
    p_task_template_id,
    p_user_id,
    v_commitment_id,
    'claimed'
  );
  
  RETURN v_commitment_id;
END;
$$;


ALTER FUNCTION public.claim_marketplace_task(p_user_id uuid, p_task_template_id uuid, p_kid_notes text) OWNER TO postgres;

--
-- Name: generate_recurring_tasks(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_recurring_tasks() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    task_record RECORD;
    generated_count INTEGER := 0;
BEGIN
    -- Find all recurring tasks that need generation
    FOR task_record IN 
        SELECT * FROM task_templates
        WHERE is_recurring = TRUE 
        AND recurrence_enabled = TRUE
        AND (next_generation_at IS NULL OR next_generation_at <= NOW())
    LOOP
        -- Create a new commitment from this template
        -- This is a placeholder - actual generation logic would be more complex
        UPDATE task_templates
        SET last_generated_at = NOW(),
            next_generation_at = CASE 
                WHEN recurrence_pattern = 'daily' THEN NOW() + INTERVAL '1 day'
                WHEN recurrence_pattern = 'weekly' THEN NOW() + INTERVAL '1 week'
                WHEN recurrence_pattern = 'monthly' THEN NOW() + INTERVAL '1 month'
                ELSE NOW() + (recurrence_interval || ' days')::INTERVAL
            END
        WHERE id = task_record.id;
        
        generated_count := generated_count + 1;
    END LOOP;
    
    RETURN generated_count;
END;
$$;


ALTER FUNCTION public.generate_recurring_tasks() OWNER TO postgres;

--
-- Name: get_earner_commitments_by_issuer(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_earner_commitments_by_issuer(p_earner_id uuid, p_issuer_id uuid) RETURNS TABLE(commitment_id uuid, custom_title text, effort_minutes integer, pay_cents integer, status text, created_at timestamp with time zone, completed_at timestamp with time zone, approval_status text, quality_stars integer, reviewer_name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.custom_title,
    c.effort_minutes,
    c.pay_cents,
    c.status,
    c.created_at,
    c.completed_at,
    ia.approval_status,
    cr.quality_stars,
    up.name as reviewer_name
  FROM commitments c
  LEFT JOIN issuer_approvals ia ON c.id = ia.commitment_id AND ia.issuer_id = p_issuer_id
  LEFT JOIN commitment_reviews cr ON c.id = cr.commitment_id
  LEFT JOIN user_profiles up ON cr.reviewer_id = up.id
  WHERE c.user_id = p_earner_id
    AND (c.issuer_id = p_issuer_id OR c.issuer_id IS NULL)
  ORDER BY c.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_earner_commitments_by_issuer(p_earner_id uuid, p_issuer_id uuid) OWNER TO postgres;

--
-- Name: get_earner_issuers(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_earner_issuers(p_earner_id uuid) RETURNS TABLE(issuer_id uuid, issuer_name text, issuer_type text, relationship_type text, permission_level text, organization_name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.issuer_type,
    fr.relationship_type,
    fr.permission_level,
    i.organization_name
  FROM family_relationships fr
  JOIN user_profiles up ON fr.issuer_id = up.id
  JOIN issuers i ON i.user_profile_id = up.id
  WHERE fr.earner_id = p_earner_id
    AND i.is_active = true
  ORDER BY i.name;
END;
$$;


ALTER FUNCTION public.get_earner_issuers(p_earner_id uuid) OWNER TO postgres;

--
-- Name: get_issuer_all_commitments(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_issuer_all_commitments(p_issuer_user_profile_id uuid) RETURNS TABLE(commitment_id uuid, task_title character varying, earner_name character varying, earner_age integer, status text, effort_minutes integer, pay_cents integer, created_at timestamp with time zone, parents_guardians json)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_issuer_all_commitments(p_issuer_user_profile_id uuid) OWNER TO postgres;

--
-- Name: get_issuer_by_user_profile(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_issuer_by_user_profile(p_user_profile_id uuid) RETURNS TABLE(issuer_id uuid, name text, issuer_type text, can_create_tasks boolean, can_approve_commitments boolean, can_rate_quality boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.issuer_type,
    i.can_create_tasks,
    i.can_approve_commitments,
    i.can_rate_quality
  FROM issuers i
  WHERE i.user_profile_id = p_user_profile_id
    AND i.is_active = true;
END;
$$;


ALTER FUNCTION public.get_issuer_by_user_profile(p_user_profile_id uuid) OWNER TO postgres;

--
-- Name: get_issuer_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_issuer_stats(p_issuer_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_issuer_stats(p_issuer_id uuid) OWNER TO postgres;

--
-- Name: get_issuer_tasks_dashboard(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_issuer_tasks_dashboard(p_issuer_user_profile_id uuid) RETURNS TABLE(task_id uuid, title character varying, description text, effort_minutes integer, base_pay_cents integer, is_available_for_kids boolean, pending_approval_count bigint, accepted_count bigint, in_progress_count bigint, ready_for_review_count bigint, completed_count bigint, total_assignments bigint)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_issuer_tasks_dashboard(p_issuer_user_profile_id uuid) OWNER TO postgres;

--
-- Name: get_marketplace_tasks(uuid, integer, integer, integer, integer, text, boolean, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_marketplace_tasks(p_user_id uuid DEFAULT NULL::uuid, p_min_pay_cents integer DEFAULT 0, p_max_pay_cents integer DEFAULT NULL::integer, p_min_effort_minutes integer DEFAULT 0, p_max_effort_minutes integer DEFAULT NULL::integer, p_skill_category text DEFAULT NULL::text, p_is_micro_task boolean DEFAULT NULL::boolean, p_sort_by text DEFAULT 'urgency_score'::text, p_sort_order text DEFAULT 'DESC'::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, title character varying, description text, skill_category character varying, effort_minutes integer, base_pay_cents integer, effective_pay_cents numeric, effective_effort_minutes integer, difficulty_level integer, is_micro_task boolean, due_date date, days_until_due integer, priority_type text, is_urgent boolean, urgency_score integer, parent_notes text, availability_status text, max_assignments integer, current_assignments integer)
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


ALTER FUNCTION public.get_marketplace_tasks(p_user_id uuid, p_min_pay_cents integer, p_max_pay_cents integer, p_min_effort_minutes integer, p_max_effort_minutes integer, p_skill_category text, p_is_micro_task boolean, p_sort_by text, p_sort_order text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_prioritized_tasks_for_display(text, boolean, integer, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_prioritized_tasks_for_display(p_skill_category text DEFAULT NULL::text, p_is_micro_task boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 20, p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(task_id uuid, title character varying, description text, skill_category character varying, effort_minutes integer, base_pay_cents integer, effective_pay_cents numeric, effective_effort_minutes integer, difficulty_level integer, is_micro_task boolean, due_date date, days_until_due integer, priority_type text, is_urgent boolean, urgency_score integer, parent_notes text, availability_status text, base_effort_minutes integer, priority_level integer)
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


ALTER FUNCTION public.get_prioritized_tasks_for_display(p_skill_category text, p_is_micro_task boolean, p_limit integer, p_user_id uuid) OWNER TO postgres;

--
-- Name: get_task_commitments_with_parents(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_task_commitments_with_parents(p_task_template_id uuid) RETURNS TABLE(commitment_id uuid, earner_id uuid, earner_name character varying, earner_age integer, status text, effort_minutes integer, pay_cents integer, created_at timestamp with time zone, completed_at timestamp with time zone, due_date date, parents_guardians json)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.get_task_commitments_with_parents(p_task_template_id uuid) OWNER TO postgres;

--
-- Name: get_unread_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_unread_count(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE recipient_id = p_user_id AND read = FALSE);
END;
$$;


ALTER FUNCTION public.get_unread_count(p_user_id uuid) OWNER TO postgres;

--
-- Name: mark_all_read(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_all_read(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications SET read = TRUE WHERE recipient_id = p_user_id AND read = FALSE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;


ALTER FUNCTION public.mark_all_read(p_user_id uuid) OWNER TO postgres;

--
-- Name: mark_notification_read(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_notification_read(p_notification_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE notifications SET read = TRUE WHERE id = p_notification_id;
  RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mark_notification_read(p_notification_id uuid) OWNER TO postgres;

--
-- Name: merets_multiplier(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.merets_multiplier(quality_stars integer) RETURNS numeric
    LANGUAGE sql IMMUTABLE
    AS $$
  select case
    when quality_stars = 5 then 1.20
    when quality_stars = 4 then 1.00
    when quality_stars = 3 then 0.70
    when quality_stars = 2 then 0.40
    else 0.20
  end;
$$;


ALTER FUNCTION public.merets_multiplier(quality_stars integer) OWNER TO postgres;

--
-- Name: merets_required_for_level(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.merets_required_for_level(target_level integer) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  total NUMERIC := 0;
  current_mpl NUMERIC;
  base_50 NUMERIC;
  base_70 NUMERIC;
  base_90 NUMERIC;
  i INTEGER;
BEGIN
  IF target_level <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Levels 1-10: 1 meret each
  IF target_level <= 10 THEN
    RETURN target_level;
  END IF;
  total := 10;
  
  -- Levels 11-20: 3 merets each
  IF target_level <= 20 THEN
    RETURN total + (target_level - 10) * 3;
  END IF;
  total := 40;
  
  -- Levels 21-30: 4 merets each
  IF target_level <= 30 THEN
    RETURN total + (target_level - 20) * 4;
  END IF;
  total := 80;
  
  -- Levels 31-50: 1.0932× per level
  IF target_level <= 50 THEN
    current_mpl := 4.0;
    FOR i IN 31..target_level LOOP
      current_mpl := current_mpl * 1.0932;
      total := total + current_mpl;
    END LOOP;
    RETURN ROUND(total, 2);
  END IF;
  
  -- Calculate base at level 50
  current_mpl := 4.0;
  FOR i IN 31..50 LOOP
    current_mpl := current_mpl * 1.0932;
    total := total + current_mpl;
  END LOOP;
  base_50 := total;
  
  -- Levels 51-70: Double every 10 levels
  IF target_level <= 70 THEN
    FOR i IN 51..target_level LOOP
      total := base_50 * POWER(2, (i - 50.0) / 10.0);
    END LOOP;
    RETURN ROUND(total, 2);
  END IF;
  
  -- Calculate base at level 70
  base_70 := base_50 * POWER(2, 2.0); -- 2 doublings from 50 to 70
  total := base_70;
  
  -- Levels 71-90: 1.0505× per level (reach 5000)
  IF target_level <= 90 THEN
    FOR i IN 71..target_level LOOP
      total := base_70 * POWER(5000.0 / base_70, (i - 70.0) / 20.0);
    END LOOP;
    RETURN ROUND(total, 2);
  END IF;
  
  -- Calculate base at level 90
  base_90 := 5000.0;
  
  -- Levels 91-99: 1.0801× per level (reach 10000)
  FOR i IN 91..target_level LOOP
    total := base_90 * POWER(10000.0 / base_90, (i - 90.0) / 9.0);
  END LOOP;
  
  RETURN ROUND(total, 2);
END;
$$;


ALTER FUNCTION public.merets_required_for_level(target_level integer) OWNER TO postgres;

--
-- Name: notify_on_commitment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_on_commitment() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_task_title TEXT;
  v_issuer_id UUID;
  v_issuer_name TEXT;
  v_earner_name TEXT;
  v_parent_id UUID;
  v_is_external BOOLEAN;
BEGIN
  -- Get task and user details
  SELECT title, issuer_id INTO v_task_title, v_issuer_id
  FROM task_templates WHERE id = NEW.task_template_id;
  
  SELECT name INTO v_earner_name
  FROM user_profiles WHERE id = NEW.user_id;
  
  SELECT name INTO v_issuer_name
  FROM user_profiles WHERE id = v_issuer_id;
  
  -- Get parent/guardian from family_relationships (using relationship_type = 'parent')
  SELECT issuer_id INTO v_parent_id
  FROM family_relationships 
  WHERE earner_id = NEW.user_id 
    AND relationship_type = 'parent'
  LIMIT 1;
  
  -- Check if this is an external task (issuer is not the earner's parent)
  v_is_external := (v_issuer_id != v_parent_id OR v_parent_id IS NULL);
  
  -- If external task, require parental approval
  IF v_is_external AND v_parent_id IS NOT NULL THEN
    UPDATE commitments 
    SET requires_parental_approval = TRUE,
        parental_approval_status = 'pending'
    WHERE id = NEW.id;
    
    -- Notify parent/guardian
    PERFORM send_notification(
      v_parent_id,
      'child_committed_external_task',
      '🔔 Approval Needed',
      v_earner_name || ' wants to commit to "' || v_task_title || '" from ' || COALESCE(v_issuer_name, 'external issuer') || '. Your approval is required.',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'approve_commitment',
      jsonb_build_object('commitment_id', NEW.id, 'task_title', v_task_title),
      'urgent'
    );
  ELSE
    -- Internal task, just notify the kid
    PERFORM send_notification(
      NEW.user_id,
      'task_committed',
      '✅ Task Committed',
      'You committed to "' || v_task_title || '"',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'view_commitment',
      jsonb_build_object('commitment_id', NEW.id),
      'normal'
    );
  END IF;
  
  -- Notify issuer that someone committed
  IF v_issuer_id IS NOT NULL THEN
    PERFORM send_notification(
      v_issuer_id,
      'commitment_made',
      '👤 New Commitment',
      v_earner_name || ' committed to "' || v_task_title || '"',
      NEW.id,
      NULL,
      NEW.task_template_id,
      'view_commitment',
      jsonb_build_object('commitment_id', NEW.id),
      'normal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_on_commitment() OWNER TO postgres;

--
-- Name: notify_on_submission(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_on_submission() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_task_title TEXT;
  v_task_template_id UUID;
  v_earner_id UUID;
  v_earner_name TEXT;
  v_issuer_id UUID;
  v_parent_id UUID;
BEGIN
  -- Get commitment and task details
  -- FIXED: Use v_task_template_id instead of overwriting NEW.commitment_id
  SELECT c.user_id, c.task_template_id, t.title, t.issuer_id
  INTO v_earner_id, v_task_template_id, v_task_title, v_issuer_id
  FROM commitments c
  JOIN task_templates t ON t.id = c.task_template_id
  WHERE c.id = NEW.commitment_id;
  
  SELECT name INTO v_earner_name
  FROM user_profiles WHERE id = v_earner_id;
  
  -- Get parent/guardian from family_relationships
  SELECT issuer_id INTO v_parent_id
  FROM family_relationships 
  WHERE earner_id = v_earner_id 
    AND relationship_type = 'parent'
  LIMIT 1;
  
  -- Notify issuer
  IF v_issuer_id IS NOT NULL THEN
    PERFORM send_notification(
      v_issuer_id,
      'work_submitted',
      '📸 Work Submitted',
      v_earner_name || ' submitted "' || v_task_title || '" for review',
      NEW.commitment_id,
      NEW.id,
      NULL,
      'view_submission',
      jsonb_build_object('submission_id', NEW.id, 'commitment_id', NEW.commitment_id),
      'high'
    );
  END IF;
  
  -- Notify parent/guardian
  IF v_parent_id IS NOT NULL THEN
    PERFORM send_notification(
      v_parent_id,
      'child_submitted_work',
      '📋 Work Submitted',
      v_earner_name || ' submitted "' || v_task_title || '" for approval',
      NEW.commitment_id,
      NEW.id,
      NULL,
      'view_submission',
      jsonb_build_object('submission_id', NEW.id, 'commitment_id', NEW.commitment_id),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_on_submission() OWNER TO postgres;

--
-- Name: on_commitment_review_create_events(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_commitment_review_create_events() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.on_commitment_review_create_events() OWNER TO postgres;

--
-- Name: on_commitment_review_update_rep(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_commitment_review_update_rep() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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


ALTER FUNCTION public.on_commitment_review_update_rep() OWNER TO postgres;

--
-- Name: on_commitment_status_change_update_rep(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_commitment_status_change_update_rep() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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


ALTER FUNCTION public.on_commitment_status_change_update_rep() OWNER TO postgres;

--
-- Name: quality_multiplier_for_rating(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.quality_multiplier_for_rating(rating integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN CASE rating
    WHEN 5 THEN 1.20
    WHEN 4 THEN 1.00
    WHEN 3 THEN 0.70
    WHEN 2 THEN 0.40
    ELSE 0.20
  END;
END;
$$;


ALTER FUNCTION public.quality_multiplier_for_rating(rating integer) OWNER TO postgres;

--
-- Name: reject_submission(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.reject_submission(p_submission_id uuid, p_reviewer_id uuid, p_rejection_reason text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_submission commitment_submissions%ROWTYPE;
BEGIN
    SELECT * INTO v_submission FROM commitment_submissions WHERE id = p_submission_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Submission not found'; END IF;
    
    IF v_submission.submission_status NOT IN ('pending_approval', 'submitted') THEN
        RAISE EXCEPTION 'Invalid status: %', v_submission.submission_status;
    END IF;
    
    UPDATE commitment_submissions
    SET submission_status = 'rejected', reviewer_notes = p_rejection_reason, reviewed_at = NOW(), reviewed_by = p_reviewer_id, updated_at = NOW()
    WHERE id = p_submission_id;
    
    UPDATE commitments SET status = 'in_progress' WHERE id = v_submission.commitment_id;
    
    RETURN json_build_object('success', true, 'submission_id', p_submission_id, 'message', 'Rejected');
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION public.reject_submission(p_submission_id uuid, p_reviewer_id uuid, p_rejection_reason text) OWNER TO postgres;

--
-- Name: send_notification(uuid, text, text, text, uuid, uuid, uuid, text, jsonb, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.send_notification(p_recipient_id uuid, p_type text, p_title text, p_message text, p_commitment_id uuid DEFAULT NULL::uuid, p_submission_id uuid DEFAULT NULL::uuid, p_task_template_id uuid DEFAULT NULL::uuid, p_action_type text DEFAULT 'none'::text, p_action_data jsonb DEFAULT NULL::jsonb, p_priority text DEFAULT 'normal'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    recipient_id,
    notification_type,
    title,
    message,
    commitment_id,
    submission_id,
    task_template_id,
    action_type,
    action_data,
    priority
  ) VALUES (
    p_recipient_id,
    p_type,
    p_title,
    p_message,
    p_commitment_id,
    p_submission_id,
    p_task_template_id,
    p_action_type,
    p_action_data,
    p_priority
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION public.send_notification(p_recipient_id uuid, p_type text, p_title text, p_message text, p_commitment_id uuid, p_submission_id uuid, p_task_template_id uuid, p_action_type text, p_action_data jsonb, p_priority text) OWNER TO postgres;

--
-- Name: update_rep_on_event(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_rep_on_event() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'commitment_submissions' THEN
    SELECT user_id INTO v_user_id
    FROM commitments
    WHERE id = NEW.commitment_id;
    
    IF NEW.submission_status = 'approved' AND NEW.quality_rating IS NOT NULL THEN
      UPDATE user_profiles
      SET 
        completed_commitments = COALESCE(completed_commitments, 0) + 1,
        average_quality_rating = COALESCE(average_quality_rating, 0::DECIMAL(5,2)) + 
          ((NEW.quality_rating::DECIMAL(5,2) - COALESCE(average_quality_rating, 0::DECIMAL(5,2))) / 
           (COALESCE(completed_commitments, 0) + 1)::DECIMAL(5,2))
      WHERE id = v_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_rep_on_event() OWNER TO postgres;

--
-- Name: update_savings_goal_progress(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_savings_goal_progress(p_goal_id uuid, p_amount_cents integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_new_amount INTEGER;
    v_target_amount INTEGER;
BEGIN
    -- Update the current amount
    UPDATE savings_goals
    SET current_amount_cents = current_amount_cents + p_amount_cents,
        updated_at = NOW()
    WHERE id = p_goal_id
    RETURNING current_amount_cents, target_amount_cents 
    INTO v_new_amount, v_target_amount;
    
    -- Check if goal is now completed
    IF v_new_amount >= v_target_amount THEN
        UPDATE savings_goals
        SET is_completed = TRUE,
            completed_at = NOW()
        WHERE id = p_goal_id;
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;


ALTER FUNCTION public.update_savings_goal_progress(p_goal_id uuid, p_amount_cents integer) OWNER TO postgres;

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

--
-- Name: update_user_rep_with_attribution(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_rep_with_attribution() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_old_rep INTEGER;
  v_rep_data RECORD;
  v_rep_tier RECORD;
  v_change_amount INTEGER;
  v_change_reason TEXT;
  v_previous_hash TEXT;
  v_new_hash TEXT;
  v_action_type TEXT;
BEGIN
  -- Determine action type
  v_action_type := CASE
    WHEN TG_TABLE_NAME = 'commitments' AND NEW.status = 'completed' THEN 'task_completed'
    WHEN TG_TABLE_NAME = 'commitments' AND NEW.status = 'failed' THEN 'task_failed'
    WHEN TG_TABLE_NAME = 'commitments' AND NEW.status = 'cancelled' THEN 'task_cancelled'
    WHEN TG_TABLE_NAME = 'commitment_submissions' AND NEW.submission_status = 'approved' THEN 'quality_rating'
    WHEN TG_TABLE_NAME = 'commitment_submissions' AND NEW.submission_status = 'rejected' THEN 'work_rejected'
    ELSE 'rep_update'
  END;
  
  -- Get old Rep score
  SELECT rep_score INTO v_old_rep FROM user_profiles WHERE id = NEW.user_id;
  IF v_old_rep IS NULL THEN v_old_rep := 0; END IF;
  
  -- Calculate new Rep with attribution
  SELECT * INTO v_rep_data FROM calculate_rep_score_with_attribution(NEW.user_id);
  
  -- Get Rep tier info
  SELECT * INTO v_rep_tier FROM get_rep_tier(v_rep_data.rep_score);
  
  -- Calculate change
  v_change_amount := v_rep_data.rep_score - v_old_rep;
  
  -- Generate change reason
  v_change_reason := CASE
    WHEN v_action_type = 'task_completed' THEN 
      'Completed task (' || ROUND(v_rep_data.total_merets, 1) || ' merets total, ' || ROUND(v_rep_data.avg_quality_rating, 1) || '★ avg)'
    WHEN v_action_type = 'quality_rating' THEN 
      'Quality rating received (' || ROUND(v_rep_data.avg_quality_rating, 1) || '★ avg, ' || ROUND(v_rep_data.effective_merets, 1) || ' effective merets)'
    WHEN v_action_type = 'task_failed' THEN 
      'Task failed (no Rep gained)'
    ELSE 
      'Rep recalculated'
  END;
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    rep_score = v_rep_data.rep_score,
    rep_title = v_rep_tier.title,
    rep_tier = v_rep_tier.tier,
    total_commitments = v_rep_data.total_commitments,
    completed_commitments = v_rep_data.completed_commitments,
    failed_commitments = v_rep_data.failed_commitments,
    average_quality_rating = v_rep_data.avg_quality_rating,
    last_rep_update = NOW()
  WHERE id = NEW.user_id;
  
  -- Only create ledger entry if Rep changed
  IF v_change_amount != 0 THEN
    -- Get previous hash
    SELECT blockchain_hash INTO v_previous_hash
    FROM rep_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Generate new hash
    v_new_hash := generate_rep_blockchain_hash(
      NEW.user_id,
      v_old_rep,
      v_rep_data.rep_score,
      v_change_amount,
      NOW(),
      v_previous_hash
    );
    
    -- Create ledger entry
    INSERT INTO rep_history (
      user_id,
      old_rep,
      new_rep,
      change_amount,
      change_reason,
      action_type,
      related_commitment_id,
      related_submission_id,
      completion_rate_at_time,
      quality_score_at_time,
      consistency_score_at_time,
      volume_bonus_at_time,
      failure_penalty_at_time,
      blockchain_hash,
      previous_entry_id
    ) VALUES (
      NEW.user_id,
      v_old_rep,
      v_rep_data.rep_score,
      v_change_amount,
      v_change_reason,
      v_action_type,
      CASE WHEN TG_TABLE_NAME = 'commitments' THEN NEW.id ELSE NULL END,
      CASE WHEN TG_TABLE_NAME = 'commitment_submissions' THEN NEW.id ELSE NULL END,
      v_rep_data.completion_rate,
      v_rep_data.quality_score,
      v_rep_data.consistency_score,
      v_rep_data.volume_bonus,
      v_rep_data.failure_penalty,
      v_new_hash,
      (SELECT id FROM rep_history WHERE user_id = NEW.user_id ORDER BY created_at DESC LIMIT 1)
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_rep_with_attribution() OWNER TO postgres;

--
-- Name: update_user_streak(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_streak(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_last_completion_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_today DATE;
BEGIN
  v_today := CURRENT_DATE;

  SELECT last_completion_date, current_streak, longest_streak
  INTO v_last_completion_date, v_current_streak, v_longest_streak
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_last_completion_date IS NULL THEN
    UPDATE user_profiles
    SET 
      current_streak = 1,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), 1),
      last_completion_date = v_today
    WHERE id = p_user_id;
    RETURN;
  END IF;

  IF v_last_completion_date = v_today THEN
    RETURN;
  END IF;

  IF v_last_completion_date = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
    
    UPDATE user_profiles
    SET 
      current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_completion_date = v_today
    WHERE id = p_user_id;
    RETURN;
  END IF;

  UPDATE user_profiles
  SET 
    current_streak = 1,
    last_completion_date = v_today
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION public.update_user_streak(p_user_id uuid) OWNER TO postgres;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) OWNER TO supabase_storage_admin;

--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.objects_update_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_level_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.prefixes_delete_cleanup() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: task_priorities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_priorities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_template_id uuid NOT NULL,
    priority_type text NOT NULL,
    is_urgent boolean DEFAULT false,
    parent_notes text,
    custom_pay_cents integer,
    custom_effort_minutes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT task_priorities_priority_type_check CHECK ((priority_type = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])))
);


ALTER TABLE public.task_priorities OWNER TO postgres;

--
-- Name: task_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    skill_category character varying(50) NOT NULL,
    effort_minutes integer NOT NULL,
    base_pay_cents integer NOT NULL,
    difficulty_level integer NOT NULL,
    is_micro_task boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    due_date date,
    is_available_for_kids boolean DEFAULT true,
    max_assignments integer,
    current_assignments integer DEFAULT 0,
    parent_notes text,
    urgency_multiplier numeric(5,2) DEFAULT 1.0,
    base_merets numeric(8,2) DEFAULT 0 NOT NULL,
    issuer_id uuid,
    is_recurring boolean DEFAULT false,
    recurrence_pattern text,
    recurrence_interval integer DEFAULT 1,
    recurrence_days text[],
    recurrence_enabled boolean DEFAULT true,
    last_generated_at timestamp with time zone,
    next_generation_at timestamp with time zone,
    CONSTRAINT task_templates_difficulty_level_check CHECK (((difficulty_level >= 1) AND (difficulty_level <= 4)))
);


ALTER TABLE public.task_templates OWNER TO postgres;

--
-- Name: COLUMN task_templates.issuer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.task_templates.issuer_id IS 'References user_profiles.id - should migrate to issuers.id';


--
-- Name: available_tasks_for_kids; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.available_tasks_for_kids AS
 SELECT tt.id AS task_template_id,
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
    ((COALESCE(tp.custom_pay_cents, tt.base_pay_cents))::numeric * COALESCE(tt.urgency_multiplier, 1.0)) AS effective_pay_cents,
    COALESCE(tp.custom_effort_minutes, tt.effort_minutes) AS effective_effort_minutes,
        CASE
            WHEN (tp.priority_type = 'urgent'::text) THEN 100
            WHEN (tp.priority_type = 'high'::text) THEN 75
            WHEN (tp.priority_type = 'normal'::text) THEN 50
            WHEN (tp.priority_type = 'low'::text) THEN 25
            ELSE 50
        END AS urgency_score,
        CASE
            WHEN (tt.due_date IS NOT NULL) THEN (tt.due_date - CURRENT_DATE)
            ELSE NULL::integer
        END AS days_until_due,
        CASE
            WHEN ((tt.max_assignments IS NOT NULL) AND (tt.current_assignments >= tt.max_assignments)) THEN 'full'::text
            WHEN ((tt.due_date IS NOT NULL) AND (tt.due_date < CURRENT_DATE)) THEN 'expired'::text
            WHEN (tt.is_available_for_kids = false) THEN 'hidden'::text
            ELSE 'available'::text
        END AS availability_status
   FROM (public.task_templates tt
     LEFT JOIN public.task_priorities tp ON ((tt.id = tp.task_template_id)))
  WHERE ((tt.is_available_for_kids = true) AND ((tt.max_assignments IS NULL) OR (tt.current_assignments < tt.max_assignments)) AND ((tt.due_date IS NULL) OR (tt.due_date >= CURRENT_DATE)));


ALTER VIEW public.available_tasks_for_kids OWNER TO postgres;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    message_type character varying(30) DEFAULT 'text'::character varying NOT NULL,
    content text NOT NULL,
    commitment_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chat_messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'commitment_request'::character varying, 'commitment_approved'::character varying, 'commitment_rejected'::character varying])::text[])))
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: commitment_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commitment_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    commitment_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewed_at timestamp with time zone DEFAULT now() NOT NULL,
    quality_stars integer NOT NULL,
    review_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT commitment_reviews_quality_stars_check CHECK (((quality_stars >= 1) AND (quality_stars <= 5)))
);


ALTER TABLE public.commitment_reviews OWNER TO postgres;

--
-- Name: commitment_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commitment_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    commitment_id uuid NOT NULL,
    submitted_by uuid NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    minutes_spent integer DEFAULT 0 NOT NULL,
    submission_note text,
    evidence_urls text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    submission_status text DEFAULT 'pending_approval'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    quality_rating integer,
    reviewer_notes text,
    bonus_tip_cents integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT quality_rating_check CHECK (((quality_rating IS NULL) OR ((quality_rating >= 1) AND (quality_rating <= 5)))),
    CONSTRAINT submission_status_check CHECK ((submission_status = ANY (ARRAY['pending_approval'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.commitment_submissions OWNER TO postgres;

--
-- Name: commitments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.commitments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_template_id uuid,
    custom_title character varying(200),
    custom_description text,
    skill_category character varying(50) NOT NULL,
    effort_minutes integer NOT NULL,
    pay_cents integer NOT NULL,
    status text DEFAULT 'pending'::character varying,
    quality_rating character varying(10),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    due_date date,
    actual_pay_cents integer,
    time_started timestamp with time zone,
    time_completed timestamp with time zone,
    parent_feedback text,
    kid_notes text,
    issuer_id uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    evidence_photo_url text,
    evidence_uploaded_at timestamp with time zone,
    evidence_notes text,
    is_recurring_instance boolean DEFAULT false,
    parent_task_template_id uuid,
    scheduled_for date,
    auto_generated boolean DEFAULT false,
    requires_parental_approval boolean DEFAULT false,
    parental_approval_status text DEFAULT 'not_required'::text,
    parent_approver_id uuid,
    parent_approval_notes text,
    CONSTRAINT commitments_parental_approval_status_check CHECK ((parental_approval_status = ANY (ARRAY['not_required'::text, 'pending'::text, 'approved'::text, 'denied'::text]))),
    CONSTRAINT commitments_quality_rating_check CHECK (((quality_rating)::text = ANY ((ARRAY['miss'::character varying, 'pass'::character varying, 'perfect'::character varying])::text[]))),
    CONSTRAINT commitments_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'accepted'::text, 'in_progress'::text, 'submitted'::text, 'ready_for_review'::text, 'completed'::text, 'redo_requested'::text, 'rejected'::text])))
);


ALTER TABLE public.commitments OWNER TO postgres;

--
-- Name: COLUMN commitments.issuer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.commitments.issuer_id IS 'References user_profiles.id - should migrate to issuers.id';


--
-- Name: earning_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.earning_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    actor_user_id uuid,
    commitment_id uuid,
    amount_cents integer NOT NULL,
    status text DEFAULT 'owed'::text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT earning_events_amount_cents_check CHECK ((amount_cents >= 0)),
    CONSTRAINT earning_events_status_check CHECK ((status = ANY (ARRAY['owed'::text, 'approved'::text, 'paid'::text, 'void'::text])))
);


ALTER TABLE public.earning_events OWNER TO postgres;

--
-- Name: family_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    issuer_id uuid NOT NULL,
    earner_id uuid NOT NULL,
    relationship_type text NOT NULL,
    permission_level text DEFAULT 'full'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT family_relationships_permission_level_check CHECK ((permission_level = ANY (ARRAY['full'::text, 'approve_only'::text, 'review_only'::text, 'view_only'::text]))),
    CONSTRAINT family_relationships_relationship_type_check CHECK ((relationship_type = ANY (ARRAY['parent'::text, 'guardian'::text, 'grandparent'::text, 'aunt_uncle'::text, 'teacher'::text, 'coach'::text, 'mentor'::text, 'other'::text])))
);


ALTER TABLE public.family_relationships OWNER TO postgres;

--
-- Name: COLUMN family_relationships.issuer_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.family_relationships.issuer_id IS 'References user_profiles.id - should migrate to issuers.id';


--
-- Name: household_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.household_members (
    household_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role public.user_role NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.household_members OWNER TO postgres;

--
-- Name: households; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.households (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text DEFAULT 'Family'::text NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    onboarding_completed boolean DEFAULT false,
    onboarding_completed_at timestamp with time zone
);


ALTER TABLE public.households OWNER TO postgres;

--
-- Name: issuer_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issuer_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    commitment_id uuid NOT NULL,
    issuer_id uuid NOT NULL,
    approval_status text NOT NULL,
    rejection_reason text,
    approved_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    CONSTRAINT issuer_approvals_approval_status_check CHECK ((approval_status = ANY (ARRAY['approved'::text, 'rejected'::text, 'revision_requested'::text])))
);


ALTER TABLE public.issuer_approvals OWNER TO postgres;

--
-- Name: issuers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issuers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_profile_id uuid,
    name text NOT NULL,
    email text,
    phone text,
    issuer_type text NOT NULL,
    organization_name text,
    organization_type text,
    is_active boolean DEFAULT true NOT NULL,
    can_create_tasks boolean DEFAULT true NOT NULL,
    can_approve_commitments boolean DEFAULT true NOT NULL,
    can_rate_quality boolean DEFAULT true NOT NULL,
    notification_preferences jsonb DEFAULT '{"sms": false, "email": true}'::jsonb,
    bio text,
    profile_image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT issuers_issuer_type_check CHECK ((issuer_type = ANY (ARRAY['parent'::text, 'guardian'::text, 'grandparent'::text, 'teacher'::text, 'coach'::text, 'neighbor'::text, 'family_friend'::text, 'mentor'::text, 'employer'::text, 'other'::text])))
);


ALTER TABLE public.issuers OWNER TO postgres;

--
-- Name: meret_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meret_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    actor_user_id uuid,
    commitment_id uuid,
    merets_delta numeric(8,2) NOT NULL,
    reason text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.meret_events OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    recipient_id uuid NOT NULL,
    notification_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    commitment_id uuid,
    submission_id uuid,
    task_template_id uuid,
    read boolean DEFAULT false,
    archived boolean DEFAULT false,
    action_type text,
    action_data jsonb,
    priority text DEFAULT 'normal'::text,
    CONSTRAINT notifications_action_type_check CHECK ((action_type = ANY (ARRAY['view_task'::text, 'view_commitment'::text, 'view_submission'::text, 'approve_commitment'::text, 'approve_submission'::text, 'view_notification_settings'::text, 'none'::text]))),
    CONSTRAINT notifications_notification_type_check CHECK ((notification_type = ANY (ARRAY['task_assigned'::text, 'task_completed'::text, 'task_approved'::text, 'task_rejected'::text, 'payment_received'::text, 'achievement_unlocked'::text, 'reminder'::text, 'system'::text, 'task_committed'::text, 'external_task_pending_approval'::text, 'external_task_approved'::text, 'external_task_denied'::text, 'work_approved'::text, 'work_rejected'::text, 'meret_earned'::text, 'rework_requested'::text, 'rating_received'::text, 'child_committed_external_task'::text, 'child_submitted_work'::text, 'approval_needed'::text, 'dispute_raised'::text, 'work_submitted'::text, 'commitment_made'::text]))),
    CONSTRAINT notifications_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: pay_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pay_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    skill_category character varying(50) NOT NULL,
    difficulty_level integer NOT NULL,
    base_rate_per_minute_cents integer NOT NULL,
    micro_task_flat_rate_cents integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pay_rates_difficulty_level_check CHECK (((difficulty_level >= 1) AND (difficulty_level <= 4)))
);


ALTER TABLE public.pay_rates OWNER TO postgres;

--
-- Name: payment_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    commitment_id uuid NOT NULL,
    payer_id uuid NOT NULL,
    amount_cents integer NOT NULL,
    payment_method text,
    paid_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_records_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'venmo'::text, 'paypal'::text, 'zelle'::text, 'check'::text, 'other'::text])))
);


ALTER TABLE public.payment_records OWNER TO postgres;

--
-- Name: rep_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rep_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    actor_user_id uuid,
    commitment_id uuid,
    completion_rate numeric(5,2),
    quality_avg numeric(5,2),
    volume_bonus numeric(5,2),
    rep_score_after integer NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rep_events_rep_score_after_check CHECK (((rep_score_after >= 0) AND (rep_score_after <= 100)))
);


ALTER TABLE public.rep_events OWNER TO postgres;

--
-- Name: savings_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.savings_goals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    target_amount_cents integer NOT NULL,
    current_amount_cents integer DEFAULT 0,
    goal_image_url text,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    target_date date,
    priority integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.savings_goals OWNER TO postgres;

--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_template_id uuid,
    user_id uuid,
    commitment_id uuid,
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'available'::text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT task_assignments_status_check CHECK ((status = ANY (ARRAY['available'::text, 'claimed'::text, 'in_progress'::text, 'completed'::text, 'expired'::text])))
);


ALTER TABLE public.task_assignments OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    role character varying(10) NOT NULL,
    age integer,
    level integer DEFAULT 1,
    total_xp integer DEFAULT 0,
    total_earnings_cents integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    handle text,
    avatar_url text,
    is_earner boolean DEFAULT true NOT NULL,
    is_provider boolean DEFAULT false NOT NULL,
    rep_score integer DEFAULT 50 NOT NULL,
    rep_event_count integer DEFAULT 0 NOT NULL,
    merets_balance numeric(12,2) DEFAULT 0 NOT NULL,
    lifetime_merets numeric(12,2) DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    onboarding_completed boolean DEFAULT false,
    onboarding_step integer DEFAULT 0,
    onboarding_completed_at timestamp with time zone,
    tasks_completed integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_completion_date date,
    rep_title text DEFAULT 'Entry Earner'::text,
    rep_tier text DEFAULT '1E'::text,
    total_commitments integer DEFAULT 0,
    completed_commitments integer DEFAULT 0,
    failed_commitments integer DEFAULT 0,
    average_quality_rating numeric(5,2) DEFAULT 0.00,
    consistency_score numeric(5,2) DEFAULT 0.00,
    last_rep_update timestamp with time zone DEFAULT now(),
    experience_hours numeric DEFAULT 0,
    CONSTRAINT user_profiles_role_check CHECK (((role)::text = ANY ((ARRAY['kid'::character varying, 'parent'::character varying])::text[])))
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: v_active_recurring_tasks; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_active_recurring_tasks AS
 SELECT id,
    title,
    description,
    skill_category,
    effort_minutes,
    base_pay_cents,
    recurrence_pattern,
    recurrence_interval,
    recurrence_days,
    last_generated_at,
    next_generation_at,
    is_available_for_kids
   FROM public.task_templates
  WHERE ((is_recurring = true) AND (recurrence_enabled = true))
  ORDER BY next_generation_at NULLS FIRST;


ALTER VIEW public.v_active_recurring_tasks OWNER TO postgres;

--
-- Name: v_commitments_with_relationships; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_commitments_with_relationships AS
 SELECT c.id AS commitment_id,
    c.task_template_id,
    c.custom_title,
    c.custom_description,
    c.effort_minutes,
    c.pay_cents,
    c.status,
    c.created_at,
    c.completed_at,
    c.due_date,
    c.kid_notes,
    up_earner.id AS earner_id,
    up_earner.name AS earner_name,
    up_earner.age AS earner_age,
    c.issuer_id,
    up_issuer.name AS issuer_name,
    i.issuer_type,
    i.organization_name,
    ( SELECT json_agg(json_build_object('parent_id', up_parent.id, 'parent_name', up_parent.name, 'relationship_type', fr.relationship_type, 'permission_level', fr.permission_level)) AS json_agg
           FROM (public.family_relationships fr
             JOIN public.user_profiles up_parent ON ((fr.issuer_id = up_parent.id)))
          WHERE ((fr.earner_id = up_earner.id) AND ((up_parent.role)::text = 'parent'::text))) AS parents_guardians,
    tt.title AS template_title,
    tt.skill_category
   FROM ((((public.commitments c
     JOIN public.user_profiles up_earner ON ((c.user_id = up_earner.id)))
     LEFT JOIN public.user_profiles up_issuer ON ((c.issuer_id = up_issuer.id)))
     LEFT JOIN public.issuers i ON ((i.user_profile_id = up_issuer.id)))
     LEFT JOIN public.task_templates tt ON ((c.task_template_id = tt.id)));


ALTER VIEW public.v_commitments_with_relationships OWNER TO postgres;

--
-- Name: v_issuer_tasks_with_commitments; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_issuer_tasks_with_commitments AS
 SELECT tt.id AS task_id,
    tt.title,
    tt.description,
    tt.skill_category,
    tt.effort_minutes,
    tt.base_pay_cents,
    tt.difficulty_level,
    tt.is_micro_task,
    tt.is_available_for_kids,
    tt.due_date,
    tt.max_assignments,
    tt.current_assignments,
    tt.issuer_id,
    i.name AS issuer_name,
    i.issuer_type,
    i.organization_name,
    ( SELECT count(*) AS count
           FROM public.commitments c
          WHERE ((c.task_template_id = tt.id) AND (c.status = 'pending_approval'::text))) AS pending_approval_count,
    ( SELECT count(*) AS count
           FROM public.commitments c
          WHERE ((c.task_template_id = tt.id) AND (c.status = 'accepted'::text))) AS accepted_count,
    ( SELECT count(*) AS count
           FROM public.commitments c
          WHERE ((c.task_template_id = tt.id) AND (c.status = 'in_progress'::text))) AS in_progress_count,
    ( SELECT count(*) AS count
           FROM public.commitments c
          WHERE ((c.task_template_id = tt.id) AND (c.status = 'ready_for_review'::text))) AS ready_for_review_count,
    ( SELECT count(*) AS count
           FROM public.commitments c
          WHERE ((c.task_template_id = tt.id) AND (c.status = 'completed'::text))) AS completed_count,
    tt.created_at
   FROM ((public.task_templates tt
     LEFT JOIN public.user_profiles up ON ((tt.issuer_id = up.id)))
     LEFT JOIN public.issuers i ON ((i.user_profile_id = up.id)))
  WHERE (tt.issuer_id IS NOT NULL);


ALTER VIEW public.v_issuer_tasks_with_commitments OWNER TO postgres;

--
-- Name: v_user_earnings; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_user_earnings AS
 SELECT user_id,
    sum(amount_cents) FILTER (WHERE (status = 'owed'::text)) AS owed_cents,
    sum(amount_cents) FILTER (WHERE (status = 'paid'::text)) AS paid_cents
   FROM public.earning_events
  GROUP BY user_id;


ALTER VIEW public.v_user_earnings OWNER TO postgres;

--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, sender_id, message_type, content, commitment_id, created_at) FROM stdin;
\.


--
-- Data for Name: commitment_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commitment_reviews (id, commitment_id, reviewer_id, reviewed_at, quality_stars, review_note, created_at) FROM stdin;
\.


--
-- Data for Name: commitment_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commitment_submissions (id, commitment_id, submitted_by, submitted_at, minutes_spent, submission_note, evidence_urls, created_at, submission_status, reviewed_by, reviewed_at, quality_rating, reviewer_notes, bonus_tip_cents, updated_at) FROM stdin;
39135ca0-7a13-48eb-b4be-3ddd67dd49a2	47b33618-6bcf-48c0-9162-65efe6226a72	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:11:24.007+00	0	Task completed	{}	2026-01-05 20:11:24.22414+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:12:18.135307+00	4	\N	0	2026-01-05 20:12:18.135307+00
c376538b-1d1a-4df1-bb96-15b40826bbb3	bdebcc52-9492-406b-ba58-8ad81733fe47	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:11:30.26+00	0	Task completed	{}	2026-01-05 20:11:30.348036+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:12:44.75102+00	5	\N	0	2026-01-05 20:12:44.75102+00
a09eda7a-dd26-4d66-8148-1512cd09052f	c9a9d8ad-6355-4bd9-b4aa-990da50c45c5	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:11:38.873+00	0	Task completed	{}	2026-01-05 20:11:38.976078+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:12:51.308485+00	5	\N	0	2026-01-05 20:12:51.308485+00
7ad9d6df-3136-4445-9239-e2c3cb544cbb	8f3dad03-bfa7-4edf-ae69-699a2edd812d	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:09.277+00	0	Task completed	{}	2026-01-05 20:14:09.375319+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:15:18.571932+00	5	\N	0	2026-01-05 20:15:18.571932+00
2de80844-b47a-4272-abbf-b38fc1274050	ffc7bb33-843d-463f-84bb-5d1a565fd40f	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:14.26+00	0	Task completed	{}	2026-01-05 20:14:14.354281+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:15:24.752204+00	5	\N	0	2026-01-05 20:15:24.752204+00
4d748026-92c0-413b-9b09-a0e7786a511e	92a30c28-2bb5-44ff-852f-20047f062a9d	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:19.223+00	0	Task completed	{}	2026-01-05 20:14:19.316368+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:15:30.741554+00	5	\N	0	2026-01-05 20:15:30.741554+00
7c82ffa2-faba-4532-9db4-7604345f4baa	80814540-f87a-4d61-aaab-5426f256ed0d	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:31.021+00	0	Task completed	{}	2026-01-05 20:14:31.114483+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:15:38.415564+00	5	\N	0	2026-01-05 20:15:38.415564+00
3e9e5bae-3597-43ec-82b4-975afa5e0259	a49fe64a-4628-4ab3-a512-eac66d19e533	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:45.807+00	0	Task completed	{}	2026-01-05 20:14:45.901148+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:15:45.816539+00	5	\N	0	2026-01-05 20:15:45.816539+00
3c78de34-d41d-464a-b6b8-8c10edb39e47	e51755bb-a77a-4e5f-832e-b415e9bc469d	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:50.673+00	0	Task completed	{}	2026-01-05 20:14:50.791609+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:15:54.553003+00	4	\N	0	2026-01-05 20:15:54.553003+00
1c1dc7f2-7936-4085-a380-62e47b563913	f800ac29-f772-4d8e-8877-9a25e804071c	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:25.107+00	0	Task completed	{}	2026-01-05 20:14:25.213831+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:16:01.084074+00	4	\N	0	2026-01-05 20:16:01.084074+00
1b9b5d6e-e609-48dd-90ec-5d4e2d8ab7a7	4832c519-5d2e-43ee-94f0-ff2b95be4a8c	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:36.622+00	0	Task completed	{}	2026-01-05 20:14:36.710494+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:16:07.743358+00	4	\N	0	2026-01-05 20:16:07.743358+00
e39276ae-0483-4127-b8ae-153919df4fed	24782769-1262-41dd-a80f-35ab4038fb04	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:14:55.508+00	0	Task completed	{}	2026-01-05 20:14:55.794079+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:16:15.558028+00	5	\N	0	2026-01-05 20:16:15.558028+00
d3572b98-462e-4004-99d4-14fb3a77646f	58f4af4d-f7be-429c-b4b3-3c5b701ec616	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:15:01.721+00	0	Task completed	{}	2026-01-05 20:15:01.805904+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:37:32.304569+00	5	\N	0	2026-01-05 20:37:32.304569+00
d0e9b053-cc7f-4e5c-a57b-58d7a6ef957b	68098873-bc51-43fe-94ab-b12d11f9d106	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-03 13:21:19.195+00	0		{https://bzogqqkptnbtnmpzvdca.supabase.co/storage/v1/object/public/commitment-photos/4be9f490-66e9-48ab-833d-9fade274504d/1767446478945.jpg}	2026-01-03 13:21:19.255747+00	approved	9c3d717c-4709-4911-b77a-093dfb601cdb	2026-01-03 17:03:29.018447+00	5	Excellent work!	100	2026-01-03 17:03:29.018447+00
c357e47e-2f1b-4c2d-97c8-947b534b5d1f	d8aa9635-06db-46c6-acb6-42513913dc44	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-03 17:11:10.981+00	0		{https://bzogqqkptnbtnmpzvdca.supabase.co/storage/v1/object/public/commitment-photos/4be9f490-66e9-48ab-833d-9fade274504d/1767460270731.jpg}	2026-01-03 17:11:11.050064+00	approved	658af463-a5e9-41af-a9d1-5bc771822e8e	2026-01-03 17:11:28.402549+00	5	\N	200	2026-01-03 17:11:28.402549+00
556570c1-723f-4b30-b769-624d75d07851	06a56052-e98d-4388-92a7-6a2031bae2aa	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 17:35:56.512+00	0		{https://bzogqqkptnbtnmpzvdca.supabase.co/storage/v1/object/public/commitment-photos/f8679515-35c0-41e7-af69-fc0a6d6c012d/1767461756242.jpg}	2026-01-03 17:35:56.582208+00	approved	658af463-a5e9-41af-a9d1-5bc771822e8e	2026-01-03 17:36:24.480961+00	5	Great job!	200	2026-01-03 17:36:24.480961+00
56b66e17-b0de-4c52-aa86-cbb807d24fcf	036ea1a4-d5b2-41ab-ba82-75c5b1ab2195	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 17:51:51.843+00	0		{https://bzogqqkptnbtnmpzvdca.supabase.co/storage/v1/object/public/commitment-photos/f8679515-35c0-41e7-af69-fc0a6d6c012d/1767462711591.jpg}	2026-01-03 17:51:51.914456+00	approved	658af463-a5e9-41af-a9d1-5bc771822e8e	2026-01-03 17:52:03.616954+00	5	\N	0	2026-01-03 17:52:03.616954+00
893b7b88-cbec-4ec5-a643-39f6319d82f2	473c950e-a47f-4f99-b780-501ee2f8e92b	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 17:57:01.195+00	0	Task completed	{https://bzogqqkptnbtnmpzvdca.supabase.co/storage/v1/object/public/commitment-photos/f8679515-35c0-41e7-af69-fc0a6d6c012d/1767463020955.jpg}	2026-01-03 17:57:01.26581+00	approved	658af463-a5e9-41af-a9d1-5bc771822e8e	2026-01-03 17:59:29.905388+00	5	Great job	0	2026-01-03 17:59:29.905388+00
0e2a00a9-c049-4f06-a96a-fd2cc6c4aa43	f1e432d5-0089-4088-9638-8fd66fb1d693	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:37:45.17+00	0	Task completed	{}	2026-01-05 20:37:45.27824+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:38:42.754025+00	5	\N	0	2026-01-05 20:38:42.754025+00
98800891-b27c-454e-9671-0b286c025065	cbabe0cf-1203-454a-b519-fd92a19a5e82	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 18:06:20.243+00	0	Task completed	{}	2026-01-03 18:06:20.341779+00	approved	658af463-a5e9-41af-a9d1-5bc771822e8e	2026-01-03 18:06:41.83838+00	5	Awesome	0	2026-01-03 18:06:41.83838+00
fe1f30fc-5050-44f1-ab71-794e05608cae	5522d969-98a1-4488-bb93-579da829f623	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:37:49.503+00	0	Task completed	{}	2026-01-05 20:37:49.615441+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:38:48.645277+00	5	\N	0	2026-01-05 20:38:48.645277+00
f029e38a-3013-4aff-a660-d49144b035d7	6d5e3898-4682-4ae0-be59-6bd784cd44a1	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 18:09:36.711+00	0	Task completed	{}	2026-01-03 18:09:36.827382+00	approved	658af463-a5e9-41af-a9d1-5bc771822e8e	2026-01-03 18:09:56.154364+00	5	Giggidy good	0	2026-01-03 18:09:56.154364+00
53a0a424-2509-41a6-883a-45762ec8f972	2aca1933-920e-4e43-b1fa-dd14957ff5ab	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:38:19.366+00	0	Task completed	{}	2026-01-05 20:38:19.478172+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:39:02.073111+00	5	\N	0	2026-01-05 20:39:02.073111+00
04ce6fb1-4094-4cb1-8069-2367eca4e233	568f186c-7a27-4201-b4d8-a982562ca311	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 18:13:35.849+00	0	Task completed	{}	2026-01-03 18:13:35.963664+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-03 18:13:52.485187+00	5	Noice	0	2026-01-03 18:13:52.485187+00
4e8ed9ae-2f99-4537-a6bc-748dd5b82f99	b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:38:24.436+00	0	Task completed	{}	2026-01-05 20:38:24.551273+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:39:07.758506+00	5	\N	0	2026-01-05 20:39:07.758506+00
fa91a18c-3a6d-4a16-96b9-1e418dc05e5b	72cd1f11-d985-4d2f-a3ce-85014a2bbf71	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-03 18:19:54.692+00	0	Task completed	{}	2026-01-03 18:19:54.792754+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-03 18:20:09.468661+00	5	Great jorb	0	2026-01-03 18:20:09.468661+00
894011ce-2b97-4870-a9f0-e5d3c8d2a4f2	45683614-d9e2-4a31-8c38-57a877fca62f	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-03 18:25:43.822+00	0	Task completed	{}	2026-01-03 18:25:43.940287+00	approved	658af463-a5e9-41af-a9d1-5bc771822e8e	2026-01-03 18:25:53.080495+00	5	\N	0	2026-01-03 18:25:53.080495+00
68010a63-3092-4e81-8bcf-bc60927dc34f	9e61b2fe-8d77-418a-a48b-1341344a14a1	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 20:11:14.549+00	0	Task completed	{}	2026-01-03 20:11:14.735264+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 18:17:48.078302+00	5	\N	0	2026-01-05 18:17:48.078302+00
a9be3585-d599-43b7-b084-e390e111ebb8	528b95a5-c4de-41fe-ad2c-46f75c5cb694	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-03 20:30:31.033+00	0	Task completed	{}	2026-01-03 20:30:31.134276+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 18:26:31.842734+00	5	\N	0	2026-01-05 18:26:31.842734+00
97768193-051c-40c4-85bd-cca1f484bf68	0a4c03be-2800-424b-a184-8cfa9825b8ee	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-03 20:48:28.423+00	0	Task completed	{}	2026-01-03 20:48:28.532332+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 18:31:19.154986+00	5	\N	0	2026-01-05 18:31:19.154986+00
1c2494ca-e1a1-4115-88f1-f602eb105e1e	80d9315d-da32-4ce6-a684-88ca92d1c66c	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 00:38:48.873+00	0	Task completed	{}	2026-01-05 00:38:49.057474+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 18:40:12.884525+00	5	\N	0	2026-01-05 18:40:12.884525+00
96d85a1d-bfca-4ae2-8f9d-6d081f371fb1	11054b5a-2235-4846-b60c-cd4d2d173c44	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-05 19:56:29.336+00	0	Task completed	{}	2026-01-05 19:56:29.507594+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 19:56:52.464315+00	5	\N	0	2026-01-05 19:56:52.464315+00
051683f3-f314-421e-8f4d-1869700f8619	3f565f44-ca52-4313-a270-fc9761dcedcb	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-05 19:57:42.776+00	0	Task completed	{}	2026-01-05 19:57:42.915421+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 19:58:09.948535+00	5	\N	0	2026-01-05 19:58:09.948535+00
41d81f4f-977e-44d0-bc3a-cafc60332e01	d9bc779a-4f29-4c3e-826e-9066a5e368a6	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-05 19:57:52.604+00	0	Task completed	{}	2026-01-05 19:57:52.723501+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 19:58:16.77075+00	5	\N	0	2026-01-05 19:58:16.77075+00
e2250316-9f20-4fae-8707-27bf286dba7f	4341b221-733d-4e04-9d40-3ae5b7cc6a7c	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:11:01.506+00	0	Task completed	{}	2026-01-05 20:11:01.601002+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:11:56.475178+00	5	\N	0	2026-01-05 20:11:56.475178+00
d382864c-9d6c-419d-93e7-dae900e93bd4	ace4a538-f036-454d-be0d-35d25a695321	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:11:08.588+00	0	Task completed	{}	2026-01-05 20:11:08.748218+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:12:04.05977+00	4	\N	0	2026-01-05 20:12:04.05977+00
cb59ccb5-d391-4569-b805-f0e4700fc2ba	801faac2-552c-42ab-a03e-32facb5c3a42	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:11:15.104+00	0	Task completed	{}	2026-01-05 20:11:15.188484+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:12:11.405368+00	4	\N	0	2026-01-05 20:12:11.405368+00
f75f02d0-8d4d-4b7f-9906-3e85599f2b51	13e4000e-bdc8-4a55-9d63-cdd449f7b314	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 20:37:53.97+00	0	Task completed	{}	2026-01-05 20:37:54.12241+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 20:38:55.561837+00	5	\N	0	2026-01-05 20:38:55.561837+00
ef7c40ba-2354-41a7-9666-491ac0498428	f715e231-e3a5-4748-a4e4-50c6278db6c6	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 21:26:51.219+00	0	Task completed	{}	2026-01-05 21:26:51.327623+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 21:27:17.825185+00	5	\N	0	2026-01-05 21:27:17.825185+00
7af40d2d-fb8a-45ae-8e32-a34ee917a000	c39292fe-0c72-4bb6-8f9e-fd7178450729	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 21:26:54.816+00	0	Task completed	{}	2026-01-05 21:26:54.914373+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 21:27:24.586451+00	5	\N	0	2026-01-05 21:27:24.586451+00
6d33bceb-2af0-46cf-95ff-e70b401d2e7f	1529b7ba-9f8d-4f57-b024-ae9ec1ab1831	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 21:27:01.535+00	0	Task completed	{}	2026-01-05 21:27:01.662733+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 21:27:38.401346+00	5	\N	0	2026-01-05 21:27:38.401346+00
9c3702a4-6705-487c-8d88-125b46b3f9a1	0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-05 21:26:58.385+00	0	Task completed	{}	2026-01-05 21:26:58.507982+00	approved	971b6c20-1c43-4d12-a2e6-cbf6053c4706	2026-01-05 21:27:32.068873+00	5	\N	0	2026-01-05 21:27:32.068873+00
\.


--
-- Data for Name: commitments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.commitments (id, user_id, task_template_id, custom_title, custom_description, skill_category, effort_minutes, pay_cents, status, quality_rating, completed_at, created_at, due_date, actual_pay_cents, time_started, time_completed, parent_feedback, kid_notes, issuer_id, updated_at, evidence_photo_url, evidence_uploaded_at, evidence_notes, is_recurring_instance, parent_task_template_id, scheduled_for, auto_generated, requires_parental_approval, parental_approval_status, parent_approver_id, parent_approval_notes) FROM stdin;
528b95a5-c4de-41fe-ad2c-46f75c5cb694	4be9f490-66e9-48ab-833d-9fade274504d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-05 18:26:31.842734+00	2026-01-01 21:19:59.640838+00	\N	\N	\N	2026-01-05 18:26:31.842734+00	\N	\N	\N	2026-01-05 18:26:31.842734+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
6e8e8e16-1930-4205-a404-ad2b2db65801	4be9f490-66e9-48ab-833d-9fade274504d	77cfcf4c-023d-4ce7-aa35-3b53f98ade91	Dust all rooms	Dust furniture in all rooms	Cleaning	20	1200	accepted	\N	\N	2025-12-29 21:23:36.246166+00	\N	\N	\N	\N	\N	\N	\N	2025-12-29 21:23:46.940513+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
f9ce3e9e-7ad7-4cd1-a7a0-b94b6939a8cd	4be9f490-66e9-48ab-833d-9fade274504d	4704a6ab-f03c-4120-aa89-c68b7c096ef5	Clean garage	Sweep and organize garage	Organization	45	2700	accepted	\N	\N	2025-12-30 13:15:41.835935+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:22:39.203774+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
f82352db-54bc-4340-9505-9812e792167c	4be9f490-66e9-48ab-833d-9fade274504d	3fbf5c1c-e60e-49cd-9a43-fea100f50267	Take out trash	Empty kitchen trash and replace bag	Cleaning	2	100	completed	\N	2025-12-24 16:32:19.469+00	2025-12-24 16:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
4375fa85-0175-42ed-b920-26ef5b4c7493	4be9f490-66e9-48ab-833d-9fade274504d	fa4df0bb-3694-40ab-b100-b838fbdfb52d	Water plants	Water all indoor plants	General	4	250	completed	\N	2025-12-28 21:34:19.469+00	2025-12-28 21:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
d8fcd359-99dc-441a-bcc1-dfaafc234bbc	4be9f490-66e9-48ab-833d-9fade274504d	77ba6d7f-c0e6-47eb-a94c-a54f327b2ba0	Wipe kitchen counter	Clean and sanitize counters	Cleaning	5	300	completed	\N	2025-12-24 15:35:19.469+00	2025-12-24 15:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
5c32decd-cf7b-4a24-aef9-31a172e488b3	4be9f490-66e9-48ab-833d-9fade274504d	3fbf5c1c-e60e-49cd-9a43-fea100f50267	Take out trash	Empty kitchen trash and replace bag	Cleaning	2	100	completed	\N	2025-12-21 23:32:19.469+00	2025-12-21 23:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
6603b6b7-a24c-42ac-bc92-b2eeb03d3e46	4be9f490-66e9-48ab-833d-9fade274504d	fa4df0bb-3694-40ab-b100-b838fbdfb52d	Water plants	Water all indoor plants	General	4	250	completed	\N	2025-12-22 19:34:19.469+00	2025-12-22 19:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
6a8dc4d5-13f0-4d92-84e5-949a2c9a2cb1	4be9f490-66e9-48ab-833d-9fade274504d	77ba6d7f-c0e6-47eb-a94c-a54f327b2ba0	Wipe kitchen counter	Clean and sanitize counters	Cleaning	5	300	completed	\N	2025-12-22 21:35:19.469+00	2025-12-22 21:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
beadd5f4-98ed-4314-b565-25b05fc46a54	4be9f490-66e9-48ab-833d-9fade274504d	46a25e52-09cd-4588-a16f-f03631ec3092	Empty bathroom trash	All bathroom wastebaskets	Cleaning	3	200	completed	\N	2025-12-04 19:33:19.469+00	2025-12-04 19:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
e5795143-adf7-423f-8cdb-84f8ac02da68	4be9f490-66e9-48ab-833d-9fade274504d	0acbabe7-759c-43c1-8a62-1513268f2b8a	Load dishwasher	Load dishes and start cycle	Dishes	6	400	completed	\N	2025-12-05 19:36:19.469+00	2025-12-05 19:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
7f759a72-c706-4ec3-9318-017ab423cafc	4be9f490-66e9-48ab-833d-9fade274504d	5f52d1f4-d54d-4942-b4e3-4450d98c7527	Unload dishwasher	Put away all clean dishes	Dishes	5	350	completed	\N	2025-12-02 21:35:19.469+00	2025-12-02 21:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
d8ba405e-74eb-4a35-a836-ab1ec156dd71	4be9f490-66e9-48ab-833d-9fade274504d	0d3138c5-98f3-43d6-9211-8d7cbe72215f	Sweep kitchen floor	Sweep entire kitchen	Cleaning	8	500	completed	\N	2025-12-04 16:38:19.469+00	2025-12-04 16:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
a15899d2-150e-4d82-8375-b542f310e675	4be9f490-66e9-48ab-833d-9fade274504d	19cc2ec9-87fb-4c46-bb2a-8cf1bf1dbba7	Clean bathroom sink	Scrub sink and faucet	Cleaning	7	450	completed	\N	2025-12-19 01:37:19.469+00	2025-12-19 01:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
426a6ce1-311e-4571-8cf2-f8fd6db82cf4	4be9f490-66e9-48ab-833d-9fade274504d	3cc6fc22-1287-4cba-ae66-e090bf0b1add	Fold laundry	Fold one load of clean laundry	Laundry	10	600	completed	\N	2025-12-09 15:40:19.469+00	2025-12-09 15:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
2b5b0212-7783-4690-87b5-453db231ae55	f8679515-35c0-41e7-af69-fc0a6d6c012d	46a25e52-09cd-4588-a16f-f03631ec3092	Empty bathroom trash	All bathroom wastebaskets	Cleaning	3	200	completed	\N	2025-12-31 01:33:19.469+00	2025-12-31 01:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
984ed55d-89f1-4d9c-8a2c-ebbe71708481	f8679515-35c0-41e7-af69-fc0a6d6c012d	0acbabe7-759c-43c1-8a62-1513268f2b8a	Load dishwasher	Load dishes and start cycle	Dishes	6	400	completed	\N	2025-12-30 22:36:19.469+00	2025-12-30 22:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
b0b6d55a-1129-4104-b510-8f0cc1ab9413	f8679515-35c0-41e7-af69-fc0a6d6c012d	5f52d1f4-d54d-4942-b4e3-4450d98c7527	Unload dishwasher	Put away all clean dishes	Dishes	5	350	completed	\N	2025-12-24 23:35:19.469+00	2025-12-24 23:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
2381ac01-ea70-494e-9e34-b947e4d8107b	f8679515-35c0-41e7-af69-fc0a6d6c012d	46a25e52-09cd-4588-a16f-f03631ec3092	Empty bathroom trash	All bathroom wastebaskets	Cleaning	3	200	completed	\N	2025-11-30 19:33:19.469+00	2025-11-30 19:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
0d21ee83-0049-4f1c-9bb8-eab0eaf6dec0	f8679515-35c0-41e7-af69-fc0a6d6c012d	0acbabe7-759c-43c1-8a62-1513268f2b8a	Load dishwasher	Load dishes and start cycle	Dishes	6	400	completed	\N	2025-12-22 20:36:19.469+00	2025-12-22 20:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
69e5f968-5ddd-44b4-a750-6d078d4ac49d	f8679515-35c0-41e7-af69-fc0a6d6c012d	5f52d1f4-d54d-4942-b4e3-4450d98c7527	Unload dishwasher	Put away all clean dishes	Dishes	5	350	completed	\N	2025-12-12 17:35:19.469+00	2025-12-12 17:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
11891375-c7a7-4267-85b7-c4307d071b12	f8679515-35c0-41e7-af69-fc0a6d6c012d	0d3138c5-98f3-43d6-9211-8d7cbe72215f	Sweep kitchen floor	Sweep entire kitchen	Cleaning	8	500	completed	\N	2025-12-22 18:38:19.469+00	2025-12-22 18:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
56357b6e-147f-4faf-88bd-2aedcffef57e	f8679515-35c0-41e7-af69-fc0a6d6c012d	19cc2ec9-87fb-4c46-bb2a-8cf1bf1dbba7	Clean bathroom sink	Scrub sink and faucet	Cleaning	7	450	completed	\N	2025-12-05 02:37:19.469+00	2025-12-05 02:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
48aba01d-3e51-455b-95f3-44718965dc56	f8679515-35c0-41e7-af69-fc0a6d6c012d	3cc6fc22-1287-4cba-ae66-e090bf0b1add	Fold laundry	Fold one load of clean laundry	Laundry	10	600	completed	\N	2025-12-17 01:40:19.469+00	2025-12-17 01:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
614de6fe-c3b9-43fb-83f8-711d55c35372	f8679515-35c0-41e7-af69-fc0a6d6c012d	8ff807b7-5031-460b-8a37-f57732db5c64	Make beds	Make all beds in house	General	12	700	completed	\N	2025-12-14 21:42:19.469+00	2025-12-14 21:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
92ad4f61-652d-4c37-b7f9-1760e238fbf3	f8679515-35c0-41e7-af69-fc0a6d6c012d	e6d927f2-de10-4b7e-a2f0-3268cbb52e06	Vacuum one room	Vacuum living room or bedroom	Cleaning	10	600	completed	\N	2025-12-11 19:40:19.469+00	2025-12-11 19:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
b4770c7f-7482-4609-86e8-d19366033fb2	f8679515-35c0-41e7-af69-fc0a6d6c012d	f3dfc730-49b1-488c-8b6b-f5458d3e7000	Clean mirrors	Clean all mirrors in house	Cleaning	8	500	completed	\N	2025-12-12 02:38:19.469+00	2025-12-12 02:30:19.469+00	\N	\N	\N	\N	\N	\N	\N	2025-12-30 13:30:19.532315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
36c94e56-d853-408d-ae29-e41d58938f11	f8679515-35c0-41e7-af69-fc0a6d6c012d	3984b039-5155-4c0e-bb01-ca731b1618c5	Shovel snow	Clear driveway and walkways	Yard	45	2700	accepted	\N	\N	2025-12-29 21:25:55.537965+00	\N	\N	\N	\N	\N	\N	\N	2026-01-05 19:52:51.770032+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
47b33618-6bcf-48c0-9162-65efe6226a72	4be9f490-66e9-48ab-833d-9fade274504d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-05 20:12:18.135307+00	2026-01-01 21:16:38.417102+00	\N	\N	\N	2026-01-05 20:12:18.135307+00	\N	\N	\N	2026-01-05 20:12:18.135307+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
c9a9d8ad-6355-4bd9-b4aa-990da50c45c5	4be9f490-66e9-48ab-833d-9fade274504d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-05 20:12:51.308485+00	2026-01-01 21:15:58.334973+00	\N	\N	\N	2026-01-05 20:12:51.308485+00	\N	\N	\N	2026-01-05 20:12:51.308485+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
a49fe64a-4628-4ab3-a512-eac66d19e533	4be9f490-66e9-48ab-833d-9fade274504d	b0755ec3-d047-45f4-9686-bd508c0f4f76	\N	\N	Bedroom	20	500	completed	\N	2026-01-05 20:15:45.816539+00	2026-01-01 19:02:54.104505+00	\N	\N	\N	2026-01-05 20:15:45.816539+00	\N	\N	\N	2026-01-05 20:15:45.816539+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
4832c519-5d2e-43ee-94f0-ff2b95be4a8c	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 20:16:07.743358+00	2026-01-05 18:45:18.38234+00	\N	\N	\N	2026-01-05 20:16:07.743358+00	\N	\N	\N	2026-01-05 20:16:07.743358+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
24782769-1262-41dd-a80f-35ab4038fb04	4be9f490-66e9-48ab-833d-9fade274504d	277d8c16-ab5a-4739-a3b6-5c33e71b7ae5	\N	\N	Cleaning	15	400	completed	\N	2026-01-05 20:16:15.558028+00	2026-01-01 21:09:25.422855+00	\N	\N	\N	2026-01-05 20:16:15.558028+00	\N	\N	\N	2026-01-05 20:16:15.558028+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
72cd1f11-d985-4d2f-a3ce-85014a2bbf71	4be9f490-66e9-48ab-833d-9fade274504d	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	\N	\N	Pet Care	15	800	completed	\N	2026-01-03 18:20:09.468661+00	2026-01-01 22:48:44.828053+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 18:20:09.468661+00	\N	\N	\N	f	\N	\N	f	t	pending	\N	\N
58f4af4d-f7be-429c-b4b3-3c5b701ec616	4be9f490-66e9-48ab-833d-9fade274504d	77ba6d7f-c0e6-47eb-a94c-a54f327b2ba0	\N	\N	Cleaning	5	300	completed	\N	2026-01-05 20:37:32.304569+00	2026-01-01 19:45:31.789214+00	\N	\N	\N	2026-01-05 20:37:32.304569+00	\N	\N	\N	2026-01-05 20:37:32.304569+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
68098873-bc51-43fe-94ab-b12d11f9d106	4be9f490-66e9-48ab-833d-9fade274504d	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	\N	\N	Pet Care	15	800	completed	\N	2026-01-03 17:03:29.018447+00	2026-01-01 22:54:23.685146+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 17:03:29.018447+00	\N	\N	\N	f	\N	\N	f	t	pending	\N	\N
d8aa9635-06db-46c6-acb6-42513913dc44	4be9f490-66e9-48ab-833d-9fade274504d	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	\N	\N	Pet Care	15	800	completed	\N	2026-01-03 17:11:28.402549+00	2026-01-03 17:05:02.924115+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 17:11:28.402549+00	\N	\N	\N	f	\N	\N	f	t	pending	\N	\N
06a56052-e98d-4388-92a7-6a2031bae2aa	f8679515-35c0-41e7-af69-fc0a6d6c012d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-03 17:36:24.480961+00	2026-01-03 17:16:41.966155+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 17:36:24.480961+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
036ea1a4-d5b2-41ab-ba82-75c5b1ab2195	f8679515-35c0-41e7-af69-fc0a6d6c012d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-03 17:52:03.616954+00	2026-01-01 21:42:43.20768+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 17:52:03.616954+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
473c950e-a47f-4f99-b780-501ee2f8e92b	f8679515-35c0-41e7-af69-fc0a6d6c012d	b0755ec3-d047-45f4-9686-bd508c0f4f76	\N	\N	Bedroom	20	500	completed	\N	2026-01-03 17:59:29.905388+00	2026-01-01 21:29:55.096915+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 17:59:29.905388+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
cbabe0cf-1203-454a-b519-fd92a19a5e82	f8679515-35c0-41e7-af69-fc0a6d6c012d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-03 18:06:41.83838+00	2026-01-01 21:29:37.982238+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 18:06:41.83838+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
6d5e3898-4682-4ae0-be59-6bd784cd44a1	f8679515-35c0-41e7-af69-fc0a6d6c012d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-03 18:09:56.154364+00	2026-01-01 21:26:24.336686+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 18:09:56.154364+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
568f186c-7a27-4201-b4d8-a982562ca311	f8679515-35c0-41e7-af69-fc0a6d6c012d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-03 18:13:52.485187+00	2026-01-01 21:22:16.970804+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 18:13:52.485187+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
45683614-d9e2-4a31-8c38-57a877fca62f	4be9f490-66e9-48ab-833d-9fade274504d	b0755ec3-d047-45f4-9686-bd508c0f4f76	\N	\N	Bedroom	20	500	completed	\N	2026-01-03 18:25:53.080495+00	2026-01-01 21:21:41.127169+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 18:25:53.080495+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
54d5d6f1-e2b3-40ca-9ccd-4404649cc16b	f8679515-35c0-41e7-af69-fc0a6d6c012d	b0755ec3-d047-45f4-9686-bd508c0f4f76	\N	\N	Bedroom	20	500	in_progress	\N	\N	2026-01-03 20:03:45.962643+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 20:03:45.962643+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
0a4c03be-2800-424b-a184-8cfa9825b8ee	4be9f490-66e9-48ab-833d-9fade274504d	4704a6ab-f03c-4120-aa89-c68b7c096ef5	\N	\N	Organization	45	2700	completed	\N	2026-01-05 18:31:19.154986+00	2026-01-03 20:41:50.473596+00	\N	\N	\N	2026-01-05 18:31:19.154986+00	\N	\N	\N	2026-01-05 18:31:19.154986+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
80d9315d-da32-4ce6-a684-88ca92d1c66c	4be9f490-66e9-48ab-833d-9fade274504d	0acbabe7-759c-43c1-8a62-1513268f2b8a	\N	\N	Dishes	6	400	completed	\N	2026-01-05 18:40:12.884525+00	2026-01-05 00:38:20.831593+00	\N	\N	\N	2026-01-05 18:40:12.884525+00	\N	\N	\N	2026-01-05 18:40:12.884525+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
6efe5faa-4408-4f3a-944b-52fbffa4212e	f8679515-35c0-41e7-af69-fc0a6d6c012d	8805d3c6-d10c-4685-8c4b-2bfc9a7ed889	\N	\N	Laundry	20	500	in_progress	\N	\N	2026-01-03 21:33:04.441503+00	\N	\N	\N	\N	\N	\N	\N	2026-01-03 21:33:04.441503+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
ed84ee85-11c7-4eef-a386-e1fcb7946974	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	accepted	\N	\N	2026-01-05 19:46:31.978724+00	\N	\N	\N	\N	\N	\N	\N	2026-01-05 19:47:06.29757+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
1170e146-f1cd-4bdf-b347-f970293e9b88	f8679515-35c0-41e7-af69-fc0a6d6c012d	77cfcf4c-023d-4ce7-aa35-3b53f98ade91	Dust all rooms	Dust furniture in all rooms	Cleaning	20	1200	accepted	\N	\N	2025-12-29 21:24:36.454102+00	\N	\N	\N	\N	\N	\N	\N	2026-01-05 19:51:16.203209+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
11054b5a-2235-4846-b60c-cd4d2d173c44	f8679515-35c0-41e7-af69-fc0a6d6c012d	4704a6ab-f03c-4120-aa89-c68b7c096ef5	\N	\N	Organization	45	2700	completed	\N	2026-01-05 19:56:52.464315+00	2026-01-04 23:52:32.711964+00	\N	\N	\N	2026-01-05 19:56:52.464315+00	\N	\N	\N	2026-01-05 19:56:52.464315+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
9e61b2fe-8d77-418a-a48b-1341344a14a1	f8679515-35c0-41e7-af69-fc0a6d6c012d	4704a6ab-f03c-4120-aa89-c68b7c096ef5	\N	\N	Organization	45	2700	completed	\N	2026-01-05 18:17:48.078302+00	2026-01-03 20:04:53.794506+00	\N	\N	\N	2026-01-05 18:17:48.078302+00	\N	\N	\N	2026-01-05 18:17:48.078302+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
f715e231-e3a5-4748-a4e4-50c6278db6c6	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 21:27:17.825185+00	2026-01-05 21:26:20.975534+00	\N	\N	\N	2026-01-05 21:27:17.825185+00	\N	\N	\N	2026-01-05 21:27:17.825185+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
3f565f44-ca52-4313-a270-fc9761dcedcb	f8679515-35c0-41e7-af69-fc0a6d6c012d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 19:58:09.948535+00	2026-01-05 19:57:12.529496+00	\N	\N	\N	2026-01-05 19:58:09.948535+00	\N	\N	\N	2026-01-05 19:58:09.948535+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
d9bc779a-4f29-4c3e-826e-9066a5e368a6	f8679515-35c0-41e7-af69-fc0a6d6c012d	3cc6fc22-1287-4cba-ae66-e090bf0b1add	\N	\N	Laundry	10	600	completed	\N	2026-01-05 19:58:16.77075+00	2026-01-03 21:32:47.120744+00	\N	\N	\N	2026-01-05 19:58:16.77075+00	\N	\N	\N	2026-01-05 19:58:16.77075+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
c39292fe-0c72-4bb6-8f9e-fd7178450729	4be9f490-66e9-48ab-833d-9fade274504d	593c77e5-7364-460f-aee3-721379d40736	\N	\N	Yard	40	2400	completed	\N	2026-01-05 21:27:24.586451+00	2026-01-05 21:26:06.730075+00	\N	\N	\N	2026-01-05 21:27:24.586451+00	\N	\N	\N	2026-01-05 21:27:24.586451+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a	4be9f490-66e9-48ab-833d-9fade274504d	4ab85eab-7aa7-4211-845b-75aa22ba723a	\N	\N	Yard	45	2700	completed	\N	2026-01-05 21:27:32.068873+00	2026-01-05 21:25:59.787182+00	\N	\N	\N	2026-01-05 21:27:32.068873+00	\N	\N	\N	2026-01-05 21:27:32.068873+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
1529b7ba-9f8d-4f57-b024-ae9ec1ab1831	4be9f490-66e9-48ab-833d-9fade274504d	3984b039-5155-4c0e-bb01-ca731b1618c5	\N	\N	Yard	45	2700	completed	\N	2026-01-05 21:27:38.401346+00	2026-01-05 21:25:49.732472+00	\N	\N	\N	2026-01-05 21:27:38.401346+00	\N	\N	\N	2026-01-05 21:27:38.401346+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
4341b221-733d-4e04-9d40-3ae5b7cc6a7c	4be9f490-66e9-48ab-833d-9fade274504d	1f537dce-2a0f-45da-bbc2-2c0ea5bf2384	\N	\N	Cleaning	30	1800	completed	\N	2026-01-05 20:11:56.475178+00	2026-01-05 20:10:19.486862+00	\N	\N	\N	2026-01-05 20:11:56.475178+00	\N	\N	\N	2026-01-05 20:11:56.475178+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
ace4a538-f036-454d-be0d-35d25a695321	4be9f490-66e9-48ab-833d-9fade274504d	587acf8a-de48-469e-8214-3f5ae1e5ebb8	\N	\N	Cleaning	60	2500	completed	\N	2026-01-05 20:12:04.05977+00	2026-01-05 20:10:08.632491+00	\N	\N	\N	2026-01-05 20:12:04.05977+00	\N	\N	\N	2026-01-05 20:12:04.05977+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
801faac2-552c-42ab-a03e-32facb5c3a42	4be9f490-66e9-48ab-833d-9fade274504d	5e49f378-c5fe-4746-9211-6e2e32244b9a	\N	\N	Organization	60	2500	completed	\N	2026-01-05 20:12:11.405368+00	2026-01-05 20:09:58.615991+00	\N	\N	\N	2026-01-05 20:12:11.405368+00	\N	\N	\N	2026-01-05 20:12:11.405368+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
bdebcc52-9492-406b-ba58-8ad81733fe47	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 20:12:44.75102+00	2026-01-05 19:45:44.228927+00	\N	\N	\N	2026-01-05 20:12:44.75102+00	\N	\N	\N	2026-01-05 20:12:44.75102+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
8f3dad03-bfa7-4edf-ae69-699a2edd812d	4be9f490-66e9-48ab-833d-9fade274504d	587acf8a-de48-469e-8214-3f5ae1e5ebb8	\N	\N	Cleaning	60	2500	completed	\N	2026-01-05 20:15:18.571932+00	2026-01-05 20:13:41.642115+00	\N	\N	\N	2026-01-05 20:15:18.571932+00	\N	\N	\N	2026-01-05 20:15:18.571932+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
ffc7bb33-843d-463f-84bb-5d1a565fd40f	4be9f490-66e9-48ab-833d-9fade274504d	7aa4dbb6-a1f2-4edf-af14-40fa28aca312	\N	\N	Cleaning	35	2100	completed	\N	2026-01-05 20:15:24.752204+00	2026-01-05 20:13:32.178367+00	\N	\N	\N	2026-01-05 20:15:24.752204+00	\N	\N	\N	2026-01-05 20:15:24.752204+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
92a30c28-2bb5-44ff-852f-20047f062a9d	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 20:15:30.741554+00	2026-01-05 20:13:21.491777+00	\N	\N	\N	2026-01-05 20:15:30.741554+00	\N	\N	\N	2026-01-05 20:15:30.741554+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
80814540-f87a-4d61-aaab-5426f256ed0d	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 20:15:38.415564+00	2026-01-05 18:50:26.827558+00	\N	\N	\N	2026-01-05 20:15:38.415564+00	\N	\N	\N	2026-01-05 20:15:38.415564+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
e51755bb-a77a-4e5f-832e-b415e9bc469d	4be9f490-66e9-48ab-833d-9fade274504d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-05 20:15:54.553003+00	2026-01-01 21:14:10.653656+00	\N	\N	\N	2026-01-05 20:15:54.553003+00	\N	\N	\N	2026-01-05 20:15:54.553003+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
f800ac29-f772-4d8e-8877-9a25e804071c	4be9f490-66e9-48ab-833d-9fade274504d	a7639d2a-c35f-4f1d-91b6-1f075339d912	\N	\N	Product Assembly	60	2000	completed	\N	2026-01-05 20:16:01.084074+00	2026-01-05 20:13:12.54815+00	\N	\N	\N	2026-01-05 20:16:01.084074+00	\N	\N	\N	2026-01-05 20:16:01.084074+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
f1e432d5-0089-4088-9638-8fd66fb1d693	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 20:38:42.754025+00	2026-01-05 20:37:00.73901+00	\N	\N	\N	2026-01-05 20:38:42.754025+00	\N	\N	\N	2026-01-05 20:38:42.754025+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
5522d969-98a1-4488-bb93-579da829f623	4be9f490-66e9-48ab-833d-9fade274504d	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	\N	\N	Laundry	90	3000	completed	\N	2026-01-05 20:38:48.645277+00	2026-01-05 20:23:43.205095+00	\N	\N	\N	2026-01-05 20:38:48.645277+00	\N	\N	\N	2026-01-05 20:38:48.645277+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
13e4000e-bdc8-4a55-9d63-cdd449f7b314	4be9f490-66e9-48ab-833d-9fade274504d	583db4be-ee93-4d97-9d82-8db704f0401b	\N	\N	Kitchen	20	600	completed	\N	2026-01-05 20:38:55.561837+00	2026-01-05 20:17:04.460204+00	\N	\N	\N	2026-01-05 20:38:55.561837+00	\N	\N	\N	2026-01-05 20:38:55.561837+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
2aca1933-920e-4e43-b1fa-dd14957ff5ab	4be9f490-66e9-48ab-833d-9fade274504d	601f8fbe-2e51-4932-98f3-99b0aebab2a6	\N	\N	Bedroom	20	600	completed	\N	2026-01-05 20:39:02.073111+00	2026-01-05 20:16:51.309294+00	\N	\N	\N	2026-01-05 20:39:02.073111+00	\N	\N	\N	2026-01-05 20:39:02.073111+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d	4be9f490-66e9-48ab-833d-9fade274504d	cd5c98a5-b168-44ab-b385-1a624740340d	\N	\N	Outdoor	45	1500	completed	\N	2026-01-05 20:39:07.758506+00	2026-01-05 20:16:39.700194+00	\N	\N	\N	2026-01-05 20:39:07.758506+00	\N	\N	\N	2026-01-05 20:39:07.758506+00	\N	\N	\N	f	\N	\N	f	f	not_required	\N	\N
\.


--
-- Data for Name: earning_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.earning_events (id, user_id, actor_user_id, commitment_id, amount_cents, status, meta, created_at) FROM stdin;
\.


--
-- Data for Name: family_relationships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family_relationships (id, issuer_id, earner_id, relationship_type, permission_level, notes, created_at, updated_at) FROM stdin;
cc7ef0b5-48f9-4564-8c93-7f3f1f1df4a1	971b6c20-1c43-4d12-a2e6-cbf6053c4706	4be9f490-66e9-48ab-833d-9fade274504d	parent	full	\N	2025-12-28 23:26:36.624054+00	2025-12-28 23:26:36.624054+00
692cf828-9d14-4ed5-97e1-ad324af7de77	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f8679515-35c0-41e7-af69-fc0a6d6c012d	parent	full	\N	2025-12-28 23:26:36.624054+00	2025-12-28 23:26:36.624054+00
b103558e-8631-40a9-b1d8-c731db011d2e	658af463-a5e9-41af-a9d1-5bc771822e8e	4be9f490-66e9-48ab-833d-9fade274504d	parent	full	\N	2025-12-28 23:26:36.624054+00	2025-12-28 23:26:36.624054+00
d9f58c5e-daab-4199-a00e-80b6b2dfeb22	658af463-a5e9-41af-a9d1-5bc771822e8e	f8679515-35c0-41e7-af69-fc0a6d6c012d	parent	full	\N	2025-12-28 23:26:36.624054+00	2025-12-28 23:26:36.624054+00
df1ed3e2-7f8a-49d9-8f81-2590bbb198e3	fdc5d741-cec1-4259-9946-62bf1b25a52a	4be9f490-66e9-48ab-833d-9fade274504d	other	full	\N	2026-01-01 21:49:18.626449+00	2026-01-01 21:49:18.626449+00
\.


--
-- Data for Name: household_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.household_members (household_id, profile_id, role, is_admin, created_at) FROM stdin;
110aa5c1-8cd7-40c7-bcc0-b0c60d5e4293	9c3d717c-4709-4911-b77a-093dfb601cdb	provider	t	2025-12-26 19:32:25.383916+00
110aa5c1-8cd7-40c7-bcc0-b0c60d5e4293	4be9f490-66e9-48ab-833d-9fade274504d	earner	f	2025-12-26 19:32:25.383916+00
110aa5c1-8cd7-40c7-bcc0-b0c60d5e4293	f8679515-35c0-41e7-af69-fc0a6d6c012d	earner	f	2025-12-26 19:32:25.383916+00
\.


--
-- Data for Name: households; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.households (id, name, created_by, created_at, onboarding_completed, onboarding_completed_at) FROM stdin;
110aa5c1-8cd7-40c7-bcc0-b0c60d5e4293	Family	9c3d717c-4709-4911-b77a-093dfb601cdb	2025-12-26 19:32:25.383916+00	f	\N
\.


--
-- Data for Name: issuer_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issuer_approvals (id, commitment_id, issuer_id, approval_status, rejection_reason, approved_at, notes) FROM stdin;
5285faaa-2af0-4acb-bb79-d43776af729b	f9ce3e9e-7ad7-4cd1-a7a0-b94b6939a8cd	971b6c20-1c43-4d12-a2e6-cbf6053c4706	approved	\N	2025-12-30 13:22:39.285035+00	\N
\.


--
-- Data for Name: issuers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issuers (id, user_profile_id, name, email, phone, issuer_type, organization_name, organization_type, is_active, can_create_tasks, can_approve_commitments, can_rate_quality, notification_preferences, bio, profile_image_url, created_at, updated_at) FROM stdin;
d34733fc-2677-4714-92c8-242516f211bd	9c3d717c-4709-4911-b77a-093dfb601cdb	Parent	\N	\N	parent	\N	\N	t	t	t	t	{"sms": false, "email": true}	\N	\N	2025-12-28 22:59:34.295257+00	2025-12-28 22:59:34.295257+00
a44db8bb-1ae1-47e4-bd32-57325b3c20af	971b6c20-1c43-4d12-a2e6-cbf6053c4706	Brett	\N	\N	parent	\N	\N	t	t	t	t	{"sms": false, "email": true}	\N	\N	2025-12-28 23:26:36.518925+00	2025-12-28 23:26:36.518925+00
7353c9a8-670b-4c4b-824a-bcbf6092d531	658af463-a5e9-41af-a9d1-5bc771822e8e	Lauren	\N	\N	parent	\N	\N	t	t	t	t	{"sms": false, "email": true}	\N	\N	2025-12-28 23:26:36.518925+00	2025-12-28 23:26:36.518925+00
\.


--
-- Data for Name: meret_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meret_events (id, user_id, actor_user_id, commitment_id, merets_delta, reason, meta, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, created_at, recipient_id, notification_type, title, message, commitment_id, submission_id, task_template_id, read, archived, action_type, action_data, priority) FROM stdin;
9690887f-10b7-4111-bd3f-4e291219f36e	2026-01-01 21:09:25.422855+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Clean microwave"	24782769-1262-41dd-a80f-35ab4038fb04	\N	277d8c16-ab5a-4739-a3b6-5c33e71b7ae5	f	f	view_commitment	{"commitment_id": "24782769-1262-41dd-a80f-35ab4038fb04"}	normal
e9dadf4d-07f7-4828-81d2-2aed662d8fc7	2026-01-01 21:14:10.653656+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	e51755bb-a77a-4e5f-832e-b415e9bc469d	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "e51755bb-a77a-4e5f-832e-b415e9bc469d"}	normal
75f6cf0e-9978-4dab-960b-408338775c4a	2026-01-01 21:15:58.334973+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	c9a9d8ad-6355-4bd9-b4aa-990da50c45c5	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "c9a9d8ad-6355-4bd9-b4aa-990da50c45c5"}	normal
d9ffde57-0e0a-4af4-867f-dcc74d13ce71	2026-01-01 21:19:59.640838+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	528b95a5-c4de-41fe-ad2c-46f75c5cb694	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "528b95a5-c4de-41fe-ad2c-46f75c5cb694"}	normal
59e2b5e3-982a-4568-8fcf-70ffb7ce92a1	2026-01-01 21:21:41.127169+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Tidy bedroom"	45683614-d9e2-4a31-8c38-57a877fca62f	\N	b0755ec3-d047-45f4-9686-bd508c0f4f76	f	f	view_commitment	{"commitment_id": "45683614-d9e2-4a31-8c38-57a877fca62f"}	normal
d0eea28f-0b5a-49ab-86f9-d8579b29dbeb	2026-01-01 21:22:16.970804+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	568f186c-7a27-4201-b4d8-a982562ca311	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "568f186c-7a27-4201-b4d8-a982562ca311"}	normal
23c50447-5946-4d2c-8c4e-d2764ee691da	2026-01-01 21:26:24.336686+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	6d5e3898-4682-4ae0-be59-6bd784cd44a1	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "6d5e3898-4682-4ae0-be59-6bd784cd44a1"}	normal
8fb07a71-c047-4d7f-bc67-f7b0acb790ad	2026-01-01 21:29:37.982238+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	cbabe0cf-1203-454a-b519-fd92a19a5e82	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "cbabe0cf-1203-454a-b519-fd92a19a5e82"}	normal
b154cb29-7f58-4c99-9219-8c65d29cf4be	2026-01-01 21:29:55.096915+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Tidy bedroom"	473c950e-a47f-4f99-b780-501ee2f8e92b	\N	b0755ec3-d047-45f4-9686-bd508c0f4f76	f	f	view_commitment	{"commitment_id": "473c950e-a47f-4f99-b780-501ee2f8e92b"}	normal
c4f93064-530b-455b-b120-5ac1b256ee8a	2026-01-01 22:48:44.828053+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_committed_external_task	🔔 Approval Needed	Aveya wants to commit to "Play fetch with Bijou" from Bijou. Your approval is required.	72cd1f11-d985-4d2f-a3ce-85014a2bbf71	\N	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	f	f	approve_commitment	{"task_title": "Play fetch with Bijou", "commitment_id": "72cd1f11-d985-4d2f-a3ce-85014a2bbf71"}	urgent
9ebbbd83-9816-428a-a734-27f6990346c6	2026-01-01 22:48:44.828053+00	fdc5d741-cec1-4259-9946-62bf1b25a52a	commitment_made	👤 New Commitment	Aveya committed to "Play fetch with Bijou"	72cd1f11-d985-4d2f-a3ce-85014a2bbf71	\N	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	f	f	view_commitment	{"commitment_id": "72cd1f11-d985-4d2f-a3ce-85014a2bbf71"}	normal
6893bf4e-f91c-4745-91b3-88781a5bf217	2026-01-01 22:54:23.685146+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_committed_external_task	🔔 Approval Needed	Aveya wants to commit to "Play fetch with Bijou" from Bijou. Your approval is required.	68098873-bc51-43fe-94ab-b12d11f9d106	\N	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	f	f	approve_commitment	{"task_title": "Play fetch with Bijou", "commitment_id": "68098873-bc51-43fe-94ab-b12d11f9d106"}	urgent
6e49819e-63aa-4ed6-8ef2-a3195b65cba6	2026-01-01 22:54:23.685146+00	fdc5d741-cec1-4259-9946-62bf1b25a52a	commitment_made	👤 New Commitment	Aveya committed to "Play fetch with Bijou"	68098873-bc51-43fe-94ab-b12d11f9d106	\N	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	f	f	view_commitment	{"commitment_id": "68098873-bc51-43fe-94ab-b12d11f9d106"}	normal
3e069014-9cc4-4fcf-ad34-a00e414a5f08	2026-01-03 13:21:19.255747+00	fdc5d741-cec1-4259-9946-62bf1b25a52a	work_submitted	📸 Work Submitted	Aveya submitted "Play fetch with Bijou" for review	68098873-bc51-43fe-94ab-b12d11f9d106	d0e9b053-cc7f-4e5c-a57b-58d7a6ef957b	\N	f	f	view_submission	{"commitment_id": "68098873-bc51-43fe-94ab-b12d11f9d106", "submission_id": "d0e9b053-cc7f-4e5c-a57b-58d7a6ef957b"}	high
a4c4f622-1ee7-43cb-b35a-a520ae9ae90b	2026-01-03 13:21:19.255747+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Play fetch with Bijou" for approval	68098873-bc51-43fe-94ab-b12d11f9d106	d0e9b053-cc7f-4e5c-a57b-58d7a6ef957b	\N	f	f	view_submission	{"commitment_id": "68098873-bc51-43fe-94ab-b12d11f9d106", "submission_id": "d0e9b053-cc7f-4e5c-a57b-58d7a6ef957b"}	high
eaf6669a-2c1b-4af2-b67c-c10478fd8670	2026-01-03 17:05:02.924115+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_committed_external_task	🔔 Approval Needed	Aveya wants to commit to "Play fetch with Bijou" from Bijou. Your approval is required.	d8aa9635-06db-46c6-acb6-42513913dc44	\N	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	f	f	approve_commitment	{"task_title": "Play fetch with Bijou", "commitment_id": "d8aa9635-06db-46c6-acb6-42513913dc44"}	urgent
aaf163bd-608e-4514-a678-a309ad5c57a8	2026-01-03 17:05:02.924115+00	fdc5d741-cec1-4259-9946-62bf1b25a52a	commitment_made	👤 New Commitment	Aveya committed to "Play fetch with Bijou"	d8aa9635-06db-46c6-acb6-42513913dc44	\N	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	f	f	view_commitment	{"commitment_id": "d8aa9635-06db-46c6-acb6-42513913dc44"}	normal
c5db2d46-2daf-4c8e-9d90-95b679d1d847	2026-01-03 17:11:11.050064+00	fdc5d741-cec1-4259-9946-62bf1b25a52a	work_submitted	📸 Work Submitted	Aveya submitted "Play fetch with Bijou" for review	d8aa9635-06db-46c6-acb6-42513913dc44	c357e47e-2f1b-4c2d-97c8-947b534b5d1f	\N	f	f	view_submission	{"commitment_id": "d8aa9635-06db-46c6-acb6-42513913dc44", "submission_id": "c357e47e-2f1b-4c2d-97c8-947b534b5d1f"}	high
2f95fb0e-9cc6-4d2f-947a-505160c83e37	2026-01-03 17:11:11.050064+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Play fetch with Bijou" for approval	d8aa9635-06db-46c6-acb6-42513913dc44	c357e47e-2f1b-4c2d-97c8-947b534b5d1f	\N	f	f	view_submission	{"commitment_id": "d8aa9635-06db-46c6-acb6-42513913dc44", "submission_id": "c357e47e-2f1b-4c2d-97c8-947b534b5d1f"}	high
72a8a7d0-04ba-488d-bd03-cf95bdd358d2	2026-01-03 17:16:41.966155+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	06a56052-e98d-4388-92a7-6a2031bae2aa	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "06a56052-e98d-4388-92a7-6a2031bae2aa"}	normal
b9504831-32c0-47ed-b72b-db819e711bde	2026-01-03 17:35:56.582208+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Change bed sheets" for approval	06a56052-e98d-4388-92a7-6a2031bae2aa	556570c1-723f-4b30-b769-624d75d07851	\N	f	f	view_submission	{"commitment_id": "06a56052-e98d-4388-92a7-6a2031bae2aa", "submission_id": "556570c1-723f-4b30-b769-624d75d07851"}	high
57c0ea20-d8eb-4a58-ada9-db4b55a0fc40	2026-01-03 17:51:51.914456+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Change bed sheets" for approval	036ea1a4-d5b2-41ab-ba82-75c5b1ab2195	56b66e17-b0de-4c52-aa86-cbb807d24fcf	\N	f	f	view_submission	{"commitment_id": "036ea1a4-d5b2-41ab-ba82-75c5b1ab2195", "submission_id": "56b66e17-b0de-4c52-aa86-cbb807d24fcf"}	high
06e12944-1a99-4d0d-a3a3-dc14c8c8b1b0	2026-01-01 21:16:38.417102+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	47b33618-6bcf-48c0-9162-65efe6226a72	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	t	f	view_commitment	{"commitment_id": "47b33618-6bcf-48c0-9162-65efe6226a72"}	normal
621436c1-407b-467a-988b-b90a0dac2296	2026-01-03 17:57:01.26581+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Tidy bedroom" for approval	473c950e-a47f-4f99-b780-501ee2f8e92b	893b7b88-cbec-4ec5-a643-39f6319d82f2	\N	f	f	view_submission	{"commitment_id": "473c950e-a47f-4f99-b780-501ee2f8e92b", "submission_id": "893b7b88-cbec-4ec5-a643-39f6319d82f2"}	high
bc2bc0e1-ab36-4b82-a36f-7d25132ae1ac	2026-01-03 18:25:43.940287+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Tidy bedroom" for approval	45683614-d9e2-4a31-8c38-57a877fca62f	894011ce-2b97-4870-a9f0-e5d3c8d2a4f2	\N	f	f	view_submission	{"commitment_id": "45683614-d9e2-4a31-8c38-57a877fca62f", "submission_id": "894011ce-2b97-4870-a9f0-e5d3c8d2a4f2"}	high
2c394b6b-47b4-43c8-ab71-bb7fa04d01ba	2026-01-03 18:06:20.341779+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Change bed sheets" for approval	cbabe0cf-1203-454a-b519-fd92a19a5e82	98800891-b27c-454e-9671-0b286c025065	\N	f	f	view_submission	{"commitment_id": "cbabe0cf-1203-454a-b519-fd92a19a5e82", "submission_id": "98800891-b27c-454e-9671-0b286c025065"}	high
8784a9d8-aa25-43b7-ad71-fb93678c736a	2026-01-03 18:06:41.83838+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	✅ Task Approved!	Great job on "Change bed sheets"! Lauren approved your work. You earned $6.00 and 10 merets. Feedback: "Awesome"	cbabe0cf-1203-454a-b519-fd92a19a5e82	98800891-b27c-454e-9671-0b286c025065	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_task	{"commitment_id": "cbabe0cf-1203-454a-b519-fd92a19a5e82", "merets_earned": 10, "submission_id": "98800891-b27c-454e-9671-0b286c025065", "quality_rating": 5, "reviewer_notes": "Awesome", "bonus_tip_cents": 0, "money_earned_cents": 600}	high
a07d680e-5134-4e3f-a5f7-6c0c8b481ab1	2026-01-01 21:42:43.20768+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	036ea1a4-d5b2-41ab-ba82-75c5b1ab2195	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	t	f	view_commitment	{"commitment_id": "036ea1a4-d5b2-41ab-ba82-75c5b1ab2195"}	normal
5a27d321-9afe-4bb8-accc-2df4cc762e4f	2026-01-03 18:09:36.827382+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Change bed sheets" for approval	6d5e3898-4682-4ae0-be59-6bd784cd44a1	f029e38a-3013-4aff-a660-d49144b035d7	\N	f	f	view_submission	{"commitment_id": "6d5e3898-4682-4ae0-be59-6bd784cd44a1", "submission_id": "f029e38a-3013-4aff-a660-d49144b035d7"}	high
e70c2d61-3797-4af0-b0cd-50c62900952f	2026-01-03 18:09:56.154364+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	✅ Task Approved!	Great job on "Change bed sheets"! Lauren approved your work. You earned $6.00 and 10 merets. Feedback: "Giggidy good"	6d5e3898-4682-4ae0-be59-6bd784cd44a1	f029e38a-3013-4aff-a660-d49144b035d7	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_task	{"commitment_id": "6d5e3898-4682-4ae0-be59-6bd784cd44a1", "merets_earned": 10, "submission_id": "f029e38a-3013-4aff-a660-d49144b035d7", "quality_rating": 5, "reviewer_notes": "Giggidy good", "bonus_tip_cents": 0, "money_earned_cents": 600}	high
3ec7acfc-de9c-4bcf-9c59-62f5573b1332	2026-01-03 18:13:35.963664+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Change bed sheets" for approval	568f186c-7a27-4201-b4d8-a982562ca311	04ce6fb1-4094-4cb1-8069-2367eca4e233	\N	f	f	view_submission	{"commitment_id": "568f186c-7a27-4201-b4d8-a982562ca311", "submission_id": "04ce6fb1-4094-4cb1-8069-2367eca4e233"}	high
c0a97d87-ac42-437a-8f84-99103f6dc4b7	2026-01-03 18:13:52.485187+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	✅ Task Approved!	Great job on "Change bed sheets"! Brett approved your work. You earned $6.00 and 10 merets. Feedback: "Noice"	568f186c-7a27-4201-b4d8-a982562ca311	04ce6fb1-4094-4cb1-8069-2367eca4e233	601f8fbe-2e51-4932-98f3-99b0aebab2a6	t	f	view_task	{"commitment_id": "568f186c-7a27-4201-b4d8-a982562ca311", "merets_earned": 10, "submission_id": "04ce6fb1-4094-4cb1-8069-2367eca4e233", "quality_rating": 5, "reviewer_notes": "Noice", "bonus_tip_cents": 0, "money_earned_cents": 600}	high
4e08dbf6-3c47-4008-9b8d-1028e1551d1d	2026-01-03 17:59:29.905388+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	✅ Task Approved!	Great job on "Tidy bedroom"! Lauren approved your work. You earned $5.0000000000000000 and 0 merets. Feedback: "Great job"	473c950e-a47f-4f99-b780-501ee2f8e92b	893b7b88-cbec-4ec5-a643-39f6319d82f2	b0755ec3-d047-45f4-9686-bd508c0f4f76	t	f	view_task	{"commitment_id": "473c950e-a47f-4f99-b780-501ee2f8e92b", "merets_earned": 0, "submission_id": "893b7b88-cbec-4ec5-a643-39f6319d82f2", "quality_rating": 5, "reviewer_notes": "Great job", "bonus_tip_cents": 0, "money_earned_cents": 500}	high
ffcd5497-28f8-442f-be57-143a9a253e8f	2026-01-03 18:19:54.792754+00	fdc5d741-cec1-4259-9946-62bf1b25a52a	work_submitted	📸 Work Submitted	Aveya submitted "Play fetch with Bijou" for review	72cd1f11-d985-4d2f-a3ce-85014a2bbf71	fa91a18c-3a6d-4a16-96b9-1e418dc05e5b	\N	f	f	view_submission	{"commitment_id": "72cd1f11-d985-4d2f-a3ce-85014a2bbf71", "submission_id": "fa91a18c-3a6d-4a16-96b9-1e418dc05e5b"}	high
2a3ca401-35a6-4428-aed2-c138c990e2e2	2026-01-03 18:19:54.792754+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Play fetch with Bijou" for approval	72cd1f11-d985-4d2f-a3ce-85014a2bbf71	fa91a18c-3a6d-4a16-96b9-1e418dc05e5b	\N	f	f	view_submission	{"commitment_id": "72cd1f11-d985-4d2f-a3ce-85014a2bbf71", "submission_id": "fa91a18c-3a6d-4a16-96b9-1e418dc05e5b"}	high
3f526421-865a-4dd4-85f5-e2b418c7a155	2026-01-03 18:20:09.468661+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	✅ Task Approved!	Great job on "Play fetch with Bijou"! Brett approved your work. You earned $8.00 and 0.00 merets. Feedback: "Great jorb"	72cd1f11-d985-4d2f-a3ce-85014a2bbf71	fa91a18c-3a6d-4a16-96b9-1e418dc05e5b	4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	f	f	view_task	{"base_merets": 0.00, "commitment_id": "72cd1f11-d985-4d2f-a3ce-85014a2bbf71", "merets_earned": 0.00, "submission_id": "fa91a18c-3a6d-4a16-96b9-1e418dc05e5b", "quality_rating": 5, "reviewer_notes": "Great jorb", "bonus_tip_cents": 0, "money_earned_cents": 800, "quality_multiplier": 1.20}	high
b029ffb2-701b-4a10-9abd-25c49d23e1fc	2026-01-03 18:25:53.080495+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	✅ Task Approved!	Great job on "Tidy bedroom"! Lauren approved your work. You earned $5.00 and 0.40 merets.	45683614-d9e2-4a31-8c38-57a877fca62f	894011ce-2b97-4870-a9f0-e5d3c8d2a4f2	b0755ec3-d047-45f4-9686-bd508c0f4f76	f	f	view_task	{"commitment_id": "45683614-d9e2-4a31-8c38-57a877fca62f", "merets_earned": 0.40, "submission_id": "894011ce-2b97-4870-a9f0-e5d3c8d2a4f2", "effort_minutes": 20, "quality_rating": 5, "reviewer_notes": null, "bonus_tip_cents": 0, "money_earned_cents": 500, "quality_multiplier": 1.20}	high
834308ae-680d-4a73-ad52-2a4afab09b4f	2026-01-03 20:03:45.962643+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Tidy bedroom"	54d5d6f1-e2b3-40ca-9ccd-4404649cc16b	\N	b0755ec3-d047-45f4-9686-bd508c0f4f76	f	f	view_commitment	{"commitment_id": "54d5d6f1-e2b3-40ca-9ccd-4404649cc16b"}	normal
84030bbd-4937-4186-b903-80459055d93f	2026-01-03 20:04:53.794506+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Clean garage"	9e61b2fe-8d77-418a-a48b-1341344a14a1	\N	4704a6ab-f03c-4120-aa89-c68b7c096ef5	f	f	view_commitment	{"commitment_id": "9e61b2fe-8d77-418a-a48b-1341344a14a1"}	normal
f52993b8-8c0b-4675-8f09-80b1cf07315a	2026-01-03 20:04:53.794506+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Onyx committed to "Clean garage"	9e61b2fe-8d77-418a-a48b-1341344a14a1	\N	4704a6ab-f03c-4120-aa89-c68b7c096ef5	f	f	view_commitment	{"commitment_id": "9e61b2fe-8d77-418a-a48b-1341344a14a1"}	normal
bbbdaae1-e70e-41b5-9cf1-17d4622ba022	2026-01-03 20:11:14.735264+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Onyx submitted "Clean garage" for review	9e61b2fe-8d77-418a-a48b-1341344a14a1	68010a63-3092-4e81-8bcf-bc60927dc34f	\N	f	f	view_submission	{"commitment_id": "9e61b2fe-8d77-418a-a48b-1341344a14a1", "submission_id": "68010a63-3092-4e81-8bcf-bc60927dc34f"}	high
6535765d-d174-4a44-a357-f33dca61c6c8	2026-01-03 20:11:14.735264+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Clean garage" for approval	9e61b2fe-8d77-418a-a48b-1341344a14a1	68010a63-3092-4e81-8bcf-bc60927dc34f	\N	f	f	view_submission	{"commitment_id": "9e61b2fe-8d77-418a-a48b-1341344a14a1", "submission_id": "68010a63-3092-4e81-8bcf-bc60927dc34f"}	high
39d5618b-46d8-43eb-858c-5d65ae6e4ec3	2026-01-03 20:30:31.134276+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Change bed sheets" for approval	528b95a5-c4de-41fe-ad2c-46f75c5cb694	a9be3585-d599-43b7-b084-e390e111ebb8	\N	f	f	view_submission	{"commitment_id": "528b95a5-c4de-41fe-ad2c-46f75c5cb694", "submission_id": "a9be3585-d599-43b7-b084-e390e111ebb8"}	high
4e0dad65-269c-4f82-a6de-824cd072758c	2026-01-03 20:41:50.473596+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Clean garage"	0a4c03be-2800-424b-a184-8cfa9825b8ee	\N	4704a6ab-f03c-4120-aa89-c68b7c096ef5	f	f	view_commitment	{"commitment_id": "0a4c03be-2800-424b-a184-8cfa9825b8ee"}	normal
1734bef5-22bd-4f02-91df-83116e5c2be0	2026-01-03 20:41:50.473596+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Clean garage"	0a4c03be-2800-424b-a184-8cfa9825b8ee	\N	4704a6ab-f03c-4120-aa89-c68b7c096ef5	f	f	view_commitment	{"commitment_id": "0a4c03be-2800-424b-a184-8cfa9825b8ee"}	normal
0f97cee7-4b90-407f-a297-463979672415	2026-01-03 20:48:28.532332+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Clean garage" for review	0a4c03be-2800-424b-a184-8cfa9825b8ee	97768193-051c-40c4-85bd-cca1f484bf68	\N	f	f	view_submission	{"commitment_id": "0a4c03be-2800-424b-a184-8cfa9825b8ee", "submission_id": "97768193-051c-40c4-85bd-cca1f484bf68"}	high
dd0974e4-af22-4d0c-a2cc-dbd54e94d24f	2026-01-03 20:48:28.532332+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Clean garage" for approval	0a4c03be-2800-424b-a184-8cfa9825b8ee	97768193-051c-40c4-85bd-cca1f484bf68	\N	t	f	view_submission	{"commitment_id": "0a4c03be-2800-424b-a184-8cfa9825b8ee", "submission_id": "97768193-051c-40c4-85bd-cca1f484bf68"}	high
8da82e27-e633-4c49-ae6b-d8be31afff1b	2026-01-03 21:32:47.120744+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Fold laundry"	d9bc779a-4f29-4c3e-826e-9066a5e368a6	\N	3cc6fc22-1287-4cba-ae66-e090bf0b1add	f	f	view_commitment	{"commitment_id": "d9bc779a-4f29-4c3e-826e-9066a5e368a6"}	normal
134bdbeb-b0cd-4f8a-97a6-e7f186a833ba	2026-01-03 21:32:47.120744+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Onyx committed to "Fold laundry"	d9bc779a-4f29-4c3e-826e-9066a5e368a6	\N	3cc6fc22-1287-4cba-ae66-e090bf0b1add	f	f	view_commitment	{"commitment_id": "d9bc779a-4f29-4c3e-826e-9066a5e368a6"}	normal
144fab87-f829-45ef-9e96-c0744b3afc38	2026-01-03 21:33:04.441503+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Fold laundry"	6efe5faa-4408-4f3a-944b-52fbffa4212e	\N	8805d3c6-d10c-4685-8c4b-2bfc9a7ed889	f	f	view_commitment	{"commitment_id": "6efe5faa-4408-4f3a-944b-52fbffa4212e"}	normal
0418154d-51f8-4afd-b65b-0c23bd286c0f	2026-01-04 23:52:32.711964+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Clean garage"	11054b5a-2235-4846-b60c-cd4d2d173c44	\N	4704a6ab-f03c-4120-aa89-c68b7c096ef5	f	f	view_commitment	{"commitment_id": "11054b5a-2235-4846-b60c-cd4d2d173c44"}	normal
0c6506e7-1001-4877-8f64-b8a0c671db9b	2026-01-04 23:52:32.711964+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Onyx committed to "Clean garage"	11054b5a-2235-4846-b60c-cd4d2d173c44	\N	4704a6ab-f03c-4120-aa89-c68b7c096ef5	f	f	view_commitment	{"commitment_id": "11054b5a-2235-4846-b60c-cd4d2d173c44"}	normal
8ff150f0-dda5-4905-905f-0ab0edfabf4f	2026-01-05 00:38:20.831593+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Load dishwasher"	80d9315d-da32-4ce6-a684-88ca92d1c66c	\N	0acbabe7-759c-43c1-8a62-1513268f2b8a	f	f	view_commitment	{"commitment_id": "80d9315d-da32-4ce6-a684-88ca92d1c66c"}	normal
77539067-70d0-4ab2-bd41-f3914b60a313	2026-01-05 00:38:20.831593+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Load dishwasher"	80d9315d-da32-4ce6-a684-88ca92d1c66c	\N	0acbabe7-759c-43c1-8a62-1513268f2b8a	f	f	view_commitment	{"commitment_id": "80d9315d-da32-4ce6-a684-88ca92d1c66c"}	normal
fb0922f3-09cb-4498-abf1-999f24f26e5a	2026-01-05 00:38:49.057474+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Load dishwasher" for review	80d9315d-da32-4ce6-a684-88ca92d1c66c	1c2494ca-e1a1-4115-88f1-f602eb105e1e	\N	f	f	view_submission	{"commitment_id": "80d9315d-da32-4ce6-a684-88ca92d1c66c", "submission_id": "1c2494ca-e1a1-4115-88f1-f602eb105e1e"}	high
1f49c18e-9450-4629-bf27-ddcab55b4afa	2026-01-05 00:38:49.057474+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Load dishwasher" for approval	80d9315d-da32-4ce6-a684-88ca92d1c66c	1c2494ca-e1a1-4115-88f1-f602eb105e1e	\N	f	f	view_submission	{"commitment_id": "80d9315d-da32-4ce6-a684-88ca92d1c66c", "submission_id": "1c2494ca-e1a1-4115-88f1-f602eb105e1e"}	high
ab3be683-8e3a-43c3-b34f-c5e0e707d4bb	2026-01-05 18:17:48.078302+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.9 Merets and $27.00	9e61b2fe-8d77-418a-a48b-1341344a14a1	68010a63-3092-4e81-8bcf-bc60927dc34f	\N	f	f	view_task	{"commitment_id": "9e61b2fe-8d77-418a-a48b-1341344a14a1", "merets_earned": 0.9000000000000000000000, "submission_id": "68010a63-3092-4e81-8bcf-bc60927dc34f", "quality_rating": 5, "money_earned_cents": 2700}	normal
4fc97b51-dcf5-4a10-a58a-66de14177e9a	2026-01-05 18:26:31.842734+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.4 Merets and $6.00	528b95a5-c4de-41fe-ad2c-46f75c5cb694	a9be3585-d599-43b7-b084-e390e111ebb8	\N	f	f	view_task	{"commitment_id": "528b95a5-c4de-41fe-ad2c-46f75c5cb694", "merets_earned": 0.3999999999999999999960, "submission_id": "a9be3585-d599-43b7-b084-e390e111ebb8", "quality_rating": 5, "money_earned_cents": 600}	normal
c70bf0ef-40c9-430f-a9f4-2b1c74f07408	2026-01-05 18:31:19.154986+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.9 Merets and $27.00	0a4c03be-2800-424b-a184-8cfa9825b8ee	97768193-051c-40c4-85bd-cca1f484bf68	\N	f	f	view_task	{"commitment_id": "0a4c03be-2800-424b-a184-8cfa9825b8ee", "merets_earned": 0.9000000000000000000000, "submission_id": "97768193-051c-40c4-85bd-cca1f484bf68", "quality_rating": 5, "money_earned_cents": 2700}	normal
f47e0ec5-1ed1-4e35-90f3-543315bb30b3	2026-01-05 18:40:12.884525+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.1 Merets and $4.00	80d9315d-da32-4ce6-a684-88ca92d1c66c	1c2494ca-e1a1-4115-88f1-f602eb105e1e	\N	f	f	view_task	{"commitment_id": "80d9315d-da32-4ce6-a684-88ca92d1c66c", "merets_earned": 0.1200000000000000000000, "submission_id": "1c2494ca-e1a1-4115-88f1-f602eb105e1e", "quality_rating": 5, "money_earned_cents": 400}	normal
61016840-28bc-4365-a8b8-6383279319d3	2026-01-05 18:45:18.38234+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	4832c519-5d2e-43ee-94f0-ff2b95be4a8c	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "4832c519-5d2e-43ee-94f0-ff2b95be4a8c"}	normal
fed38e97-1932-4be1-825d-25178d20e4df	2026-01-05 18:45:18.38234+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	4832c519-5d2e-43ee-94f0-ff2b95be4a8c	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "4832c519-5d2e-43ee-94f0-ff2b95be4a8c"}	normal
17aa1908-cf42-43f6-b196-86e1cf2d7e3a	2026-01-05 18:50:26.827558+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	80814540-f87a-4d61-aaab-5426f256ed0d	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "80814540-f87a-4d61-aaab-5426f256ed0d"}	normal
48374474-d605-416f-aac7-5c21adda1c12	2026-01-05 18:50:26.827558+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	80814540-f87a-4d61-aaab-5426f256ed0d	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "80814540-f87a-4d61-aaab-5426f256ed0d"}	normal
fb34e478-3f7d-4386-84d2-168a2e6f75ab	2026-01-05 19:45:44.228927+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	bdebcc52-9492-406b-ba58-8ad81733fe47	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "bdebcc52-9492-406b-ba58-8ad81733fe47"}	normal
e5b80a0a-ea2f-4b08-9b3d-4c4d9d272b1a	2026-01-05 19:45:44.228927+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	bdebcc52-9492-406b-ba58-8ad81733fe47	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "bdebcc52-9492-406b-ba58-8ad81733fe47"}	normal
3e825e35-3c19-4595-b867-fdecbe8a83c2	2026-01-05 19:46:31.978724+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	ed84ee85-11c7-4eef-a386-e1fcb7946974	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "ed84ee85-11c7-4eef-a386-e1fcb7946974"}	normal
50019cd6-eda8-4130-9e6f-9011b9174425	2026-01-05 19:46:31.978724+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	ed84ee85-11c7-4eef-a386-e1fcb7946974	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "ed84ee85-11c7-4eef-a386-e1fcb7946974"}	normal
f91a7e8e-7f47-4e6d-bb0e-92f9e2a90d90	2026-01-05 19:56:29.507594+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Onyx submitted "Clean garage" for review	11054b5a-2235-4846-b60c-cd4d2d173c44	96d85a1d-bfca-4ae2-8f9d-6d081f371fb1	\N	f	f	view_submission	{"commitment_id": "11054b5a-2235-4846-b60c-cd4d2d173c44", "submission_id": "96d85a1d-bfca-4ae2-8f9d-6d081f371fb1"}	high
00c6ad97-4d61-461f-bddb-8b6b9110bf14	2026-01-05 19:56:29.507594+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Clean garage" for approval	11054b5a-2235-4846-b60c-cd4d2d173c44	96d85a1d-bfca-4ae2-8f9d-6d081f371fb1	\N	f	f	view_submission	{"commitment_id": "11054b5a-2235-4846-b60c-cd4d2d173c44", "submission_id": "96d85a1d-bfca-4ae2-8f9d-6d081f371fb1"}	high
31bfd967-5c6f-4a24-85d2-6e0b456ac110	2026-01-05 19:56:52.464315+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.9 Merets and $27.00	11054b5a-2235-4846-b60c-cd4d2d173c44	96d85a1d-bfca-4ae2-8f9d-6d081f371fb1	\N	f	f	view_task	{"commitment_id": "11054b5a-2235-4846-b60c-cd4d2d173c44", "merets_earned": 0.9000000000000000000000, "submission_id": "96d85a1d-bfca-4ae2-8f9d-6d081f371fb1", "quality_rating": 5, "money_earned_cents": 2700}	normal
2ac74a1a-7b7d-4a9b-91f6-c9344dda576e	2026-01-05 19:57:12.529496+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	3f565f44-ca52-4313-a270-fc9761dcedcb	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "3f565f44-ca52-4313-a270-fc9761dcedcb"}	normal
39b127d9-7ffa-4386-891b-ff925b9fac1e	2026-01-05 19:57:12.529496+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Onyx committed to "Do laundry start to finish"	3f565f44-ca52-4313-a270-fc9761dcedcb	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "3f565f44-ca52-4313-a270-fc9761dcedcb"}	normal
443c0647-1b72-4749-a8bc-a325f17ac22c	2026-01-05 19:57:42.915421+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Onyx submitted "Do laundry start to finish" for review	3f565f44-ca52-4313-a270-fc9761dcedcb	051683f3-f314-421e-8f4d-1869700f8619	\N	f	f	view_submission	{"commitment_id": "3f565f44-ca52-4313-a270-fc9761dcedcb", "submission_id": "051683f3-f314-421e-8f4d-1869700f8619"}	high
995be9c7-4995-4dfd-bf04-ab25671aecff	2026-01-05 19:57:42.915421+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Do laundry start to finish" for approval	3f565f44-ca52-4313-a270-fc9761dcedcb	051683f3-f314-421e-8f4d-1869700f8619	\N	f	f	view_submission	{"commitment_id": "3f565f44-ca52-4313-a270-fc9761dcedcb", "submission_id": "051683f3-f314-421e-8f4d-1869700f8619"}	high
bc3f9f0e-b714-4b31-8ea4-bc1f61b4ec96	2026-01-05 19:57:52.723501+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Onyx submitted "Fold laundry" for review	d9bc779a-4f29-4c3e-826e-9066a5e368a6	41d81f4f-977e-44d0-bc3a-cafc60332e01	\N	f	f	view_submission	{"commitment_id": "d9bc779a-4f29-4c3e-826e-9066a5e368a6", "submission_id": "41d81f4f-977e-44d0-bc3a-cafc60332e01"}	high
9fcdc65f-62b7-4bc6-b522-43e74e6eb86a	2026-01-05 19:57:52.723501+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Onyx submitted "Fold laundry" for approval	d9bc779a-4f29-4c3e-826e-9066a5e368a6	41d81f4f-977e-44d0-bc3a-cafc60332e01	\N	f	f	view_submission	{"commitment_id": "d9bc779a-4f29-4c3e-826e-9066a5e368a6", "submission_id": "41d81f4f-977e-44d0-bc3a-cafc60332e01"}	high
a7ce096a-5d91-4645-9bbb-d1a34b1152f9	2026-01-05 19:58:09.948535+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.8 Merets and $30.00	3f565f44-ca52-4313-a270-fc9761dcedcb	051683f3-f314-421e-8f4d-1869700f8619	\N	f	f	view_task	{"commitment_id": "3f565f44-ca52-4313-a270-fc9761dcedcb", "merets_earned": 1.800000000000000000, "submission_id": "051683f3-f314-421e-8f4d-1869700f8619", "quality_rating": 5, "money_earned_cents": 3000}	normal
1d5094ae-1781-4fb4-9719-02138c2f0eda	2026-01-05 19:58:16.77075+00	f8679515-35c0-41e7-af69-fc0a6d6c012d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.2 Merets and $6.00	d9bc779a-4f29-4c3e-826e-9066a5e368a6	41d81f4f-977e-44d0-bc3a-cafc60332e01	\N	f	f	view_task	{"commitment_id": "d9bc779a-4f29-4c3e-826e-9066a5e368a6", "merets_earned": 0.2000000000000000000040, "submission_id": "41d81f4f-977e-44d0-bc3a-cafc60332e01", "quality_rating": 5, "money_earned_cents": 600}	normal
4cdc0ca6-37fe-4047-81fe-5a66273df2c3	2026-01-05 20:09:58.615991+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Organize closet"	801faac2-552c-42ab-a03e-32facb5c3a42	\N	5e49f378-c5fe-4746-9211-6e2e32244b9a	f	f	view_commitment	{"commitment_id": "801faac2-552c-42ab-a03e-32facb5c3a42"}	normal
28cf4038-f9ff-442a-815a-913212a824e4	2026-01-05 20:09:58.615991+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Organize closet"	801faac2-552c-42ab-a03e-32facb5c3a42	\N	5e49f378-c5fe-4746-9211-6e2e32244b9a	f	f	view_commitment	{"commitment_id": "801faac2-552c-42ab-a03e-32facb5c3a42"}	normal
3ec06090-90b6-4b89-ab32-3ad598dd3b61	2026-01-05 20:10:08.632491+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Deep clean kitchen"	ace4a538-f036-454d-be0d-35d25a695321	\N	587acf8a-de48-469e-8214-3f5ae1e5ebb8	f	f	view_commitment	{"commitment_id": "ace4a538-f036-454d-be0d-35d25a695321"}	normal
bd018113-f278-4f66-97e0-e522948f999c	2026-01-05 20:10:08.632491+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Deep clean kitchen"	ace4a538-f036-454d-be0d-35d25a695321	\N	587acf8a-de48-469e-8214-3f5ae1e5ebb8	f	f	view_commitment	{"commitment_id": "ace4a538-f036-454d-be0d-35d25a695321"}	normal
3891c6cc-6003-49de-9126-2016e727a591	2026-01-05 20:10:19.486862+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Vacuum whole house"	4341b221-733d-4e04-9d40-3ae5b7cc6a7c	\N	1f537dce-2a0f-45da-bbc2-2c0ea5bf2384	f	f	view_commitment	{"commitment_id": "4341b221-733d-4e04-9d40-3ae5b7cc6a7c"}	normal
37118c13-043b-4def-8d40-3349ae909966	2026-01-05 20:10:19.486862+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Vacuum whole house"	4341b221-733d-4e04-9d40-3ae5b7cc6a7c	\N	1f537dce-2a0f-45da-bbc2-2c0ea5bf2384	f	f	view_commitment	{"commitment_id": "4341b221-733d-4e04-9d40-3ae5b7cc6a7c"}	normal
87dc97de-c75f-4245-8044-5db88b5f59ff	2026-01-05 20:11:01.601002+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Vacuum whole house" for review	4341b221-733d-4e04-9d40-3ae5b7cc6a7c	e2250316-9f20-4fae-8707-27bf286dba7f	\N	f	f	view_submission	{"commitment_id": "4341b221-733d-4e04-9d40-3ae5b7cc6a7c", "submission_id": "e2250316-9f20-4fae-8707-27bf286dba7f"}	high
cb1ac038-978a-4e91-b907-665c0078b798	2026-01-05 20:11:01.601002+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Vacuum whole house" for approval	4341b221-733d-4e04-9d40-3ae5b7cc6a7c	e2250316-9f20-4fae-8707-27bf286dba7f	\N	f	f	view_submission	{"commitment_id": "4341b221-733d-4e04-9d40-3ae5b7cc6a7c", "submission_id": "e2250316-9f20-4fae-8707-27bf286dba7f"}	high
c8aefffc-b668-4241-9556-9acb8b6f5970	2026-01-05 20:11:08.748218+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Deep clean kitchen" for review	ace4a538-f036-454d-be0d-35d25a695321	d382864c-9d6c-419d-93e7-dae900e93bd4	\N	f	f	view_submission	{"commitment_id": "ace4a538-f036-454d-be0d-35d25a695321", "submission_id": "d382864c-9d6c-419d-93e7-dae900e93bd4"}	high
2acd0562-b6cb-4ac6-acaa-2946389ff5a8	2026-01-05 20:11:08.748218+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Deep clean kitchen" for approval	ace4a538-f036-454d-be0d-35d25a695321	d382864c-9d6c-419d-93e7-dae900e93bd4	\N	f	f	view_submission	{"commitment_id": "ace4a538-f036-454d-be0d-35d25a695321", "submission_id": "d382864c-9d6c-419d-93e7-dae900e93bd4"}	high
d569429c-11ec-4211-95c5-85a47e8150d9	2026-01-05 20:11:15.188484+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Organize closet" for review	801faac2-552c-42ab-a03e-32facb5c3a42	cb59ccb5-d391-4569-b805-f0e4700fc2ba	\N	f	f	view_submission	{"commitment_id": "801faac2-552c-42ab-a03e-32facb5c3a42", "submission_id": "cb59ccb5-d391-4569-b805-f0e4700fc2ba"}	high
13c0d642-f593-4201-a776-39d9adee606a	2026-01-05 20:11:15.188484+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Organize closet" for approval	801faac2-552c-42ab-a03e-32facb5c3a42	cb59ccb5-d391-4569-b805-f0e4700fc2ba	\N	f	f	view_submission	{"commitment_id": "801faac2-552c-42ab-a03e-32facb5c3a42", "submission_id": "cb59ccb5-d391-4569-b805-f0e4700fc2ba"}	high
443878e7-d6f4-431b-aa86-2c112bc41024	2026-01-05 20:11:24.22414+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Change bed sheets" for approval	47b33618-6bcf-48c0-9162-65efe6226a72	39135ca0-7a13-48eb-b4be-3ddd67dd49a2	\N	f	f	view_submission	{"commitment_id": "47b33618-6bcf-48c0-9162-65efe6226a72", "submission_id": "39135ca0-7a13-48eb-b4be-3ddd67dd49a2"}	high
1e623a55-9a51-47e7-ad8a-81137ecfcdef	2026-01-05 20:11:30.348036+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Do laundry start to finish" for review	bdebcc52-9492-406b-ba58-8ad81733fe47	c376538b-1d1a-4df1-bb96-15b40826bbb3	\N	f	f	view_submission	{"commitment_id": "bdebcc52-9492-406b-ba58-8ad81733fe47", "submission_id": "c376538b-1d1a-4df1-bb96-15b40826bbb3"}	high
76d58687-66d7-4bc0-ac23-1da2e18ae464	2026-01-05 20:11:30.348036+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Do laundry start to finish" for approval	bdebcc52-9492-406b-ba58-8ad81733fe47	c376538b-1d1a-4df1-bb96-15b40826bbb3	\N	f	f	view_submission	{"commitment_id": "bdebcc52-9492-406b-ba58-8ad81733fe47", "submission_id": "c376538b-1d1a-4df1-bb96-15b40826bbb3"}	high
3d89480f-0eef-4686-afe4-282a58ec773a	2026-01-05 20:12:44.75102+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.8 Merets and $30.00	bdebcc52-9492-406b-ba58-8ad81733fe47	c376538b-1d1a-4df1-bb96-15b40826bbb3	\N	f	f	view_task	{"commitment_id": "bdebcc52-9492-406b-ba58-8ad81733fe47", "merets_earned": 1.800000000000000000, "submission_id": "c376538b-1d1a-4df1-bb96-15b40826bbb3", "quality_rating": 5, "money_earned_cents": 3000}	normal
a5b37de3-66fc-4e19-a9ce-a658d0a3acbf	2026-01-05 20:12:51.308485+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.4 Merets and $6.00	c9a9d8ad-6355-4bd9-b4aa-990da50c45c5	a09eda7a-dd26-4d66-8148-1512cd09052f	\N	f	f	view_task	{"commitment_id": "c9a9d8ad-6355-4bd9-b4aa-990da50c45c5", "merets_earned": 0.3999999999999999999960, "submission_id": "a09eda7a-dd26-4d66-8148-1512cd09052f", "quality_rating": 5, "money_earned_cents": 600}	normal
c0f1a4f1-9997-40b1-8d24-34f3330d435c	2026-01-05 20:13:12.54815+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Product Assembly "	f800ac29-f772-4d8e-8877-9a25e804071c	\N	a7639d2a-c35f-4f1d-91b6-1f075339d912	f	f	view_commitment	{"commitment_id": "f800ac29-f772-4d8e-8877-9a25e804071c"}	normal
10f8c606-00dd-4e8e-ae23-dd3dfdf6fe7c	2026-01-05 20:11:38.976078+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Change bed sheets" for approval	c9a9d8ad-6355-4bd9-b4aa-990da50c45c5	a09eda7a-dd26-4d66-8148-1512cd09052f	\N	f	f	view_submission	{"commitment_id": "c9a9d8ad-6355-4bd9-b4aa-990da50c45c5", "submission_id": "a09eda7a-dd26-4d66-8148-1512cd09052f"}	high
9b37822a-2897-4d3e-89d3-b055ed7d6417	2026-01-05 20:11:56.475178+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.6 Merets and $18.00	4341b221-733d-4e04-9d40-3ae5b7cc6a7c	e2250316-9f20-4fae-8707-27bf286dba7f	\N	f	f	view_task	{"commitment_id": "4341b221-733d-4e04-9d40-3ae5b7cc6a7c", "merets_earned": 0.6000000000000000000000, "submission_id": "e2250316-9f20-4fae-8707-27bf286dba7f", "quality_rating": 5, "money_earned_cents": 1800}	normal
3744493e-14e6-4c2c-a56e-91b14a30cb17	2026-01-05 20:12:04.05977+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 4 stars! You earned 1.0 Merets and $25.00	ace4a538-f036-454d-be0d-35d25a695321	d382864c-9d6c-419d-93e7-dae900e93bd4	\N	f	f	view_task	{"commitment_id": "ace4a538-f036-454d-be0d-35d25a695321", "merets_earned": 1.0000000000000000000000, "submission_id": "d382864c-9d6c-419d-93e7-dae900e93bd4", "quality_rating": 4, "money_earned_cents": 2500}	normal
a2567657-144b-446b-963a-7890cf0425b4	2026-01-05 20:12:11.405368+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 4 stars! You earned 1.0 Merets and $25.00	801faac2-552c-42ab-a03e-32facb5c3a42	cb59ccb5-d391-4569-b805-f0e4700fc2ba	\N	f	f	view_task	{"commitment_id": "801faac2-552c-42ab-a03e-32facb5c3a42", "merets_earned": 1.0000000000000000000000, "submission_id": "cb59ccb5-d391-4569-b805-f0e4700fc2ba", "quality_rating": 4, "money_earned_cents": 2500}	normal
c46875b2-37cb-4b9a-8bcd-33a559eb311b	2026-01-05 20:12:18.135307+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 4 stars! You earned 0.3 Merets and $6.00	47b33618-6bcf-48c0-9162-65efe6226a72	39135ca0-7a13-48eb-b4be-3ddd67dd49a2	\N	f	f	view_task	{"commitment_id": "47b33618-6bcf-48c0-9162-65efe6226a72", "merets_earned": 0.3333333333333333333300, "submission_id": "39135ca0-7a13-48eb-b4be-3ddd67dd49a2", "quality_rating": 4, "money_earned_cents": 600}	normal
c5bea916-3b45-4fb4-bb8e-27d2d400fc21	2026-01-05 20:13:21.491777+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	92a30c28-2bb5-44ff-852f-20047f062a9d	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "92a30c28-2bb5-44ff-852f-20047f062a9d"}	normal
addb87e8-329c-4063-9660-f3bdd8358b29	2026-01-05 20:13:21.491777+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	92a30c28-2bb5-44ff-852f-20047f062a9d	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "92a30c28-2bb5-44ff-852f-20047f062a9d"}	normal
89add079-d568-46ac-b7a5-ae6fd36a3de7	2026-01-05 20:13:32.178367+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Wash windows"	ffc7bb33-843d-463f-84bb-5d1a565fd40f	\N	7aa4dbb6-a1f2-4edf-af14-40fa28aca312	f	f	view_commitment	{"commitment_id": "ffc7bb33-843d-463f-84bb-5d1a565fd40f"}	normal
fc5821db-8abf-4851-9370-284a933e3e1b	2026-01-05 20:13:32.178367+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Wash windows"	ffc7bb33-843d-463f-84bb-5d1a565fd40f	\N	7aa4dbb6-a1f2-4edf-af14-40fa28aca312	f	f	view_commitment	{"commitment_id": "ffc7bb33-843d-463f-84bb-5d1a565fd40f"}	normal
e008c9ef-4256-4fd8-8e7c-f341d99fdd2a	2026-01-05 20:13:41.642115+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Deep clean kitchen"	8f3dad03-bfa7-4edf-ae69-699a2edd812d	\N	587acf8a-de48-469e-8214-3f5ae1e5ebb8	f	f	view_commitment	{"commitment_id": "8f3dad03-bfa7-4edf-ae69-699a2edd812d"}	normal
a34b7df3-8b6b-43b6-acaf-ad1cf4ac1725	2026-01-05 20:13:41.642115+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Deep clean kitchen"	8f3dad03-bfa7-4edf-ae69-699a2edd812d	\N	587acf8a-de48-469e-8214-3f5ae1e5ebb8	f	f	view_commitment	{"commitment_id": "8f3dad03-bfa7-4edf-ae69-699a2edd812d"}	normal
e96eccb5-0a1f-4846-a9d8-8dfaba732549	2026-01-05 20:14:09.375319+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Deep clean kitchen" for review	8f3dad03-bfa7-4edf-ae69-699a2edd812d	7ad9d6df-3136-4445-9239-e2c3cb544cbb	\N	f	f	view_submission	{"commitment_id": "8f3dad03-bfa7-4edf-ae69-699a2edd812d", "submission_id": "7ad9d6df-3136-4445-9239-e2c3cb544cbb"}	high
701538da-8bd9-4a2e-8e5b-8af14ec3761e	2026-01-05 20:14:09.375319+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Deep clean kitchen" for approval	8f3dad03-bfa7-4edf-ae69-699a2edd812d	7ad9d6df-3136-4445-9239-e2c3cb544cbb	\N	f	f	view_submission	{"commitment_id": "8f3dad03-bfa7-4edf-ae69-699a2edd812d", "submission_id": "7ad9d6df-3136-4445-9239-e2c3cb544cbb"}	high
ebe506f6-2428-436c-a8b8-d3b85b4c40d2	2026-01-05 20:14:14.354281+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Wash windows" for review	ffc7bb33-843d-463f-84bb-5d1a565fd40f	2de80844-b47a-4272-abbf-b38fc1274050	\N	f	f	view_submission	{"commitment_id": "ffc7bb33-843d-463f-84bb-5d1a565fd40f", "submission_id": "2de80844-b47a-4272-abbf-b38fc1274050"}	high
95e0d7fa-7b9b-44fb-9761-22d48197ca0d	2026-01-05 20:14:14.354281+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Wash windows" for approval	ffc7bb33-843d-463f-84bb-5d1a565fd40f	2de80844-b47a-4272-abbf-b38fc1274050	\N	f	f	view_submission	{"commitment_id": "ffc7bb33-843d-463f-84bb-5d1a565fd40f", "submission_id": "2de80844-b47a-4272-abbf-b38fc1274050"}	high
73bd65bd-ad9a-4550-8fe2-9c484cea943e	2026-01-05 20:14:19.316368+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Do laundry start to finish" for review	92a30c28-2bb5-44ff-852f-20047f062a9d	4d748026-92c0-413b-9b09-a0e7786a511e	\N	f	f	view_submission	{"commitment_id": "92a30c28-2bb5-44ff-852f-20047f062a9d", "submission_id": "4d748026-92c0-413b-9b09-a0e7786a511e"}	high
852a09a7-ba43-4a10-8a15-e5591c67036d	2026-01-05 20:14:19.316368+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Do laundry start to finish" for approval	92a30c28-2bb5-44ff-852f-20047f062a9d	4d748026-92c0-413b-9b09-a0e7786a511e	\N	f	f	view_submission	{"commitment_id": "92a30c28-2bb5-44ff-852f-20047f062a9d", "submission_id": "4d748026-92c0-413b-9b09-a0e7786a511e"}	high
ade758b4-7d37-4b1a-99d8-f6289ec0ab9a	2026-01-05 20:14:25.213831+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Product Assembly " for approval	f800ac29-f772-4d8e-8877-9a25e804071c	1c1dc7f2-7936-4085-a380-62e47b563913	\N	f	f	view_submission	{"commitment_id": "f800ac29-f772-4d8e-8877-9a25e804071c", "submission_id": "1c1dc7f2-7936-4085-a380-62e47b563913"}	high
6d7c2698-52b7-471c-97c4-c361db91db2d	2026-01-05 20:14:31.114483+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Do laundry start to finish" for review	80814540-f87a-4d61-aaab-5426f256ed0d	7c82ffa2-faba-4532-9db4-7604345f4baa	\N	f	f	view_submission	{"commitment_id": "80814540-f87a-4d61-aaab-5426f256ed0d", "submission_id": "7c82ffa2-faba-4532-9db4-7604345f4baa"}	high
9f69754b-f4a8-4f0a-b122-c51f2c7cd9c9	2026-01-05 20:14:31.114483+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Do laundry start to finish" for approval	80814540-f87a-4d61-aaab-5426f256ed0d	7c82ffa2-faba-4532-9db4-7604345f4baa	\N	f	f	view_submission	{"commitment_id": "80814540-f87a-4d61-aaab-5426f256ed0d", "submission_id": "7c82ffa2-faba-4532-9db4-7604345f4baa"}	high
5989dcea-14c7-47f1-8ff1-12c684b23e93	2026-01-05 20:14:36.710494+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Do laundry start to finish" for review	4832c519-5d2e-43ee-94f0-ff2b95be4a8c	1b9b5d6e-e609-48dd-90ec-5d4e2d8ab7a7	\N	f	f	view_submission	{"commitment_id": "4832c519-5d2e-43ee-94f0-ff2b95be4a8c", "submission_id": "1b9b5d6e-e609-48dd-90ec-5d4e2d8ab7a7"}	high
37a9184f-8f79-4f99-b28b-8dc71b0dbbdf	2026-01-05 20:14:36.710494+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Do laundry start to finish" for approval	4832c519-5d2e-43ee-94f0-ff2b95be4a8c	1b9b5d6e-e609-48dd-90ec-5d4e2d8ab7a7	\N	f	f	view_submission	{"commitment_id": "4832c519-5d2e-43ee-94f0-ff2b95be4a8c", "submission_id": "1b9b5d6e-e609-48dd-90ec-5d4e2d8ab7a7"}	high
e3f34725-629a-45bd-a101-b989eda36b01	2026-01-05 20:14:45.901148+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Tidy bedroom" for approval	a49fe64a-4628-4ab3-a512-eac66d19e533	3e9e5bae-3597-43ec-82b4-975afa5e0259	\N	f	f	view_submission	{"commitment_id": "a49fe64a-4628-4ab3-a512-eac66d19e533", "submission_id": "3e9e5bae-3597-43ec-82b4-975afa5e0259"}	high
38a641cd-9e65-47a7-96fe-6eb7d8dfdf29	2026-01-05 20:14:50.791609+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Change bed sheets" for approval	e51755bb-a77a-4e5f-832e-b415e9bc469d	3c78de34-d41d-464a-b6b8-8c10edb39e47	\N	f	f	view_submission	{"commitment_id": "e51755bb-a77a-4e5f-832e-b415e9bc469d", "submission_id": "3c78de34-d41d-464a-b6b8-8c10edb39e47"}	high
c493299b-bf25-401d-8915-8f5880c8eb7c	2026-01-05 20:15:01.805904+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Wipe kitchen counter" for review	58f4af4d-f7be-429c-b4b3-3c5b701ec616	d3572b98-462e-4004-99d4-14fb3a77646f	\N	f	f	view_submission	{"commitment_id": "58f4af4d-f7be-429c-b4b3-3c5b701ec616", "submission_id": "d3572b98-462e-4004-99d4-14fb3a77646f"}	high
90c36960-f64c-4f4d-9891-3cb66a68a293	2026-01-05 20:15:01.805904+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Wipe kitchen counter" for approval	58f4af4d-f7be-429c-b4b3-3c5b701ec616	d3572b98-462e-4004-99d4-14fb3a77646f	\N	f	f	view_submission	{"commitment_id": "58f4af4d-f7be-429c-b4b3-3c5b701ec616", "submission_id": "d3572b98-462e-4004-99d4-14fb3a77646f"}	high
f74bde58-c0d7-489e-be70-b0d137f5751c	2026-01-05 20:15:18.571932+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.2 Merets and $25.00	8f3dad03-bfa7-4edf-ae69-699a2edd812d	7ad9d6df-3136-4445-9239-e2c3cb544cbb	\N	f	f	view_task	{"commitment_id": "8f3dad03-bfa7-4edf-ae69-699a2edd812d", "merets_earned": 1.2000000000000000000000, "submission_id": "7ad9d6df-3136-4445-9239-e2c3cb544cbb", "quality_rating": 5, "money_earned_cents": 2500}	normal
9676ff98-4639-45ca-ab21-89a90417d048	2026-01-05 20:15:30.741554+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.8 Merets and $30.00	92a30c28-2bb5-44ff-852f-20047f062a9d	4d748026-92c0-413b-9b09-a0e7786a511e	\N	f	f	view_task	{"commitment_id": "92a30c28-2bb5-44ff-852f-20047f062a9d", "merets_earned": 1.800000000000000000, "submission_id": "4d748026-92c0-413b-9b09-a0e7786a511e", "quality_rating": 5, "money_earned_cents": 3000}	normal
71dde71b-2566-4efa-99bc-4364747250ee	2026-01-05 20:15:38.415564+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.8 Merets and $30.00	80814540-f87a-4d61-aaab-5426f256ed0d	7c82ffa2-faba-4532-9db4-7604345f4baa	\N	f	f	view_task	{"commitment_id": "80814540-f87a-4d61-aaab-5426f256ed0d", "merets_earned": 1.800000000000000000, "submission_id": "7c82ffa2-faba-4532-9db4-7604345f4baa", "quality_rating": 5, "money_earned_cents": 3000}	normal
771fd61b-94c0-4146-aca9-9893cabc11e4	2026-01-05 20:15:45.816539+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.4 Merets and $5.00	a49fe64a-4628-4ab3-a512-eac66d19e533	3e9e5bae-3597-43ec-82b4-975afa5e0259	\N	f	f	view_task	{"commitment_id": "a49fe64a-4628-4ab3-a512-eac66d19e533", "merets_earned": 0.3999999999999999999960, "submission_id": "3e9e5bae-3597-43ec-82b4-975afa5e0259", "quality_rating": 5, "money_earned_cents": 500}	normal
12b7bb75-3325-45ad-b313-ae0a6f3a96ee	2026-01-05 20:16:07.743358+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 4 stars! You earned 1.5 Merets and $30.00	4832c519-5d2e-43ee-94f0-ff2b95be4a8c	1b9b5d6e-e609-48dd-90ec-5d4e2d8ab7a7	\N	f	f	view_task	{"commitment_id": "4832c519-5d2e-43ee-94f0-ff2b95be4a8c", "merets_earned": 1.500000000000000000, "submission_id": "1b9b5d6e-e609-48dd-90ec-5d4e2d8ab7a7", "quality_rating": 4, "money_earned_cents": 3000}	normal
bfb638b1-6d6c-4a04-a677-4eb5750d8bc1	2026-01-05 20:16:51.309294+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Change bed sheets"	2aca1933-920e-4e43-b1fa-dd14957ff5ab	\N	601f8fbe-2e51-4932-98f3-99b0aebab2a6	f	f	view_commitment	{"commitment_id": "2aca1933-920e-4e43-b1fa-dd14957ff5ab"}	normal
581d83b9-11bc-434c-9575-b50282541f1a	2026-01-05 20:14:55.794079+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Clean microwave" for approval	24782769-1262-41dd-a80f-35ab4038fb04	e39276ae-0483-4127-b8ae-153919df4fed	\N	f	f	view_submission	{"commitment_id": "24782769-1262-41dd-a80f-35ab4038fb04", "submission_id": "e39276ae-0483-4127-b8ae-153919df4fed"}	high
e748b955-b167-42e2-adec-70d344adf238	2026-01-05 20:15:24.752204+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.7 Merets and $21.00	ffc7bb33-843d-463f-84bb-5d1a565fd40f	2de80844-b47a-4272-abbf-b38fc1274050	\N	f	f	view_task	{"commitment_id": "ffc7bb33-843d-463f-84bb-5d1a565fd40f", "merets_earned": 0.6999999999999999999960, "submission_id": "2de80844-b47a-4272-abbf-b38fc1274050", "quality_rating": 5, "money_earned_cents": 2100}	normal
35508d0b-69f5-4971-8af7-a82f0ad7a527	2026-01-05 20:15:54.553003+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 4 stars! You earned 0.3 Merets and $6.00	e51755bb-a77a-4e5f-832e-b415e9bc469d	3c78de34-d41d-464a-b6b8-8c10edb39e47	\N	f	f	view_task	{"commitment_id": "e51755bb-a77a-4e5f-832e-b415e9bc469d", "merets_earned": 0.3333333333333333333300, "submission_id": "3c78de34-d41d-464a-b6b8-8c10edb39e47", "quality_rating": 4, "money_earned_cents": 600}	normal
83cacc2b-88e7-4cf6-8d7a-87b2a5d4bce9	2026-01-05 20:16:01.084074+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 4 stars! You earned 1.0 Merets and $20.00	f800ac29-f772-4d8e-8877-9a25e804071c	1c1dc7f2-7936-4085-a380-62e47b563913	\N	f	f	view_task	{"commitment_id": "f800ac29-f772-4d8e-8877-9a25e804071c", "merets_earned": 1.0000000000000000000000, "submission_id": "1c1dc7f2-7936-4085-a380-62e47b563913", "quality_rating": 4, "money_earned_cents": 2000}	normal
adc2ff67-1ddb-4ada-84a9-9eddbe98d5a5	2026-01-05 20:16:15.558028+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.3 Merets and $4.00	24782769-1262-41dd-a80f-35ab4038fb04	e39276ae-0483-4127-b8ae-153919df4fed	\N	f	f	view_task	{"commitment_id": "24782769-1262-41dd-a80f-35ab4038fb04", "merets_earned": 0.3000000000000000000000, "submission_id": "e39276ae-0483-4127-b8ae-153919df4fed", "quality_rating": 5, "money_earned_cents": 400}	normal
a8f48202-185e-4781-a261-ac2f047a30e5	2026-01-05 20:16:39.700194+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Shovel driveway"	b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d	\N	cd5c98a5-b168-44ab-b385-1a624740340d	f	f	view_commitment	{"commitment_id": "b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d"}	normal
4eb2974c-bc35-4203-8cab-df5ac59f4081	2026-01-05 20:17:04.460204+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Prep vegetables for dinner"	13e4000e-bdc8-4a55-9d63-cdd449f7b314	\N	583db4be-ee93-4d97-9d82-8db704f0401b	f	f	view_commitment	{"commitment_id": "13e4000e-bdc8-4a55-9d63-cdd449f7b314"}	normal
bbeee2e1-08d4-4783-9d8a-4b775d01ad54	2026-01-05 20:23:43.205095+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	5522d969-98a1-4488-bb93-579da829f623	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "5522d969-98a1-4488-bb93-579da829f623"}	normal
2a97bb22-a956-4fb4-8266-1163368e8e79	2026-01-05 20:23:43.205095+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	5522d969-98a1-4488-bb93-579da829f623	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "5522d969-98a1-4488-bb93-579da829f623"}	normal
882a5c72-1d00-489d-a2f7-5dc48b95f1dc	2026-01-05 20:37:00.73901+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	f1e432d5-0089-4088-9638-8fd66fb1d693	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "f1e432d5-0089-4088-9638-8fd66fb1d693"}	normal
4707aa9c-5e17-4b4f-974d-3a3d3735f9f6	2026-01-05 20:37:00.73901+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	f1e432d5-0089-4088-9638-8fd66fb1d693	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "f1e432d5-0089-4088-9638-8fd66fb1d693"}	normal
d5b62c2b-bde7-4fff-89c0-ec8e46be96f7	2026-01-05 20:37:32.304569+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.1 Merets and $3.00	58f4af4d-f7be-429c-b4b3-3c5b701ec616	d3572b98-462e-4004-99d4-14fb3a77646f	\N	f	f	view_task	{"commitment_id": "58f4af4d-f7be-429c-b4b3-3c5b701ec616", "merets_earned": 0.0999999999999999999960, "submission_id": "d3572b98-462e-4004-99d4-14fb3a77646f", "quality_rating": 5, "money_earned_cents": 300}	normal
e0db0102-bb57-4316-b27d-a5e17b0fcfe0	2026-01-05 20:37:45.27824+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Do laundry start to finish" for review	f1e432d5-0089-4088-9638-8fd66fb1d693	0e2a00a9-c049-4f06-a96a-fd2cc6c4aa43	\N	f	f	view_submission	{"commitment_id": "f1e432d5-0089-4088-9638-8fd66fb1d693", "submission_id": "0e2a00a9-c049-4f06-a96a-fd2cc6c4aa43"}	high
b6f7df1d-2f2c-42ff-bf95-2641bd91a9b7	2026-01-05 20:37:45.27824+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Do laundry start to finish" for approval	f1e432d5-0089-4088-9638-8fd66fb1d693	0e2a00a9-c049-4f06-a96a-fd2cc6c4aa43	\N	f	f	view_submission	{"commitment_id": "f1e432d5-0089-4088-9638-8fd66fb1d693", "submission_id": "0e2a00a9-c049-4f06-a96a-fd2cc6c4aa43"}	high
cc12aa8f-6660-432d-967a-f4a51197cf8e	2026-01-05 20:37:49.615441+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Do laundry start to finish" for review	5522d969-98a1-4488-bb93-579da829f623	fe1f30fc-5050-44f1-ab71-794e05608cae	\N	f	f	view_submission	{"commitment_id": "5522d969-98a1-4488-bb93-579da829f623", "submission_id": "fe1f30fc-5050-44f1-ab71-794e05608cae"}	high
60947895-9e27-4130-bb3b-c780a9afc1f8	2026-01-05 20:37:49.615441+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Do laundry start to finish" for approval	5522d969-98a1-4488-bb93-579da829f623	fe1f30fc-5050-44f1-ab71-794e05608cae	\N	f	f	view_submission	{"commitment_id": "5522d969-98a1-4488-bb93-579da829f623", "submission_id": "fe1f30fc-5050-44f1-ab71-794e05608cae"}	high
5e9b1c98-2689-4e0e-817b-6eb111e73600	2026-01-05 20:37:54.12241+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Prep vegetables for dinner" for approval	13e4000e-bdc8-4a55-9d63-cdd449f7b314	f75f02d0-8d4d-4b7f-9906-3e85599f2b51	\N	f	f	view_submission	{"commitment_id": "13e4000e-bdc8-4a55-9d63-cdd449f7b314", "submission_id": "f75f02d0-8d4d-4b7f-9906-3e85599f2b51"}	high
4be0ab64-bbef-47d0-ad2a-464750386f1b	2026-01-05 20:38:19.478172+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Change bed sheets" for approval	2aca1933-920e-4e43-b1fa-dd14957ff5ab	53a0a424-2509-41a6-883a-45762ec8f972	\N	f	f	view_submission	{"commitment_id": "2aca1933-920e-4e43-b1fa-dd14957ff5ab", "submission_id": "53a0a424-2509-41a6-883a-45762ec8f972"}	high
df5ae875-0e08-4c6a-afe8-f23bf49ceb1d	2026-01-05 20:38:24.551273+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Shovel driveway" for approval	b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d	4e8ed9ae-2f99-4537-a6bc-748dd5b82f99	\N	f	f	view_submission	{"commitment_id": "b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d", "submission_id": "4e8ed9ae-2f99-4537-a6bc-748dd5b82f99"}	high
ccb0dd87-9ad7-44e7-9264-574bce419b33	2026-01-05 20:38:42.754025+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.8 Merets and $30.00	f1e432d5-0089-4088-9638-8fd66fb1d693	0e2a00a9-c049-4f06-a96a-fd2cc6c4aa43	\N	f	f	view_task	{"commitment_id": "f1e432d5-0089-4088-9638-8fd66fb1d693", "merets_earned": 1.800000000000000000, "submission_id": "0e2a00a9-c049-4f06-a96a-fd2cc6c4aa43", "quality_rating": 5, "money_earned_cents": 3000}	normal
30651e3c-f495-4b74-96b3-69dc19571a22	2026-01-05 20:38:48.645277+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.8 Merets and $30.00	5522d969-98a1-4488-bb93-579da829f623	fe1f30fc-5050-44f1-ab71-794e05608cae	\N	f	f	view_task	{"commitment_id": "5522d969-98a1-4488-bb93-579da829f623", "merets_earned": 1.800000000000000000, "submission_id": "fe1f30fc-5050-44f1-ab71-794e05608cae", "quality_rating": 5, "money_earned_cents": 3000}	normal
51dac904-6b5f-47ce-9362-a4224fd780fe	2026-01-05 20:38:55.561837+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.4 Merets and $6.00	13e4000e-bdc8-4a55-9d63-cdd449f7b314	f75f02d0-8d4d-4b7f-9906-3e85599f2b51	\N	f	f	view_task	{"commitment_id": "13e4000e-bdc8-4a55-9d63-cdd449f7b314", "merets_earned": 0.3999999999999999999960, "submission_id": "f75f02d0-8d4d-4b7f-9906-3e85599f2b51", "quality_rating": 5, "money_earned_cents": 600}	normal
00c0cdb3-53d2-481e-b4cf-85188586ae7b	2026-01-05 20:39:02.073111+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.4 Merets and $6.00	2aca1933-920e-4e43-b1fa-dd14957ff5ab	53a0a424-2509-41a6-883a-45762ec8f972	\N	f	f	view_task	{"commitment_id": "2aca1933-920e-4e43-b1fa-dd14957ff5ab", "merets_earned": 0.3999999999999999999960, "submission_id": "53a0a424-2509-41a6-883a-45762ec8f972", "quality_rating": 5, "money_earned_cents": 600}	normal
16d38391-426e-45d6-a509-e0383931b39c	2026-01-05 20:39:07.758506+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.9 Merets and $15.00	b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d	4e8ed9ae-2f99-4537-a6bc-748dd5b82f99	\N	f	f	view_task	{"commitment_id": "b51691ba-f8b8-4c05-99d9-c4a9b80b7b8d", "merets_earned": 0.9000000000000000000000, "submission_id": "4e8ed9ae-2f99-4537-a6bc-748dd5b82f99", "quality_rating": 5, "money_earned_cents": 1500}	normal
9d13f28e-4bb1-4270-ae2f-99d66800f8bd	2026-01-05 21:25:49.732472+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Shovel snow"	1529b7ba-9f8d-4f57-b024-ae9ec1ab1831	\N	3984b039-5155-4c0e-bb01-ca731b1618c5	f	f	view_commitment	{"commitment_id": "1529b7ba-9f8d-4f57-b024-ae9ec1ab1831"}	normal
92f535d2-338e-4cc5-abb0-2ca9363be795	2026-01-05 21:25:49.732472+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Shovel snow"	1529b7ba-9f8d-4f57-b024-ae9ec1ab1831	\N	3984b039-5155-4c0e-bb01-ca731b1618c5	f	f	view_commitment	{"commitment_id": "1529b7ba-9f8d-4f57-b024-ae9ec1ab1831"}	normal
edf533fd-1043-4a71-bfe8-aac555e29aa4	2026-01-05 21:25:59.787182+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Weed garden beds"	0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a	\N	4ab85eab-7aa7-4211-845b-75aa22ba723a	f	f	view_commitment	{"commitment_id": "0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a"}	normal
ec464bd6-5e0c-45c1-ae2b-1fa098b5fa35	2026-01-05 21:25:59.787182+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Weed garden beds"	0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a	\N	4ab85eab-7aa7-4211-845b-75aa22ba723a	f	f	view_commitment	{"commitment_id": "0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a"}	normal
7b112af4-16da-45ab-bb1a-47590bdb7b3a	2026-01-05 21:26:06.730075+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Rake leaves"	c39292fe-0c72-4bb6-8f9e-fd7178450729	\N	593c77e5-7364-460f-aee3-721379d40736	f	f	view_commitment	{"commitment_id": "c39292fe-0c72-4bb6-8f9e-fd7178450729"}	normal
ef34791b-9726-4188-a751-c2f04d7ec06d	2026-01-05 21:26:06.730075+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Rake leaves"	c39292fe-0c72-4bb6-8f9e-fd7178450729	\N	593c77e5-7364-460f-aee3-721379d40736	f	f	view_commitment	{"commitment_id": "c39292fe-0c72-4bb6-8f9e-fd7178450729"}	normal
1510fca7-1d3f-4e5c-8f3b-e87922f05cd1	2026-01-05 21:26:20.975534+00	4be9f490-66e9-48ab-833d-9fade274504d	task_committed	✅ Task Committed	You committed to "Do laundry start to finish"	f715e231-e3a5-4748-a4e4-50c6278db6c6	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "f715e231-e3a5-4748-a4e4-50c6278db6c6"}	normal
70a1eb94-4e66-46dc-957d-ff8d6f1c2246	2026-01-05 21:26:20.975534+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	commitment_made	👤 New Commitment	Aveya committed to "Do laundry start to finish"	f715e231-e3a5-4748-a4e4-50c6278db6c6	\N	335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	f	f	view_commitment	{"commitment_id": "f715e231-e3a5-4748-a4e4-50c6278db6c6"}	normal
a29fe28e-5c64-42ce-87ca-4c7ac3e27680	2026-01-05 21:26:51.327623+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Do laundry start to finish" for review	f715e231-e3a5-4748-a4e4-50c6278db6c6	ef7c40ba-2354-41a7-9666-491ac0498428	\N	f	f	view_submission	{"commitment_id": "f715e231-e3a5-4748-a4e4-50c6278db6c6", "submission_id": "ef7c40ba-2354-41a7-9666-491ac0498428"}	high
f7a6ad85-bc88-4922-9a6a-91ae1c6619c7	2026-01-05 21:26:51.327623+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Do laundry start to finish" for approval	f715e231-e3a5-4748-a4e4-50c6278db6c6	ef7c40ba-2354-41a7-9666-491ac0498428	\N	f	f	view_submission	{"commitment_id": "f715e231-e3a5-4748-a4e4-50c6278db6c6", "submission_id": "ef7c40ba-2354-41a7-9666-491ac0498428"}	high
e68c7100-97c4-40b4-8e90-b6e14f5768ed	2026-01-05 21:26:54.914373+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Rake leaves" for review	c39292fe-0c72-4bb6-8f9e-fd7178450729	7af40d2d-fb8a-45ae-8e32-a34ee917a000	\N	f	f	view_submission	{"commitment_id": "c39292fe-0c72-4bb6-8f9e-fd7178450729", "submission_id": "7af40d2d-fb8a-45ae-8e32-a34ee917a000"}	high
db22de3e-d1d8-4464-874c-39bad72f81bd	2026-01-05 21:26:54.914373+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Rake leaves" for approval	c39292fe-0c72-4bb6-8f9e-fd7178450729	7af40d2d-fb8a-45ae-8e32-a34ee917a000	\N	f	f	view_submission	{"commitment_id": "c39292fe-0c72-4bb6-8f9e-fd7178450729", "submission_id": "7af40d2d-fb8a-45ae-8e32-a34ee917a000"}	high
3df19882-9b6b-4a2c-aeb7-2a48e5529a3c	2026-01-05 21:26:58.507982+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Weed garden beds" for review	0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a	9c3702a4-6705-487c-8d88-125b46b3f9a1	\N	f	f	view_submission	{"commitment_id": "0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a", "submission_id": "9c3702a4-6705-487c-8d88-125b46b3f9a1"}	high
a877b8b1-5533-40dd-a3f3-dbc884d93ada	2026-01-05 21:26:58.507982+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Weed garden beds" for approval	0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a	9c3702a4-6705-487c-8d88-125b46b3f9a1	\N	f	f	view_submission	{"commitment_id": "0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a", "submission_id": "9c3702a4-6705-487c-8d88-125b46b3f9a1"}	high
22f3c7d6-71a7-4ec6-8022-1f23234cf1e7	2026-01-05 21:27:01.662733+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	work_submitted	📸 Work Submitted	Aveya submitted "Shovel snow" for review	1529b7ba-9f8d-4f57-b024-ae9ec1ab1831	6d33bceb-2af0-46cf-95ff-e70b401d2e7f	\N	f	f	view_submission	{"commitment_id": "1529b7ba-9f8d-4f57-b024-ae9ec1ab1831", "submission_id": "6d33bceb-2af0-46cf-95ff-e70b401d2e7f"}	high
4e6f9c94-57ae-45fc-acb9-0ad324ffb865	2026-01-05 21:27:01.662733+00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	child_submitted_work	📋 Work Submitted	Aveya submitted "Shovel snow" for approval	1529b7ba-9f8d-4f57-b024-ae9ec1ab1831	6d33bceb-2af0-46cf-95ff-e70b401d2e7f	\N	f	f	view_submission	{"commitment_id": "1529b7ba-9f8d-4f57-b024-ae9ec1ab1831", "submission_id": "6d33bceb-2af0-46cf-95ff-e70b401d2e7f"}	high
5ec471a1-45e2-41b0-9240-f05e5e6fd616	2026-01-05 21:27:17.825185+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 1.8 Merets and $30.00	f715e231-e3a5-4748-a4e4-50c6278db6c6	ef7c40ba-2354-41a7-9666-491ac0498428	\N	f	f	view_task	{"commitment_id": "f715e231-e3a5-4748-a4e4-50c6278db6c6", "merets_earned": 1.800000000000000000, "submission_id": "ef7c40ba-2354-41a7-9666-491ac0498428", "quality_rating": 5, "money_earned_cents": 3000}	normal
7915da03-1c05-454e-a623-522312575bd7	2026-01-05 21:27:24.586451+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.8 Merets and $24.00	c39292fe-0c72-4bb6-8f9e-fd7178450729	7af40d2d-fb8a-45ae-8e32-a34ee917a000	\N	f	f	view_task	{"commitment_id": "c39292fe-0c72-4bb6-8f9e-fd7178450729", "merets_earned": 0.8000000000000000000040, "submission_id": "7af40d2d-fb8a-45ae-8e32-a34ee917a000", "quality_rating": 5, "money_earned_cents": 2400}	normal
fe4bf262-f3dd-4023-bc23-7a8af8fcc179	2026-01-05 21:27:32.068873+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.9 Merets and $27.00	0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a	9c3702a4-6705-487c-8d88-125b46b3f9a1	\N	f	f	view_task	{"commitment_id": "0d02f2a2-cd2b-4473-9b2c-3935d6e8a82a", "merets_earned": 0.9000000000000000000000, "submission_id": "9c3702a4-6705-487c-8d88-125b46b3f9a1", "quality_rating": 5, "money_earned_cents": 2700}	normal
ad66c5a5-037e-499e-ad0f-72bd59234fb0	2026-01-05 21:27:38.401346+00	4be9f490-66e9-48ab-833d-9fade274504d	work_approved	Task Approved! 🎉	Your task was approved with 5 stars! You earned 0.9 Merets and $27.00	1529b7ba-9f8d-4f57-b024-ae9ec1ab1831	6d33bceb-2af0-46cf-95ff-e70b401d2e7f	\N	f	f	view_task	{"commitment_id": "1529b7ba-9f8d-4f57-b024-ae9ec1ab1831", "merets_earned": 0.9000000000000000000000, "submission_id": "6d33bceb-2af0-46cf-95ff-e70b401d2e7f", "quality_rating": 5, "money_earned_cents": 2700}	normal
\.


--
-- Data for Name: pay_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pay_rates (id, skill_category, difficulty_level, base_rate_per_minute_cents, micro_task_flat_rate_cents, created_at) FROM stdin;
f49184d3-51b4-4bd5-b618-043b35562957	Dishes	1	30	200	2025-12-26 12:32:39.224459+00
a0df0254-7c9d-4ab9-b2e8-322ce3423724	Dishes	2	35	250	2025-12-26 12:32:39.224459+00
409916ad-5691-4752-bfd0-b521e377ff76	Cleaning	1	25	150	2025-12-26 12:32:39.224459+00
2b6bec24-1b7a-472e-9928-9a5b4cdbf638	Cleaning	2	30	200	2025-12-26 12:32:39.224459+00
794a7f35-36a9-49e1-a8ff-b1b2472097f2	Cleaning	3	40	300	2025-12-26 12:32:39.224459+00
2564631e-90d8-4571-98fb-f869e1c7524b	Laundry	1	25	180	2025-12-26 12:32:39.224459+00
5ef24d0c-7271-4c9b-9b04-aec8671ae755	Laundry	2	35	250	2025-12-26 12:32:39.224459+00
b6f8257d-6dc5-4a47-b643-d5f4914a9b82	Yard	1	20	150	2025-12-26 12:32:39.224459+00
fb75f418-af24-4537-8b20-52064bb20d21	Yard	2	35	300	2025-12-26 12:32:39.224459+00
582cee32-5dfa-418c-917c-79c261993be4	General	1	25	180	2025-12-26 12:32:39.224459+00
\.


--
-- Data for Name: payment_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_records (id, commitment_id, payer_id, amount_cents, payment_method, paid_at, notes, created_at) FROM stdin;
\.


--
-- Data for Name: rep_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rep_events (id, user_id, actor_user_id, commitment_id, completion_rate, quality_avg, volume_bonus, rep_score_after, meta, created_at) FROM stdin;
\.


--
-- Data for Name: savings_goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.savings_goals (id, user_id, title, description, target_amount_cents, current_amount_cents, goal_image_url, is_completed, completed_at, target_date, priority, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_assignments (id, task_template_id, user_id, commitment_id, assigned_at, status, expires_at, created_at, updated_at) FROM stdin;
49b2bf3e-c9cd-41b0-8c7d-cfe3fe016b51	77cfcf4c-023d-4ce7-aa35-3b53f98ade91	f8679515-35c0-41e7-af69-fc0a6d6c012d	1170e146-f1cd-4bdf-b347-f970293e9b88	2025-12-29 21:24:36.454102+00	claimed	\N	2025-12-29 21:24:36.454102+00	2025-12-29 21:24:36.454102+00
\.


--
-- Data for Name: task_priorities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_priorities (id, task_template_id, priority_type, is_urgent, parent_notes, custom_pay_cents, custom_effort_minutes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_templates (id, title, description, skill_category, effort_minutes, base_pay_cents, difficulty_level, is_micro_task, created_at, due_date, is_available_for_kids, max_assignments, current_assignments, parent_notes, urgency_multiplier, base_merets, issuer_id, is_recurring, recurrence_pattern, recurrence_interval, recurrence_days, recurrence_enabled, last_generated_at, next_generation_at) FROM stdin;
3fbf5c1c-e60e-49cd-9a43-fea100f50267	Take out trash	Empty kitchen trash and replace bag	Cleaning	2	100	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Daily task	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
fa4df0bb-3694-40ab-b100-b838fbdfb52d	Water plants	Water all indoor plants	General	4	250	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Check soil first	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
77ba6d7f-c0e6-47eb-a94c-a54f327b2ba0	Wipe kitchen counter	Clean and sanitize counters	Cleaning	5	300	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Use spray cleaner	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
46a25e52-09cd-4588-a16f-f03631ec3092	Empty bathroom trash	All bathroom wastebaskets	Cleaning	3	200	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Check all bathrooms	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
0acbabe7-759c-43c1-8a62-1513268f2b8a	Load dishwasher	Load dishes and start cycle	Dishes	6	400	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Scrape plates first	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
5f52d1f4-d54d-4942-b4e3-4450d98c7527	Unload dishwasher	Put away all clean dishes	Dishes	5	350	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Check if clean	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
0d3138c5-98f3-43d6-9211-8d7cbe72215f	Sweep kitchen floor	Sweep entire kitchen	Cleaning	8	500	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Get under table	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
19cc2ec9-87fb-4c46-bb2a-8cf1bf1dbba7	Clean bathroom sink	Scrub sink and faucet	Cleaning	7	450	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Use bathroom cleaner	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
3cc6fc22-1287-4cba-ae66-e090bf0b1add	Fold laundry	Fold one load of clean laundry	Laundry	10	600	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Fold neatly	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
8ff807b7-5031-460b-8a37-f57732db5c64	Make beds	Make all beds in house	General	12	700	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Straighten sheets	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
e6d927f2-de10-4b7e-a2f0-3268cbb52e06	Vacuum one room	Vacuum living room or bedroom	Cleaning	10	600	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Move small items	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
f3dfc730-49b1-488c-8b6b-f5458d3e7000	Clean mirrors	Clean all mirrors in house	Cleaning	8	500	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Glass cleaner	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
522bac05-7f40-41a3-9ce6-ca0036c9a35d	Organize shoes	Organize shoe area/closet	Organization	10	600	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Pair them up	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
2957c712-4dc7-424e-bfd6-06bc3f974c00	Mop kitchen floor	Sweep and mop kitchen	Cleaning	15	900	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Let it dry	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
67fea107-6f0c-481f-941d-c4a1f9184bc1	Clean toilet	Scrub toilet inside and out	Cleaning	10	600	1	t	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Use toilet cleaner	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
77cfcf4c-023d-4ce7-aa35-3b53f98ade91	Dust all rooms	Dust furniture in all rooms	Cleaning	20	1200	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Use microfiber cloth	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
c01d12a1-d801-4b89-9b8d-8d9a3ae6e7fc	Wash dishes by hand	Wash and dry all dishes	Dishes	15	900	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Hot soapy water	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
f605ce95-19c2-4888-8e51-d6f790761061	Clean refrigerator	Wipe shelves and throw out old food	Cleaning	20	1200	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Check dates	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
d1332d11-d6b3-438b-951b-7fe29f2e8c1f	Organize bedroom	Clean and organize entire bedroom	Organization	25	1500	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Put everything away	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
14a1bd97-f05f-41eb-8494-b416753a81bb	Wash car	Wash exterior of family car	Yard	30	1800	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Soap and rinse well	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
0b003060-c131-4770-b8c5-9506fb909ea1	Deep clean bathroom	Scrub toilet, sink, tub, floor	Cleaning	35	2100	3	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Complete clean	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
1f537dce-2a0f-45da-bbc2-2c0ea5bf2384	Vacuum whole house	Vacuum all rooms and stairs	Cleaning	30	1800	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	All floors	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
335b78f0-aa51-45c4-82ce-4ef1ea7cc35b	Do laundry start to finish	Wash, dry, fold, and put away	Laundry	90	3000	3	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Complete task	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
593c77e5-7364-460f-aee3-721379d40736	Rake leaves	Rake yard and bag leaves	Yard	40	2400	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Fill bags	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
4ab85eab-7aa7-4211-845b-75aa22ba723a	Weed garden beds	Pull weeds from all garden areas	Yard	45	2700	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Get the roots	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
4ba7470e-cc8d-44a8-84a5-fbe3785f24c2	Mow lawn	Mow front and back yard	Yard	50	3000	3	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Edge too if time	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
4704a6ab-f03c-4120-aa89-c68b7c096ef5	Clean garage	Sweep and organize garage	Organization	45	2700	3	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Make walkways clear	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
7aa4dbb6-a1f2-4edf-af14-40fa28aca312	Wash windows	Clean inside and outside windows	Cleaning	35	2100	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Both sides	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
587acf8a-de48-469e-8214-3f5ae1e5ebb8	Deep clean kitchen	Clean all surfaces, appliances, floor	Cleaning	60	2500	3	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Everything	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
5e49f378-c5fe-4746-9211-6e2e32244b9a	Organize closet	Sort and organize entire closet	Organization	60	2500	3	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Donate old items	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
3984b039-5155-4c0e-bb01-ca731b1618c5	Shovel snow	Clear driveway and walkways	Yard	45	2700	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Salt after	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
16f80882-d52c-488a-bd2e-e490db7f3a39	Wash and vacuum car interior	Complete interior detail	General	40	2400	2	f	2025-12-28 22:31:44.704524+00	\N	t	\N	0	Get all crumbs	1.00	0.00	971b6c20-1c43-4d12-a2e6-cbf6053c4706	f	\N	1	\N	t	\N	\N
a7639d2a-c35f-4f1d-91b6-1f075339d912	Product Assembly 	Pencil Refills	Product Assembly	60	2000	1	f	2026-01-01 14:36:12.026768+00	\N	t	\N	0		1.00	0.00	\N	f	\N	1	\N	t	\N	\N
09d251d7-29f1-4845-9eac-cbf69db8440c	Shovel front walkway	Clear snow from front entrance and walkway to sidewalk	Outdoor	20	800	2	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
cd5c98a5-b168-44ab-b385-1a624740340d	Shovel driveway	Clear entire driveway of snow and ice	Outdoor	45	1500	3	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
177f1ea8-e2e0-437a-a8a7-21d2c2a77e2f	Salt walkways and steps	Apply ice melt to prevent slipping hazards	Outdoor	10	300	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
3e9268d1-a640-41f2-a053-a3790f5e1574	Clear snow from car	Brush off snow and scrape ice from family car	Outdoor	15	500	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
23d7fe58-d157-4267-b485-c557f7422897	Shovel back patio	Clear snow from back door and patio area	Outdoor	20	600	2	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
02fcbf47-5156-4ff4-aeb2-8ca5fd9a76b8	Vacuum living room	Vacuum all floors and under furniture	Cleaning	20	500	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
45a84527-6b6c-473d-b606-f5816ce02c98	Vacuum bedrooms	Vacuum all bedroom floors thoroughly	Cleaning	25	600	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
34aa3a37-f04a-45d3-ba63-07196df555a6	Clean bathroom sink	Scrub sink, faucet, and counter	Cleaning	15	400	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
ff0943fa-0129-4eec-aa6c-d0229c1b811f	Clean bathroom mirror	Clean mirror and wipe down surfaces	Cleaning	8	200	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
b36a8bac-d1d7-4be0-982b-e00f5a34532a	Scrub toilet	Clean toilet bowl, seat, and base	Cleaning	15	500	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
7e951b51-af57-4ed6-a649-686834728e56	Mop kitchen floor	Sweep and mop entire kitchen floor	Cleaning	20	600	2	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
e54872b7-b197-4c3e-a96d-1378a0a27ffc	Wipe down kitchen counters	Clean and disinfect all kitchen surfaces	Cleaning	10	300	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
277d8c16-ab5a-4739-a3b6-5c33e71b7ae5	Clean microwave	Clean inside and outside of microwave	Cleaning	15	400	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
2fedf05e-243d-4a02-a620-586a7e352d4e	Dust living room	Dust all surfaces, shelves, and decorations	Cleaning	15	400	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
dd593611-c286-4021-a701-34dd753f67db	Clean windows (inside)	Clean interior windows in main rooms	Cleaning	30	800	2	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
a5e78365-4120-4934-bfa1-1198519bf479	Organize coat closet	Sort winter gear and hang up coats properly	Organization	20	500	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
3b56ae07-c341-4c46-9975-fcc41dd32184	Organize boot tray	Clean and organize winter boots and shoes	Organization	10	300	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
958cd447-5e93-462c-813a-725edf2f073f	Sort recycling	Separate and organize recycling bins	Organization	10	300	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
8f679ead-f776-4638-b937-e3edeb4f1abe	Organize pantry	Arrange food items and check expiry dates	Organization	25	700	2	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
c3b3207c-4305-4e08-a4e7-9aad8cfc775a	Tidy playroom	Put away toys and organize game area	Organization	20	600	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
1f06738f-6020-4e56-856f-648f885b0e67	Load dishwasher	Load dirty dishes and start dishwasher	Kitchen	10	300	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
5f977702-9d1d-412b-90be-9d3cb647ae7d	Unload dishwasher	Put away clean dishes in proper places	Kitchen	10	300	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
aeee8fc8-031e-400b-bdcf-c395465a8ffd	Wipe dining table	Clean table after meals	Kitchen	8	200	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
65ae6e86-6676-4c92-a428-5da57539f506	Take out kitchen trash	Empty trash and replace bag	Kitchen	8	200	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
583db4be-ee93-4d97-9d82-8db704f0401b	Prep vegetables for dinner	Wash and cut vegetables as instructed	Kitchen	20	600	2	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
d406c7a0-a6eb-4391-94c6-adb97ef298e8	Set the table	Set plates, utensils, and glasses for dinner	Kitchen	8	200	1	t	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
8805d3c6-d10c-4685-8c4b-2bfc9a7ed889	Fold laundry	Fold clean clothes from dryer	Laundry	20	500	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
3406f4d7-5b57-4252-90af-8175e086bf4f	Put away clean laundry	Sort and put away folded clothes	Laundry	15	400	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
601f8fbe-2e51-4932-98f3-99b0aebab2a6	Change bed sheets	Remove old sheets and put on fresh ones	Bedroom	20	600	2	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
b0755ec3-d047-45f4-9686-bd508c0f4f76	Tidy bedroom	Make bed, put away clothes, organize desk	Bedroom	20	500	1	f	2026-01-01 17:20:57.829738+00	\N	t	\N	0	\N	1.00	0.00	\N	f	\N	1	\N	t	\N	\N
99fa39bf-6beb-4582-84a2-13c25848d1ed	Product assembly	Pencil Refills	Product Assembl	45	1500	1	f	2026-01-01 19:05:44.015462+00	\N	t	\N	0		1.00	0.00	\N	f	\N	1	\N	t	\N	\N
4ecd4ad4-4e92-4e54-b0ff-01cbbca56d20	Play fetch with Bijou	Throw the ball for Bijou in the backyard for 15 minutes. Make sure she gets plenty of exercise!	Pet Care	15	800	1	f	2026-01-01 21:49:18.626449+00	\N	t	\N	0	\N	1.00	0.00	fdc5d741-cec1-4259-9946-62bf1b25a52a	f	\N	1	\N	t	\N	\N
f4297a12-aa41-4a39-bba9-03d9f87408e7	Refill Bijou's water bowl	Make sure Bijou has fresh, clean water. Wash the bowl first!	Pet Care	5	300	1	t	2026-01-01 21:49:18.626449+00	\N	t	\N	0	\N	1.00	0.00	fdc5d741-cec1-4259-9946-62bf1b25a52a	f	\N	1	\N	t	\N	\N
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, name, role, age, level, total_xp, total_earnings_cents, created_at, handle, avatar_url, is_earner, is_provider, rep_score, rep_event_count, merets_balance, lifetime_merets, updated_at, onboarding_completed, onboarding_step, onboarding_completed_at, tasks_completed, current_streak, longest_streak, last_completion_date, rep_title, rep_tier, total_commitments, completed_commitments, failed_commitments, average_quality_rating, consistency_score, last_rep_update, experience_hours) FROM stdin;
f8679515-35c0-41e7-af69-fc0a6d6c012d	Onyx	kid	10	2	85	87545	2025-12-26 12:32:39.224459+00	onyx	\N	t	f	25	0	30.00	51.80	2026-01-05 19:58:16.77075+00	f	0	\N	100	0	0	\N	Entry Earner	1E	0	6	0	4.52	0.00	2026-01-03 13:41:46.747412+00	46.80666666666666666667
4be9f490-66e9-48ab-833d-9fade274504d	Aveya	kid	12	3	320	143236	2025-12-26 12:32:39.224459+00	aveya	\N	t	f	30	0	0.40	81.38	2026-01-05 21:27:38.401346+00	f	0	\N	140	0	0	\N	Entry Earner	1E	0	4	0	4.50	0.00	2026-01-03 13:41:46.747412+00	72.92666666666666666664
9c3d717c-4709-4911-b77a-093dfb601cdb	Parent	parent	\N	1	0	0	2025-12-26 12:32:39.224459+00	parent	\N	f	t	50	0	0.00	0.00	2025-12-26 19:32:25.383916+00	f	0	\N	0	0	0	\N	Entry Earner	1E	0	0	0	0.00	0.00	2026-01-03 13:41:46.747412+00	0
971b6c20-1c43-4d12-a2e6-cbf6053c4706	Brett	parent	\N	1	0	0	2025-12-28 23:26:21.37464+00	\N	\N	t	f	50	0	0.00	0.00	2025-12-28 23:26:21.37464+00	f	0	\N	0	0	0	\N	Entry Earner	1E	0	0	0	0.00	0.00	2026-01-03 13:41:46.747412+00	0
658af463-a5e9-41af-a9d1-5bc771822e8e	Lauren	parent	\N	1	0	0	2025-12-28 23:26:21.459356+00	\N	\N	t	f	50	0	0.00	0.00	2025-12-28 23:26:21.459356+00	f	0	\N	0	0	0	\N	Entry Earner	1E	0	0	0	0.00	0.00	2026-01-03 13:41:46.747412+00	0
fdc5d741-cec1-4259-9946-62bf1b25a52a	Bijou	parent	\N	1	0	0	2026-01-01 21:49:18.626449+00	\N	\N	t	f	50	0	0.00	0.00	2026-01-01 21:49:18.626449+00	f	0	\N	0	0	0	\N	Entry Earner	1E	0	0	0	0.00	0.00	2026-01-03 13:41:46.747412+00	0
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
submission-photos	submission-photos	\N	2026-01-02 21:38:00.53315+00	2026-01-02 21:38:00.53315+00	t	f	\N	\N	\N	STANDARD
commitment-photos	commitment-photos	\N	2026-01-01 20:01:31.478318+00	2026-01-01 20:01:31.478318+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-12-25 23:44:25.341349
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-12-25 23:44:25.347304
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-12-25 23:44:25.350927
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-12-25 23:44:25.364638
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-12-25 23:44:25.372108
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-12-25 23:44:25.375538
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-12-25 23:44:25.379774
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-12-25 23:44:25.38419
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-12-25 23:44:25.387757
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-12-25 23:44:25.39191
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-12-25 23:44:25.396703
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-12-25 23:44:25.401163
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-12-25 23:44:25.405452
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-12-25 23:44:25.409138
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-12-25 23:44:25.41295
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-12-25 23:44:25.428953
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-12-25 23:44:25.43281
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-12-25 23:44:25.436549
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-12-25 23:44:25.439872
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-12-25 23:44:25.444017
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-12-25 23:44:25.44773
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-12-25 23:44:25.452944
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-12-25 23:44:25.463757
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-12-25 23:44:25.475474
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-12-25 23:44:25.483791
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-12-25 23:44:25.487546
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-12-25 23:44:25.491401
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-12-25 23:44:25.501916
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-12-25 23:44:25.533325
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-12-25 23:44:25.537838
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-12-25 23:44:25.542604
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-12-25 23:44:25.549156
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-12-25 23:44:25.555768
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-12-25 23:44:25.563232
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-12-25 23:44:25.56519
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-12-25 23:44:25.57187
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-12-25 23:44:25.576134
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-12-25 23:44:25.584886
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-12-25 23:44:25.588948
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2025-12-25 23:44:25.596236
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2025-12-25 23:44:25.600548
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2025-12-25 23:44:25.607227
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2025-12-25 23:44:25.61155
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2025-12-25 23:44:25.616572
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2025-12-25 23:44:25.620596
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2025-12-25 23:44:25.624744
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2025-12-25 23:44:25.635822
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2025-12-25 23:44:25.639697
48	iceberg-catalog-ids	2666dff93346e5d04e0a878416be1d5fec345d6f	2025-12-25 23:44:25.64547
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2025-12-25 23:44:25.661203
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
81beed08-1ded-4829-bca0-e07efa221101	commitment-photos	4be9f490-66e9-48ab-833d-9fade274504d/1767397192657.jpg	\N	2026-01-02 23:39:52.821525+00	2026-01-02 23:39:52.821525+00	2026-01-02 23:39:52.821525+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/heic", "cacheControl": "max-age=3600", "lastModified": "2026-01-02T23:39:52.826Z", "contentLength": 0, "httpStatusCode": 200}	f978eb2e-50d8-4a10-9dad-329284592cd6	\N	{}	2
45224e5a-e891-433e-a9e7-251f54b22ba2	commitment-photos	4be9f490-66e9-48ab-833d-9fade274504d/1767397790005.jpg	\N	2026-01-02 23:49:50.148187+00	2026-01-02 23:49:50.148187+00	2026-01-02 23:49:50.148187+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-02T23:49:50.153Z", "contentLength": 0, "httpStatusCode": 200}	d422bb40-eddb-4422-acc6-416477f62931	\N	{}	2
ae70973b-e5a4-475b-8df7-db765e0f25b1	commitment-photos	4be9f490-66e9-48ab-833d-9fade274504d/1767397922703.jpg	\N	2026-01-02 23:52:03.134376+00	2026-01-02 23:52:03.134376+00	2026-01-02 23:52:03.134376+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/heic", "cacheControl": "max-age=3600", "lastModified": "2026-01-02T23:52:03.137Z", "contentLength": 0, "httpStatusCode": 200}	bf3c147e-9cf8-4f3a-92e4-b69e3ed2e45b	\N	{}	2
8a21d9d6-ea2c-4fd2-9629-fd8c24d52729	commitment-photos	4be9f490-66e9-48ab-833d-9fade274504d/1767398201153.jpg	\N	2026-01-02 23:56:41.319931+00	2026-01-02 23:56:41.319931+00	2026-01-02 23:56:41.319931+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-02T23:56:41.324Z", "contentLength": 0, "httpStatusCode": 200}	a9d21317-4124-4aa2-9693-1763133c8310	\N	{}	2
4e2c67cf-203e-4e83-99d8-ea9f590ab0a8	commitment-photos	4be9f490-66e9-48ab-833d-9fade274504d/1767446478945.jpg	\N	2026-01-03 13:21:19.116601+00	2026-01-03 13:21:19.116601+00	2026-01-03 13:21:19.116601+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-03T13:21:19.121Z", "contentLength": 0, "httpStatusCode": 200}	ec0c774c-58b5-4860-a0e2-8c9a581699f5	\N	{}	2
cb2054fd-514e-4230-8222-693fecfda273	commitment-photos	4be9f490-66e9-48ab-833d-9fade274504d/1767460270731.jpg	\N	2026-01-03 17:11:10.918979+00	2026-01-03 17:11:10.918979+00	2026-01-03 17:11:10.918979+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-03T17:11:10.922Z", "contentLength": 0, "httpStatusCode": 200}	28bd7e6a-131f-4c21-a029-2932a2a37abe	\N	{}	2
7e45a9e6-d4e0-4e62-b9a8-06d8dfed3cde	commitment-photos	f8679515-35c0-41e7-af69-fc0a6d6c012d/1767461756242.jpg	\N	2026-01-03 17:35:56.428542+00	2026-01-03 17:35:56.428542+00	2026-01-03 17:35:56.428542+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/heic", "cacheControl": "max-age=3600", "lastModified": "2026-01-03T17:35:56.427Z", "contentLength": 0, "httpStatusCode": 200}	d72881cb-d315-4f0a-b6e9-4eaf1da12666	\N	{}	2
c3509cf2-2f0f-4441-964a-db8c54856a0d	commitment-photos	f8679515-35c0-41e7-af69-fc0a6d6c012d/1767462711591.jpg	\N	2026-01-03 17:51:51.801634+00	2026-01-03 17:51:51.801634+00	2026-01-03 17:51:51.801634+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-03T17:51:51.799Z", "contentLength": 0, "httpStatusCode": 200}	b11fbd93-feee-4cdf-a59a-24612fd6c2a3	\N	{}	2
44144895-1b82-40cb-be23-1fea64f5335e	commitment-photos	f8679515-35c0-41e7-af69-fc0a6d6c012d/1767463020955.jpg	\N	2026-01-03 17:57:01.152972+00	2026-01-03 17:57:01.152972+00	2026-01-03 17:57:01.152972+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "image/heic", "cacheControl": "max-age=3600", "lastModified": "2026-01-03T17:57:01.150Z", "contentLength": 0, "httpStatusCode": 200}	080fd5ce-ef27-4ebe-97e1-67fa4f6b4f61	\N	{}	2
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
commitment-photos	4be9f490-66e9-48ab-833d-9fade274504d	2026-01-02 23:39:52.821525+00	2026-01-02 23:39:52.821525+00
commitment-photos	f8679515-35c0-41e7-af69-fc0a6d6c012d	2026-01-03 17:35:56.428542+00	2026-01-03 17:35:56.428542+00
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: commitment_reviews commitment_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitment_reviews
    ADD CONSTRAINT commitment_reviews_pkey PRIMARY KEY (id);


--
-- Name: commitment_submissions commitment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitment_submissions
    ADD CONSTRAINT commitment_submissions_pkey PRIMARY KEY (id);


--
-- Name: commitments commitments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_pkey PRIMARY KEY (id);


--
-- Name: earning_events earning_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_events
    ADD CONSTRAINT earning_events_pkey PRIMARY KEY (id);


--
-- Name: family_relationships family_relationships_issuer_id_earner_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_relationships
    ADD CONSTRAINT family_relationships_issuer_id_earner_id_key UNIQUE (issuer_id, earner_id);


--
-- Name: family_relationships family_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_relationships
    ADD CONSTRAINT family_relationships_pkey PRIMARY KEY (id);


--
-- Name: household_members household_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_pkey PRIMARY KEY (household_id, profile_id);


--
-- Name: households households_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_pkey PRIMARY KEY (id);


--
-- Name: issuer_approvals issuer_approvals_commitment_id_issuer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issuer_approvals
    ADD CONSTRAINT issuer_approvals_commitment_id_issuer_id_key UNIQUE (commitment_id, issuer_id);


--
-- Name: issuer_approvals issuer_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issuer_approvals
    ADD CONSTRAINT issuer_approvals_pkey PRIMARY KEY (id);


--
-- Name: issuers issuers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issuers
    ADD CONSTRAINT issuers_pkey PRIMARY KEY (id);


--
-- Name: issuers issuers_user_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issuers
    ADD CONSTRAINT issuers_user_profile_id_key UNIQUE (user_profile_id);


--
-- Name: meret_events meret_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meret_events
    ADD CONSTRAINT meret_events_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pay_rates pay_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_rates
    ADD CONSTRAINT pay_rates_pkey PRIMARY KEY (id);


--
-- Name: pay_rates pay_rates_skill_category_difficulty_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_rates
    ADD CONSTRAINT pay_rates_skill_category_difficulty_level_key UNIQUE (skill_category, difficulty_level);


--
-- Name: payment_records payment_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_pkey PRIMARY KEY (id);


--
-- Name: rep_events rep_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rep_events
    ADD CONSTRAINT rep_events_pkey PRIMARY KEY (id);


--
-- Name: savings_goals savings_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_task_template_id_user_id_assigned_at_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_template_id_user_id_assigned_at_key UNIQUE (task_template_id, user_id, assigned_at);


--
-- Name: task_priorities task_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_priorities
    ADD CONSTRAINT task_priorities_pkey PRIMARY KEY (id);


--
-- Name: task_priorities task_priorities_task_template_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_priorities
    ADD CONSTRAINT task_priorities_task_template_id_key UNIQUE (task_template_id);


--
-- Name: task_templates task_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_chat_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at);


--
-- Name: idx_commitments_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commitments_due_date ON public.commitments USING btree (due_date) WHERE (due_date IS NOT NULL);


--
-- Name: idx_commitments_evidence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commitments_evidence ON public.commitments USING btree (evidence_photo_url) WHERE (evidence_photo_url IS NOT NULL);


--
-- Name: idx_commitments_issuer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commitments_issuer ON public.commitments USING btree (issuer_id);


--
-- Name: idx_commitments_scheduled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commitments_scheduled ON public.commitments USING btree (scheduled_for, status) WHERE (scheduled_for IS NOT NULL);


--
-- Name: idx_commitments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commitments_status ON public.commitments USING btree (status);


--
-- Name: idx_commitments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commitments_user_id ON public.commitments USING btree (user_id);


--
-- Name: idx_earning_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_earning_events_user ON public.earning_events USING btree (user_id);


--
-- Name: idx_family_relationships_earner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_relationships_earner ON public.family_relationships USING btree (earner_id);


--
-- Name: idx_family_relationships_issuer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_relationships_issuer ON public.family_relationships USING btree (issuer_id);


--
-- Name: idx_issuer_approvals_commitment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issuer_approvals_commitment ON public.issuer_approvals USING btree (commitment_id);


--
-- Name: idx_issuer_approvals_issuer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issuer_approvals_issuer ON public.issuer_approvals USING btree (issuer_id);


--
-- Name: idx_issuers_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issuers_active ON public.issuers USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_issuers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issuers_email ON public.issuers USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: idx_issuers_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issuers_type ON public.issuers USING btree (issuer_type);


--
-- Name: idx_issuers_user_profile; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_issuers_user_profile ON public.issuers USING btree (user_profile_id);


--
-- Name: idx_meret_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_meret_events_user ON public.meret_events USING btree (user_id);


--
-- Name: idx_notifications_commitment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_commitment ON public.notifications USING btree (commitment_id);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_recipient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_recipient ON public.notifications USING btree (recipient_id);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (notification_type);


--
-- Name: idx_payment_records_commitment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_records_commitment ON public.payment_records USING btree (commitment_id);


--
-- Name: idx_payment_records_payer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_records_payer ON public.payment_records USING btree (payer_id);


--
-- Name: idx_rep_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rep_events_user ON public.rep_events USING btree (user_id);


--
-- Name: idx_savings_goals_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_savings_goals_user ON public.savings_goals USING btree (user_id, is_completed);


--
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_status ON public.commitment_submissions USING btree (submission_status);


--
-- Name: idx_task_assignments_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_assignments_user_status ON public.task_assignments USING btree (user_id, status);


--
-- Name: idx_task_templates_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_templates_available ON public.task_templates USING btree (is_available_for_kids) WHERE (is_available_for_kids = true);


--
-- Name: idx_task_templates_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_templates_due_date ON public.task_templates USING btree (due_date) WHERE (due_date IS NOT NULL);


--
-- Name: idx_task_templates_is_micro_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_templates_is_micro_task ON public.task_templates USING btree (is_micro_task);


--
-- Name: idx_task_templates_issuer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_templates_issuer ON public.task_templates USING btree (issuer_id);


--
-- Name: idx_task_templates_recurring; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_templates_recurring ON public.task_templates USING btree (is_recurring, recurrence_enabled, next_generation_at) WHERE ((is_recurring = true) AND (recurrence_enabled = true));


--
-- Name: idx_task_templates_skill_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_templates_skill_category ON public.task_templates USING btree (skill_category);


--
-- Name: user_profiles_handle_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_profiles_handle_unique ON public.user_profiles USING btree (handle) WHERE (handle IS NOT NULL);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: family_relationships family_relationships_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER family_relationships_updated_at BEFORE UPDATE ON public.family_relationships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: issuers issuers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER issuers_updated_at BEFORE UPDATE ON public.issuers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: commitment_reviews trg_commitment_review_update_rep; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_commitment_review_update_rep AFTER INSERT ON public.commitment_reviews FOR EACH ROW EXECUTE FUNCTION public.on_commitment_review_update_rep();


--
-- Name: commitments trg_commitments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_commitments_updated_at BEFORE UPDATE ON public.commitments FOR EACH ROW EXECUTE FUNCTION public._set_updated_at();


--
-- Name: commitment_reviews trg_review_events; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_review_events AFTER INSERT ON public.commitment_reviews FOR EACH ROW EXECUTE FUNCTION public.on_commitment_review_create_events();


--
-- Name: user_profiles trigger_auto_update_rep; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_auto_update_rep BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.auto_update_rep_from_merets();


--
-- Name: commitments trigger_notify_on_commitment; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_notify_on_commitment AFTER INSERT ON public.commitments FOR EACH ROW EXECUTE FUNCTION public.notify_on_commitment();


--
-- Name: commitment_submissions trigger_notify_on_submission; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_notify_on_submission AFTER INSERT ON public.commitment_submissions FOR EACH ROW EXECUTE FUNCTION public.notify_on_submission();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id);


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.user_profiles(id);


--
-- Name: commitment_reviews commitment_reviews_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitment_reviews
    ADD CONSTRAINT commitment_reviews_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE CASCADE;


--
-- Name: commitment_reviews commitment_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitment_reviews
    ADD CONSTRAINT commitment_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.user_profiles(id);


--
-- Name: commitment_submissions commitment_submissions_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitment_submissions
    ADD CONSTRAINT commitment_submissions_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE CASCADE;


--
-- Name: commitment_submissions commitment_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitment_submissions
    ADD CONSTRAINT commitment_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.user_profiles(id);


--
-- Name: commitment_submissions commitment_submissions_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitment_submissions
    ADD CONSTRAINT commitment_submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.user_profiles(id);


--
-- Name: commitments commitments_issuer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_issuer_id_fkey FOREIGN KEY (issuer_id) REFERENCES public.user_profiles(id);


--
-- Name: commitments commitments_parent_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_parent_approver_id_fkey FOREIGN KEY (parent_approver_id) REFERENCES public.user_profiles(id);


--
-- Name: commitments commitments_parent_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_parent_task_template_id_fkey FOREIGN KEY (parent_task_template_id) REFERENCES public.task_templates(id);


--
-- Name: commitments commitments_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id);


--
-- Name: commitments commitments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commitments
    ADD CONSTRAINT commitments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id);


--
-- Name: earning_events earning_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_events
    ADD CONSTRAINT earning_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.user_profiles(id);


--
-- Name: earning_events earning_events_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_events
    ADD CONSTRAINT earning_events_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE SET NULL;


--
-- Name: earning_events earning_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earning_events
    ADD CONSTRAINT earning_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: family_relationships family_relationships_earner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_relationships
    ADD CONSTRAINT family_relationships_earner_id_fkey FOREIGN KEY (earner_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: family_relationships family_relationships_issuer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family_relationships
    ADD CONSTRAINT family_relationships_issuer_id_fkey FOREIGN KEY (issuer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: household_members household_members_household_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;


--
-- Name: household_members household_members_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.household_members
    ADD CONSTRAINT household_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: households households_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.households
    ADD CONSTRAINT households_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id);


--
-- Name: issuer_approvals issuer_approvals_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issuer_approvals
    ADD CONSTRAINT issuer_approvals_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE CASCADE;


--
-- Name: issuer_approvals issuer_approvals_issuer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issuer_approvals
    ADD CONSTRAINT issuer_approvals_issuer_id_fkey FOREIGN KEY (issuer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: issuers issuers_user_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issuers
    ADD CONSTRAINT issuers_user_profile_id_fkey FOREIGN KEY (user_profile_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: meret_events meret_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meret_events
    ADD CONSTRAINT meret_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.user_profiles(id);


--
-- Name: meret_events meret_events_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meret_events
    ADD CONSTRAINT meret_events_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE SET NULL;


--
-- Name: meret_events meret_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meret_events
    ADD CONSTRAINT meret_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.commitment_submissions(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id) ON DELETE SET NULL;


--
-- Name: payment_records payment_records_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE CASCADE;


--
-- Name: payment_records payment_records_payer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_records
    ADD CONSTRAINT payment_records_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: rep_events rep_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rep_events
    ADD CONSTRAINT rep_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.user_profiles(id);


--
-- Name: rep_events rep_events_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rep_events
    ADD CONSTRAINT rep_events_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE SET NULL;


--
-- Name: rep_events rep_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rep_events
    ADD CONSTRAINT rep_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: savings_goals savings_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.savings_goals
    ADD CONSTRAINT savings_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_commitment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_commitment_id_fkey FOREIGN KEY (commitment_id) REFERENCES public.commitments(id) ON DELETE SET NULL;


--
-- Name: task_assignments task_assignments_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id) ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: task_priorities task_priorities_task_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_priorities
    ADD CONSTRAINT task_priorities_task_template_id_fkey FOREIGN KEY (task_template_id) REFERENCES public.task_templates(id) ON DELETE CASCADE;


--
-- Name: task_templates task_templates_issuer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_templates
    ADD CONSTRAINT task_templates_issuer_id_fkey FOREIGN KEY (issuer_id) REFERENCES public.user_profiles(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages Allow all operations on chat_messages; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on chat_messages" ON public.chat_messages TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: commitment_submissions Allow all operations on commitment_submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on commitment_submissions" ON public.commitment_submissions TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: commitments Allow all operations on commitments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on commitments" ON public.commitments TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: issuers Allow all operations on issuers; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on issuers" ON public.issuers TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: pay_rates Allow all operations on pay_rates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on pay_rates" ON public.pay_rates TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: task_assignments Allow all operations on task_assignments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on task_assignments" ON public.task_assignments TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: task_priorities Allow all operations on task_priorities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on task_priorities" ON public.task_priorities TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: task_templates Allow all operations on task_templates; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on task_templates" ON public.task_templates TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: user_profiles Allow all operations on user_profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles TO authenticated, anon USING (true) WITH CHECK (true);


--
-- Name: notifications System can create notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: notifications System can insert notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: savings_goals Users can create their own goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own goals" ON public.savings_goals FOR INSERT WITH CHECK (true);


--
-- Name: savings_goals Users can delete their own goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own goals" ON public.savings_goals FOR DELETE USING (true);


--
-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (true);


--
-- Name: savings_goals Users can update their own goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own goals" ON public.savings_goals FOR UPDATE USING (true);


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: savings_goals Users can view their own goals; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own goals" ON public.savings_goals FOR SELECT USING (true);


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (true);


--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: commitment_reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.commitment_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: commitment_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.commitment_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: commitments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

--
-- Name: earning_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.earning_events ENABLE ROW LEVEL SECURITY;

--
-- Name: earning_events earning_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY earning_select ON public.earning_events FOR SELECT USING (true);


--
-- Name: family_relationships; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: family_relationships family_relationships_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY family_relationships_insert ON public.family_relationships FOR INSERT WITH CHECK (true);


--
-- Name: family_relationships family_relationships_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY family_relationships_select ON public.family_relationships FOR SELECT USING (true);


--
-- Name: family_relationships family_relationships_update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY family_relationships_update ON public.family_relationships FOR UPDATE USING (true);


--
-- Name: household_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

--
-- Name: households; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

--
-- Name: issuer_approvals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.issuer_approvals ENABLE ROW LEVEL SECURITY;

--
-- Name: issuer_approvals issuer_approvals_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY issuer_approvals_insert ON public.issuer_approvals FOR INSERT WITH CHECK (true);


--
-- Name: issuer_approvals issuer_approvals_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY issuer_approvals_select ON public.issuer_approvals FOR SELECT USING (true);


--
-- Name: issuers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.issuers ENABLE ROW LEVEL SECURITY;

--
-- Name: meret_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.meret_events ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: pay_rates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pay_rates ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_records payment_records_insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payment_records_insert ON public.payment_records FOR INSERT WITH CHECK (true);


--
-- Name: payment_records payment_records_select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY payment_records_select ON public.payment_records FOR SELECT USING (true);


--
-- Name: rep_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rep_events ENABLE ROW LEVEL SECURITY;

--
-- Name: savings_goals; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

--
-- Name: task_assignments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: task_priorities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.task_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: task_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Allow anon to upload photos pwbos9_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow anon to upload photos pwbos9_0" ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK ((bucket_id = 'commitment-photos'::text));


--
-- Name: objects Allow authenticated uploads; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'submission-photos'::text));


--
-- Name: objects Allow authenticated uploads commitment; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow authenticated uploads commitment" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'commitment-photos'::text));


--
-- Name: objects Allow public reads; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING ((bucket_id = 'submission-photos'::text));


--
-- Name: objects Allow public reads commitment; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow public reads commitment" ON storage.objects FOR SELECT USING ((bucket_id = 'commitment-photos'::text));


--
-- Name: objects Allow users to delete commitment photos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow users to delete commitment photos" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'commitment-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Allow users to delete their own photos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Allow users to delete their own photos" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'submission-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Anyone can view photos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Anyone can view photos" ON storage.objects FOR SELECT USING ((bucket_id = 'commitment-photos'::text));


--
-- Name: objects Users can delete their own photos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users can delete their own photos" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'commitment-photos'::text));


--
-- Name: objects Users can upload their own photos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--

CREATE POLICY "Users can upload their own photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'commitment-photos'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION _set_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public._set_updated_at() TO anon;
GRANT ALL ON FUNCTION public._set_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public._set_updated_at() TO service_role;


--
-- Name: FUNCTION apply_approval_fixes(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.apply_approval_fixes() TO anon;
GRANT ALL ON FUNCTION public.apply_approval_fixes() TO authenticated;
GRANT ALL ON FUNCTION public.apply_approval_fixes() TO service_role;


--
-- Name: FUNCTION approve_submission(p_submission_id uuid, p_quality_rating integer, p_reviewed_by uuid, p_reviewer_notes text, p_bonus_tip_cents integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.approve_submission(p_submission_id uuid, p_quality_rating integer, p_reviewed_by uuid, p_reviewer_notes text, p_bonus_tip_cents integer) TO anon;
GRANT ALL ON FUNCTION public.approve_submission(p_submission_id uuid, p_quality_rating integer, p_reviewed_by uuid, p_reviewer_notes text, p_bonus_tip_cents integer) TO authenticated;
GRANT ALL ON FUNCTION public.approve_submission(p_submission_id uuid, p_quality_rating integer, p_reviewed_by uuid, p_reviewer_notes text, p_bonus_tip_cents integer) TO service_role;


--
-- Name: FUNCTION auto_update_rep_from_merets(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.auto_update_rep_from_merets() TO anon;
GRANT ALL ON FUNCTION public.auto_update_rep_from_merets() TO authenticated;
GRANT ALL ON FUNCTION public.auto_update_rep_from_merets() TO service_role;


--
-- Name: FUNCTION calculate_composite_rep(p_earner_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_composite_rep(p_earner_id uuid) TO anon;
GRANT ALL ON FUNCTION public.calculate_composite_rep(p_earner_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_composite_rep(p_earner_id uuid) TO service_role;


--
-- Name: FUNCTION calculate_rep_from_merets(p_total_merets numeric, p_avg_quality_rating numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_rep_from_merets(p_total_merets numeric, p_avg_quality_rating numeric) TO anon;
GRANT ALL ON FUNCTION public.calculate_rep_from_merets(p_total_merets numeric, p_avg_quality_rating numeric) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_rep_from_merets(p_total_merets numeric, p_avg_quality_rating numeric) TO service_role;


--
-- Name: FUNCTION calculate_rep_level_from_merets(total_merets numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_rep_level_from_merets(total_merets numeric) TO anon;
GRANT ALL ON FUNCTION public.calculate_rep_level_from_merets(total_merets numeric) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_rep_level_from_merets(total_merets numeric) TO service_role;


--
-- Name: FUNCTION calculate_rep_score_with_attribution(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_rep_score_with_attribution(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.calculate_rep_score_with_attribution(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_rep_score_with_attribution(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION claim_marketplace_task(p_user_id uuid, p_task_template_id uuid, p_kid_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.claim_marketplace_task(p_user_id uuid, p_task_template_id uuid, p_kid_notes text) TO anon;
GRANT ALL ON FUNCTION public.claim_marketplace_task(p_user_id uuid, p_task_template_id uuid, p_kid_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.claim_marketplace_task(p_user_id uuid, p_task_template_id uuid, p_kid_notes text) TO service_role;


--
-- Name: FUNCTION generate_recurring_tasks(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_recurring_tasks() TO anon;
GRANT ALL ON FUNCTION public.generate_recurring_tasks() TO authenticated;
GRANT ALL ON FUNCTION public.generate_recurring_tasks() TO service_role;


--
-- Name: FUNCTION get_earner_commitments_by_issuer(p_earner_id uuid, p_issuer_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_earner_commitments_by_issuer(p_earner_id uuid, p_issuer_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_earner_commitments_by_issuer(p_earner_id uuid, p_issuer_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_earner_commitments_by_issuer(p_earner_id uuid, p_issuer_id uuid) TO service_role;


--
-- Name: FUNCTION get_earner_issuers(p_earner_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_earner_issuers(p_earner_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_earner_issuers(p_earner_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_earner_issuers(p_earner_id uuid) TO service_role;


--
-- Name: FUNCTION get_issuer_all_commitments(p_issuer_user_profile_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_issuer_all_commitments(p_issuer_user_profile_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_issuer_all_commitments(p_issuer_user_profile_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_issuer_all_commitments(p_issuer_user_profile_id uuid) TO service_role;


--
-- Name: FUNCTION get_issuer_by_user_profile(p_user_profile_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_issuer_by_user_profile(p_user_profile_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_issuer_by_user_profile(p_user_profile_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_issuer_by_user_profile(p_user_profile_id uuid) TO service_role;


--
-- Name: FUNCTION get_issuer_stats(p_issuer_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_issuer_stats(p_issuer_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_issuer_stats(p_issuer_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_issuer_stats(p_issuer_id uuid) TO service_role;


--
-- Name: FUNCTION get_issuer_tasks_dashboard(p_issuer_user_profile_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_issuer_tasks_dashboard(p_issuer_user_profile_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_issuer_tasks_dashboard(p_issuer_user_profile_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_issuer_tasks_dashboard(p_issuer_user_profile_id uuid) TO service_role;


--
-- Name: FUNCTION get_marketplace_tasks(p_user_id uuid, p_min_pay_cents integer, p_max_pay_cents integer, p_min_effort_minutes integer, p_max_effort_minutes integer, p_skill_category text, p_is_micro_task boolean, p_sort_by text, p_sort_order text, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_marketplace_tasks(p_user_id uuid, p_min_pay_cents integer, p_max_pay_cents integer, p_min_effort_minutes integer, p_max_effort_minutes integer, p_skill_category text, p_is_micro_task boolean, p_sort_by text, p_sort_order text, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_marketplace_tasks(p_user_id uuid, p_min_pay_cents integer, p_max_pay_cents integer, p_min_effort_minutes integer, p_max_effort_minutes integer, p_skill_category text, p_is_micro_task boolean, p_sort_by text, p_sort_order text, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_marketplace_tasks(p_user_id uuid, p_min_pay_cents integer, p_max_pay_cents integer, p_min_effort_minutes integer, p_max_effort_minutes integer, p_skill_category text, p_is_micro_task boolean, p_sort_by text, p_sort_order text, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_prioritized_tasks_for_display(p_skill_category text, p_is_micro_task boolean, p_limit integer, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_prioritized_tasks_for_display(p_skill_category text, p_is_micro_task boolean, p_limit integer, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_prioritized_tasks_for_display(p_skill_category text, p_is_micro_task boolean, p_limit integer, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_prioritized_tasks_for_display(p_skill_category text, p_is_micro_task boolean, p_limit integer, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_task_commitments_with_parents(p_task_template_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_task_commitments_with_parents(p_task_template_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_task_commitments_with_parents(p_task_template_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_task_commitments_with_parents(p_task_template_id uuid) TO service_role;


--
-- Name: FUNCTION get_unread_count(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_unread_count(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_unread_count(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_unread_count(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION mark_all_read(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_all_read(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.mark_all_read(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.mark_all_read(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION mark_notification_read(p_notification_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_notification_read(p_notification_id uuid) TO anon;
GRANT ALL ON FUNCTION public.mark_notification_read(p_notification_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.mark_notification_read(p_notification_id uuid) TO service_role;


--
-- Name: FUNCTION merets_multiplier(quality_stars integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.merets_multiplier(quality_stars integer) TO anon;
GRANT ALL ON FUNCTION public.merets_multiplier(quality_stars integer) TO authenticated;
GRANT ALL ON FUNCTION public.merets_multiplier(quality_stars integer) TO service_role;


--
-- Name: FUNCTION merets_required_for_level(target_level integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.merets_required_for_level(target_level integer) TO anon;
GRANT ALL ON FUNCTION public.merets_required_for_level(target_level integer) TO authenticated;
GRANT ALL ON FUNCTION public.merets_required_for_level(target_level integer) TO service_role;


--
-- Name: FUNCTION notify_on_commitment(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_on_commitment() TO anon;
GRANT ALL ON FUNCTION public.notify_on_commitment() TO authenticated;
GRANT ALL ON FUNCTION public.notify_on_commitment() TO service_role;


--
-- Name: FUNCTION notify_on_submission(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_on_submission() TO anon;
GRANT ALL ON FUNCTION public.notify_on_submission() TO authenticated;
GRANT ALL ON FUNCTION public.notify_on_submission() TO service_role;


--
-- Name: FUNCTION on_commitment_review_create_events(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_commitment_review_create_events() TO anon;
GRANT ALL ON FUNCTION public.on_commitment_review_create_events() TO authenticated;
GRANT ALL ON FUNCTION public.on_commitment_review_create_events() TO service_role;


--
-- Name: FUNCTION on_commitment_review_update_rep(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_commitment_review_update_rep() TO anon;
GRANT ALL ON FUNCTION public.on_commitment_review_update_rep() TO authenticated;
GRANT ALL ON FUNCTION public.on_commitment_review_update_rep() TO service_role;


--
-- Name: FUNCTION on_commitment_status_change_update_rep(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_commitment_status_change_update_rep() TO anon;
GRANT ALL ON FUNCTION public.on_commitment_status_change_update_rep() TO authenticated;
GRANT ALL ON FUNCTION public.on_commitment_status_change_update_rep() TO service_role;


--
-- Name: FUNCTION quality_multiplier_for_rating(rating integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.quality_multiplier_for_rating(rating integer) TO anon;
GRANT ALL ON FUNCTION public.quality_multiplier_for_rating(rating integer) TO authenticated;
GRANT ALL ON FUNCTION public.quality_multiplier_for_rating(rating integer) TO service_role;


--
-- Name: FUNCTION reject_submission(p_submission_id uuid, p_reviewer_id uuid, p_rejection_reason text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.reject_submission(p_submission_id uuid, p_reviewer_id uuid, p_rejection_reason text) TO anon;
GRANT ALL ON FUNCTION public.reject_submission(p_submission_id uuid, p_reviewer_id uuid, p_rejection_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.reject_submission(p_submission_id uuid, p_reviewer_id uuid, p_rejection_reason text) TO service_role;


--
-- Name: FUNCTION send_notification(p_recipient_id uuid, p_type text, p_title text, p_message text, p_commitment_id uuid, p_submission_id uuid, p_task_template_id uuid, p_action_type text, p_action_data jsonb, p_priority text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.send_notification(p_recipient_id uuid, p_type text, p_title text, p_message text, p_commitment_id uuid, p_submission_id uuid, p_task_template_id uuid, p_action_type text, p_action_data jsonb, p_priority text) TO anon;
GRANT ALL ON FUNCTION public.send_notification(p_recipient_id uuid, p_type text, p_title text, p_message text, p_commitment_id uuid, p_submission_id uuid, p_task_template_id uuid, p_action_type text, p_action_data jsonb, p_priority text) TO authenticated;
GRANT ALL ON FUNCTION public.send_notification(p_recipient_id uuid, p_type text, p_title text, p_message text, p_commitment_id uuid, p_submission_id uuid, p_task_template_id uuid, p_action_type text, p_action_data jsonb, p_priority text) TO service_role;


--
-- Name: FUNCTION update_rep_on_event(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_rep_on_event() TO anon;
GRANT ALL ON FUNCTION public.update_rep_on_event() TO authenticated;
GRANT ALL ON FUNCTION public.update_rep_on_event() TO service_role;


--
-- Name: FUNCTION update_savings_goal_progress(p_goal_id uuid, p_amount_cents integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_savings_goal_progress(p_goal_id uuid, p_amount_cents integer) TO anon;
GRANT ALL ON FUNCTION public.update_savings_goal_progress(p_goal_id uuid, p_amount_cents integer) TO authenticated;
GRANT ALL ON FUNCTION public.update_savings_goal_progress(p_goal_id uuid, p_amount_cents integer) TO service_role;


--
-- Name: FUNCTION update_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at() TO service_role;


--
-- Name: FUNCTION update_user_rep_with_attribution(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_user_rep_with_attribution() TO anon;
GRANT ALL ON FUNCTION public.update_user_rep_with_attribution() TO authenticated;
GRANT ALL ON FUNCTION public.update_user_rep_with_attribution() TO service_role;


--
-- Name: FUNCTION update_user_streak(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_user_streak(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.update_user_streak(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.update_user_streak(p_user_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE task_priorities; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.task_priorities TO anon;
GRANT ALL ON TABLE public.task_priorities TO authenticated;
GRANT ALL ON TABLE public.task_priorities TO service_role;


--
-- Name: TABLE task_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.task_templates TO anon;
GRANT ALL ON TABLE public.task_templates TO authenticated;
GRANT ALL ON TABLE public.task_templates TO service_role;


--
-- Name: TABLE available_tasks_for_kids; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.available_tasks_for_kids TO anon;
GRANT ALL ON TABLE public.available_tasks_for_kids TO authenticated;
GRANT ALL ON TABLE public.available_tasks_for_kids TO service_role;


--
-- Name: TABLE chat_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.chat_messages TO anon;
GRANT ALL ON TABLE public.chat_messages TO authenticated;
GRANT ALL ON TABLE public.chat_messages TO service_role;


--
-- Name: TABLE commitment_reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.commitment_reviews TO anon;
GRANT ALL ON TABLE public.commitment_reviews TO authenticated;
GRANT ALL ON TABLE public.commitment_reviews TO service_role;


--
-- Name: TABLE commitment_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.commitment_submissions TO anon;
GRANT ALL ON TABLE public.commitment_submissions TO authenticated;
GRANT ALL ON TABLE public.commitment_submissions TO service_role;


--
-- Name: TABLE commitments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.commitments TO anon;
GRANT ALL ON TABLE public.commitments TO authenticated;
GRANT ALL ON TABLE public.commitments TO service_role;


--
-- Name: TABLE earning_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.earning_events TO anon;
GRANT ALL ON TABLE public.earning_events TO authenticated;
GRANT ALL ON TABLE public.earning_events TO service_role;


--
-- Name: TABLE family_relationships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.family_relationships TO anon;
GRANT ALL ON TABLE public.family_relationships TO authenticated;
GRANT ALL ON TABLE public.family_relationships TO service_role;


--
-- Name: TABLE household_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.household_members TO anon;
GRANT ALL ON TABLE public.household_members TO authenticated;
GRANT ALL ON TABLE public.household_members TO service_role;


--
-- Name: TABLE households; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.households TO anon;
GRANT ALL ON TABLE public.households TO authenticated;
GRANT ALL ON TABLE public.households TO service_role;


--
-- Name: TABLE issuer_approvals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.issuer_approvals TO anon;
GRANT ALL ON TABLE public.issuer_approvals TO authenticated;
GRANT ALL ON TABLE public.issuer_approvals TO service_role;


--
-- Name: TABLE issuers; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.issuers TO anon;
GRANT ALL ON TABLE public.issuers TO authenticated;
GRANT ALL ON TABLE public.issuers TO service_role;


--
-- Name: TABLE meret_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.meret_events TO anon;
GRANT ALL ON TABLE public.meret_events TO authenticated;
GRANT ALL ON TABLE public.meret_events TO service_role;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO anon;
GRANT ALL ON TABLE public.notifications TO authenticated;
GRANT ALL ON TABLE public.notifications TO service_role;


--
-- Name: TABLE pay_rates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pay_rates TO anon;
GRANT ALL ON TABLE public.pay_rates TO authenticated;
GRANT ALL ON TABLE public.pay_rates TO service_role;


--
-- Name: TABLE payment_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_records TO anon;
GRANT ALL ON TABLE public.payment_records TO authenticated;
GRANT ALL ON TABLE public.payment_records TO service_role;


--
-- Name: TABLE rep_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rep_events TO anon;
GRANT ALL ON TABLE public.rep_events TO authenticated;
GRANT ALL ON TABLE public.rep_events TO service_role;


--
-- Name: TABLE savings_goals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.savings_goals TO anon;
GRANT ALL ON TABLE public.savings_goals TO authenticated;
GRANT ALL ON TABLE public.savings_goals TO service_role;


--
-- Name: TABLE task_assignments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.task_assignments TO anon;
GRANT ALL ON TABLE public.task_assignments TO authenticated;
GRANT ALL ON TABLE public.task_assignments TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: TABLE v_active_recurring_tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_active_recurring_tasks TO anon;
GRANT ALL ON TABLE public.v_active_recurring_tasks TO authenticated;
GRANT ALL ON TABLE public.v_active_recurring_tasks TO service_role;


--
-- Name: TABLE v_commitments_with_relationships; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_commitments_with_relationships TO anon;
GRANT ALL ON TABLE public.v_commitments_with_relationships TO authenticated;
GRANT ALL ON TABLE public.v_commitments_with_relationships TO service_role;


--
-- Name: TABLE v_issuer_tasks_with_commitments; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_issuer_tasks_with_commitments TO anon;
GRANT ALL ON TABLE public.v_issuer_tasks_with_commitments TO authenticated;
GRANT ALL ON TABLE public.v_issuer_tasks_with_commitments TO service_role;


--
-- Name: TABLE v_user_earnings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.v_user_earnings TO anon;
GRANT ALL ON TABLE public.v_user_earnings TO authenticated;
GRANT ALL ON TABLE public.v_user_earnings TO service_role;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict SvBQMSMdQZf0P9xaF7V6vtete0bHtKnoFo6i8EnR9RjjQ5q1CPVrFwWGoRhEo5q

