insert into storage.buckets (id, name, public)
values
  ('patient-documents', 'patient-documents', false),
  ('therapist-vault', 'therapist-vault', false)
on conflict (id) do nothing;

alter table public.referral_documents
  add column if not exists storage_path text,
  add column if not exists mime_type varchar(100),
  add column if not exists file_size_kb integer;

comment on column public.referral_documents.storage_path is 'Pathul din Supabase Storage pentru biletul de trimitere.';
comment on column public.referral_documents.mime_type is 'Tipul MIME al fisierului incarcat.';
comment on column public.referral_documents.file_size_kb is 'Dimensiunea fisierului incarcat in KB.';
