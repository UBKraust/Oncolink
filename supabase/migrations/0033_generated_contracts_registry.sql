-- Migration 0033: generated contracts registry with sequential numbering

CREATE TABLE IF NOT EXISTS public.generated_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    template_type VARCHAR(20) NOT NULL,
    contract_number VARCHAR(50) NOT NULL,
    contract_year INTEGER NOT NULL,
    sequence_number INTEGER NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    patient_document_id UUID NULL REFERENCES public.patient_documents(id) ON DELETE SET NULL,
    document_url TEXT NULL,
    drive_file_id VARCHAR(255) NULL,
    CONSTRAINT generated_contracts_template_type_check
      CHECK (template_type IN ('STANDARD', 'MINOR', 'B2B', 'CAS')),
    CONSTRAINT generated_contracts_sequence_positive_check
      CHECK (sequence_number > 0),
    CONSTRAINT generated_contracts_unique_number_per_therapist
      UNIQUE (therapist_id, contract_number),
    CONSTRAINT generated_contracts_unique_sequence_per_year
      UNIQUE (therapist_id, contract_year, sequence_number)
);

CREATE INDEX IF NOT EXISTS generated_contracts_client_idx
  ON public.generated_contracts (client_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS generated_contracts_therapist_year_idx
  ON public.generated_contracts (therapist_id, contract_year DESC, sequence_number DESC);

ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strict_therapist_isolation_generated_contracts" ON public.generated_contracts;
CREATE POLICY "strict_therapist_isolation_generated_contracts" ON public.generated_contracts
  FOR ALL
  USING (auth.uid() = therapist_id)
  WITH CHECK (auth.uid() = therapist_id);

CREATE OR REPLACE FUNCTION public.issue_generated_contract_number(
  p_client_id UUID,
  p_template_type TEXT
)
RETURNS public.generated_contracts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_therapist_id UUID := auth.uid();
  v_contract_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_sequence_number INTEGER;
  v_contract_number TEXT;
  v_row public.generated_contracts;
BEGIN
  IF v_therapist_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_template_type NOT IN ('STANDARD', 'MINOR', 'B2B', 'CAS') THEN
    RAISE EXCEPTION 'Template type invalid: %', p_template_type;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = p_client_id
      AND c.therapist_id = v_therapist_id
  ) THEN
    RAISE EXCEPTION 'Client inexistent sau inaccesibil.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(v_therapist_id::TEXT || '-' || v_contract_year::TEXT, 0));

  SELECT COALESCE(MAX(gc.sequence_number), 0) + 1
  INTO v_sequence_number
  FROM public.generated_contracts gc
  WHERE gc.therapist_id = v_therapist_id
    AND gc.contract_year = v_contract_year;

  v_contract_number := FORMAT('CTR-%s-%s', v_contract_year, LPAD(v_sequence_number::TEXT, 4, '0'));

  INSERT INTO public.generated_contracts (
    therapist_id,
    client_id,
    template_type,
    contract_number,
    contract_year,
    sequence_number
  )
  VALUES (
    v_therapist_id,
    p_client_id,
    p_template_type,
    v_contract_number,
    v_contract_year,
    v_sequence_number
  )
  RETURNING *
  INTO v_row;

  RETURN v_row;
END;
$$;
