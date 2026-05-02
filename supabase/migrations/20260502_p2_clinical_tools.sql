-- P2: teme CBT, formulare caz CBT, diary cards DBT, plan de siguranță DBT

-- homework_items: teme pentru acasă CBT (multiple per client)
create table if not exists public.homework_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  therapist_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  due_date date,
  completed_at timestamptz,
  therapist_notes text,
  created_at timestamptz not null default now()
);

create index if not exists homework_items_client_idx
  on public.homework_items (client_id, created_at desc);

alter table public.homework_items enable row level security;

drop policy if exists "therapist_own_homework_items" on public.homework_items;
create policy "therapist_own_homework_items" on public.homework_items
  for all using (auth.uid() = therapist_id) with check (auth.uid() = therapist_id);

-- cbt_case_formulations: formulare de caz CBT (unul per client)
create table if not exists public.cbt_case_formulations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  therapist_id uuid not null references auth.users(id) on delete cascade,
  presenting_problem text,
  automatic_thoughts text,
  cognitive_distortions text[],
  core_beliefs text,
  behavioral_patterns text,
  triggering_situations text,
  maintenance_factors text,
  strengths text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cbt_case_formulations enable row level security;

drop policy if exists "therapist_own_cbt_formulations" on public.cbt_case_formulations;
create policy "therapist_own_cbt_formulations" on public.cbt_case_formulations
  for all using (auth.uid() = therapist_id) with check (auth.uid() = therapist_id);

-- dbt_diary_cards: diary card săptămânal DBT (multiple per client)
create table if not exists public.dbt_diary_cards (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  therapist_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  emotion_scores jsonb,
  skills_used text[],
  target_behaviors jsonb,
  therapist_notes text,
  created_at timestamptz not null default now(),
  unique(client_id, week_start)
);

create index if not exists dbt_diary_cards_client_idx
  on public.dbt_diary_cards (client_id, week_start desc);

alter table public.dbt_diary_cards enable row level security;

drop policy if exists "therapist_own_dbt_diary_cards" on public.dbt_diary_cards;
create policy "therapist_own_dbt_diary_cards" on public.dbt_diary_cards
  for all using (auth.uid() = therapist_id) with check (auth.uid() = therapist_id);

-- safety_plans: plan de siguranță DBT/risc (unul per client)
create table if not exists public.safety_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients(id) on delete cascade,
  therapist_id uuid not null references auth.users(id) on delete cascade,
  warning_signs text,
  internal_coping text,
  social_distractions text,
  reasons_for_living text,
  support_contacts jsonb,
  professional_contacts jsonb,
  safe_environment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.safety_plans enable row level security;

drop policy if exists "therapist_own_safety_plans" on public.safety_plans;
create policy "therapist_own_safety_plans" on public.safety_plans
  for all using (auth.uid() = therapist_id) with check (auth.uid() = therapist_id);
