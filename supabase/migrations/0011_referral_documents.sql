-- Migration 0011: Referral document storage for CAS sessions

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS referral_drive_file_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS referral_document_url TEXT;

-- Separate table for tracking uploaded referral documents per patient
CREATE TABLE IF NOT EXISTS public.referral_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    drive_file_id VARCHAR(255),
    document_url TEXT,
    referral_number VARCHAR(100),
    referral_date DATE,
    referring_doctor_code VARCHAR(50),
    diagnosis_code_cim10 VARCHAR(20),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referral_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "therapist_full_access_referrals" ON public.referral_documents
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS referrals_client_idx ON public.referral_documents (client_id);
CREATE INDEX IF NOT EXISTS referrals_appointment_idx ON public.referral_documents (appointment_id);
