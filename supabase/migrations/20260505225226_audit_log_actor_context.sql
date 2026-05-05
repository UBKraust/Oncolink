alter table public.audit_logs
  alter column therapist_id drop not null;

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);
