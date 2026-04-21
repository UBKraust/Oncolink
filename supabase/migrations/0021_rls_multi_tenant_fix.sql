-- Migration: Multi-tenant Security Fix (RLS)
-- Ensures that therapists only see and modify their own data.

-- 1. Add therapist_id to core tables if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clients' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.clients ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'appointments' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.appointments ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notes' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.notes ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invoices' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.invoices ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'patient_medication' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.patient_medication ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_crisis_notes' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.client_crisis_notes ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'client_assessments' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.client_assessments ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'psychological_tests' AND COLUMN_NAME = 'therapist_id') THEN
    ALTER TABLE public.psychological_tests ADD COLUMN therapist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Drop existing weak policies
DROP POLICY IF EXISTS "therapist_full_access_clients" ON public.clients;
DROP POLICY IF EXISTS "therapist_full_access_appointments" ON public.appointments;
DROP POLICY IF EXISTS "therapist_full_access_notes" ON public.notes;
DROP POLICY IF EXISTS "therapist_full_access_invoices" ON public.invoices;
DROP POLICY IF EXISTS "therapist_full_access_activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "therapist_full_access_medication" ON public.patient_medication;
DROP POLICY IF EXISTS "therapist_full_access_crisis_notes" ON public.client_crisis_notes;
DROP POLICY IF EXISTS "therapist_full_access_client_assessments" ON public.client_assessments;
DROP POLICY IF EXISTS "therapist_full_access_psychological_tests" ON public.psychological_tests;

-- 3. Create strong per-therapist policies
CREATE POLICY "therapist_own_clients" ON public.clients
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_appointments" ON public.appointments
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_notes" ON public.notes
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_invoices" ON public.invoices
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_activity_logs" ON public.activity_logs
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_medication" ON public.patient_medication
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_crisis_notes" ON public.client_crisis_notes
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_client_assessments" ON public.client_assessments
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

CREATE POLICY "therapist_own_psychological_tests" ON public.psychological_tests
    FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

-- 4. Special cases for public onboarding
-- We need to keep these but ensure they only work for the specific therapist if we can,
-- otherwise they are still a vector. For now, we allow insert with a specific therapist_id.
ALTER POLICY "Allow public insert for minor onboarding" ON public.clients
WITH CHECK (is_minor = true AND therapist_id IS NOT NULL);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS clients_therapist_idx ON public.clients (therapist_id);
CREATE INDEX IF NOT EXISTS appointments_therapist_idx ON public.appointments (therapist_id);
CREATE INDEX IF NOT EXISTS notes_therapist_idx ON public.notes (therapist_id);
CREATE INDEX IF NOT EXISTS invoices_therapist_idx ON public.invoices (therapist_id);
CREATE INDEX IF NOT EXISTS medication_therapist_idx ON public.patient_medication (therapist_id);
CREATE INDEX IF NOT EXISTS crisis_notes_therapist_idx ON public.client_crisis_notes (therapist_id);
CREATE INDEX IF NOT EXISTS client_assessments_therapist_idx ON public.client_assessments (therapist_id);
CREATE INDEX IF NOT EXISTS psychological_tests_therapist_idx ON public.psychological_tests (therapist_id);
