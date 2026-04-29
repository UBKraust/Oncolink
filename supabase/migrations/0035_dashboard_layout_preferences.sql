create table if not exists public.dashboard_layout_preferences (
  therapist_id uuid primary key references auth.users(id) on delete cascade,
  hidden_section_ids text[] not null default '{}'::text[],
  section_order text[] not null default '{}'::text[],
  updated_at timestamptz not null default now()
);

alter table public.dashboard_layout_preferences enable row level security;

drop policy if exists "therapist_full_access_dashboard_layout_preferences" on public.dashboard_layout_preferences;
create policy "therapist_full_access_dashboard_layout_preferences"
on public.dashboard_layout_preferences
for all
to authenticated
using (auth.uid() = therapist_id)
with check (auth.uid() = therapist_id);

