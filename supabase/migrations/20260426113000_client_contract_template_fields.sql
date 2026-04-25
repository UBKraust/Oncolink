alter table public.clients
  add column if not exists client_id_series text,
  add column if not exists client_id_number text,
  add column if not exists date_of_birth date,
  add column if not exists parent_cnp text,
  add column if not exists parent_address text,
  add column if not exists parent_id_series text,
  add column if not exists parent_id_number text,
  add column if not exists company_address text,
  add column if not exists company_iban text,
  add column if not exists company_bank text,
  add column if not exists company_representative_email text;

comment on column public.clients.client_id_series is 'Seria actului de identitate pentru clientul adult.';
comment on column public.clients.client_id_number is 'Numarul actului de identitate pentru clientul adult.';
comment on column public.clients.date_of_birth is 'Data nasterii clientului; folosita in special pentru contractele minorilor.';
comment on column public.clients.parent_cnp is 'CNP-ul reprezentantului legal pentru client minor.';
comment on column public.clients.parent_address is 'Adresa reprezentantului legal pentru client minor.';
comment on column public.clients.parent_id_series is 'Seria CI a reprezentantului legal.';
comment on column public.clients.parent_id_number is 'Numarul CI a reprezentantului legal.';
comment on column public.clients.company_address is 'Sediul social al companiei platitoare.';
comment on column public.clients.company_iban is 'IBAN-ul companiei platitoare.';
comment on column public.clients.company_bank is 'Banca la care este deschis contul companiei.';
comment on column public.clients.company_representative_email is 'Email-ul reprezentantului legal al companiei.';
