-- Public link hardening: tokenized onboarding/confirmation links,
-- stable public booking slug, and DB-backed request rate limiting.

ALTER TABLE public.therapist_settings
ADD COLUMN IF NOT EXISTS public_booking_slug text,
ADD COLUMN IF NOT EXISTS public_booking_enabled boolean NOT NULL DEFAULT true;

UPDATE public.therapist_settings
SET public_booking_slug = COALESCE(
  public_booking_slug,
  lower(left(replace(therapist_id::text, '-', ''), 12))
)
WHERE therapist_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS therapist_settings_public_booking_slug_idx
  ON public.therapist_settings (public_booking_slug)
  WHERE public_booking_slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.onboarding_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS onboarding_tokens_client_idx
  ON public.onboarding_tokens (client_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS public.appointment_action_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('confirm', 'cancel')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS appointment_action_tokens_lookup_idx
  ON public.appointment_action_tokens (appointment_id, action, expires_at DESC);

CREATE TABLE IF NOT EXISTS public.public_request_rate_limits (
  bucket_key text PRIMARY KEY,
  action text NOT NULL,
  hits integer NOT NULL DEFAULT 1,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  window_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_action_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_request_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strict_therapist_isolation_onboarding_tokens" ON public.onboarding_tokens;
CREATE POLICY "strict_therapist_isolation_onboarding_tokens" ON public.onboarding_tokens
  FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "strict_therapist_isolation_appointment_action_tokens" ON public.appointment_action_tokens;
CREATE POLICY "strict_therapist_isolation_appointment_action_tokens" ON public.appointment_action_tokens
  FOR ALL USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);
