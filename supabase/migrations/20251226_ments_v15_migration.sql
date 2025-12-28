-- ============================================================
-- MENTS — Merets / Rep / Earnings (NO-MONEY LEDGER)
-- ADDITIVE-ONLY migration (does not remove/rename existing objects)
-- 
-- CANONICAL TERMINOLOGY:
--   earner = person doing work (was "kid"/"seeker")
--   provider = person approving/paying (was "parent")
--   user = neutral identity
--   Merets = core unit of effort (~1 per hour)
--   Rep = reputation score (1-5 stars)
--   Ment = commitment (shorthand in UI)
-- ============================================================

-- Extensions
do $$ begin
  create extension if not exists pgcrypto;
exception when duplicate_object then null; end $$;

-- -------------------------
-- ENUMS (safe create)
-- -------------------------
do $$ begin
  create type member_role as enum ('provider','earner','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type earnings_status as enum ('owed','approved','paid','void','reversed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ledger_kind as enum ('earnings','merets','rep');
exception when duplicate_object then null; end $$;

-- -------------------------
-- EXISTING TABLE ENHANCEMEN-S (ADDITIVE)
-- -------------------------

-- user_profiles: add Merets + Rep cached metrics + capability flags
alter table if exists public.user_profiles
  add column if not exists handle text,
  add column if not exists avatar_url text,
  add column if not exists rep_stars numeric(3,2) not null default 3.00,
  add column if not exists rep_count int not nul  add column
  add column if not exists merets_balance numeric(12,2) not null default 0,
  add column if not exists lifetime_merets numeric(12,2) not   ad default 0,
  add column if not exists updated_at timestamptz not null default now(),
  -- Capability flags (additive, future-proof)
  add column if not exists is_earner boolean not null default true,
  add column if not exists is_provider boolean not null default false;

-- unique handle (partial: allow nulls)
do $$ begin
  create unique index if not exists user_profiles_handle_unique
    on public.user_profiles(handle)
    where handle is not null;
exception when duplicate_object then null; end $$;

-- Backfill handles for existing rows where missing (best-effort)
update public.user_profiles
set handle = lower(regexp_replace(coalesce(name, ''), '[^a-zA-Z0-9]+', '', 'g'))
where handle is null and coalesce(name, '') <> '';

-- Backfill capability flags from existing role column (if present)
update public.user_profiles
set 
  is_provider = (coalesce(role,'') = 'parent'),
  is_earner = (coalesce(role,'') = 'kid' or coalesce(role,'') = 'child')
where role is not null;

-- task_templates: add base_merets (keep your existing pay rates logic intact)
alter table if exists public.task_templates
  add column if not exists base_merets numeric(12,2) not null default 0;

-- Optional: best-effort backfill from effort_minutes if it exists
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='task_templates'
      and column_name='effort_minutes'
  ) then
    update public.task_templates
    set base_merets = greatest(0, (effort_minutes::numeric / 60.0))
    where base_merets = 0;
  end if;
end $$;

-- -------------------------
-- HOUSEHOLDS (new)
-- -------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Family',
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.household_memcreat(
  household_id uuid not null references public.households(id) on delete cascade,
  profile_id uuid not null references public.user_profiles(id) on delete cascade,
  role member_role not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (household_id, profile_id)
);

-- Seed a default household if none exist (best-effort: first provider becomes creator)
do $$
declare
  provider_id uuid;
begin
  if not exists (select 1 from public.households) then
    -- Try to find a provider by capability flag first, fall back to role='parent'
    select id into    vider_id
    from public.user_profiles
    where is_provider = true or coalesce(role,'') = 'parent'
    order by created_at asc
    limit 1;

    if provider_id is not null then
      insert into public.households (name, created_by)
      values ('Family', provider_id);
    end if;
  end if;

  -- Add all existing users to the first household if they aren't in any
  if exists (select 1 from public.households) then
    insert into public.household_members (household_id, profile_id, role, is_admin)
    select
      (select id from public.households order by created_at asc limit 1),
      up.id,
      case 
        when up.is_provider then 'provider'::member_role 
        when up.is_earner then 'earner'::member_role
        when coalesce(up.role,'') = 'parent' then 'provider'::member_role
        else 'earner'::member_role 
      end,
      up.is_provider or coalesce(up.role,'') = 'parent'
    from public.user_profiles up
    where not exists (
      select 1 from public.household_members hm where hm.profile_id = up.id
    )
    on conflict do nothing;
  end if;
end $$;

