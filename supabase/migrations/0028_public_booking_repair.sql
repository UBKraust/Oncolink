-- Migration 0028: Public Booking Repair
-- Allows public (unauthenticated) users to create clients and appointments
-- IF a therapist_id is provided. This is necessary for the public booking flow.

-- 1. Clients Table
-- Allow public insert if therapist_id is present
DROP POLICY IF EXISTS "public_insert_clients" ON public.clients;
CREATE POLICY "public_insert_clients" ON public.clients
    FOR INSERT WITH CHECK (therapist_id IS NOT NULL);

-- 2. Appointments Table
-- Allow public insert if therapist_id is present
DROP POLICY IF EXISTS "public_insert_appointments" ON public.appointments;
CREATE POLICY "public_insert_appointments" ON public.appointments
    FOR INSERT WITH CHECK (therapist_id IS NOT NULL);

-- 3. Update existing strict policies to be even stricter?
-- Actually, the current policies are fine for authenticated users.

-- 4. Note: The database trigger tr_set_therapist_id will skip population if therapist_id is provided.
-- For public bookings, the application MUST provide the therapist_id.
