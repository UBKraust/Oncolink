-- Close remaining broad or contradictory RLS policies.
-- Public flows now go through trusted server endpoints/actions instead of
-- broad anon Data API policies.

-- 1. Remove dangerous public onboarding policy from Data API.
DROP POLICY IF EXISTS "Allow public update via onboarding" ON public.clients;
DROP POLICY IF EXISTS "Allow public insert for minor onboarding" ON public.clients;

-- 2. Remove legacy broad authenticated policies that survived the multi-tenant migrations.
DROP POLICY IF EXISTS "therapist_full_access_settings" ON public.therapist_settings;
DROP POLICY IF EXISTS "therapist_full_access_docs" ON public.patient_documents;
DROP POLICY IF EXISTS "therapist_full_access_referrals" ON public.referral_documents;

-- 3. Remove duplicate legacy policies where strict per-therapist policies already exist.
DROP POLICY IF EXISTS "therapist_own_clients" ON public.clients;
DROP POLICY IF EXISTS "therapist_own_appointments" ON public.appointments;
DROP POLICY IF EXISTS "therapist_own_notes" ON public.notes;
DROP POLICY IF EXISTS "therapist_own_invoices" ON public.invoices;
DROP POLICY IF EXISTS "therapist_own_activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "therapist_own_medication" ON public.patient_medication;
DROP POLICY IF EXISTS "therapist_own_crisis_notes" ON public.client_crisis_notes;
DROP POLICY IF EXISTS "therapist_own_client_assessments" ON public.client_assessments;
DROP POLICY IF EXISTS "therapist_own_psychological_tests" ON public.psychological_tests;

DROP POLICY IF EXISTS "therapist full access own documents" ON public.therapist_documents;
DROP POLICY IF EXISTS "therapist full access own expenses" ON public.cabinet_expenses;

-- 4. Re-assert strict policies explicitly for tables whose old broad policies were removed
-- but whose strict canonical policy may be missing in some environments.
DROP POLICY IF EXISTS "strict_therapist_isolation_therapist_settings" ON public.therapist_settings;
CREATE POLICY "strict_therapist_isolation_therapist_settings" ON public.therapist_settings
  FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "strict_therapist_isolation_patient_documents" ON public.patient_documents;
CREATE POLICY "strict_therapist_isolation_patient_documents" ON public.patient_documents
  FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "strict_therapist_isolation_referral_documents" ON public.referral_documents;
CREATE POLICY "strict_therapist_isolation_referral_documents" ON public.referral_documents
  FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "strict_therapist_isolation_therapist_documents" ON public.therapist_documents;
CREATE POLICY "strict_therapist_isolation_therapist_documents" ON public.therapist_documents
  FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "strict_therapist_isolation_cabinet_expenses" ON public.cabinet_expenses;
CREATE POLICY "strict_therapist_isolation_cabinet_expenses" ON public.cabinet_expenses
  FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);
