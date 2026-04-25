ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS minor_cnp VARCHAR(20),
ADD COLUMN IF NOT EXISTS terms_consent_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS legal_liability_consent_signed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.clients.minor_cnp IS 'Personal numeric code of the minor, stored separately from the billing CNP/CIF of the legal representative.';
COMMENT ON COLUMN public.clients.terms_consent_signed_at IS 'Timestamp when the adult client accepted the service terms during onboarding.';
COMMENT ON COLUMN public.clients.legal_liability_consent_signed_at IS 'Timestamp when the legal representative accepted responsibility for the minor onboarding data.';
