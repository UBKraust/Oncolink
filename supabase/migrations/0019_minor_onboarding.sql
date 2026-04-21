-- Migration: Minor Client Onboarding & Parental Guardians
-- Adds columns to handle minor-specific legal data.

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_1_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_1_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS parent_1_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_2_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_2_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS parent_2_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS parents_marital_status VARCHAR(50), -- 'CASATORITI', 'DIVORTATI_CUSTODIE_COMUNA', 'DIVORTATI_CUSTODIE_EXCLUSIVA', 'ALTUL'
ADD COLUMN IF NOT EXISTS needs_legal_review BOOLEAN DEFAULT FALSE, -- Flag for therapist dashboard alert
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Enable public inserts for the onboarding flow 
-- In a real app we'd have a specific secure endpoint, 
-- but for the MVP we allow public insert into clients IF is_minor is true.
CREATE POLICY "Allow public insert for minor onboarding" 
ON public.clients
FOR INSERT
WITH CHECK (is_minor = true);

-- Index for dashboard alerts
CREATE INDEX IF NOT EXISTS idx_clients_legal_review ON public.clients (needs_legal_review) WHERE needs_legal_review = true;
