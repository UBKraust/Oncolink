create or replace function public.sync_invoice_links_from_appointment()
returns trigger
language plpgsql
as $$
declare
  v_client_id uuid;
  v_therapist_id uuid;
begin
  if new.appointment_id is null then
    return new;
  end if;

  select a.client_id, a.therapist_id
    into v_client_id, v_therapist_id
  from public.appointments a
  where a.id = new.appointment_id;

  if new.client_id is null then
    new.client_id := v_client_id;
  end if;

  if new.therapist_id is null then
    new.therapist_id := v_therapist_id;
  end if;

  return new;
end;
$$;

drop trigger if exists tr_sync_invoice_links_from_appointment on public.invoices;
create trigger tr_sync_invoice_links_from_appointment
before insert or update on public.invoices
for each row
execute function public.sync_invoice_links_from_appointment();

update public.invoices i
set
  client_id = coalesce(i.client_id, a.client_id),
  therapist_id = coalesce(i.therapist_id, a.therapist_id)
from public.appointments a
where i.appointment_id = a.id
  and (i.client_id is null or i.therapist_id is null);

create unique index if not exists invoices_unique_appointment_id
  on public.invoices (appointment_id)
  where appointment_id is not null;

create index if not exists invoices_client_issued_idx
  on public.invoices (client_id, issued_at desc)
  where client_id is not null;

create index if not exists patient_documents_client_uploaded_idx
  on public.patient_documents (client_id, uploaded_at desc)
  where client_id is not null;

create index if not exists referral_documents_client_uploaded_idx
  on public.referral_documents (client_id, uploaded_at desc)
  where client_id is not null;

alter table public.patient_documents
  drop constraint if exists patient_documents_has_backing_reference_check;

alter table public.patient_documents
  add constraint patient_documents_has_backing_reference_check
  check (
    coalesce(nullif(btrim(storage_path), ''), nullif(btrim(document_url), ''), nullif(btrim(drive_file_id), '')) is not null
  );

alter table public.referral_documents
  drop constraint if exists referral_documents_has_backing_reference_check;

alter table public.referral_documents
  add constraint referral_documents_has_backing_reference_check
  check (
    coalesce(nullif(btrim(storage_path), ''), nullif(btrim(document_url), ''), nullif(btrim(drive_file_id), '')) is not null
  );
