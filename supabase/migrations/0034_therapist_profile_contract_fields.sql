-- Migration 0034: extra therapist profile fields used in generated contracts

ALTER TABLE public.therapist_settings
ADD COLUMN IF NOT EXISTS practice_name varchar(255),
ADD COLUMN IF NOT EXISTS practice_address text,
ADD COLUMN IF NOT EXISTS practice_phone varchar(50),
ADD COLUMN IF NOT EXISTS practice_email varchar(255),
ADD COLUMN IF NOT EXISTS practice_caen varchar(100);
