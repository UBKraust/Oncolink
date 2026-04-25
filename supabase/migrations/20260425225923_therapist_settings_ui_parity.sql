ALTER TABLE public.therapist_settings
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS cif VARCHAR(50),
ADD COLUMN IF NOT EXISTS cpr_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS iban VARCHAR(100),
ADD COLUMN IF NOT EXISTS practice_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS practice_address TEXT,
ADD COLUMN IF NOT EXISTS practice_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS practice_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS practice_caen VARCHAR(100),
ADD COLUMN IF NOT EXISTS default_session_price DECIMAL(10, 2) DEFAULT 250.00,
ADD COLUMN IF NOT EXISTS default_session_duration_minutes INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS session_types_pricing JSONB DEFAULT '{"Sesiune Individuală": 250, "Sesiune Cuplu": 350}'::jsonb,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'RON',
ADD COLUMN IF NOT EXISTS work_schedule JSONB DEFAULT '{
  "monday": { "enabled": true, "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
  "tuesday": { "enabled": true, "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
  "wednesday": { "enabled": true, "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
  "thursday": { "enabled": true, "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00" },
  "friday": { "enabled": true, "start": "09:00", "end": "17:00", "break_start": "13:00", "break_end": "14:00" },
  "saturday": { "enabled": false, "start": "10:00", "end": "14:00", "break_start": null, "break_end": null },
  "sunday": { "enabled": false, "start": "10:00", "end": "14:00", "break_start": null, "break_end": null }
}'::jsonb,
ADD COLUMN IF NOT EXISTS smartbill_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS smartbill_token TEXT,
ADD COLUMN IF NOT EXISTS smartbill_cif VARCHAR(50),
ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR(255),
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS clinical_notes_pin_hash TEXT,
ADD COLUMN IF NOT EXISTS cas_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cas_contract_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS cas_county VARCHAR(10);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'therapist_settings'
      AND column_name = 'cas_county_code'
  ) THEN
    EXECUTE '
      UPDATE public.therapist_settings
      SET cas_county = COALESCE(cas_county, cas_county_code)
      WHERE cas_county IS NULL AND cas_county_code IS NOT NULL
    ';
  END IF;
END $$;

COMMENT ON COLUMN public.therapist_settings.practice_name IS 'Displayed in therapist profile settings and used in generated legal/financial documents.';
COMMENT ON COLUMN public.therapist_settings.practice_address IS 'Professional address shown in generated contracts and settings UI.';
COMMENT ON COLUMN public.therapist_settings.practice_phone IS 'Practice phone shown in settings UI and exported documents.';
COMMENT ON COLUMN public.therapist_settings.practice_email IS 'Practice email shown in settings UI and exported documents.';
COMMENT ON COLUMN public.therapist_settings.practice_caen IS 'CAEN code shown in therapist settings.';
COMMENT ON COLUMN public.therapist_settings.cas_county IS 'Normalized CAS county code used by the current settings UI.';
