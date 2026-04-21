-- Therapist professional document vault
create table if not exists public.therapist_documents (
  id            uuid primary key default uuid_generate_v4(),
  therapist_id  uuid references auth.users(id) on delete cascade,
  name          varchar(255) not null,
  category      varchar(50) not null
                  check (category in (
                    'DIPLOME',
                    'CERTIFICARI',
                    'CABINET_ACTE',
                    'UTILITATI',
                    'CONTRACTE',
                    'ASIGURARE',
                    'ALTE'
                  )),
  file_url      text not null,
  file_path     text,           -- path in Supabase Storage bucket
  expiry_date   date default null,
  uploaded_at   timestamptz default now()
);

-- Only the owning therapist can access their documents
alter table public.therapist_documents enable row level security;

create policy "therapist full access own documents"
  on public.therapist_documents
  for all
  using  (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);

-- Index for fast per-therapist queries
create index if not exists therapist_documents_therapist_idx
  on public.therapist_documents (therapist_id);

-- Index for expiry alerts
create index if not exists therapist_documents_expiry_idx
  on public.therapist_documents (expiry_date)
  where expiry_date is not null;
