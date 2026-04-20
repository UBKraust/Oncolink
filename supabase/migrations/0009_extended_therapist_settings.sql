-- Migration 0009: Extended Therapist Settings

ALTER TABLE public.therapist_settings
ADD COLUMN IF NOT EXISTS full_name varchar(255),
ADD COLUMN IF NOT EXISTS cif varchar(50),
ADD COLUMN IF NOT EXISTS cpr_code varchar(50),
ADD COLUMN IF NOT EXISTS iban varchar(100),
ADD COLUMN IF NOT EXISTS session_types_pricing jsonb default '{"Sesiune Individuală": 250, "Sesiune Cuplu": 350}'::jsonb,
ADD COLUMN IF NOT EXISTS currency varchar(10) default 'RON',
ADD COLUMN IF NOT EXISTS clinical_notes_pin_hash text,
ADD COLUMN IF NOT EXISTS smartbill_username varchar(255),
ADD COLUMN IF NOT EXISTS smartbill_token text,
ADD COLUMN IF NOT EXISTS smartbill_cif varchar(50),
ADD COLUMN IF NOT EXISTS twilio_account_sid varchar(255),
ADD COLUMN IF NOT EXISTS twilio_auth_token text,
ADD COLUMN IF NOT EXISTS twilio_phone_number varchar(50);
