export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import {
  createPublicBooking,
  PublicBookingSchema,
} from "@/lib/booking/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAvailableSlots } from "@/lib/availability/engine";
import type { AppointmentRow } from "@/lib/appointments/helpers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolvePublicBookingTherapistId } from "@/lib/security/public-booking";
import {
  enforceRateLimit,
  getClientIp,
} from "@/lib/security/public-rate-limit";

/**
 * GET  /api/book          — returns available slots for the next 14 days
 * POST /api/book          — creates an appointment (status=PROGRAMAT) and
 *                           triggers confirmation flow
 */

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    const slots = getAvailableSlots([], 14);
    return NextResponse.json({ slots: slots.map((s) => ({ start: s.startISO, end: s.endISO })) });
  }

  const rateLimit = await enforceRateLimit({
    action: "public_booking_slots",
    identifier: getClientIp(req.headers),
    limit: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json({ error: "Prea multe solicitări." }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseServiceClient();
  
  let therapistId: string | null = user?.id || null;
  const therapistSlug = new URL(req.url).searchParams.get("therapist");
  if (!therapistId) therapistId = await resolvePublicBookingTherapistId(therapistSlug);

  if (!therapistId) {
    return NextResponse.json({ error: "Booking public indisponibil." }, { status: 404 });
  }

  const appointmentsQuery = user ? supabase : admin;
  const { data } = await appointmentsQuery
    .from("appointments")
    .select("*")
    .eq("therapist_id", therapistId)
    .gte(
      "appointment_date",
      new Date(Date.now() - 86_400_000).toISOString(),
    )
    .in("status", ["PROGRAMAT", "CONFIRMAT"]);

  const slots = getAvailableSlots((data ?? []) as AppointmentRow[]);
  return NextResponse.json({
    slots: slots.map((s) => ({ start: s.startISO, end: s.endISO })),
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Booking offline în mod demo." }, { status: 503 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const legacyBody =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const asOptionalString = (value: unknown) =>
    typeof value === "string" ? value : undefined;
  const asDuration = (value: unknown) =>
    typeof value === "number" ? value : 50;
  const parsed = PublicBookingSchema.safeParse({
    full_name: asOptionalString(legacyBody.full_name),
    email: asOptionalString(legacyBody.email),
    phone: asOptionalString(legacyBody.phone),
    cnp_cif: asOptionalString(legacyBody.cnp_cif),
    address: asOptionalString(legacyBody.address),
    therapist_slug: asOptionalString(legacyBody.therapist_slug),
    website: asOptionalString(legacyBody.website),
    slot_start:
      asOptionalString(legacyBody.slot_start) ??
      asOptionalString(legacyBody.slotStart),
    duration_minutes: asDuration(legacyBody.duration_minutes),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Date invalide.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await createPublicBooking(parsed.data, req.headers, {
    rateLimitAction: "public_booking_submit",
  });
  return NextResponse.json(result.body, { status: result.status });
}
