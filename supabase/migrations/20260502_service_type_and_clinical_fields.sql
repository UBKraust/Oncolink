alter table public.clients
  add column if not exists service_type text not null default 'UNDECIDED',
  add column if not exists service_track_status text,
  add column if not exists main_complaint text,
  add column if not exists clinical_focus jsonb not null default '[]',
  add column if not exists treatment_goals jsonb not null default '[]',
  add column if not exists treatment_plan text,
  add column if not exists risk_level text,
  add column if not exists research_consent boolean not null default false;

create index if not exists clients_service_type_idx
  on public.clients (therapist_id, service_type);
