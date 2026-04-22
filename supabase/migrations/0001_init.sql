-- Oncolink initial schema
-- Tables: clients, appointments, notes, invoices, activity_logs
-- All tables have Row Level Security enabled. Policies are intentionally
-- restrictive here; auth-aware policies are added in a later migration once
-- the therapist-user model is wired up.

create extension if not exists "uuid-ossp";

create table if not exists public.clients (
    id uuid primary key default gen_random_uuid(),
    full_name varchar(255),
    email varchar(255) unique,
    phone varchar(20),
    cnp_cif varchar(50),
    address text,
    gdpr_consent_signed boolean default false,
    contract_url text,
    notes_anonymized_at timestamptz,
    created_at timestamptz default now()
);

create table if not exists public.appointments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete cascade,
    appointment_date timestamptz not null,
    duration_minutes int default 50,
    status varchar(50) default 'PROGRAMAT',
    google_event_id varchar(255) unique,
    meet_link text,
    payment_link text,
    is_external_duty boolean default false,
    created_at timestamptz default now()
);
create index if not exists appointments_date_idx on public.appointments (appointment_date);
create index if not exists appointments_client_idx on public.appointments (client_id);

create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    appointment_id uuid references public.appointments(id) on delete cascade unique,
    encrypted_content text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.invoices (
    id uuid primary key default gen_random_uuid(),
    appointment_id uuid references public.appointments(id) on delete set null,
    smartbill_series varchar(50),
    smartbill_number varchar(50),
    amount decimal(10, 2),
    status varchar(50) default 'EMISĂ',
    smartbill_id varchar(255) unique,
    issued_at timestamptz default now()
);

create table if not exists public.activity_logs (
    id uuid primary key default gen_random_uuid(),
    therapist_id uuid,
    action_type varchar(100),
    client_initials varchar(10),
    timestamp timestamptz default now()
);

alter table public.clients       enable row level security;
alter table public.appointments  enable row level security;
alter table public.notes         enable row level security;
alter table public.invoices      enable row level security;
alter table public.activity_logs enable row level security;

-- Authenticated therapist has full access (single-therapist MVP).
-- Tighten per-user once multi-tenant support is added.
create policy "therapist_full_access_clients" on public.clients
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "therapist_full_access_appointments" on public.appointments
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "therapist_full_access_notes" on public.notes
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "therapist_full_access_invoices" on public.invoices
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "therapist_full_access_activity_logs" on public.activity_logs
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
