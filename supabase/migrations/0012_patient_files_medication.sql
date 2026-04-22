-- Migration 0012: Patient Documents & Medication Tracker

-- Document archive (all patient files)
CREATE TABLE IF NOT EXISTS public.patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_kb INTEGER,
    mime_type VARCHAR(100),
    storage_path TEXT,       -- Supabase Storage path (private bucket)
    drive_file_id VARCHAR(255),
    document_url TEXT,       -- Supabase signed URL or Drive link
    document_type VARCHAR(50) NOT NULL DEFAULT 'ALTELE',
    -- Types: SCRISOARE_MEDICALA | RETETA | ANALIZA | SENTINTA_CUSTODIE | ACORD_PARINTI | CONTRACT | CI | ALTELE
    notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_full_access_docs" ON public.patient_documents
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS docs_client_idx ON public.patient_documents (client_id);
CREATE INDEX IF NOT EXISTS docs_type_idx ON public.patient_documents (document_type);

-- Medication tracker
CREATE TABLE IF NOT EXISTS public.patient_medication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    start_date DATE,
    end_date DATE,           -- NULL = still active
    prescribing_doctor VARCHAR(255),
    side_effect_notes TEXT,  -- client-reported side effects
    is_active BOOLEAN GENERATED ALWAYS AS (end_date IS NULL) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patient_medication ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_full_access_medication" ON public.patient_medication
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS medication_client_idx ON public.patient_medication (client_id);
CREATE INDEX IF NOT EXISTS medication_active_idx ON public.patient_medication (client_id, is_active);
