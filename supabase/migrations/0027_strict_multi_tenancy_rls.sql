-- Migration 0027: Strict Multi-Tenancy and RLS Isolation
-- This migration ensures that all core tables have a therapist_id, strict RLS policies,
-- and automatic population of therapist_id via triggers.

-- 1. Helper function for automatic therapist_id population
CREATE OR REPLACE FUNCTION public.set_therapist_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if therapist_id is null; this allows manual override if needed (e.g. by service_role)
  IF NEW.therapist_id IS NULL THEN
    NEW.therapist_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix therapist_settings table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'therapist_settings' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.therapist_settings ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE public.therapist_settings DROP CONSTRAINT IF EXISTS therapist_settings_pkey;
ALTER TABLE public.therapist_settings DROP CONSTRAINT IF EXISTS therapist_settings_id_check;

DELETE FROM public.therapist_settings WHERE therapist_id IS NULL;
ALTER TABLE public.therapist_settings ADD PRIMARY KEY (therapist_id);
ALTER TABLE public.therapist_settings DROP COLUMN IF EXISTS id;

-- 3. Add therapist_id to missing core tables
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'documents' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.documents ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'assessments' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.assessments ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'referral_documents' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.referral_documents ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_documents' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.patient_documents ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Enable/Update RLS policies to be strict
-- We'll do this for ALL tables to ensure consistency.

DO $$ 
DECLARE
    table_name_var TEXT;
    tables_to_harden TEXT[] := ARRAY[
        'clients', 'appointments', 'notes', 'invoices', 'activity_logs', 
        'patient_medication', 'client_crisis_notes', 'client_assessments', 
        'psychological_tests', 'therapist_settings', 'documents', 
        'assessments', 'referral_documents', 'patient_documents',
        'therapist_documents', 'cabinet_expenses'
    ];
BEGIN
    FOREACH table_name_var IN ARRAY tables_to_harden LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name_var);
        
        -- Drop existing policies that might be weak
        EXECUTE format('DROP POLICY IF EXISTS "therapist_full_access_%s" ON public.%I', table_name_var, table_name_var);
        EXECUTE format('DROP POLICY IF EXISTS "therapist_full_access_own_%s" ON public.%I', table_name_var, table_name_var);
        EXECUTE format('DROP POLICY IF EXISTS "therapist_full_access" ON public.%I', table_name_var);
        
        -- Create strict per-therapist policy
        EXECUTE format('
            CREATE POLICY "strict_therapist_isolation_%s" ON public.%I
            FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id)', 
            table_name_var, table_name_var);

        -- Add/Replace trigger for auto-populating therapist_id
        EXECUTE format('DROP TRIGGER IF EXISTS tr_set_therapist_id ON public.%I', table_name_var);
        EXECUTE format('
            CREATE TRIGGER tr_set_therapist_id
            BEFORE INSERT ON public.%I
            FOR EACH ROW EXECUTE FUNCTION public.set_therapist_id()', 
            table_name_var);
            
        -- Ensure index exists
        EXECUTE format('CREATE INDEX IF NOT EXISTS %s_therapist_idx ON public.%I (therapist_id)', table_name_var, table_name_var);
    END LOOP;
END $$;

-- 5. Special cases (e.g. public onboarding)
-- If we have public forms, they need specific policies.
-- Based on 0021, we have a public insert policy for minor onboarding.
DROP POLICY IF EXISTS "Allow public insert for minor onboarding" ON public.clients;
CREATE POLICY "Allow public insert for minor onboarding" ON public.clients
    FOR INSERT WITH CHECK (is_minor = true AND therapist_id IS NOT NULL);
-- Note: The trigger will NOT work for public inserts if auth.uid() is null.
-- For public onboarding, the therapist_id MUST be provided in the request.
