-- Migration 0010: CAS (Casa de Asigurări) subsidized sessions tracking

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_cas_subsidized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referral_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS referral_date DATE,
ADD COLUMN IF NOT EXISTS referring_doctor_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS diagnosis_code_cim10 VARCHAR(20);

-- Add CAS contract flag to therapist settings (module on/off switch)
ALTER TABLE public.therapist_settings
ADD COLUMN IF NOT EXISTS cas_contract_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cas_contract_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS cas_county_code VARCHAR(10); -- e.g. "B" for Bucuresti

-- Index for fast monthly CAS reports
CREATE INDEX IF NOT EXISTS appointments_cas_idx
  ON public.appointments (is_cas_subsidized, appointment_date)
  WHERE is_cas_subsidized = TRUE;
