-- Hardening for the clinical dashboard / appointments UI added on 2026-05-02..03.
-- Goal:
-- - keep client clinical fields consistent with the UI selectors
-- - improve lookup speed for appointment/session/dashboard query paths
-- - stay fully backward-compatible and safe on already-migrated environments

-- Normalize legacy or hand-edited values before constraints are added.
update public.clients
set service_type = 'UNDECIDED'
where service_type is null
   or service_type not in ('CLINICAL_PSYCHOLOGY', 'CBT', 'DBT', 'COUNSELING', 'MIXED', 'UNDECIDED');

update public.clients
set risk_level = null
where risk_level is not null
  and risk_level not in ('LOW', 'MEDIUM', 'HIGH', 'CRISIS');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_service_type_valid'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_service_type_valid
      check (service_type in ('CLINICAL_PSYCHOLOGY', 'CBT', 'DBT', 'COUNSELING', 'MIXED', 'UNDECIDED'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_risk_level_valid'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_risk_level_valid
      check (risk_level is null or risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRISIS'));
  end if;
end $$;

create index if not exists clients_risk_level_idx
  on public.clients (therapist_id, risk_level);

create index if not exists appointments_client_date_desc_idx
  on public.appointments (client_id, appointment_date desc);

create index if not exists notes_appointment_idx
  on public.notes (appointment_id);

create index if not exists invoices_appointment_idx
  on public.invoices (appointment_id);
