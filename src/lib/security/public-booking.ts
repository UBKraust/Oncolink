import { isSupabaseServiceConfigured } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export function getDefaultBookingSlug(): string | null {
  return (
    process.env.NEXT_PUBLIC_PUBLIC_BOOKING_SLUG?.trim() ||
    process.env.PUBLIC_BOOKING_SLUG?.trim() ||
    null
  );
}

export async function resolvePublicBookingTherapistId(
  slug?: string | null,
): Promise<string | null> {
  if (!isSupabaseServiceConfigured()) {
    return null;
  }

  const resolvedSlug = slug?.trim() || getDefaultBookingSlug();
  if (!resolvedSlug) {
    return null;
  }

  const admin = createSupabaseServiceClient();
  const { data } = await (admin as any)
    .from("therapist_settings")
    .select("therapist_id")
    .eq("public_booking_slug", resolvedSlug)
    .eq("public_booking_enabled", true)
    .maybeSingle();

  return data?.therapist_id ?? null;
}
