-- Remove broad anon insert policies from public booking.
-- Public booking writes are handled by trusted server routes with service-role
-- clients so callers cannot write arbitrary rows directly through the Data API.

DROP POLICY IF EXISTS "public_insert_clients" ON public.clients;
DROP POLICY IF EXISTS "public_insert_appointments" ON public.appointments;
