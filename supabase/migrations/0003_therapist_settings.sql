-- Single-row settings table for the therapist account.
-- Stores Google OAuth tokens, default session price, and other preferences.
-- id = 1 always (single-therapist MVP).

create table if not exists public.therapist_settings (
  id integer primary key default 1 check (id = 1),
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamptz,
  google_calendar_channel_id varchar(255),
  google_calendar_resource_id varchar(255),
  default_session_price decimal(10,2) default 250.00,
  default_session_duration_minutes integer default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.therapist_settings enable row level security;

create policy "therapist_full_access_settings" on public.therapist_settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
