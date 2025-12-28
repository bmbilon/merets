-- ============================================================
-- MENTS v1.5 — Merets + Rep (Additive Migration)
-- ============================================================

-- Extensions
do $$ begin
  create extension if not exists pgcrypto;
exception when duplicate_object then null; end $$;

-- Enums
do $$ begin
  create type user_role as enum ('earner','provider','admin');
exception when duplicate_object then null; end $$;

-- -------------------------
-- ENHANCE user_profiles
-- -------------------------
alter table user_profiles
add column if not exists handle text,
add column if not exists avatar_url text,
add column if not exists role user_role,
add column if not exists is_earner boolean not null default true,
add column if not exists is_provider boolean not null default false,
add column if not exists rep_score int not null default 50,
add column if not exists rep_event_count int not null default 0,
add column if not exists merets_balance numeric(12,2) not null default 0,
add column if not exists lifetime_merets numeric(12,2) not null default 0,
add column if not exists updated_at timestamptz not null default now();

-- Unique handle
do $$ begin
  create unique index if not exists user_profiles_handle_unique
    on user_profiles(handle)
    where handle is not null;
exception when duplicate_object then null; end $$;

-- Backfill handles
update user_profiles
set handle = lower(regexp_replace(coalesce(name, ''), '[^a-zA-Z0-9]+', '', 'g'))
where handle is null and coalesce(name, '') <> '';

-- Backfill capability flags
update user_profiles
set 
  is_provider = (coalesce(user_profiles.role::text, '') = 'parent'),
  is_earner = (coalesce(user_profiles.role::text, '') in ('kid', 'child'))
where user_profiles.role::text in ('parent', 'kid', 'child');

-- -------------------------
-- ENHANCE task_templates
-- -------------------------
alter table task_templates
add column if not exists base_merets numeric(8,2) not null default 0;

-- Backfill merets from effort
update task_templates
set base_merets = greatest(0, (effort_minutes::numeric / 60.0))
where base_merets = 0 and effort_minutes is not null;

-- -------------------------
-- EVENT TABLES
-- -------------------------

create table if not exists meret_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  actor_user_id uuid references user_profiles(id),
  commitment_id uuid references commitments(id) on delete set null,
  merets_delta numeric(8,2) not null,
  reason text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_meret_events_user on meret_events(user_id);

create table if not exists rep_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  actor_user_id uuid references user_profiles(id),
  commitment_id uuid references commitments(id) on delete set null,
  completion_rate numeric(5,2),
  quality_avg numeric(3,2),
  volume_bonus numeric(3,2),
  rep_score_after int not null check (rep_score_after between 0 and 100),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_rep_events_user on rep_events(user_id);

create table if not exists earning_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  actor_user_id uuid references user_profiles(id),
  commitment_id uuid references commitments(id) on delete set null,
  amount_cents int not null check (amount_cents >= 0),
  status text not null default 'owed' check (status in ('owed','approved','paid','void')),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_earning_events_user on earning_events(user_id);

-- -------------------------
-- HOUSEHOLDS
-- -------------------------

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Family',
  created_by uuid not null references user_profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  profile_id uuid not null references user_profiles(id) on delete cascade,
  role user_role not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (household_id, profile_id)
);

-- Seed household
do $$
declare
  provider_id uuid;
begin
  if not exists (select 1 from households) then
    select id into provider_id
    from user_profiles
    where is_provider = true or coalesce(user_profiles.role::text,'') = 'parent'
    order by created_at asc
    limit 1;

    if provider_id is not null then
      insert into households (name, created_by) values ('Family', provider_id);
    end if;
  end if;

  if exists (select 1 from households) then
    insert into household_members (household_id, profile_id, role, is_admin)
    select
      (select id from households order by created_at asc limit 1),
      up.id,
      case 
        when up.is_provider then 'provider'::user_role
        else 'earner'::user_role
      end,
      up.is_provider
    from user_profiles up
    where not exists (select 1 from household_members hm where hm.profile_id = up.id)
    on conflict do nothing;
  end if;
end $$;

-- -------------------------
-- SUBMISSIONS + REVIEWS
-- -------------------------

