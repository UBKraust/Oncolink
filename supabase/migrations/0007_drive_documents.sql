-- Migration 0007: Google Drive Documents integration

CREATE TABLE IF NOT EXISTS public.documents (
    id uuid primary key default uuid_generate_v4(),
    client_id uuid references public.clients(id) on delete cascade,
    file_name varchar(255) not null,
    drive_file_id varchar(255) not null unique,
    drive_link text,
    document_type varchar(50) default 'ALTUL',
    created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS documents_client_idx ON public.documents (client_id);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_full_access_documents" ON public.documents
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
