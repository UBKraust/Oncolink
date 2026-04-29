alter table public.clients
  add column if not exists lifecycle_status varchar(32) not null default 'LEAD',
  add column if not exists lifecycle_status_updated_at timestamptz not null default now();

create table if not exists public.client_status_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  therapist_id uuid references auth.users(id) on delete cascade,
  from_status varchar(32),
  to_status varchar(32) not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists clients_lifecycle_status_idx
  on public.clients (therapist_id, lifecycle_status);

create index if not exists client_status_history_client_idx
  on public.client_status_history (client_id, changed_at desc);

alter table public.client_status_history enable row level security;

drop policy if exists "strict_therapist_isolation_client_status_history" on public.client_status_history;
create policy "strict_therapist_isolation_client_status_history" on public.client_status_history
  for all using (auth.uid() = therapist_id) with check (auth.uid() = therapist_id);

update public.clients c
set
  lifecycle_status = case
    when c.notes_anonymized_at is not null then 'ANONIMIZAT'
    when exists (
      select 1
      from public.appointments a
      where a.client_id = c.id
        and a.status = 'FINALIZAT'
    ) then 'ACTIV'
    when exists (
      select 1
      from public.appointments a
      where a.client_id = c.id
        and a.status in ('PROGRAMAT', 'CONFIRMAT')
        and a.appointment_date >= now()
    ) then 'PROGRAMAT'
    when c.onboarding_completed_at is not null
      or c.gdpr_consent_signed is true
      or c.terms_consent_signed_at is not null
    then 'ONBOARDING'
    else 'LEAD'
  end,
  lifecycle_status_updated_at = now();

insert into public.client_status_history (
  client_id,
  therapist_id,
  from_status,
  to_status,
  reason,
  metadata
)
select
  c.id,
  c.therapist_id,
  null,
  c.lifecycle_status,
  'Backfill lifecycle status',
  jsonb_build_object('source', 'migration', 'migration', '20260429223610_client_lifecycle_status')
from public.clients c
where not exists (
  select 1
  from public.client_status_history h
  where h.client_id = c.id
);
