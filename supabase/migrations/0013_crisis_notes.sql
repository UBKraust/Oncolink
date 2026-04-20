-- Crisis / out-of-session notes linked directly to a client (not an appointment)
create table if not exists public.client_crisis_notes (
    id uuid primary key default uuid_generate_v4(),
    client_id uuid references public.clients(id) on delete cascade not null,
    note text not null,
    contact_method varchar(20), -- 'PHONE' | 'SMS' | 'EMAIL' | null
    created_at timestamptz default now()
);

create index if not exists crisis_notes_client_idx on public.client_crisis_notes (client_id);

alter table public.client_crisis_notes enable row level security;

create policy "therapist_full_access_crisis_notes" on public.client_crisis_notes
    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
