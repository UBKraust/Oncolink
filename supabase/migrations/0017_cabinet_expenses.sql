-- Cabinet deductible expenses tracking
create table if not exists public.cabinet_expenses (
  id           uuid primary key default uuid_generate_v4(),
  therapist_id uuid references auth.users(id) on delete cascade,
  category     varchar(30) not null
                 check (category in (
                   'CHIRIE',
                   'UTILITATI',
                   'CONTABILITATE',
                   'CURSURI',
                   'ASIGURARE',
                   'ECHIPAMENTE',
                   'ALTE'
                 )),
  description  text not null,
  amount       numeric(10,2) not null check (amount > 0),
  expense_date date not null,
  receipt_url  text default null,
  receipt_path text default null,   -- path in therapist-vault storage bucket
  created_at   timestamptz default now()
);

alter table public.cabinet_expenses enable row level security;

create policy "therapist full access own expenses"
  on public.cabinet_expenses
  for all
  using  (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);

create index if not exists cabinet_expenses_therapist_idx
  on public.cabinet_expenses (therapist_id);

create index if not exists cabinet_expenses_date_idx
  on public.cabinet_expenses (expense_date desc);
