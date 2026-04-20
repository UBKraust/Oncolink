-- Migration to support individual client pricing and track appointment revenue

-- Add base session price to clients
ALTER TABLE public.clients
ADD COLUMN session_price decimal(10, 2);

-- Add price snapshot for specific appointments to correctly track analytics over time
-- even if the client's base price changes in the future.
ALTER TABLE public.appointments
ADD COLUMN price decimal(10, 2);