create table if not exists commitment_submissions (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references commitments(id) on delete cascade,
  submitted_by uuid not null references user_profiles(id),
  submitted_at timestamptz not null default now(),
  minutes_spent int not null default 0,
  submission_note text,
  evidence_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists commitment_reviews (
  id uuid primary key default gen_random_uuid(),
  commitment_id uuid not null references commitments(id) on delete cascade,
  reviewer_id uuid not null references user_profiles(id),
  reviewed_at timestamptz not null default now(),
  quality_stars int not null check (quality_stars between 1 and 5),
  review_note text,
  created_at timestamptz not null default now()
);

-- -------------------------
-- FUNCTIONS
-- -------------------------

create or replace function calculate_composite_rep(p_user_id uuid)
returns int
language plpgsql
as $$
declare
  v_completion_rate numeric := 1.0;
  v_quality_avg numeric := 3.0;
  v_volume_bonus numeric := 0.0;
  v_total int := 0;
  v_completed int := 0;
begin
  select 
    count(*) filter (where status in ('completed', 'failed')),
    count(*) filter (where status = 'completed')
  into v_total, v_completed
  from commitments where user_id = p_user_id;
  
  if v_total > 0 then
    v_completion_rate := v_completed::numeric / v_total::numeric;
  end if;
  
  select coalesce(avg(quality_stars), 3.0) into v_quality_avg
  from commitment_reviews cr
  join commitments c on c.id = cr.commitment_id
  where c.user_id = p_user_id;
  
  if v_completed > 0 then
    v_volume_bonus := least(10.0, ln(v_completed + 1) * 2.0);
  end if;
  
  return greatest(0, least(100, round(
    (v_completion_rate * 40.0) +
    ((v_quality_avg - 1.0) / 4.0 * 50.0) +
    v_volume_bonus
  )::int));
end;
$$;

create or replace function merets_multiplier(quality_stars int)
returns numeric
language sql immutable
as $$
  select case
    when quality_stars = 5 then 1.20
    when quality_stars = 4 then 1.00
    when quality_stars = 3 then 0.70
    when quality_stars = 2 then 0.40
    else 0.20
  end;
$$;

-- -------------------------
-- TRIGGER
-- -------------------------

create or replace function on_commitment_review_create_events()
returns trigger
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_task_id uuid;
  v_base_merets numeric := 0;
  v_merets numeric := 0;
  v_cash int := 0;
  v_rep int;
  v_mult numeric := 1.0;
begin
  select c.user_id, c.task_template_id
  into v_user_id, v_task_id
  from commitments c where c.id = new.commitment_id;
  
  if v_user_id is null then return new; end if;
  
  if v_task_id is not null then
    select coalesce(base_merets, 0) into v_base_merets
    from task_templates where id = v_task_id;
  end if;
  
  v_mult := merets_multiplier(new.quality_stars);
  v_merets := round(v_base_merets * v_mult, 2);
  
  if exists (select 1 from information_schema.columns where table_name='commitments' and column_name='pay_cents') then
    execute format('select coalesce(pay_cents, 0) from commitments where id = %L', new.commitment_id) into v_cash;
  end if;
  
  insert into meret_events (user_id, actor_user_id, commitment_id, merets_delta, reason, meta)
  values (v_user_id, new.reviewer_id, new.commitment_id, v_merets, 'review', 
          jsonb_build_object('stars', new.quality_stars));
  
  if v_cash > 0 then
    insert into earning_events (user_id, actor_user_id, commitment_id, amount_cents, status)
    values (v_user_id, new.reviewer_id, new.commitment_id, v_cash, 'owed');
  end if;
  
  v_rep := calculate_composite_rep(v_user_id);
  
  insert into rep_events (user_id, actor_user_id, commitment_id, rep_score_after, meta)
  values (v_user_id, new.reviewer_id, new.commitment_id, v_rep,
          jsonb_build_object('stars', new.quality_stars));
  
  update user_profiles
  set
    rep_score = v_rep,
    rep_event_count = rep_event_count + 1,
    merets_balance = merets_balance + v_merets,
    lifetime_merets = lifetime_merets + v_merets,
    updated_at = now()
  where id = v_user_id;
  
  return new;
end;
$$;

drop trigger if exists trg_review_events on commitment_reviews;
create trigger trg_review_events
after insert on commitment_reviews
for each row
execute function on_commitment_review_create_events();

-- -------------------------
-- VIEWS
-- -------------------------

create or replace view v_user_rep_breakdown as
select
  c.user_id,
  count(*) filter (where c.status in ('completed', 'failed')) as total_ments,
  count(*) filter (where c.status = 'completed') as completed_ments,
  round(avg(cr.quality_stars), 2) as avg_quality,
  up.rep_score
from commitments c
left join commitment_reviews cr on cr.commitment_id = c.id
join user_profiles up on up.id = c.user_id
group by c.user_id, up.rep_score;

create or replace view v_user_earnings as
select
  user_id,
  sum(amount_cents) filter (where status = 'owed') as owed_cents,
  sum(amount_cents) filter (where status = 'paid') as paid_cents
from earning_events
group by user_id;

-- -------------------------
-- RLS
-- -------------------------

alter table meret_events enable row level security;
alter table rep_events enable row level security;
alter table earning_events enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table commitment_submissions enable row level security;
alter table commitment_reviews enable row level security;

create policy "events_select" on meret_events for select using (true);
create policy "rep_select" on rep_events for select using (true);
create policy "earning_select" on earning_events for select using (true);
create policy "households_select" on households for select using (true);
create policy "members_select" on household_members for select using (true);
create policy "submissions_all" on commitment_submissions for all using (true);
create policy "reviews_all" on commitment_reviews for all using (true);

-- -------------------------
-- GRANTS
-- -------------------------

grant select on meret_events to authenticated;
grant select on rep_events to authenticated;
grant select on earning_events to authenticated;
grant select on households to authenticated;
grant select on household_members to authenticated;
grant select, insert on commitment_submissions to authenticated;
grant select, insert on commitment_reviews to authenticated;
grant select on v_user_rep_breakdown to authenticated;
grant select on v_user_earnings to authenticated;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