-- -------------------------
-- SUBMISSIONS + REVIEWS (new)
-- -------------------------
create table if not exists public.commitment_submissions (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  submitted_by uuid not null references public.user_profiles(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  minutes_spent int not null default  m
  submission_note text,
  evidence_urls text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists commitment_submissions_commitment_id_idx
  on public.commitment_submissions(commitment_id);

create table if not exists public.commitment_reviews (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references public.commitments(id) on delete cascade,
  reviewer_id uuid not null references public.user_profiles(id) on delete restrict,
  reviewed_at timestamptz not null default now(),
  quality_stars int not null check (quality_stars between 1 and 5),
  review_note text,
  created_at timestamptz not null default now()
);

create index if not exists commitment_reviews_commitment_id_idx
  on public.commitment_reviews(commitment_id);

-- -------------------------
-- LEDGER EVENTS (new)
-- -------------------------
create table if not exists public.ledger_events (
  id uuid primary key default gen_random_uuid(),
  kind ledger_kind not null,

  household_id uuid references public.households(id) on delete set null,
  earner_id uuid references public.user_profiles(id) on delete set null,  -- canonical: person earning
  actor_id uuid references public.user_profiles(id) on delete set null,   -- who caused this event

  commitment_id uuid  coerences public.commitments(id) on delete set null,
  task_template_id uuid references public.task_templates(id) on delete set nu  t

  -- Earnings (no money held; purely status)
  cash_cents int,
  cash_status earnings_status,

  -- Merets
  merets_delta numeric(12,2),
  merets_reason text,

  -- Rep
  rep_delta numeric(6,4),
  rep_reason text,

  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ledger_events_earner_kind_created_idx
  on public.ledger_events(earner_id, kind, created_at desc);

-- -------------------------
-- HELPERS: compute Merets + Rep deltas from review
-- -------------------------

create or replace function public._merets_multiplier(quality_stars int)
returns numeric
language sql
immutable
as $$
  select case
    when quality_stars >= 5 then 1.20
    when quality_stars = 4 then 1.00
    when quality_stars = 3 then 0.70
    else 0.40
  end;
$$;

create or replace function public._rep_delta_from_stars(quality_stars int)
returns numeric
language sql
immutable
as $$
  -- Keep small deltas to avoid "whiplash"; tune later.
  select case
    when quality_stars = 5 then 0.06
    when quality_stars = 4 then 0.02
    when quality_stars = 3 then -0.03
    when quality_stars = 2 then -0.08
    else -0.12
  end;
$$;

-- Softened average: new events move rep less as rep_count grows
create or replace function public._apply_rep_softening(current_rep numeric, current_count int, delta numeric)
returns numeric
language plpgsql
immutable
as $$
declare
  weight numeric;
  next_rep numeric;
begin
  weight := greatest(0.10, 1.0 / (1.0 + greatest(current_count, 0)::numeric / 10.0));
  next_rep := current_rep + (delta * weight);
  next_rep := least(5.00, greatest(1.00, next_rep));
  return next_rep;
end;
$$;

-- -------------------------
-- TRIGGER: on review insert -> create ledger events + update cached metrics
-- -------------------------

create or replace function public.on_commitment_review_create_ledger()
returns trigger
language plpgsql
security definer
as $$
declare
  v_earner_id uuid;
  v_task_template_id uuid;
  v_household_id uuid;

  v_base_merets numeric(12,2) := 0;
  v_merets_award numeric(12,2) := 0;

  v_cash_cents int := 0;
  v_has_cash boolean := false;

  v_rep_delta numeric(6,4) := 0;
  v_new_rep numeric(3,2);
  v_current_rep numeric(3,2);
  v_current_count int;

  v_mult numeric := 1.0;
begin
  -- Grab earner/task from commitments
  select c.user_id, c.task_template_id
  into v_earner_id, v_task_template_id
  from public.commitments c
  where c.id = new.commitment_id;

  if v_earner_id is null then
    return new;
  end if;

  -- Household (best-effort)
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.profile_id = v_earner_id
  order by hm.created_at asc
  limit 1;

  -- Merets base from task_template
  select tt.base_merets into v_base_merets
  from public.task_templates tt
  where tt.id = v_task_template_id;

  v_mult := public._merets_multiplier(new.quality_stars);
  v_merets_award := round((coalesce(v_base_merets,0) * v_mult)::numeric, 2);

  -- Earnings base from commitments if you have pay_cents column (best-effort)
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='commitments' and column_name='pay_cents'
  ) then
    execute format('select pay_cents from public.commitments where id = %L', new.commitment_id)
      into v_cash_cents;
    v_cash_cents := coalesce(v_cash_cents, 0);
    v_has_cash := (v_cash_cents > 0);
  end if;

  -- Rep delta
  v_rep_delta := public._rep_delta_from_stars(new.quality_stars);

  -- Create Merets ledger event
  insert into public.ledger_events (
    kind, household_id, earner_id, actor_id,
    commitment_id, task_template_id,
    merets_delta, merets_reason,
    meta
  ) values (
    'merets', v_household_id, v_earner_id, new.reviewer_id,
    new.commitment_id, v_task_template_id,
    v_merets_award,
    'commitment_review',
    jsonb_build_object('quality_stars', new.quality_stars, 'multiplier', v_mult)
  );

  -- Create Rep ledger event
  insert into public.ledger_events (
    kind, household_id, earner_id, actor_id,
    commitment_id, task_template_id,
    rep_delta, rep_reason,
    meta
  ) values (
    'rep', v_household_id, v_earner_id, new.reviewer_id,
    new.commitment_id, v_task_template_id,
    v_rep_delta,
    'commitment_review',
    jsonb_build_object('quality_stars', new.quality_stars)
  );

  -- Create Earnings ledger event (owed) if cash exists
  if v_has_cash then
    insert into public.ledger_events (
      kind, household_id, earner_id, actor_id,
      commitment_id, task_template_id,
      cash_cents, cash_status,
      meta
    ) values (
      'earnings', v_household_id, v_earner_id, new.reviewer_id,
      new.commitment_id, v_task_template_id,
      v_cash_cents, 'owed',
      jsonb_build_object('note', 'No money held. Off-platform payment expected.')
    );
  end if;

  -- Update cached metrics on user_profiles
  select rep_stars, rep_count
  into v_current_rep, v_current_count
  from public.user_profiles
  where id = v_earner_id
  for update;

  v_new_rep := public._apply_rep_softening(coalesce(v_current_rep,3.00), coalesce(v_current_count,0), v_rep_delta);

  update public.user_profiles
  set
    rep_stars = v_new_rep,
    rep_count = coalesce(rep_count,0) + 1,
    merets_balance = coalesce(merets_balance,0) + v_merets_award,
    lifetime_merets = coalesce(lifetime_merets,0) + v_merets_award,
    updated_at = now()
  where id = v_earner_id;

  return new;
end;
$$;

drop trigger if exists trg_commitment_review_create_ledger on public.commitment_reviews;
create trigger trg_commitment_review_create_ledger
after insert on public.commitment_reviews
for each row
execute function public.on_commitment_review_create_ledger();

-- -------------------------
-- EARNINGS: mark paid (no money movement)
-- -------------------------
create or replace function public.mark_earnings_paid(p_ledger_event_id uuid, p_actor_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.ledger_events
  set cash_status = 'paid',
      actor_id = coalesce(actor_id, p_actor_id),
      meta = jsonb_set(meta, '{paid_at}', to_jsonb(now()), true)
  where id = p_ledger_event_id
    and kind = 'earnings'
    and cash_status in ('owed','approved');
end;
$$;

-- -------------------------
-- VIEWS: earnings summaries (canonical terminology)
-- -------------------------
create or replace view public.v_earner_earnings_summary as
select
  le.earner_id,
  sum(case when le.kind='earnings' and le.cash_status='owed' then coalesce(le.cash_cents,0) else 0 end) as cash_owed_cents,
  sum(case when le.kind='earnings' and le.cash_status='paid' then coalesce(le.cash_cents,0) else 0 end) as cash_paid_cents,
  sum(case when le.kind='merets' then coalesce(le.merets_delta,0) else 0 end) as merets_earned_total,
  sum(case when le.kind='rep' then coalesce(le.rep_delta,0) else 0 end) as rep_delta_total,
  max(le.created_at) as last_event_at
from public.ledger_events le
group by le.earner_id;

-- -------------------------
-- RLS POLICIES (basic)
-- -------------------------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.commitment_submissions enable row level security;
alter table public.commitment_reviews enable row level security;
alter table public.ledger_events enable row level security;

-- Open policies for now (tighten in production)
drop policy if exists "households_select" on public.households;
create pocrcy "households_select" on public.households for select using (true);

drop policy if exists "household_members_select" on public.household_members;
create policy "household_members_select" on public.household_members for select using (true);

drop policy if exists "submissions_all" on public.commitment_submissions;
create policy "submissions_all" on public.commitment_submissions for all using (true);

drop policy if exists "reviews_all" on public.commitment_reviews;
create policy "reviews_all" on public.commitment_reviews for all using (true);

drop policy if exists "ledger_select" on public.ledger_events;
create policy "ledger_select" on public.ledger_events for select using (true);

-- -------------------------
-- GRANT PERMISSIONS
-- -------------------------
grant select on public.households to authenticated;
grant select on public.household_members to authenticated;
grant select, insert on public.commitment_submissions to authenticated;
grant select, insert on public.commitment_reviews to authenticated;
grant select on public.ledger_events to authenticated;
grant select on public.v_earner_earnings_summary to authenticated;
grant execute on function public.mark_earnings_paid to authenticated;

-- ============================================================
-- MIGRATION COMPLETE - CANONICAL TERMINOLOGY + CAPABILITY FLAGS
-- 
-- NEW CAPABILITY FLAGS ON user_profiles:
--   is_earner (default: true)   → can claim tasks, earn Merets/Rep
--   is_provider (default: false) → can post tasks, review work
-- 
-- PATTERNS:
--   Child:  is_earner=true, is_provider=false
--   Parent: is_earner=false, is_provider=true  
--   Teen:   is_earner=true, is_provider=true (both!)
--   Vendor: is_earner=false, is_provider=true
-- 
-- This avoids hard-coded "kid/parent" checks everywhere.
-- Check capabilities, not identities!
-- 
-- Trigger expects: commitments.user_id, commitments.task_template_id, commitments.pay_cents
-- ============================================================
