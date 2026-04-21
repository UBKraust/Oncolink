-- Calendar & Appointments Enhancements
alter table public.appointments
  add column if not exists location_tag varchar(50) default null,
  add column if not exists personal_notes text default null,
  add column if not exists reminder_minutes integer default null,
  add column if not exists reminders_enabled boolean default true;

comment on column public.appointments.location_tag is '#cabinet or #Clinica tags for visual grouping';
comment on column public.appointments.personal_notes is 'Private therapist notes for the appointment (not synced to GCal)';
