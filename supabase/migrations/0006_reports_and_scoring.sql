-- Migration 0006: Client session frequencies and psychological assessments

ALTER TABLE public.clients
ADD COLUMN session_frequency varchar(50) DEFAULT 'SAPTAMANAL',
ADD COLUMN report_frequency varchar(50) DEFAULT 'NICIODATA',
ADD COLUMN send_report_to_parent boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.assessments (
    id uuid primary key default gen_random_uuid(),
    client_id uuid references public.clients(id) on delete cascade,
    assessment_type varchar(100) not null,
    scoring_data jsonb,
    content_summary text,
    sent_to_parent_at timestamptz,
    created_at timestamptz default now()
);

CREATE INDEX IF NOT EXISTS assessments_client_idx ON public.assessments (client_id);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "therapist_full_access_assessments" ON public.assessments
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
