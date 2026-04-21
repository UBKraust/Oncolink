-- Migration 0025: B2B Representative Fields
-- Adds legal representative info for company contracts.

ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS company_representative_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_representative_role VARCHAR(100), -- e.g. 'Administrator', 'Director General'
ADD COLUMN IF NOT EXISTS company_reg_com VARCHAR(50); -- e.g. J40/1234/2020

COMMENT ON COLUMN public.clients.company_representative_name IS 'Name of the person signing on behalf of the company.';
COMMENT ON COLUMN public.clients.company_representative_role IS 'Job title or role of the company signer.';
COMMENT ON COLUMN public.clients.company_reg_com IS 'Trade Register number for B2B entities.';
