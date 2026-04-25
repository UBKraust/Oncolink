alter table public.clients
  add column if not exists minor_cnp varchar(20),
  add column if not exists terms_consent_signed_at timestamptz,
  add column if not exists legal_liability_consent_signed_at timestamptz;

comment on column public.clients.minor_cnp is 'Personal numeric code of the minor, stored separately from the billing CNP/CIF of the legal representative.';
comment on column public.clients.terms_consent_signed_at is 'Timestamp when the adult client accepted the service terms during onboarding.';
comment on column public.clients.legal_liability_consent_signed_at is 'Timestamp when the legal representative accepted responsibility for the minor onboarding data.';

create unique index if not exists clients_unique_email_per_therapist
  on public.clients (therapist_id, lower(email))
  where email is not null and btrim(email) <> '';

create unique index if not exists clients_unique_phone_per_therapist
  on public.clients (therapist_id, regexp_replace(phone, '\D', '', 'g'))
  where phone is not null and btrim(phone) <> '';

create unique index if not exists clients_unique_minor_cnp_per_therapist
  on public.clients (therapist_id, minor_cnp)
  where minor_cnp is not null and btrim(minor_cnp) <> '';
