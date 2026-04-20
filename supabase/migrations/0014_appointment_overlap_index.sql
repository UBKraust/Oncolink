-- Prevents two appointments for the same client from being inserted
-- at the exact same timestamp (race-condition safety net).
-- The real overlap logic is handled in application code (overlapCheck.ts);
-- this index is the last line of defense for concurrent requests.
create unique index if not exists appointments_client_date_unique
    on public.appointments (client_id, appointment_date)
    where status in ('PROGRAMAT', 'CONFIRMAT');
