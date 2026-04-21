-- Migration 0024: Historical data support for SmartBill import

-- Allow invoices without an appointment (historical data)
ALTER TABLE public.invoices 
  ALTER COLUMN appointment_id DROP NOT NULL;

-- Add tracking for clients that are not yet in our formal UUID system
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS client_name_historical VARCHAR(255),
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Update cabinet_expenses categories to include CONSUMABILE and align with standard flows
ALTER TABLE public.cabinet_expenses 
  DROP CONSTRAINT IF EXISTS cabinet_expenses_category_check;

ALTER TABLE public.cabinet_expenses
  ADD CONSTRAINT cabinet_expenses_category_check 
  CHECK (category IN (
    'CHIRIE',
    'UTILITATI',
    'CONTABILITATE',
    'CURSURI',
    'ASIGURARE',
    'ECHIPAMENTE',
    'CONSUMABILE',
    'ALTE'
  ));

COMMENT ON COLUMN public.invoices.client_name_historical IS 'Stores the client name for historical imports when a direct client match is not found.';
COMMENT ON COLUMN public.invoices.client_id IS 'Direct link to client for invoices imported without a specific appointment.';
