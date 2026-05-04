-- Audit log complet pentru SaaS cu date sensibile psihologice/sănătate
-- Înlocuiește activity_logs (schemă schelet) cu un audit real, multi-tenant, orientat pe compliance

create table public.audit_logs (
  id              uuid        primary key default gen_random_uuid(),

  therapist_id    uuid        not null references auth.users(id) on delete cascade,
  actor_user_id   uuid        references auth.users(id) on delete set null,
  actor_role      text        not null default 'THERAPIST',

  action          text        not null,
  category        text        not null,

  entity_type     text,
  entity_id       uuid,
  client_id       uuid        references public.clients(id) on delete set null,

  severity        text        not null default 'INFO',
  status          text        not null default 'SUCCESS',

  metadata        jsonb       not null default '{}',
  before_snapshot jsonb,
  after_snapshot  jsonb,

  ip_address      inet,
  user_agent      text,

  created_at      timestamptz not null default now()
);

alter table public.audit_logs
  add constraint audit_logs_severity_check
    check (severity in ('INFO', 'WARNING', 'CRITICAL')),
  add constraint audit_logs_status_check
    check (status in ('SUCCESS', 'FAILED')),
  add constraint audit_logs_category_check
    check (category in (
      'AUTH', 'CLIENT', 'NOTE', 'DOCUMENT', 'CONTRACT', 'CONSENT',
      'APPOINTMENT', 'ASSESSMENT', 'REPORT', 'INVOICE', 'SETTINGS',
      'SECURITY', 'AI', 'EXPORT', 'DELETE', 'SYSTEM'
    ));

create index audit_logs_therapist_date_idx
  on public.audit_logs (therapist_id, created_at desc);

create index audit_logs_client_date_idx
  on public.audit_logs (client_id, created_at desc);

create index audit_logs_category_date_idx
  on public.audit_logs (therapist_id, category, created_at desc);

create index audit_logs_action_date_idx
  on public.audit_logs (therapist_id, action, created_at desc);

create index audit_logs_severity_date_idx
  on public.audit_logs (therapist_id, severity, created_at desc);

alter table public.audit_logs enable row level security;

create policy "Therapist vede doar propriile audit logs"
  on public.audit_logs for select
  using (auth.uid() = therapist_id);

create policy "Therapist inserează doar propriile audit logs"
  on public.audit_logs for insert
  with check (auth.uid() = therapist_id);
