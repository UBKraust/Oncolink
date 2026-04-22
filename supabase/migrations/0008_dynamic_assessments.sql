-- Migration 0008: Dynamic Psychological Assessments with JSONB

CREATE TABLE IF NOT EXISTS public.psychological_tests (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    description text,
    scoring_logic jsonb,
    questions jsonb,
    created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.client_assessments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete cascade,
    test_id uuid references public.psychological_tests(id) on delete set null,
    appointment_id uuid references public.appointments(id) on delete set null,
    raw_answers jsonb,
    calculated_score jsonb,
    ai_interpretation text,
    created_at timestamptz default now()
);

-- Note: We drop the simple 'assessments' table from 0006 right now, or we just leave it for simple reports and use client_assessments for dynamic forms.
-- We'll use 'client_assessments' exclusively for the structured form taking.

ALTER TABLE public.psychological_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_full_access_psychological_tests" ON public.psychological_tests
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "therapist_full_access_client_assessments" ON public.client_assessments
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
