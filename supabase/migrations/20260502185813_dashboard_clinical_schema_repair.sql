-- Repair migration for dashboard clinical command center schema.
-- Context:
-- - an older remote migration exists under the ambiguous version `20260502`
-- - local service/P2 migrations were moved to unique timestamps
-- - this file safely backfills and hardens the schema required by today's dashboard work

-- 1. Ensure service-track columns exist on clients.
alter table public.clients
  add column if not exists service_type text,
  add column if not exists service_track_status text,
  add column if not exists main_complaint text,
  add column if not exists clinical_focus jsonb,
  add column if not exists treatment_goals jsonb,
  add column if not exists treatment_plan text,
  add column if not exists risk_level text,
  add column if not exists research_consent boolean;

update public.clients
set
  service_type = coalesce(service_type, 'UNDECIDED'),
  clinical_focus = coalesce(clinical_focus, '[]'::jsonb),
  treatment_goals = coalesce(treatment_goals, '[]'::jsonb),
  research_consent = coalesce(research_consent, false);

alter table public.clients
  alter column service_type set default 'UNDECIDED',
  alter column service_type set not null,
  alter column clinical_focus set default '[]'::jsonb,
  alter column clinical_focus set not null,
  alter column treatment_goals set default '[]'::jsonb,
  alter column treatment_goals set not null,
  alter column research_consent set default false,
  alter column research_consent set not null;

create index if not exists clients_service_type_idx
  on public.clients (therapist_id, service_type);

create index if not exists clients_track_status_idx
  on public.clients (therapist_id, service_track_status);

-- 2. Ensure legacy assessments table matches the fields already used by the app/dashboard.
alter table public.assessments
  add column if not exists therapist_id uuid references auth.users(id) on delete cascade,
  add column if not exists encrypted_content text;

create index if not exists assessments_client_created_idx
  on public.assessments (client_id, created_at desc);

create index if not exists assessments_therapist_created_idx
  on public.assessments (therapist_id, created_at desc);

create index if not exists assessments_type_created_idx
  on public.assessments (assessment_type, created_at desc);

-- 3. Dashboard query helpers read invoices and appointments by date/status very often.
create index if not exists invoices_status_issued_idx
  on public.invoices (therapist_id, status, issued_at desc);

create index if not exists appointments_status_date_idx
  on public.appointments (therapist_id, status, appointment_date desc);
