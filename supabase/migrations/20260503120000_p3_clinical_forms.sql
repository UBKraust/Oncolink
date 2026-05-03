-- P3: fișe clinice editabile + rapoarte psihologice

-- clinical_forms: fișe clinice structurate per client (una sau mai multe per tip)
create table if not exists public.clinical_forms (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients(id) on delete cascade,
  therapist_id uuid not null references auth.users(id) on delete cascade,
  form_type    text not null,
  -- ANAMNESIS | CLINICAL_INTERVIEW | RISK_ASSESSMENT
  -- DBT_COMMITMENT | COUNSELING_PLAN | RECOMMENDATIONS
  -- CBT_PROGRESS | COUNSELING_PROGRESS
  title        text,
  content      jsonb not null default '{}',
  status       text not null default 'DRAFT',
  -- DRAFT | COMPLETE
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists clinical_forms_client_type_idx
  on public.clinical_forms (client_id, form_type);

create index if not exists clinical_forms_therapist_date_idx
  on public.clinical_forms (therapist_id, created_at desc);

alter table public.clinical_forms enable row level security;

drop policy if exists "therapist_own_clinical_forms" on public.clinical_forms;
create policy "therapist_own_clinical_forms" on public.clinical_forms
  for all
  using (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);

-- therapy_reports: rapoarte psihologice formale cu export PDF
create table if not exists public.therapy_reports (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  therapist_id  uuid not null references auth.users(id) on delete cascade,
  report_type   text not null default 'ADULT',
  -- ADULT | MINOR | B2B_WELLBEING
  report_number text,
  title         text,
  content       jsonb not null default '{}',
  status        text not null default 'DRAFT',
  -- DRAFT | FINAL
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists therapy_reports_client_idx
  on public.therapy_reports (client_id, report_type);

create index if not exists therapy_reports_therapist_date_idx
  on public.therapy_reports (therapist_id, created_at desc);

alter table public.therapy_reports enable row level security;

drop policy if exists "therapist_own_therapy_reports" on public.therapy_reports;
create policy "therapist_own_therapy_reports" on public.therapy_reports
  for all
  using (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);
