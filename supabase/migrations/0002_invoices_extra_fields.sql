-- Add fields needed for SmartBill integration to invoices.
-- client_name is denormalized so invoice history survives GDPR anonymization.

alter table public.invoices
  add column if not exists client_name varchar(255),
  add column if not exists payment_link text,
  add column if not exists pdf_url text;
