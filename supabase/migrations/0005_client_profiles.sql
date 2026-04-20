-- Add detailed client profiling: locations, minors with parents, and company billing
ALTER TABLE public.clients
ADD COLUMN location varchar(50) DEFAULT 'CABINET_PARTICULAR',
ADD COLUMN is_minor boolean DEFAULT false,
ADD COLUMN parent_name varchar(255),
ADD COLUMN parent_phone varchar(20),
ADD COLUMN billing_type varchar(50) DEFAULT 'INDIVIDUAL',
ADD COLUMN company_name varchar(255);
