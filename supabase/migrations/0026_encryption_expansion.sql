-- Migration 0026: Encryption Expansion for Clinical Data
-- Adds encrypted_content columns to tables that currently store clinical text in plaintext.

-- 1. client_crisis_notes
ALTER TABLE public.client_crisis_notes ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
COMMENT ON COLUMN public.client_crisis_notes.encrypted_content IS 'AES-GCM encrypted content of the crisis note (client-side encryption).';

-- 2. assessments
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS encrypted_content TEXT;
COMMENT ON COLUMN public.assessments.encrypted_content IS 'AES-GCM encrypted content of the assessment (client-side encryption).';

-- 3. patient_medication
ALTER TABLE public.patient_medication ADD COLUMN IF NOT EXISTS encrypted_side_effects TEXT;
COMMENT ON COLUMN public.patient_medication.encrypted_side_effects IS 'AES-GCM encrypted side effect notes (client-side encryption).';

-- 4. patient_documents
ALTER TABLE public.patient_documents ADD COLUMN IF NOT EXISTS encrypted_notes TEXT;
COMMENT ON COLUMN public.patient_documents.encrypted_notes IS 'AES-GCM encrypted qualitative notes about the document (client-side encryption).';

-- Note: We keep the old columns (note, content_summary, side_effect_notes, notes) for backward compatibility during migration, 
-- but they should be deprecated in the application logic.
