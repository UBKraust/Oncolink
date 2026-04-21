-- Migration 0023: Therapist work schedule and CAS contract fields

ALTER TABLE public.therapist_settings
ADD COLUMN IF NOT EXISTS work_schedule jsonb DEFAULT '{
  "monday":    {"enabled": true,  "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00"},
  "tuesday":   {"enabled": true,  "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00"},
  "wednesday": {"enabled": true,  "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00"},
  "thursday":  {"enabled": true,  "start": "09:00", "end": "18:00", "break_start": "13:00", "break_end": "14:00"},
  "friday":    {"enabled": true,  "start": "09:00", "end": "17:00", "break_start": "13:00", "break_end": "14:00"},
  "saturday":  {"enabled": false, "start": "10:00", "end": "14:00", "break_start": null,     "break_end": null},
  "sunday":    {"enabled": false, "start": "10:00", "end": "14:00", "break_start": null,     "break_end": null}
}'::jsonb,
ADD COLUMN IF NOT EXISTS cas_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cas_contract_number varchar(100),
ADD COLUMN IF NOT EXISTS cas_county varchar(10);
