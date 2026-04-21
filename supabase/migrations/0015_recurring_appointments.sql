-- Add recurring appointment support
alter table public.appointments
  add column if not exists recurring_group_id uuid default null,
  add column if not exists recurring_index integer default null;

create index if not exists appointments_recurring_group_idx
  on public.appointments (recurring_group_id)
  where recurring_group_id is not null;
