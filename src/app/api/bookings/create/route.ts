export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkOverlap, OverlapError } from "@/lib/availability/overlapCheck";
import { pushAppointmentToGoogle } from "@/lib/google/sync";
import { upsertClientByIdentifiers } from "@/lib/clients/upsert";
import { resolvePublicBookingTherapistId } from "@/lib/security/public-booking";
import {
  enforceRateLimit,
  getClientIp,
  isHoneypotTriggered,
} from "@/lib/security/public-rate-limit";

const BookingSchema = z.object({
  // Client details
  full_name: z.string().min(2, "Nume prea scurt"),
  email: z.string().email("Email invalid"),
  phone: z.string().min(7, "Telefon invalid"),
  cnp_cif: z.string().optional(),
  address: z.string().optional(),
  therapist_slug: z.string().optional(),
  website: z.string().optional(),
  // Booking details
  slot_start: z.string().datetime({ message: "Data/ora invalidă (format ISO 8601)" }),
  duration_minutes: z.number().int().min(25).max(240).default(50),
});

type BookingPayload = z.infer<typeof BookingSchema>;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Serviciu indisponibil în modul demo." },
      { status: 503 },
    );
  }

  // --- Parse & validate payload ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Date invalide.", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const payload: BookingPayload = parsed.data;
  if (isHoneypotTriggered(payload.website)) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const rateLimit = await enforceRateLimit({
    action: "public_booking_submit_v2",
    identifier: `${getClientIp(req.headers)}:${payload.email.toLowerCase()}`,
    limit: 6,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Prea multe încercări. Reîncearcă mai târziu." },
      { status: 429 },
    );
  }

  const startISO = payload.slot_start;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseServiceClient();
  let therapistId: string | null = user?.id || null;

  if (!therapistId) {
    therapistId = await resolvePublicBookingTherapistId(payload.therapist_slug);
  }

  if (!therapistId) {
    return NextResponse.json({ error: "Nu am găsit niciun terapeut configurat." }, { status: 500 });
  }

  const db = user ? supabase : admin;

  // --- Step 1 + 2: Dual overlap check (Supabase + Google FreeBusy) ---
  try {
    await checkOverlap(startISO, payload.duration_minutes, therapistId);
  } catch (err) {
    if (err instanceof OverlapError) {
      return NextResponse.json(
        {
          error:
            "Ne pare rău, dar acest interval a fost ocupat cu câteva momente în urmă. Te rugăm să alegi un alt interval.",
          source: err.source,
        },
        { status: 409 },
      );
    }
    throw err;
  }

  // --- Step 3: Atomic client upsert + appointment insert ---
  let clientId: string;
  try {
    const clientResult = await upsertClientByIdentifiers(db as any, therapistId, {
      email: payload.email,
      phone: payload.phone,
      cnp_cif: payload.cnp_cif ?? null,
      full_name: payload.full_name,
    }, {
      therapist_id: therapistId,
      full_name: payload.full_name,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      cnp_cif: payload.cnp_cif ?? null,
      address: payload.address ?? null,
    });
    clientId = clientResult.id;
  } catch (clientError) {
    return NextResponse.json(
      { error: clientError instanceof Error ? clientError.message : "Nu am putut salva clientul." },
      { status: 500 },
    );
  }

  // Insert appointment
  const { data: appt, error: apptError } = await (db as any)
    .from("appointments")
    .insert({
      therapist_id: therapistId,
      client_id: clientId,
      appointment_date: new Date(startISO).toISOString(),
      duration_minutes: payload.duration_minutes,
      status: "PROGRAMAT",
    })
    .select("id")
    .single();

  if (apptError) {
    // Unique constraint violation = race condition, another booking just won
    if (apptError.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Ne pare rău, dar acest interval a fost ocupat cu câteva momente în urmă. Te rugăm să alegi un alt interval.",
          source: "race_condition",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: apptError.message }, { status: 500 });
  }

  // --- Step 4: Push to Google Calendar (non-blocking — don't fail booking if Google is down) ---
  pushAppointmentToGoogle(appt.id).catch((err) => {
    console.error("[bookings/create] Google Calendar sync failed:", err);
  });

  return NextResponse.json(
    {
      ok: true,
      appointmentId: appt.id,
      clientId,
      message: "Programare confirmată. Veți primi un email de confirmare.",
    },
    { status: 201 },
  );
}
